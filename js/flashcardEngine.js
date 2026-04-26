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

    this.currentDeckId = deckId;
    this.currentCardIndex = 0;
    
    // Reset session stats
    this.sessionStats = {
      cardsReviewed: 0,
      correctAnswers: 0,
      startTime: new Date(),
      ratings: { again: 0, hard: 0, good: 0, easy: 0 },
      deckId
    };

    // Get cards for this session
    const cards = this.getSessionCards(deckId, options);
    
    return {
      deck,
      cards,
      totalCards: cards.length,
      dueCards: cards.filter(c => this.isCardDue(c)).length
    };
  }

  /**
   * Get cards for current session
   */
  getSessionCards(deckId, options = {}) {
    const deck = this.decks.get(deckId);
    if (!deck) return [];

    const { includeNew = true, includeDue = true, limit = null } = options;
    
    let cards = [];

    // Get due cards first
    if (includeDue) {
      const dueCards = deck.cards.filter(c => this.isCardDue(c));
      cards.push(...dueCards);
    }

    // Add new cards if requested
    if (includeNew) {
      const newCards = deck.cards.filter(c => c.difficulty === 'new');
      cards.push(...newCards);
    }

    // Remove duplicates
    cards = [...new Set(cards)];

    // Apply limit
    if (limit && cards.length > limit) {
      cards = cards.slice(0, limit);
    }

    return cards;
  }

  /**
   * Get current card in session
   */
  getCurrentCard() {
    if (!this.currentDeckId) return null;
    
    const deck = this.decks.get(this.currentDeckId);
    if (!deck) return null;

    const cards = this.getSessionCards(this.currentDeckId);
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
    const cards = this.currentDeckId ? this.getSessionCards(this.currentDeckId) : [];
    const maxIndex = Math.max(cards.length - 1, 0);
    this.currentCardIndex = Math.min(Math.max(next, 0), maxIndex);
    return this.currentCardIndex;
  }

  /**
   * Rate current card and move to next
   */
  rateCurrentCard(rating) {
    const card = this.getCurrentCard();
    if (!card) return null;

    // Update card with SM-2 algorithm
    const updates = this.calculateSM2(card, rating);
    
    // Update card statistics
    updates.timesReviewed = (card.timesReviewed || 0) + 1;
    if (rating >= 2) {
      updates.timesCorrect = (card.timesCorrect || 0) + 1;
    }

    // Update session stats
    this.sessionStats.cardsReviewed++;
    if (rating >= 2) this.sessionStats.correctAnswers++;
    
    const ratingNames = ['again', 'hard', 'good', 'easy'];
    this.sessionStats.ratings[ratingNames[rating]]++;

    // Apply updates
    this.updateCard(this.currentDeckId, card.id, updates);
    
    // Move to next card
    this.currentCardIndex++;

    return {
      card,
      updates,
      sessionComplete: this.currentCardIndex >= this.getSessionCards(this.currentDeckId).length,
      sessionStats: this.getSessionStats()
    };
  }

  /**
   * Move to next card without rating
   */
  nextCard() {
    const cards = this.getSessionCards(this.currentDeckId);
    this.currentCardIndex = Math.min(this.currentCardIndex + 1, cards.length - 1);
    return this.getCurrentCard();
  }

  /**
   * Move to previous card
   */
  previousCard() {
    this.currentCardIndex = Math.max(this.currentCardIndex - 1, 0);
    return this.getCurrentCard();
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    const { cardsReviewed, correctAnswers, ratings, startTime } = this.sessionStats;
    
    const accuracy = cardsReviewed > 0 ? Math.round((correctAnswers / cardsReviewed) * 100) : 0;
    const elapsed = startTime ? Math.round((new Date() - startTime) / 1000) : 0;
    
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
    
    // Update deck stats
    if (this.currentDeckId) {
      const deck = this.decks.get(this.currentDeckId);
      if (deck) {
        deck.stats.lastStudied = new Date().toISOString();
        deck.stats.totalTime += stats.elapsed;
        this._updateDeckStats(deck);
      }
    }
    
    this._saveToStorage();
    
    this.currentDeckId = null;
    this.currentCardIndex = 0;
    
    return stats;
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
        tags: deck.tags,
        cards: deck.cards.map(c => ({
          id: c.id,
          front: c.front,
          back: c.back,
          tags: c.tags
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
      tags: deckData.tags || []
    });

    // Import cards
    if (deckData.cards && Array.isArray(deckData.cards)) {
      deckData.cards.forEach(cardData => {
        this.createCard(newDeck.id, {
          front: cardData.front,
          back: cardData.back,
          tags: cardData.tags || []
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
      const data = {
        decks: Array.from(this.decks.entries()),
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
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.decks = new Map(parsed.decks || []);
      }
    } catch (e) {
      console.error('Failed to load flashcards from storage:', e);
      this.decks = new Map();
    }
  }

  /**
   * Clear all data
   */
  clearAllData() {
    this.decks.clear();
    this.currentDeckId = null;
    this.currentCardIndex = 0;
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Get storage size
   */
  getStorageInfo() {
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
