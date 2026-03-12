/**
 * timer.js — Countdown / Stopwatch Widget
 *
 * Responsibility:
 *   Reusable timer component. Supports countdown (exam mode)
 *   and stopwatch (practice mode). Renders its own UI into
 *   a provided container element.
 *
 * Events emitted (via eventBus):
 *   timer:tick      — { elapsed, remaining } every second
 *   timer:warning   — when <= warningThreshold seconds remain
 *   timer:expired   — when countdown reaches zero
 *   timer:stopped   — when manually stopped/paused
 *
 * Depends on: eventBus.js, helperFunctions.js
 */

import { eventBus }   from '../js/eventBus.js';
import { formatTime } from '../utils/helperFunctions.js';

// Timer modes
const MODE = { COUNTDOWN: 'countdown', STOPWATCH: 'stopwatch', IDLE: 'idle' };

// Visual urgency thresholds (seconds remaining)
const URGENCY = { WARNING: 60, CRITICAL: 30 };

class Timer {
  constructor() {
    this._mode            = MODE.IDLE;
    this._totalSeconds    = 0;
    this._elapsed         = 0;     // seconds elapsed
    this._intervalId      = null;
    this._container       = null;
    this._isPaused        = false;
    this._warningFired    = false;
    this._warningThreshold = URGENCY.WARNING;
  }

  /**
   * Render the timer display into a container element.
   * Must be called before start() for visual output.
   * Safe to call multiple times — re-renders in place.
   *
   * @param {HTMLElement} containerEl
   */
  render(containerEl) {
    this._container = containerEl;
    this._container.innerHTML = `
      <div class="timer-widget" id="timer-display" role="timer" aria-live="polite">
        <div class="timer-digits" id="timer-digits">00:00</div>
        <div class="timer-label"  id="timer-label">Ready</div>
        <div class="timer-bar-wrap" id="timer-bar-wrap" style="display:none;">
          <div class="timer-bar" id="timer-bar" style="width:100%;"></div>
        </div>
      </div>
    `;
    this._injectTimerStyles();
  }

  /**
   * Start a countdown from `seconds`.
   *
   * @param {number} seconds       — total duration
   * @param {number} [warning=60]  — threshold to emit 'timer:warning'
   */
  startCountdown(seconds, warning = URGENCY.WARNING) {
    this._assertContainer();
    this.reset();

    this._mode             = MODE.COUNTDOWN;
    this._totalSeconds     = seconds;
    this._elapsed          = 0;
    this._isPaused         = false;
    this._warningFired     = false;
    this._warningThreshold = warning;

    this._showBar(true);
    this._update();
    this._intervalId = setInterval(() => this._tick(), 1000);
  }

  /**
   * Start a stopwatch counting upward.
   */
  startStopwatch() {
    this._assertContainer();
    this.reset();

    this._mode     = MODE.STOPWATCH;
    this._elapsed  = 0;
    this._isPaused = false;

    this._showBar(false);
    this._update();
    this._intervalId = setInterval(() => this._tick(), 1000);
  }

  /**
   * Pause the timer. Does not reset elapsed time.
   */
  pause() {
    if (this._mode === MODE.IDLE || this._isPaused) return;
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._isPaused   = true;

    const label = this._el('timer-label');
    if (label) label.textContent = 'Paused';

    eventBus.emit('timer:stopped', {
      elapsed:   this._elapsed,
      remaining: this._getRemaining()
    });
  }

  /**
   * Resume from paused state.
   */
  resume() {
    if (this._mode === MODE.IDLE || !this._isPaused) return;
    this._isPaused   = false;
    this._intervalId = setInterval(() => this._tick(), 1000);
    this._update();
  }

  /**
   * Stop timer and return to idle. Does not clear the display.
   */
  stop() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._mode       = MODE.IDLE;
    this._isPaused   = false;
  }

  /**
   * Full reset — stop and zero the display.
   */
  reset() {
    this.stop();
    this._elapsed       = 0;
    this._warningFired  = false;
    this._mode          = MODE.IDLE;

    const digits = this._el('timer-digits');
    const label  = this._el('timer-label');
    const bar    = this._el('timer-bar');
    if (digits) digits.textContent = '00:00';
    if (label)  label.textContent  = 'Ready';
    if (bar)    bar.style.width    = '100%';
    if (bar)    bar.className      = 'timer-bar';
  }

  /**
   * Return elapsed seconds since start.
   * @returns {number}
   */
  getElapsed() { return this._elapsed; }

  /**
   * Return seconds remaining (countdown) or 0 (stopwatch/idle).
   * @returns {number}
   */
  getRemaining() { return this._getRemaining(); }

  /**
   * Check if timer is currently running.
   * @returns {boolean}
   */
  isRunning() { return this._intervalId !== null; }

  /**
   * Remove timer from DOM and stop all intervals.
   */
  destroy() {
    this.stop();
    if (this._container) {
      this._container.innerHTML = '';
      this._container = null;
    }
  }

  // ─── Private ────────────────────────────────

  _tick() {
    this._elapsed++;
    this._update();

    const remaining = this._getRemaining();

    // Emit tick event
    eventBus.emit('timer:tick', { elapsed: this._elapsed, remaining });

    // Warning threshold (countdown only)
    if (
      this._mode === MODE.COUNTDOWN &&
      !this._warningFired &&
      remaining <= this._warningThreshold
    ) {
      this._warningFired = true;
      eventBus.emit('timer:warning', { remaining });
    }

    // Expiry (countdown only)
    if (this._mode === MODE.COUNTDOWN && remaining <= 0) {
      this.stop();
      eventBus.emit('timer:expired', { totalSeconds: this._totalSeconds });
    }
  }

  _update() {
    const remaining = this._getRemaining();
    const displaySeconds = this._mode === MODE.STOPWATCH ? this._elapsed : remaining;

    // Update digits
    const digits = this._el('timer-digits');
    if (digits) {
      digits.textContent = formatTime(displaySeconds);
      // Apply urgency styling for countdown
      digits.className = 'timer-digits';
      if (this._mode === MODE.COUNTDOWN) {
        if (remaining <= URGENCY.CRITICAL) digits.className += ' timer-critical';
        else if (remaining <= URGENCY.WARNING) digits.className += ' timer-warning';
      }
    }

    // Update label
    const label = this._el('timer-label');
    if (label) {
      if (this._mode === MODE.COUNTDOWN) {
        label.textContent = remaining <= URGENCY.CRITICAL ? '⚠ Time Running Out' : 'Time Remaining';
      } else if (this._mode === MODE.STOPWATCH) {
        label.textContent = 'Elapsed';
      }
    }

    // Update progress bar (countdown only)
    if (this._mode === MODE.COUNTDOWN) {
      const bar = this._el('timer-bar');
      if (bar && this._totalSeconds > 0) {
        const pct = (remaining / this._totalSeconds) * 100;
        bar.style.width = `${Math.max(0, pct)}%`;
        bar.className = 'timer-bar';
        if (remaining <= URGENCY.CRITICAL)      bar.className += ' bar-critical';
        else if (remaining <= URGENCY.WARNING)  bar.className += ' bar-warning';
      }
    }
  }

  _getRemaining() {
    if (this._mode !== MODE.COUNTDOWN) return 0;
    return Math.max(0, this._totalSeconds - this._elapsed);
  }

  _showBar(show) {
    const wrap = this._el('timer-bar-wrap');
    if (wrap) wrap.style.display = show ? 'block' : 'none';
  }

  _el(id) {
    return this._container ? this._container.querySelector(`#${id}`) : null;
  }

  _assertContainer() {
    if (!this._container) {
      console.warn('[Timer] render(containerEl) must be called before start methods.');
    }
  }

  /**
   * Inject timer-specific CSS once into the document head.
   * Avoids requiring a separate CSS import for this small component.
   */
  _injectTimerStyles() {
    if (document.getElementById('timer-styles')) return;
    const style = document.createElement('style');
    style.id = 'timer-styles';
    style.textContent = `
      .timer-widget {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        padding: 0.75rem 1.25rem;
        background: var(--color-bg-raised);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        min-width: 120px;
        text-align: center;
      }
      .timer-digits {
        font-family: var(--font-mono);
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-cyan);
        letter-spacing: 0.05em;
        line-height: 1;
        transition: color 0.3s ease;
      }
      .timer-digits.timer-warning  { color: var(--color-warning); }
      .timer-digits.timer-critical {
        color: var(--color-error);
        animation: glow-pulse 0.8s ease-in-out infinite;
      }
      .timer-label {
        font-size: 0.6875rem;
        font-family: var(--font-mono);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--color-text-muted);
      }
      .timer-bar-wrap {
        width: 100%;
        height: 4px;
        background: var(--color-bg-medium);
        border-radius: 99px;
        overflow: hidden;
        margin-top: 0.25rem;
      }
      .timer-bar {
        height: 100%;
        background: var(--color-cyan);
        border-radius: 99px;
        transition: width 0.9s linear, background 0.3s ease;
      }
      .timer-bar.bar-warning  { background: var(--color-warning); }
      .timer-bar.bar-critical { background: var(--color-error); }
    `;
    document.head.appendChild(style);
  }
}

// Export a factory function so each module gets its OWN instance.
// Unlike singletons, timers are per-module (exam has one, practice has one).
export function createTimer() { return new Timer(); }

// Also export the class for any module that needs to instantiate directly.
export { Timer };
