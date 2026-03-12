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
  }

  init() {
    this._root = document.getElementById('modal-root');
    if (!this._root) return;

    // Listen for open/close events from any module
    this._openUnsub  = eventBus.on('modal:open',  (config) => this.open(config));
    this._closeUnsub = eventBus.on('modal:close', ()       => this.close());

    // ESC key listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._isOpen) this.close();
    });
  }

  /**
   * Open a modal dialog.
   * @param {Object} config — { title, body, actions?, wide? }
   */
  open({ title = '', body = '', actions = [], wide = false } = {}) {
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
        " role="dialog" aria-modal="true">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem;">
            <h3 style="font-size:1.125rem; color:var(--color-text-primary);">${title}</h3>
            <button id="modal-close-btn" style="
              background:none; border:none; cursor:pointer;
              color:var(--color-text-muted); font-size:1.25rem; line-height:1;
              padding:0.25rem;
            " aria-label="Close modal">✕</button>
          </div>
          <div class="modal-body">${body}</div>
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
  }

  close() {
    if (!this._isOpen) return;
    this._root.innerHTML = '';
    this._root.classList.remove('is-open');
    this._isOpen = false;
    eventBus.emit('modal:closed');
  }

  showExplanation(title, content) {
    this.open({ title, body: `<div class="text-secondary" style="line-height:1.8;">${content}</div>` });
  }

  destroy() {
    if (this._openUnsub)  this._openUnsub();
    if (this._closeUnsub) this._closeUnsub();
  }
}

export const modalSystem = new ModalSystem();
