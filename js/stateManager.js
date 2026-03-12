/**
 * stateManager.js — Centralized Reactive State Store
 *
 * Responsibility:
 *   Single source of truth for all application state.
 *   No module holds its own persistent state.
 *   Notifies subscribers when state keys change.
 *   Persists user progress to localStorage.
 *
 * Depends on: eventBus.js
 */

import { eventBus } from './eventBus.js';

/**
 * Keys that are automatically persisted to localStorage.
 * Simulation state and transient data are NOT persisted.
 */
const PERSISTENT_KEYS = new Set(['userProgress', 'theme']);

/**
 * Default initial state — all keys declared here.
 * Modules must not add undeclared keys.
 */
const INITIAL_STATE = {
  // Navigation
  currentRoute: '/',

  // Exam session (null when not in exam)
  examSession: null,
  // { questions: [], currentIndex: 0, score: 0, timeLeft: 0, isComplete: false }

  // Active simulation state (cleared on route change)
  simState: null,
  // { moduleId: string, step: number, data: {} }

  // User progress (persisted)
  userProgress: {
    completedModules: [],
    scores: {},            // { moduleId: highScore }
    examAttempts: 0,
    bestExamScore: 0,
  },

  // Live simulation data (volatile — not persisted)
  arpCache:     {},   // { '192.168.1.1': 'aa:bb:cc:dd:ee:ff' }
  macTable:     {},   // { 'aa:bb:cc:dd:ee:ff': 'Port1' }
  routingTable: [],   // [{ network, prefix, nextHop, interface, metric }]

  // UI state
  theme:         'dark',
  sidebarOpen:   true,
  activeModal:   null,
};

class StateManager {
  constructor() {
    // Deep clone initial state so INITIAL_STATE is never mutated
    this._state = this._deepClone(INITIAL_STATE);

    // Subscribers: Map<key, Set<callback>>
    this._subscribers = new Map();

    // Load persisted values from localStorage
    this._loadPersisted();
  }

  /**
   * Read the current value for a state key.
   * Returns undefined for undeclared keys (warns in console).
   *
   * @param {string} key
   * @returns {*} Current state value
   */
  getState(key) {
    if (!(key in INITIAL_STATE)) {
      console.warn(`[StateManager] Unknown state key: "${key}"`);
    }
    return this._state[key];
  }

  /**
   * Update a state key and notify all subscribers.
   * Does NOT mutate nested objects — pass a full replacement value.
   *
   * @param {string} key
   * @param {*} value — New value (replaces current, not merged)
   */
  setState(key, value) {
    if (!(key in INITIAL_STATE)) {
      console.warn(`[StateManager] Attempted to set unknown key: "${key}"`);
      return;
    }

    const previous = this._state[key];

    // Skip update if value hasn't changed (shallow check for primitives)
    if (previous === value) return;

    this._state[key] = value;

    // Notify key-specific subscribers
    this._notifySubscribers(key, value, previous);

    // Notify global state listeners
    eventBus.emit('state:updated', { key, value, previous });

    // Persist if this key is marked for persistence
    if (PERSISTENT_KEYS.has(key)) {
      this._persist(key, value);
    }
  }

  /**
   * Merge an object into an existing state key.
   * Only use for object-type keys (userProgress, simState, etc.)
   *
   * @param {string} key
   * @param {Object} partial — Properties to merge into current value
   */
  mergeState(key, partial) {
    const current = this.getState(key);
    if (typeof current !== 'object' || current === null) {
      console.error(`[StateManager] mergeState requires an object key. "${key}" is not an object.`);
      return;
    }
    this.setState(key, { ...current, ...partial });
  }

  /**
   * Subscribe to changes on a specific state key.
   * Callback receives (newValue, previousValue).
   *
   * @param {string} key
   * @param {Function} callback — (newValue, previousValue) => void
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this._subscribers.has(key)) {
      this._subscribers.set(key, new Set());
    }
    this._subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => this.unsubscribe(key, callback);
  }

  /**
   * Remove a subscription for a state key.
   * @param {string} key
   * @param {Function} callback
   */
  unsubscribe(key, callback) {
    if (!this._subscribers.has(key)) return;
    this._subscribers.get(key).delete(callback);
  }

  /**
   * Reset a specific key to its initial default value.
   * Useful for clearing simulation state between module visits.
   * @param {string} key
   */
  reset(key) {
    if (!(key in INITIAL_STATE)) return;
    this.setState(key, this._deepClone(INITIAL_STATE[key]));
  }

  /**
   * Reset ALL volatile (non-persisted) state keys.
   * Called by router when navigating away from a simulation.
   */
  resetVolatile() {
    ['simState', 'arpCache', 'macTable', 'routingTable', 'activeModal'].forEach(key => {
      this.reset(key);
    });
  }

  // ─── Private Methods ───────────────────────

  /**
   * Notify all subscribers for a specific key.
   */
  _notifySubscribers(key, newValue, previousValue) {
    if (!this._subscribers.has(key)) return;
    this._subscribers.get(key).forEach(callback => {
      try {
        callback(newValue, previousValue);
      } catch (err) {
        console.error(`[StateManager] Error in subscriber for "${key}":`, err);
      }
    });
  }

  /**
   * Save a state value to localStorage.
   * Silently handles storage errors (e.g. private browsing quotas).
   */
  _persist(key, value) {
    try {
      localStorage.setItem(`netlearn:${key}`, JSON.stringify(value));
    } catch (err) {
      console.warn(`[StateManager] Could not persist "${key}" to localStorage:`, err);
    }
  }

  /**
   * Restore all PERSISTENT_KEYS from localStorage on startup.
   * Validates that loaded data matches expected shape; discards if corrupt.
   */
  _loadPersisted() {
    PERSISTENT_KEYS.forEach(key => {
      try {
        const raw = localStorage.getItem(`netlearn:${key}`);
        if (raw === null) return;

        const parsed = JSON.parse(raw);

        // Basic type validation — if stored type doesn't match initial type, discard
        const expected = typeof INITIAL_STATE[key];
        if (typeof parsed !== expected) {
          console.warn(`[StateManager] Discarding corrupt persisted value for "${key}"`);
          return;
        }

        // For objects, merge with defaults to handle schema additions between versions
        if (expected === 'object' && parsed !== null) {
          this._state[key] = { ...INITIAL_STATE[key], ...parsed };
        } else {
          this._state[key] = parsed;
        }
      } catch (err) {
        console.warn(`[StateManager] Failed to load persisted key "${key}":`, err);
      }
    });
  }

  /**
   * Deep clone a value using structured clone (modern, safe).
   * Falls back to JSON round-trip if structuredClone unavailable.
   */
  _deepClone(value) {
    try {
      return structuredClone(value);
    } catch {
      return JSON.parse(JSON.stringify(value));
    }
  }
}

export const stateManager = new StateManager();
