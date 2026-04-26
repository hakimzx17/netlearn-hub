/**
 * helperFunctions.js — General DOM and Logic Utilities
 *
 * Responsibility:
 *   DOM helpers, string formatters, functional utilities.
 *   Pure functions — no business logic, no imports needed.
 *   Used by all layers: modules, components, core.
 */

/**
 * querySelector shorthand with optional parent scope.
 * @param {string} selector
 * @param {Element} [parent=document]
 * @returns {Element|null}
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * querySelectorAll as a real Array.
 * @param {string} selector
 * @param {Element} [parent=document]
 * @returns {Element[]}
 */
export function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/**
 * Create a DOM element with attributes and optional text content.
 * @param {string} tag — HTML tag name
 * @param {Object} [attrs={}] — { className, id, 'data-x': val, ... }
 * @param {string} [text=''] — Inner text content
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, text = '') {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'innerHTML') {
      el.innerHTML = value;
    } else {
      el.setAttribute(key, value);
    }
  });
  if (text) el.textContent = text;
  return el;
}

/**
 * Remove all children from a DOM element.
 * Preferred over innerHTML = '' for performance and event safety.
 * @param {Element} el
 */
export function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/**
 * Debounce a function — delay execution until after wait ms
 * have passed since the last invocation.
 * @param {Function} fn
 * @param {number} wait — milliseconds
 * @returns {Function}
 */
export function debounce(fn, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Throttle a function — execute at most once per wait ms.
 * @param {Function} fn
 * @param {number} wait — milliseconds
 * @returns {Function}
 */
export function throttle(fn, wait) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      return fn.apply(this, args);
    }
  };
}

/**
 * Deep clone a value using structuredClone with JSON fallback.
 * @param {*} obj
 * @returns {*}
 */
export function deepClone(obj) {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
}

/**
 * Return a random element from an array.
 * @param {Array} array
 * @returns {*}
 */
export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Fisher-Yates shuffle — returns a new shuffled array.
 * Does NOT mutate the original.
 * @param {Array} array
 * @returns {Array}
 */
export function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Format seconds into MM:SS string.
 * @param {number} seconds
 * @returns {string} e.g. '04:30'
 */
export function formatTime(seconds) {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.floor(Math.abs(seconds) % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Clamp a number between min and max (inclusive).
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Promise that resolves after ms milliseconds.
 * Used by simulations to create visual pauses between steps.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a unique string ID.
 * @param {string} [prefix='id']
 * @returns {string} e.g. 'id-a3f8k2'
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Escape HTML special characters to prevent XSS.
 * Use when injecting user-provided strings into innerHTML.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Replace CSS custom properties in injected stylesheet strings with
 * static literal values. Some modules inject styles at runtime where
 * var(--token) resolution is unreliable in this project setup.
 *
 * @param {string} cssText
 * @returns {string}
 */
export function resolveInjectedCssTokens(cssText) {
  const TOKENS = {
    '--color-bg-deepest': '#080d14',
    '--color-bg-dark': '#0d1520',
    '--color-bg-medium': '#111d2e',
    '--color-bg-panel': '#152033',
    '--color-bg-raised': '#1a2840',
    '--color-bg-surface': '#1e3050',
    '--color-cyan': '#00d4ff',
    '--color-cyan-glow': 'rgba(0, 212, 255, 0.15)',
    '--color-amber': '#ffb800',
    '--color-success': '#00e676',
    '--color-warning': '#ffb800',
    '--color-error': '#ff4444',
    '--color-text-primary': '#e8f4fd',
    '--color-text-secondary': '#7fa8c9',
    '--color-text-muted': '#4a6d8a',
    '--color-border': 'rgba(0, 212, 255, 0.12)',
    '--font-display': "'Space Grotesk', sans-serif",
    '--font-body': "'Instrument Sans', sans-serif",
    '--font-mono': "'JetBrains Mono', monospace",
    '--text-xs': '0.6875rem',
    '--text-sm': '0.8125rem',
    '--text-base': '0.9375rem',
    '--text-md': '1.0625rem',
    '--radius-xs': '3px',
    '--radius-sm': '6px',
    '--radius-md': '10px',
    '--radius-lg': '16px',
    '--transition-fast': '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    '--transition-base': '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    '--shadow-glow': '0 0 40px rgba(0, 212, 255, 0.3)',
  };
  return cssText.replace(/var\((--[a-zA-Z0-9-]+)\)/g, (match, token) => TOKENS[token] || match);
}

/**
 * Add a CSS class to an element for a specified duration,
 * then remove it. Used for trigger-once animations.
 * @param {Element} el
 * @param {string} className
 * @param {number} [duration=600] — ms
 */
export function flashClass(el, className, duration = 600) {
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), duration);
}

/**
 * Show a toast notification via the #toast-root element.
 * Works independently of any module — pure DOM + CSS.
 *
 * @param {string} message
 * @param {'info'|'success'|'error'|'warning'} [type='info']
 * @param {number} [duration=3000] — ms before auto-dismiss
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toastRoot = document.getElementById('toast-root');
  if (!toastRoot) return;

  const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };

  const toast = createElement('div', { className: `toast ${type} toast-enter` });
  toast.innerHTML = `
    <span style="font-size:1rem">${icons[type] || 'INFO'}</span>
    <span style="flex:1; font-size:0.875rem">${escapeHtml(message)}</span>
    <button class="toast-close" style="opacity:0.5; cursor:pointer; background:none; border:none; color:inherit; font-size:1rem;">X</button>
  `;

  const dismiss = () => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 250);
  };

  toast.querySelector('.toast-close').addEventListener('click', dismiss);
  toastRoot.appendChild(toast);
  setTimeout(dismiss, duration);
}
