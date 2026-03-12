/**
 * eventBus.js — Global Publish/Subscribe Event System
 *
 * Responsibility:
 *   Decouples all modules. No module should import another directly.
 *   All cross-module communication flows through this bus.
 *
 * Event naming convention: 'namespace:action'
 *   nav:route-change    router:module-loaded   sim:step-complete
 *   quiz:answer-submitted  timer:expired        modal:open
 *
 * Depends on: Nothing (zero dependencies)
 */

class EventBus {
  constructor() {
    /**
     * _listeners: Map<eventName, Set<handler>>
     * Using Set prevents duplicate handler registration.
     */
    this._listeners = new Map();

    /**
     * _onceTokens: WeakMap to track once-registered wrappers
     * Allows off() to work correctly for once-registered handlers.
     */
    this._onceTokens = new WeakMap();

    // Dev mode: log all events to console when enabled
    this._debug = false;
  }

  /**
   * Subscribe to an event.
   * @param {string} event — Event name e.g. 'timer:expired'
   * @param {Function} handler — Callback receiving (payload)
   * @returns {Function} Unsubscribe function for convenience
   */
  on(event, handler) {
    if (typeof handler !== 'function') {
      console.error(`[EventBus] Handler for "${event}" must be a function`);
      return () => {};
    }

    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);

    if (this._debug) {
      console.debug(`[EventBus] Subscribed: "${event}"`);
    }

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Unsubscribe a handler from an event.
   * @param {string} event
   * @param {Function} handler — Must be the exact same function reference
   */
  off(event, handler) {
    if (!this._listeners.has(event)) return;

    // Handle once() wrapper removal
    const wrapper = this._onceTokens.get(handler);
    const toRemove = wrapper || handler;

    this._listeners.get(event).delete(toRemove);

    // Clean up empty sets
    if (this._listeners.get(event).size === 0) {
      this._listeners.delete(event);
    }
  }

  /**
   * Publish an event to all subscribers.
   * Handlers are called synchronously in subscription order.
   * Errors in one handler do NOT prevent others from executing.
   *
   * @param {string} event
   * @param {*} payload — Any value passed to all handlers
   */
  emit(event, payload) {
    if (this._debug) {
      console.debug(`[EventBus] Emit: "${event}"`, payload);
    }

    if (!this._listeners.has(event)) return;

    // Snapshot the set — handlers may call off() during iteration
    const handlers = [...this._listeners.get(event)];

    handlers.forEach(handler => {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err);
      }
    });
  }

  /**
   * Subscribe to an event for exactly one emission, then auto-unsubscribe.
   * @param {string} event
   * @param {Function} handler
   * @returns {Function} Cancel function (prevents the once handler from firing)
   */
  once(event, handler) {
    const wrapper = (payload) => {
      this.off(event, handler);
      handler(payload);
    };

    // Store mapping so off(event, handler) works for once-registered handlers
    this._onceTokens.set(handler, wrapper);
    this.on(event, wrapper);

    return () => this.off(event, handler);
  }

  /**
   * Remove ALL handlers for a specific event.
   * Use with caution — typically only during full module teardown.
   * @param {string} event
   */
  clear(event) {
    this._listeners.delete(event);
  }

  /**
   * Remove all listeners for all events.
   * Only called during full application reset.
   */
  clearAll() {
    this._listeners.clear();
  }

  /**
   * Enable/disable debug logging of all events.
   * @param {boolean} enabled
   */
  setDebug(enabled) {
    this._debug = enabled;
    console.info(`[EventBus] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
  }

  /**
   * Inspect current listener counts (development utility).
   * @returns {Object} Map of event → handler count
   */
  inspect() {
    const result = {};
    this._listeners.forEach((handlers, event) => {
      result[event] = handlers.size;
    });
    return result;
  }
}

// Export singleton — one bus for the entire application lifecycle
export const eventBus = new EventBus();
