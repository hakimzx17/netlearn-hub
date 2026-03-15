/**
 * modalSystem.js — Global Modal Manager
 *
 * Responsibility:
 *   Renders accessible modal dialogs on demand.
 *   Handles open/close/escape/backdrop-click.
 *   Full implementation in Phase 5.
 *
 * Depends on: eventBus.js
 */

import { eventBus } from '../js/eventBus.js';

class ModalSystem {
  constructor() {
    this._root       = null;
    this._isOpen     = false;
    this._openUnsub  = null;
    this._closeUnsub = null;
    this._escHandler = null;
    this._focusTrapHandler = null;
    this._lastFocused = null;
  }

  init() {
    this._root = document.getElementById('modal-root');
    if (!this._root) return;

    // Listen for open/close events from any module
    this._openUnsub  = eventBus.on('modal:open',  (config) => this.open(config));
    this._closeUnsub = eventBus.on('modal:close', ()       => this.close());

    // ESC key listener
    this._escHandler = (e) => {
      if (e.key === 'Escape' && this._isOpen) this.close();
    };
    document.addEventListener('keydown', this._escHandler);
  }

  /**
   * Open a modal dialog.
   * @param {Object} config — { title, body, actions?, wide? }
   */
  open({ title = '', body = '', actions = [], wide = false } = {}) {
    this._lastFocused = document.activeElement;
    const uid = `modal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const titleId = `${uid}-title`;
    const bodyId  = `${uid}-body`;
    this._root.innerHTML = `
      <div class="modal-backdrop" style="
        position:fixed; inset:0;
        background:rgba(8,13,20,0.85);
        display:flex; align-items:center; justify-content:center;
        padding:1.5rem; z-index:var(--z-modal);
      " id="modal-backdrop">
        <div class="modal-enter card" style="
          width:100%; max-width:${wide ? '720px' : '520px'};
          max-height:90vh; overflow-y:auto;
          border-color:var(--color-border-hover);
          box-shadow:var(--shadow-glow);
        " role="dialog" aria-modal="true" aria-labelledby="${titleId}" aria-describedby="${bodyId}" tabindex="-1">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem;">
            <h3 id="${titleId}" style="font-size:1.125rem; color:var(--color-text-primary);">${title}</h3>
            <button id="modal-close-btn" style="
              background:none; border:none; cursor:pointer;
              color:var(--color-text-muted); font-size:1.25rem; line-height:1;
              padding:0.25rem;
            " aria-label="Close modal">✕</button>
          </div>
          <div class="modal-body" id="${bodyId}">${body}</div>
          ${actions.length > 0 ? `
            <div style="display:flex; gap:0.75rem; justify-content:flex-end; margin-top:1.5rem;">
              ${actions.map(a => `
                <button class="btn ${a.style || 'btn-ghost'}" data-modal-action="${a.id}">
                  ${a.label}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    this._isOpen = true;
    this._root.classList.add('is-open');

    // Bind close button
    document.getElementById('modal-close-btn')?.addEventListener('click', () => this.close());

    // Bind backdrop click
    document.getElementById('modal-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-backdrop') this.close();
    });

    // Bind action buttons
    this._root.querySelectorAll('[data-modal-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const actionId = btn.getAttribute('data-modal-action');
        eventBus.emit('modal:action', { id: actionId });
        this.close();
      });
    });

    this._bindFocusTrap();
  }

  close() {
    if (!this._isOpen) return;
    this._unbindFocusTrap();
    this._root.innerHTML = '';
    this._root.classList.remove('is-open');
    this._isOpen = false;
    eventBus.emit('modal:closed');
    if (this._lastFocused && typeof this._lastFocused.focus === 'function') {
      this._lastFocused.focus();
    }
    this._lastFocused = null;
  }

  showExplanation(title, content) {
    this.open({ title, body: `<div class="text-secondary" style="line-height:1.8;">${content}</div>` });
  }

  destroy() {
    if (this._openUnsub)  this._openUnsub();
    if (this._closeUnsub) this._closeUnsub();
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
  }

  _getFocusable(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    ));
  }

  _bindFocusTrap() {
    const dialog = this._root.querySelector('[role="dialog"]');
    if (!dialog) return;
    const focusables = this._getFocusable(dialog);
    if (focusables.length > 0) focusables[0].focus();
    else dialog.focus();

    this._focusTrapHandler = (e) => {
      if (e.key !== 'Tab') return;
      const items = this._getFocusable(dialog);
      if (items.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener('keydown', this._focusTrapHandler);
  }

  _unbindFocusTrap() {
    const dialog = this._root.querySelector('[role="dialog"]');
    if (dialog && this._focusTrapHandler) {
      dialog.removeEventListener('keydown', this._focusTrapHandler);
    }
    this._focusTrapHandler = null;
  }
}

export const modalSystem = new ModalSystem();
