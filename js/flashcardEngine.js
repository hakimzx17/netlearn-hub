/**
 * flashcardEngine.js — Spaced Repetition Flashcard System
 * 
 * Features:
 * - SM-2 Algorithm for optimal learning intervals
 * - CRUD operations for decks and cards
 * - Progress tracking and statistics
 * - Import/Export functionality (JSON)
 * - LocalStorage persistence
 * 
 * Ratings:
 * 0 = Again (reset card)
 * 1 = Hard (difficult recall)
 * 2 = Good (normal recall)
 * 3 = Easy (perfect recall)
 */

class FlashcardEngine {
  constructor() {
    this.decks = new Map();
    this.currentDeckId = null;
    this.currentCardIndex = 0;
    this.sessionStats = {
      cardsReviewed: 0,
      correctAnswers: 0,
      startTime: null,
      ratings: { again: 0, hard: 0, good: 0, easy: 0 }
    };
    this.currentSessionDeck = null;
    this.sessionCardRefs = [];
    this.sessionOptions = {};
    this.sessionScope = null;
    this.storageKey = 'netlearn_flashcards';
    this._loadFromStorage();
  }

  // ═══════════════════════════════════════════
  // SM-2 ALGORITHM
  // ═══════════════════════════════════════════

  /**
   * Calculate next review date using SM-2 algorithm
   * @param {Object} card - Card with interval, repetition, easeFactor
   * @param {number} rating - 0=Again, 1=Hard, 2=Good, 3=Easy
   * @returns {Object} Updated card with new interval, repetition, easeFactor
   */
  calculateSM2(card, rating) {
    let { interval = 1, repetition = 0, easeFactor = 2.5 } = card;
    
    // SM-2 Algorithm
    if (rating < 2) {
      // Failed recall - reset
      repetition = 0;
      interval = 1;
    } else {
      // Successful recall
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetition++;
    }

    // Update easeFactor based on quality
    // Q = rating (0-3, converted to 0-5 scale for formula)
    const Q = rating + 2; // Convert 0-3 to 2-5
    easeFactor = easeFactor + (0.1 - (5 - Q) * (0.08 + (5 - Q) * 0.02));
    
    // Minimum easeFactor is 1.3
    easeFactor = Math.max(1.3, easeFactor);

    // Adjust interval based on rating
    if (rating === 1) {
      // Hard - smaller increase
      interval = Math.max(1, Math.round(interval * 0.8));
    } else if (rating === 3) {
      // Easy - larger increase
      interval = Math.round(interval * 1.3);
    }

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    return {
      interval,
      repetition,
      easeFactor,
      nextReview: nextReview.toISOString(),
      lastReview: new Date().toISOString(),
      difficulty: this.getDifficultyLevel(interval, repetition)
    };
  }

  /**
   * Get difficulty level based on interval and repetition
   */
  getDifficultyLevel(interval, repetition) {
    if (repetition === 0) return 'new';
    if (interval <= 1) return 'learning';
    if (interval <= 7) return 'young';
    return 'mature';
  }

  /**
   * Check if card is due for review
   */
  isCardDue(card) {
    if (!card.nextReview) return true;
    const now = new Date();
    const nextReview = new Date(card.nextReview);
    return now >= nextReview;
  }

  // ═══════════════════════════════════════════
  // CRUD OPERATIONS - DECKS
  // ═══════════════════════════════════════════

  /**
   * Create a new deck
   */
  createDeck(deckData) {
    const id = deckData.id || this.generateId();
    const deck = {
      id,
      name: deckData.name,
      description: deckData.description || '',
      cards: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: deckData.category || 'general',
      tags: deckData.tags || [],
      domainId: deckData.domainId || null,
      // Progress stats
      stats: {
        totalCards: 0,
        newCards: 0,
        learningCards: 0,
        reviewCards: 0,
        masteredCards: 0,
        lastStudied: null,
        totalTime: 0
      }
    };

    this.decks.set(id, deck);
    this._saveToStorage();
    return deck;
  }

  /**
   * Update deck information
   */
  updateDeck(deckId, updates) {
    const deck = this.decks.get(deckId);
    if (!deck) throw new Error(`Deck not found: ${deckId}`);

    Object.assign(deck, updates, {
      updatedAt: new Date().toISOString()
    });

    this._saveToStorage();
    return deck;
  }

  /**
   * Delete a deck
   */
  deleteDeck(deckId) {
    if (!this.decks.has(deckId)) {
      throw new Error(`Deck not found: ${deckId}`);
    }
    this.decks.delete(deckId);
    
    if (this.currentDeckId === deckId) {
      this.currentDeckId = null;
      this.currentCardIndex = 0;
    }
    
    this._saveToStorage();
    return true;
  }

  /**
   * Get deck by ID
   */
  getDeck(deckId) {
    return this.decks.get(deckId);
  }

  /**
   * Get all decks
   */
  getAllDecks() {
    return Array.from(this.decks.values());
  }

  /**
   * Get decks by category
   */
  getDecksByCategory(category) {
    return this.getAllDecks().filter(deck => deck.category === category);
  }

  // ═══════════════════════════════════════════
  // CRUD OPERATIONS - CARDS
  // ═══════════════════════════════════════════

  /**
   * Create a new card in a deck
   */
  createCard(deckId, cardData) {
    const deck = this.decks.get(deckId);
    if (!deck) throw new Error(`Deck not found: ${deckId}`);

    const card = {
      id: cardData.id || this.generateId(),
      front: cardData.front,
      back: cardData.back,
      tags: cardData.tags || [],
      // Spaced repetition data
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      nextReview: null,
      lastReview: null,
      domainId: cardData.domainId || deck.domainId || null,
      topicIds: Array.isArray(cardData.topicIds) ? [...cardData.topicIds] : [],
      // Metadata
      difficulty: 'new',
      timesReviewed: 0,
      timesCorrect: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    deck.cards.push(card);
    this._updateDeckStats(deck);
    this._saveToStorage();
    
    return card;
  }

  /**
   * Update card information
   */
  updateCard(deckId, cardId, updates) {
    const deck = this.decks.get(deckId);
    if (!deck) throw new Error(`Deck not found: ${deckId}`);

    const cardIndex = deck.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) throw new Error(`Card not found: ${cardId}`);

    const card = deck.cards[cardIndex];
    Object.assign(card, updates, {
      updatedAt: new Date().toISOString()
    });

    this._updateDeckStats(deck);
    this._saveToStorage();
    
    return card;
  }

  /**
   * Delete a card from a deck
   */
  deleteCard(deckId, cardId) {
    const deck = this.decks.get(deckId);
    if (!deck) throw new Error(`Deck not found: ${deckId}`);

    const cardIndex = deck.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) throw new Error(`Card not found: ${cardId}`);

    deck.cards.splice(cardIndex, 1);
    this._updateDeckStats(deck);
    this._saveToStorage();
    
    return true;
  }

  /**
   * Get card by ID
   */
  getCard(deckId, cardId) {
    const deck = this.decks.get(deckId);
    if (!deck) return null;
    return deck.cards.find(c => c.id === cardId);
  }

  /**
   * Get all cards in a deck
   */
  getDeckCards(deckId) {
    const deck = this.decks.get(deckId);
    return deck ? deck.cards : [];
  }

  // ═══════════════════════════════════════════
  // STUDY SESSION
  // ═══════════════════════════════════════════

  /**
   * Start a study session for a deck
   */
  startSession(deckId, options = {}) {
    const deck = this.decks.get(deckId);
    if (!deck) throw new Error(`Deck not found: ${deckId}`);

    const cards = this.getSessionCards(deckId, options);
    const refs = cards.map((card) => ({ deckId, cardId: card.id }));

    if (refs.length > 0) {
      this._activateSession({
        deck: this._snapshotDeck(deck),
        refs,
        options,
        scope: options.scope || options.filter || { deckId, domainId: deck.domainId || null },
      });
    } else {
      this._clearActiveSessionState();
      this._saveToStorage();
    }

    return this.resumeSession() || {
      deck: this._snapshotDeck(deck),
      cards: [],
      totalCards: 0,
      dueCards: 0,
      context: options.scope || options.filter || null,
    };
  }

  /**
   * Start a study session spanning one or more decks by domain/topic scope.
   */
  startScopedSession(scope = {}, options = {}) {
    const sessionOptions = { includeNew: true, includeDue: true, ...options };
    const cards = this.getCardsByScope(scope, sessionOptions);
    const deck = this._createScopedDeckSnapshot(scope, cards);
    const refs = cards.map((card) => ({ deckId: card.deckId, cardId: card.id }));

    if (refs.length > 0) {
      this._activateSession({ deck, refs, options: sessionOptions, scope });
    } else {
      this._clearActiveSessionState();
      this._saveToStorage();
    }

    return this.resumeSession() || {
      deck,
      cards: [],
      totalCards: 0,
      dueCards: 0,
      context: scope,
    };
  }

  /**
   * Get cards for current session
   */
  getSessionCards(deckId, options = {}) {
    const deck = this.decks.get(deckId);
    if (!deck) return [];

    const scope = options.scope || options.filter || null;
    const candidates = deck.cards
      .filter((card) => this._matchesScope(card, deck, scope))
      .map((card) => this._decorateCard(card, deck));

    return this._filterCardsForSession(candidates, options);
  }

  /**
   * Get cards across all decks matching a domain/topic/tag scope.
   */
  getCardsByScope(scope = {}, options = {}) {
    const deckIds = Array.isArray(scope.deckIds) && scope.deckIds.length > 0
      ? new Set(scope.deckIds)
      : null;
    const records = [];

    for (const deck of this.getAllDecks()) {
      if (deckIds && !deckIds.has(deck.id)) continue;
      for (const card of deck.cards || []) {
        if (!this._matchesScope(card, deck, scope)) continue;
        records.push(this._decorateCard(card, deck));
      }
    }

    return this._filterCardsForSession(records, options);
  }

  /**
   * Summarize cards for a domain/topic scope.
   */
  getScopeStats(scope = {}) {
    const cards = this.getCardsByScope(scope, { includeAll: true });
    const totalCards = cards.length;
    const masteredCards = cards.filter(c => c.difficulty === 'mature').length;

    return {
      totalCards,
      dueToday: cards.filter(c => this.isCardDue(c)).length,
      newCards: cards.filter(c => c.difficulty === 'new').length,
      learningCards: cards.filter(c => c.difficulty === 'learning').length,
      reviewCards: cards.filter(c => c.difficulty === 'young' || c.difficulty === 'mature').length,
      masteredCards,
      completion: totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0,
    };
  }

  /**
   * Get current card in session
   */
  getCurrentCard() {
    const cards = this._getActiveSessionCards();
    return cards[this.currentCardIndex] || null;
  }

  /**
   * Read current card index for the active session.
   * @returns {number}
   */
  getCurrentCardIndex() {
    return this.currentCardIndex;
  }

  /**
   * Safely set current card index within active-session bounds.
   * @param {number} index
   * @returns {number} clamped index
   */
  setCurrentCardIndex(index) {
    const next = Number.isFinite(index) ? Math.floor(index) : 0;
    const cards = this._getActiveSessionCards();
    const maxIndex = Math.max(cards.length - 1, 0);
    this.currentCardIndex = Math.min(Math.max(next, 0), maxIndex);
    this._saveToStorage();
    return this.currentCardIndex;
  }

  /**
   * Rate current card and move to next
   */
  rateCurrentCard(rating) {
    const currentRef = this.sessionCardRefs[this.currentCardIndex];
    const card = this.getCurrentCard();
    if (!card || !currentRef) return null;

    const normalizedRating = Math.max(0, Math.min(3, Number.isFinite(Number(rating)) ? Number(rating) : 0));

    // Update card with SM-2 algorithm
    const updates = this.calculateSM2(card, normalizedRating);
    
    // Update card statistics
    updates.timesReviewed = (card.timesReviewed || 0) + 1;
    if (normalizedRating >= 2) {
      updates.timesCorrect = (card.timesCorrect || 0) + 1;
    }

    // Update session stats
    this.sessionStats.cardsReviewed++;
    if (normalizedRating >= 2) this.sessionStats.correctAnswers++;
    
    const ratingNames = ['again', 'hard', 'good', 'easy'];
    this.sessionStats.ratings[ratingNames[normalizedRating]]++;

    // Apply updates
    this.updateCard(currentRef.deckId, card.id, updates);
    
    // Move to next card
    this.currentCardIndex++;
    this._saveToStorage();

    return {
      card,
      updates,
      rating: normalizedRating,
      sessionComplete: this.currentCardIndex >= this.sessionCardRefs.length,
      sessionStats: this.getSessionStats()
    };
  }

  /**
   * Move to next card without rating
   */
  nextCard() {
    const cards = this._getActiveSessionCards();
    if (cards.length === 0) return null;
    this.currentCardIndex = Math.min(this.currentCardIndex + 1, cards.length - 1);
    this._saveToStorage();
    return this.getCurrentCard();
  }

  /**
   * Move to previous card
   */
  previousCard() {
    this.currentCardIndex = Math.max(this.currentCardIndex - 1, 0);
    this._saveToStorage();
    return this.getCurrentCard();
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    const { cardsReviewed, correctAnswers, ratings, startTime } = this.sessionStats;
    const startTimestamp = startTime ? new Date(startTime).getTime() : null;
    
    const accuracy = cardsReviewed > 0 ? Math.round((correctAnswers / cardsReviewed) * 100) : 0;
    const elapsed = startTimestamp ? Math.max(0, Math.round((Date.now() - startTimestamp) / 1000)) : 0;
    
    return {
      cardsReviewed,
      correctAnswers,
      accuracy,
      ratings,
      elapsed,
      startTime
    };
  }

  /**
   * End current session
   */
  endSession() {
    const stats = this.getSessionStats();
    const activeDeckIds = new Set(this.sessionCardRefs.map((ref) => ref.deckId).filter(Boolean));
    if (this.currentDeckId && this.decks.has(this.currentDeckId)) activeDeckIds.add(this.currentDeckId);
    
    // Update deck stats
    activeDeckIds.forEach((deckId) => {
      const deck = this.decks.get(deckId);
      if (deck) {
        deck.stats.lastStudied = new Date().toISOString();
        deck.stats.totalTime += stats.elapsed;
        this._updateDeckStats(deck);
      }
    });
    
    this._clearActiveSessionState();
    this._saveToStorage();
    
    return stats;
  }

  hasActiveSession() {
    return Boolean(this.currentDeckId && this.sessionCardRefs.length > 0);
  }

  resumeSession() {
    if (!this.hasActiveSession()) return null;
    const deck = this.currentSessionDeck || this._snapshotDeck(this.decks.get(this.currentDeckId));
    const cards = this._getActiveSessionCards();

    return {
      deck,
      cards,
      totalCards: cards.length,
      dueCards: cards.filter((card) => this.isCardDue(card)).length,
      context: this.sessionScope || this.sessionStats.context || null,
    };
  }

  _activateSession({ deck, refs, options = {}, scope = null }) {
    this.currentDeckId = deck.id;
    this.currentSessionDeck = deck;
    this.currentCardIndex = 0;
    this.sessionCardRefs = Array.isArray(refs) ? refs.filter(ref => ref?.deckId && ref?.cardId) : [];
    this.sessionOptions = { ...options };
    this.sessionScope = scope;

    this.sessionStats = {
      cardsReviewed: 0,
      correctAnswers: 0,
      startTime: new Date().toISOString(),
      ratings: { again: 0, hard: 0, good: 0, easy: 0 },
      deckId: deck.id,
      context: scope,
    };

    this._saveToStorage();
  }

  _getActiveSessionCards() {
    return (this.sessionCardRefs || [])
      .map((ref) => this._resolveCardRef(ref))
      .filter(Boolean);
  }

  _resolveCardRef(ref) {
    const deck = this.decks.get(ref?.deckId);
    if (!deck) return null;
    const card = (deck.cards || []).find((candidate) => candidate.id === ref.cardId);
    return card ? this._decorateCard(card, deck) : null;
  }

  _decorateCard(card, deck) {
    return {
      ...card,
      deckId: deck.id,
      deckName: deck.name,
      domainId: card.domainId || deck.domainId || null,
      topicIds: Array.isArray(card.topicIds) ? [...card.topicIds] : [],
    };
  }

  _snapshotDeck(deck) {
    if (!deck) return null;
    return {
      id: deck.id,
      name: deck.name,
      description: deck.description || '',
      category: deck.category || 'general',
      tags: Array.isArray(deck.tags) ? [...deck.tags] : [],
      domainId: deck.domainId || null,
    };
  }

  _createScopedDeckSnapshot(scope = {}, cards = []) {
    const scopeLabel = scope.topicTitle || scope.domainTitle || scope.title || 'Focused Review';
    const idParts = ['scope', scope.domainId, scope.topicId].filter(Boolean);

    return {
      id: idParts.length > 1 ? idParts.join(':') : `scope:${Date.now()}`,
      name: scope.topicTitle ? `${scope.topicTitle} Flashcards` : `${scopeLabel} Flashcards`,
      description: scope.topicId
        ? `Topic-tagged active recall queue for ${scopeLabel}.`
        : `Domain-tagged active recall queue across ${cards.length} cards.`,
      category: 'scoped',
      tags: [scope.domainId ? `domain:${scope.domainId}` : null, scope.topicId ? `topic:${scope.topicId}` : null].filter(Boolean),
      domainId: scope.domainId || null,
    };
  }

  _filterCardsForSession(cards, options = {}) {
    const {
      includeNew = true,
      includeDue = true,
      includeAll = false,
      fallbackToAll = false,
      limit = null,
    } = options;

    let selected = [];
    if (includeAll) {
      selected = [...cards];
    } else {
      if (includeDue) selected.push(...cards.filter((card) => this.isCardDue(card)));
      if (includeNew) selected.push(...cards.filter((card) => card.difficulty === 'new'));
      selected = this._uniqueCards(selected);
      if (selected.length === 0 && fallbackToAll) selected = [...cards];
    }

    const normalizedLimit = Number.isInteger(limit) && limit > 0 ? limit : null;
    return normalizedLimit ? selected.slice(0, normalizedLimit) : selected;
  }

  _uniqueCards(cards) {
    const seen = new Set();
    return cards.filter((card) => {
      const key = `${card.deckId || ''}:${card.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  _matchesScope(card, deck, scope = null) {
    if (!scope) return true;
    const tags = new Set([...(deck.tags || []), ...(card.tags || [])].map((tag) => String(tag).toLowerCase()));
    const cardDomainId = card.domainId || deck.domainId || null;
    const topicIds = Array.isArray(card.topicIds) ? card.topicIds : [];

    if (scope.domainId) {
      const domainTag = `domain:${scope.domainId}`.toLowerCase();
      if (cardDomainId !== scope.domainId && !tags.has(domainTag)) return false;
    }

    if (scope.topicId) {
      const topicTag = `topic:${scope.topicId}`.toLowerCase();
      if (!topicIds.includes(scope.topicId) && !tags.has(topicTag)) return false;
    }

    if (Array.isArray(scope.tags) && scope.tags.length > 0) {
      const hasAnyTag = scope.tags.some((tag) => tags.has(String(tag).toLowerCase()));
      if (!hasAnyTag) return false;
    }

    return true;
  }

  // ═══════════════════════════════════════════
  // PROGRESS TRACKING
  // ═══════════════════════════════════════════

  /**
   * Update deck statistics
   */
  _updateDeckStats(deck) {
    const cards = deck.cards;
    
    deck.stats.totalCards = cards.length;
    deck.stats.newCards = cards.filter(c => c.difficulty === 'new').length;
    deck.stats.learningCards = cards.filter(c => c.difficulty === 'learning').length;
    deck.stats.reviewCards = cards.filter(c => c.difficulty === 'young' || c.difficulty === 'mature').length;
    deck.stats.masteredCards = cards.filter(c => c.difficulty === 'mature').length;
  }

  /**
   * Get deck progress
   */
  getDeckProgress(deckId) {
    const deck = this.decks.get(deckId);
    if (!deck) return null;

    const { totalCards, newCards, learningCards, reviewCards, masteredCards } = deck.stats;
    
    const dueToday = deck.cards.filter(c => this.isCardDue(c)).length;
    const completion = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
    
    return {
      totalCards,
      newCards,
      learningCards,
      reviewCards,
      masteredCards,
      dueToday,
      completion,
      lastStudied: deck.stats.lastStudied,
      totalTime: deck.stats.totalTime
    };
  }

  /**
   * Get overall progress across all decks
   */
  getOverallProgress() {
    const decks = this.getAllDecks();
    
    let totalCards = 0;
    let masteredCards = 0;
    let dueToday = 0;
    
    decks.forEach(deck => {
      totalCards += deck.stats.totalCards;
      masteredCards += deck.stats.masteredCards;
      dueToday += deck.cards.filter(c => this.isCardDue(c)).length;
    });

    return {
      totalDecks: decks.length,
      totalCards,
      masteredCards,
      dueToday,
      overallCompletion: totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0
    };
  }

  // ═══════════════════════════════════════════
  // IMPORT / EXPORT
  // ═══════════════════════════════════════════

  /**
   * Export deck to JSON
   * @param {string} deckId - Deck to export
   * @param {string} format - 'simple' or 'rich'
   */
  exportDeck(deckId, format = 'rich') {
    const deck = this.decks.get(deckId);
    if (!deck) throw new Error(`Deck not found: ${deckId}`);

    if (format === 'simple') {
      // Simple format: just front/back
      return {
        name: deck.name,
        description: deck.description,
        cards: deck.cards.map(c => ({
          front: c.front,
          back: c.back
        }))
      };
    }

    // Rich format: includes all metadata
    return {
      version: '1.0',
      format: 'netlearn-flashcards',
      exportedAt: new Date().toISOString(),
      deck: {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        category: deck.category,
        domainId: deck.domainId || null,
        tags: deck.tags,
        cards: deck.cards.map(c => ({
          id: c.id,
          front: c.front,
          back: c.back,
          tags: c.tags,
          domainId: c.domainId || deck.domainId || null,
          topicIds: Array.isArray(c.topicIds) ? c.topicIds : []
          // Note: Spaced repetition data is NOT exported
          // Each user has their own learning history
        }))
      }
    };
  }

  /**
   * Export all decks
   */
  exportAllDecks(format = 'rich') {
    const decks = this.getAllDecks();
    return {
      version: '1.0',
      format: 'netlearn-flashcards-bulk',
      exportedAt: new Date().toISOString(),
      decks: decks.map(d => this.exportDeck(d.id, format).deck || this.exportDeck(d.id, format))
    };
  }

  /**
   * Import deck from JSON
   * @param {Object|string} data - JSON object or string
   * @param {string} format - 'simple' or 'rich'
   */
  importDeck(data, format = 'rich') {
    // Parse if string
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    let deckData;

    if (format === 'simple') {
      // Simple format
      deckData = {
        name: data.name,
        description: data.description,
        cards: data.cards
      };
    } else {
      // Rich format - check if it's bulk import
      if (data.format === 'netlearn-flashcards-bulk') {
        // Bulk import
        return data.decks.map(d => this.importDeck({ deck: d }, 'rich'));
      }
      
      // Single deck rich format
      deckData = data.deck || data;
    }

    // Create new deck (generate new ID to avoid conflicts)
    const newDeck = this.createDeck({
      name: deckData.name,
      description: deckData.description,
      category: deckData.category || 'imported',
      tags: deckData.tags || [],
      domainId: deckData.domainId || null
    });

    // Import cards
    if (deckData.cards && Array.isArray(deckData.cards)) {
      deckData.cards.forEach(cardData => {
        this.createCard(newDeck.id, {
          front: cardData.front,
          back: cardData.back,
          tags: cardData.tags || [],
          domainId: cardData.domainId || newDeck.domainId || null,
          topicIds: Array.isArray(cardData.topicIds) ? cardData.topicIds : []
        });
      });
    }

    return newDeck;
  }

  // ═══════════════════════════════════════════
  // SEARCH & FILTER
  // ═══════════════════════════════════════════

  /**
   * Search cards across all decks
   */
  searchCards(query, options = {}) {
    const { deckId = null, limit = 50 } = options;
    const results = [];
    const searchTerm = query.toLowerCase();

    const decksToSearch = deckId ? [this.decks.get(deckId)].filter(Boolean) : this.getAllDecks();

    for (const deck of decksToSearch) {
      for (const card of deck.cards) {
        const frontMatch = card.front.toLowerCase().includes(searchTerm);
        const backMatch = card.back.toLowerCase().includes(searchTerm);
        const tagMatch = card.tags.some(t => t.toLowerCase().includes(searchTerm));

        if (frontMatch || backMatch || tagMatch) {
          results.push({
            deck: { id: deck.id, name: deck.name },
            card,
            matchType: frontMatch ? 'front' : backMatch ? 'back' : 'tag'
          });

          if (results.length >= limit) return results;
        }
      }
    }

    return results;
  }

  /**
   * Get cards by tag
   */
  getCardsByTag(tag, deckId = null) {
    const results = [];
    const decksToSearch = deckId ? [this.decks.get(deckId)].filter(Boolean) : this.getAllDecks();

    for (const deck of decksToSearch) {
      const matchingCards = deck.cards.filter(c => c.tags.includes(tag));
      results.push(...matchingCards.map(c => ({ ...c, deckId: deck.id, deckName: deck.name })));
    }

    return results;
  }

  // ═══════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════

  /**
   * Generate unique ID
   */
  generateId() {
    return `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Save to localStorage
   */
  _saveToStorage() {
    try {
      if (typeof localStorage === 'undefined') return;
      const data = {
        decks: Array.from(this.decks.entries()),
        activeSession: this._serializeActiveSession(),
        version: '1.0'
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save flashcards to storage:', e);
    }
  }

  /**
   * Load from localStorage
   */
  _loadFromStorage() {
    try {
      if (typeof localStorage === 'undefined') return;
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.decks = new Map(parsed.decks || []);
        this._restoreActiveSession(parsed.activeSession || null);
      }
    } catch (e) {
      console.error('Failed to load flashcards from storage:', e);
      this.decks = new Map();
      this._clearActiveSessionState();
    }
  }

  _serializeActiveSession() {
    if (!this.currentDeckId || !Array.isArray(this.sessionCardRefs) || this.sessionCardRefs.length === 0) {
      return null;
    }

    return {
      currentDeckId: this.currentDeckId,
      currentCardIndex: this.currentCardIndex,
      currentSessionDeck: this.currentSessionDeck,
      sessionCardRefs: this.sessionCardRefs,
      sessionOptions: this.sessionOptions,
      sessionScope: this.sessionScope,
      sessionStats: this.sessionStats,
      savedAt: new Date().toISOString(),
    };
  }

  _restoreActiveSession(activeSession) {
    if (!activeSession || !Array.isArray(activeSession.sessionCardRefs) || activeSession.sessionCardRefs.length === 0) {
      this._clearActiveSessionState();
      return;
    }

    const refs = activeSession.sessionCardRefs.filter((ref) => {
      const deck = this.decks.get(ref?.deckId);
      return deck && (deck.cards || []).some((card) => card.id === ref.cardId);
    });

    if (refs.length === 0) {
      this._clearActiveSessionState();
      return;
    }

    this.currentDeckId = activeSession.currentDeckId || activeSession.currentSessionDeck?.id || refs[0].deckId;
    this.currentSessionDeck = activeSession.currentSessionDeck || this._snapshotDeck(this.decks.get(this.currentDeckId));
    this.sessionCardRefs = refs;
    this.currentCardIndex = Math.min(Math.max(Number(activeSession.currentCardIndex) || 0, 0), refs.length);
    this.sessionOptions = activeSession.sessionOptions || {};
    this.sessionScope = activeSession.sessionScope || activeSession.sessionStats?.context || null;
    this.sessionStats = {
      cardsReviewed: Number(activeSession.sessionStats?.cardsReviewed) || 0,
      correctAnswers: Number(activeSession.sessionStats?.correctAnswers) || 0,
      startTime: activeSession.sessionStats?.startTime || new Date().toISOString(),
      ratings: {
        again: Number(activeSession.sessionStats?.ratings?.again) || 0,
        hard: Number(activeSession.sessionStats?.ratings?.hard) || 0,
        good: Number(activeSession.sessionStats?.ratings?.good) || 0,
        easy: Number(activeSession.sessionStats?.ratings?.easy) || 0,
      },
      deckId: activeSession.sessionStats?.deckId || this.currentDeckId,
      context: this.sessionScope,
    };
  }

  _clearActiveSessionState() {
    this.currentDeckId = null;
    this.currentCardIndex = 0;
    this.currentSessionDeck = null;
    this.sessionCardRefs = [];
    this.sessionOptions = {};
    this.sessionScope = null;
    this.sessionStats = {
      cardsReviewed: 0,
      correctAnswers: 0,
      startTime: null,
      ratings: { again: 0, hard: 0, good: 0, easy: 0 }
    };
  }

  /**
   * Clear all data
   */
  clearAllData() {
    this.decks.clear();
    this._clearActiveSessionState();
    if (typeof localStorage !== 'undefined') localStorage.removeItem(this.storageKey);
  }

  /**
   * Get storage size
   */
  getStorageInfo() {
    if (typeof localStorage === 'undefined') return { sizeBytes: 0, sizeKB: 0 };
    const data = localStorage.getItem(this.storageKey) || '';
    return {
      sizeBytes: new Blob([data]).size,
      sizeKB: Math.round(new Blob([data]).size / 1024 * 100) / 100
    };
  }
}

// Export singleton instance
export const flashcardEngine = new FlashcardEngine();
export default flashcardEngine;
