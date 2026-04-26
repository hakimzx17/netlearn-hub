/**
 * dragDropEngine.js — Generic Drag-and-Drop Framework
 *
 * Responsibility:
 *   Reusable drag-and-drop system for educational games.
 *   Validates drops against declared correctness rules.
 *   Provides visual feedback for correct/incorrect placements.
 *   Does NOT know anything about networking — purely mechanical.
 *
 * Events emitted:
 *   drag:started    — { itemId, itemData }
 *   drag:dropped    — { itemId, zoneId, correct: bool }
 *   drag:reset      — { }
 *   drag:complete   — { score, total } — all items placed correctly
 *
 * Depends on: eventBus.js, helperFunctions.js
 *
 * Usage:
 *   const dnd = createDragDropEngine();
 *   dnd.init({
 *     containerEl,
 *     items: [{ id, label, data }],
 *     zones: [{ id, label, accepts: itemId, hint }],
 *     onComplete: ({ score, total }) => {},
 *   });
 */

import { eventBus }  from '../js/eventBus.js';
import { flashClass, resolveInjectedCssTokens } from '../utils/helperFunctions.js';

class DragDropEngine {
  constructor() {
    this._itemsContainer   = null;
    this._zonesContainer   = null;
    this._config      = null;
    this._placements  = {};    // { zoneId: itemId }
    this._draggedId   = null;  // itemId currently being dragged
    this._locked      = false; // true when all zones filled correctly
    this._score       = 0;
    this._feedbackVisible = false; // Whether to show correct/incorrect feedback

    // Bound listeners stored for cleanup
    this._boundDragStart = this._onDragStart.bind(this);
    this._boundDragOver  = this._onDragOver.bind(this);
    this._boundDragLeave = this._onDragLeave.bind(this);
    this._boundDrop      = this._onDrop.bind(this);
    this._boundDragEnd   = this._onDragEnd.bind(this);
  }

  /**
   * Initialize the drag-and-drop game.
   *
   * @param {Object} config
   * @param {HTMLElement} config.itemsContainerEl
   *   — Element to render draggable items into.
   * @param {HTMLElement} config.zonesContainerEl
   *   — Element to render drop zones into.
   * @param {HTMLElement} [config.containerEl]
   *   — Legacy: if provided without items/zones containers, uses this for both
   * @param {Array}  config.items
   *   — [{ id: string, label: string, data?: any }]
   * @param {Array}  config.zones
   *   — [{ id: string, label: string, accepts: string (itemId), hint?: string }]
   * @param {Function} [config.onComplete]
   *   — Called with { score, total } when all zones filled correctly.
   * @param {Function} [config.onDrop]
   *   — Called with { itemId, zoneId, correct } on each drop.
   * @param {boolean} [config.showHints=true]
   *   — Whether to show hints on incorrect placement.
   * @param {boolean} [config.allowRetry=true]
   *   — Whether incorrectly placed items return to the tray.
   * @param {boolean} [config.compactTable=false]
   *   — Reduce cell and spacing sizes for compact layouts (e.g., IPv4 header).
   */
  init(config) {
    this._config    = config;
    
    // Support both new (separate containers) and legacy (single container) modes
    if (config.itemsContainerEl && config.zonesContainerEl) {
      this._itemsContainer = config.itemsContainerEl;
      this._zonesContainer = config.zonesContainerEl;
    } else if (config.containerEl) {
      this._itemsContainer = config.containerEl;
      this._zonesContainer = config.containerEl;
    } else {
      throw new Error('Must provide either (itemsContainerEl + zonesContainerEl) or containerEl');
    }

    this._locked    = false;
    this._score     = 0;
    this._placements = {};
    this._feedbackVisible = false;

    this._render();
    this._bindEvents();
  }

  /**
   * Reset all items to the tray — clear all zones.
   */
  reset() {
    this._placements = {};
    this._locked     = false;
    this._score      = 0;
    this._draggedId  = null;
    this._feedbackVisible = false;

    if (this._itemsContainer && this._zonesContainer) {
      this._render();
      this._bindEvents();
    }

    eventBus.emit('drag:reset');
  }

  /**
   * Show feedback - reveal correct/incorrect states (called by Check Result button)
   */
  showFeedback() {
    this._feedbackVisible = true;
    this._locked = true; // Prevent further moves after checking
    this._render();
    this._bindEvents();
  }

  /**
   * Public read-only state helper so callers do not depend on internals.
   * @returns {boolean}
   */
  isFeedbackVisible() {
    return this._feedbackVisible;
  }

  /**
   * Reveal the full answer map and lock the board.
   * If no map is provided, default to each zone's configured accepted item.
   *
   * @param {Object} [placementsByZone] — { [zoneId]: itemId }
   */
  revealAnswer(placementsByZone = null) {
    const map = placementsByZone || this._config.zones.reduce((acc, zone) => {
      acc[zone.id] = zone.accepts;
      return acc;
    }, {});
    this._placements = { ...map };
    this._feedbackVisible = true;
    this._locked = true;
    this._render();
    this._bindEvents();
  }

  /**
   * Programmatically check current state and return score.
   * @returns {{ score: number, total: number, placements: Object }}
   */
  checkState() {
    const zones = this._config.zones;
    let correct = 0;
    zones.forEach(zone => {
      if (this._placements[zone.id] === zone.accepts) correct++;
    });
    return { score: correct, total: zones.length, placements: { ...this._placements } };
  }

  /**
   * Lock all zones — prevent further dragging.
   * Called automatically on full correct completion.
   */
  lock() {
    this._locked = true;
    this._getDraggableItemElements().forEach(el => {
      el.setAttribute('draggable', 'false');
      el.style.cursor = 'default';
    });
  }

  /**
   * Clean up all event listeners and clear DOM.
   */
  destroy() {
    this._unbindEvents();
    this._itemsContainer = null;
    this._zonesContainer = null;
    this._config    = null;
  }

  // ─── Rendering ─────────────────────────────

  _render() {
    const { items, zones } = this._config;

    // Determine which items are currently placed
    const placedItemIds = new Set(Object.values(this._placements));
    const trayItems = items.filter(item => !placedItemIds.has(item.id));

    // Render items tray
    this._itemsContainer.innerHTML = `
      <div class="dnd-tray" id="dnd-tray" aria-label="Available items">
        <div class="dnd-tray__items" id="dnd-tray-items">
          ${trayItems.map(item => this._renderItem(item)).join('')}
        </div>
      </div>
    `;

    // Render zones - either as table or as simple list
    if (this._config.renderZonesAsTable && this._config.tableConfig) {
      this._zonesContainer.innerHTML = this._renderHeaderTable();
    } else {
      this._zonesContainer.innerHTML = `
        <div class="dnd-zones" id="dnd-zones" aria-label="Drop zones">
          ${zones.map(zone => this._renderZone(zone)).join('')}
        </div>
      `;
    }

    this._injectStyles();
  }

  _renderHeaderTable() {
    const tableConfig = this._config.tableConfig;
    const isCompact = this._config.compactTable === true;
    const cellGap = isCompact ? '0.75rem' : '0.875rem';
    const rowGap = isCompact ? '0.5rem' : '0.75rem';
    const padding = isCompact ? '0.75rem' : '1rem';
    const minHeight = isCompact ? '70px' : '75px';
    
    let tableHTML = `<div class="ipv4-header-table" id="dnd-zones" style="display: flex; flex-direction: column; gap: ${rowGap}; padding: ${padding}; background: linear-gradient(135deg, rgba(0,212,255,0.03) 0%, transparent 100%); border-radius: var(--radius-lg); border: 1px solid var(--color-border);">`;
    
    tableConfig.forEach((row, rowIdx) => {
      const totalBits = row.zones.reduce((sum, z) => sum + (z.bits || 0), 0);
      tableHTML += `<div class="ipv4-header-row" style="display: grid; grid-template-columns: ${row.zones.map(z => `${z.bits || 1}fr`).join(' ')}; gap: ${cellGap}; width: 100%;">`;
      
      row.zones.forEach(zoneConfig => {
        const placedItemId = this._placements[zoneConfig.id];
        const placedItem   = placedItemId
          ? this._config.items.find(i => i.id === placedItemId)
          : null;
        const isCorrect   = placedItem && placedItemId === zoneConfig.accepts;
        const isIncorrect = placedItem && placedItemId !== zoneConfig.accepts;

        tableHTML += this._renderHeaderCell(zoneConfig, placedItem, isCorrect, isIncorrect);
      });
      
      tableHTML += '</div>';
    });
    
    tableHTML += '</div>';
    return tableHTML;
  }

  _renderHeaderCell(zoneConfig, placedItem, isCorrect, isIncorrect) {
    const isCompact = this._config.compactTable === true;
    const minHeight = isCompact ? '70px' : '75px';
    const padding = isCompact ? '0.75rem 0.5rem' : '1rem';
    const labelFontSize = isCompact ? '0.8rem' : '0.8rem';
    const bitsFontSize = isCompact ? '0.65rem' : '0.65rem';
    const contentGap = isCompact ? '0.2rem' : '0.25rem';

    let cellContent = '';
    if (placedItem) {
      // Only add correctness classes if feedback is visible
      const feedbackClasses = this._feedbackVisible 
        ? (isCorrect ? 'is-correct' : 'is-incorrect')
        : '';
      
      cellContent = `
        <div class="header-cell__content" style="display: flex; flex-direction: column; gap: ${contentGap}; align-items: center;">
          <div class="dnd-item is-placed ${feedbackClasses}" 
               data-item-id="${placedItem.id}"
               draggable="${this._locked ? 'false' : 'true'}"
               style="margin: 0; width: 100%; cursor: ${this._locked ? 'default' : 'grab'}; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
            <span class="dnd-item__label" style="font-size: ${labelFontSize}; font-weight: 700;">${placedItem.label}</span>
            ${this._feedbackVisible && isCorrect ? '<span class="dnd-item__status">OK</span>' : ''}
            ${this._feedbackVisible && isIncorrect ? '<span class="dnd-item__status">X</span>' : ''}
          </div>
          ${placedItem.bits ? `<span class="text-mono text-xs" style="color: var(--color-text-muted); font-size: ${bitsFontSize}; font-weight: 600;">${placedItem.bits} ${this._config.unitLabel || 'bits'}</span>` : ''}
        </div>
      `;
    } else {
      cellContent = `
        <div class="header-cell__placeholder" style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--color-text-muted); font-size: 0.65rem; font-family: var(--font-mono);">
        </div>
      `;
    }

    // Only apply correctness classes to header-cell if feedback is visible
    const headerCellClass = this._feedbackVisible && placedItem
      ? (isCorrect ? 'is-correct' : 'is-incorrect')
      : '';

    return `
      <div
        class="header-cell ${headerCellClass}"
        id="dnd-zone-${zoneConfig.id}"
        data-zone-id="${zoneConfig.id}"
        data-accepts="${zoneConfig.accepts}"
        ondragover="event.preventDefault(); event.dataTransfer.dropEffect='move';"
        ondrop="event.preventDefault();"
        style="
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: ${padding};
          background: var(--color-bg-raised);
          cursor: pointer;
          transition: all var(--transition-base) cubic-bezier(0.4, 0.0, 0.2, 1);
          min-height: ${minHeight};
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        "
      >
        ${cellContent}
      </div>
    `;
  }

  _renderItem(item) {
    return `
      <div
        class="dnd-item"
        id="dnd-item-${item.id}"
        data-item-id="${item.id}"
        draggable="true"
        role="button"
        tabindex="0"
        aria-label="Drag: ${item.label}"
      >
        <span class="dnd-item__label">${item.label}</span>
        ${item.bits ? `<span class="dnd-item__bits text-mono text-xs">${item.bits} ${this._config.unitLabel || 'bits'}</span>` : ''}
      </div>
    `;
  }

  _renderZone(zone) {
    const placedItemId = this._placements[zone.id];
    const placedItem   = placedItemId
      ? this._config.items.find(i => i.id === placedItemId)
      : null;

    const isCorrect   = placedItem && placedItemId === zone.accepts;
    const isIncorrect = placedItem && placedItemId !== zone.accepts;

    return `
      <div
        class="dnd-zone ${placedItem ? (isCorrect ? 'is-correct' : 'is-incorrect') : ''}"
        id="dnd-zone-${zone.id}"
        data-zone-id="${zone.id}"
        data-accepts="${zone.accepts}"
        role="listitem"
        aria-label="Zone: ${zone.label}"
      >
        <div class="dnd-zone__label">${zone.label}</div>
        <div class="dnd-zone__slot" id="dnd-slot-${zone.id}">
          ${placedItem ? `
            <div
              class="dnd-item is-placed ${isCorrect ? 'is-correct' : 'is-incorrect'}"
              data-item-id="${placedItem.id}"
              draggable="${this._locked ? 'false' : 'true'}"
            >
              <span class="dnd-item__label">${placedItem.label}</span>
              ${isCorrect  ? '<span class="dnd-item__status">OK</span>' : ''}
              ${isIncorrect ? '<span class="dnd-item__status">X</span>' : ''}
            </div>
          ` : `
            <div class="dnd-zone__placeholder">
              ${zone.hint ? `<span class="dnd-zone__hint">${zone.hint}</span>` : 'Drop here'}
            </div>
          `}
        </div>
        <div class="dnd-zone__size-label text-mono text-xs text-muted">${zone.sizeLabel || ''}</div>
      </div>
    `;
  }

  // ─── Event Binding ──────────────────────────

  _bindEvents() {
    this._unbindEvents(); // clear any previous listeners first

    // Bind events to all draggable items (both in tray and placed in zones)
    const allItems = this._getDraggableItemElements();
    const zones = this._zonesContainer.querySelectorAll('.dnd-zone, .header-cell');

    allItems.forEach(el => {
      el.addEventListener('dragstart', this._boundDragStart);
      el.addEventListener('dragend',   this._boundDragEnd);
    });

    zones.forEach(el => {
      el.addEventListener('dragover',  this._boundDragOver);
      el.addEventListener('dragleave', this._boundDragLeave);
      el.addEventListener('drop',      this._boundDrop);
    });
  }

  _unbindEvents() {
    if (!this._itemsContainer || !this._zonesContainer) return;
    
    // Unbind from all draggable items (both in tray and placed in zones)
    this._getDraggableItemElements().forEach(el => {
      el.removeEventListener('dragstart', this._boundDragStart);
      el.removeEventListener('dragend',   this._boundDragEnd);
    });
    
    this._zonesContainer.querySelectorAll('.dnd-zone, .header-cell').forEach(el => {
      el.removeEventListener('dragover',  this._boundDragOver);
      el.removeEventListener('dragleave', this._boundDragLeave);
      el.removeEventListener('drop',      this._boundDrop);
    });
  }

  _getDraggableItemElements() {
    const scopedItems = new Set();
    [this._itemsContainer, this._zonesContainer].forEach((container) => {
      if (!container) return;
      container.querySelectorAll('.dnd-item[draggable="true"]').forEach((el) => scopedItems.add(el));
    });
    return [...scopedItems];
  }

  // ─── Drag Handlers ─────────────────────────

  _onDragStart(e) {
    if (this._locked) { e.preventDefault(); return; }

    const itemEl = e.currentTarget;
    this._draggedId = itemEl.getAttribute('data-item-id');
    itemEl.classList.add('is-dragging');

    // Required for Firefox
    e.dataTransfer.setData('text/plain', this._draggedId);
    e.dataTransfer.effectAllowed = 'move';

    eventBus.emit('drag:started', {
      itemId:   this._draggedId,
      itemData: this._findItem(this._draggedId),
    });
  }

  _onDragEnd(e) {
    e.currentTarget.classList.remove('is-dragging');
    // Clear all zone hover states
    this._zonesContainer.querySelectorAll('.dnd-zone, .header-cell').forEach(z => z.classList.remove('is-over'));
    this._draggedId = null;
  }

  _onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('is-over');
  }

  _onDragLeave(e) {
    // Only remove if leaving the zone element itself, not a child
    if (!e.currentTarget.contains(e.relatedTarget)) {
      e.currentTarget.classList.remove('is-over');
    }
  }

  _onDrop(e) {
    e.preventDefault();
    if (this._locked || !this._draggedId) return;

    const zoneEl = e.currentTarget;
    zoneEl.classList.remove('is-over');
    const zoneId = zoneEl.getAttribute('data-zone-id');
    const accepts = zoneEl.getAttribute('data-accepts');

    const correct = this._draggedId === accepts;

    // If item was previously placed in another zone, vacate that zone
    Object.keys(this._placements).forEach(zid => {
      if (this._placements[zid] === this._draggedId) {
        delete this._placements[zid];
      }
    });

    // Place item in this zone
    this._placements[zoneId] = this._draggedId;

    // Re-render to reflect new state (without feedback unless explicitly shown)
    this._render();
    this._bindEvents();

    // Only flash feedback if feedback is already visible
    if (this._feedbackVisible) {
      const newZoneEl = this._zonesContainer.querySelector(`#dnd-zone-${zoneId}`);
      if (newZoneEl) {
        flashClass(newZoneEl, correct ? 'flash-correct' : 'flash-incorrect', 700);
      }
    }

    if (!correct && this._config.showHints !== false && this._feedbackVisible) {
      this._showHintForZone(zoneId);
    }

    // Score update
    if (correct) this._score++;

    // Emit drop event
    const itemData = this._findItem(this._draggedId);
    eventBus.emit('drag:dropped', { itemId: this._draggedId, zoneId, correct, itemData });

    if (typeof this._config.onDrop === 'function') {
      this._config.onDrop({ itemId: this._draggedId, zoneId, correct, itemData });
    }

    this._draggedId = null;

    // Check for full completion
    this._checkCompletion();
  }

  // ─── Completion Check ───────────────────────

  _checkCompletion() {
    const zones = this._config.zones;
    const allCorrect = zones.every(zone => this._placements[zone.id] === zone.accepts);

    if (allCorrect) {
      this._locked = true;
      this.lock();

      const result = { score: zones.length, total: zones.length };

      eventBus.emit('drag:complete', result);

      if (typeof this._config.onComplete === 'function') {
        this._config.onComplete(result);
      }

      // Visual celebration
      this._showCompletionFeedback();
    }
  }

  _showHintForZone(zoneId) {
    const zone = this._config.zones.find(z => z.id === zoneId);
    if (!zone || !zone.hint) return;
    // The hint is already rendered in the zone placeholder on re-render
    // For wrong placement, briefly highlight the zone label
    const zoneEl = this._zonesContainer.querySelector(`#dnd-zone-${zoneId}`);
    if (zoneEl) flashClass(zoneEl, 'flash-hint', 1200);
  }

  _showCompletionFeedback() {
    // Add success banner to the zones container
    const banner = document.createElement('div');
    banner.className = 'dnd-complete-banner anim-bounce-in';
    banner.innerHTML = `
      <span style="font-size:1.5rem;">DONE</span>
      <span>All correct! Well done.</span>
    `;
    this._zonesContainer.parentElement.prepend(banner);
  }

  // ─── Helpers ───────────────────────────────

  _findItem(itemId) {
    return this._config.items.find(i => i.id === itemId) || null;
  }

  _injectStyles() {
    if (document.getElementById('dnd-styles')) return;
    const style = document.createElement('style');
    style.id = 'dnd-styles';
    style.textContent = resolveInjectedCssTokens(`
      .dnd-root { display: flex; flex-direction: column; gap: 1.5rem; }

      /* Table Container */
      .ipv4-header-table {
        background: linear-gradient(135deg, rgba(0,212,255,0.03) 0%, transparent 100%);
      }
      .ipv4-header-row {
        animation: fadeInUp 300ms ease;
      }

      /* Header Cells */
      .header-cell {
        transition: all var(--transition-base) cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
      }
      .header-cell:hover {
        border-color: var(--color-cyan);
        box-shadow: 0 4px 16px rgba(0, 212, 255, 0.15);
        transform: translateY(-2px);
      }
      .header-cell.is-over {
        border-color: var(--color-cyan);
        background: var(--color-cyan-glow);
        box-shadow: var(--shadow-glow);
      }
      .header-cell.is-correct {
        border-color: var(--color-success);
        background: rgba(0, 230, 118, 0.05);
      }
      .header-cell.is-incorrect {
        border-color: var(--color-error);
        background: rgba(255, 68, 68, 0.05);
      }
      
      .header-cell__content {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
      }
      .header-cell__placeholder {
        text-align: center;
        font-family: var(--font-mono);
        font-size: 0.65rem;
        color: var(--color-text-muted);
      }

      /* Tray */
      .dnd-tray {
        background: var(--color-bg-medium);
        border: 1px dashed var(--color-border);
        border-radius: var(--radius-md);
        padding: 1rem;
      }
      .dnd-tray__label { margin-bottom: 0.75rem; }
      .dnd-tray__items {
        display: flex; flex-wrap: wrap; gap: 0.5rem;
        min-height: 48px;
      }

      /* Items */
      .dnd-item {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.85rem;
        background: var(--color-bg-raised);
        border: 1.5px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--color-text-primary);
        cursor: grab;
        user-select: none;
        transition: all var(--transition-fast);
        white-space: nowrap;
      }
      .dnd-item:hover:not(.is-placed) {
        border-color: var(--color-cyan);
        background: var(--color-cyan-glow);
        transform: translateY(-1px);
      }
      .dnd-item.is-dragging {
        opacity: 0.6;
        transform: scale(1.05) rotate(1deg);
        box-shadow: var(--shadow-glow);
        cursor: grabbing;
      }
      .dnd-item.is-correct  { border-color: var(--color-success); color: var(--color-success); }
      .dnd-item.is-incorrect { border-color: var(--color-error);  color: var(--color-error); }
      .dnd-item__status { font-size: 0.9rem; }
      .dnd-item__bits { color: var(--color-text-muted); font-size: 0.75rem; font-weight: 600; }

      /* Zones */
      .dnd-zones {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .dnd-zone {
        border: 2px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: 0.5rem 0.75rem;
        background: var(--color-bg-panel);
        transition: all var(--transition-fast);
        display: grid;
        grid-template-columns: 180px 1fr auto;
        align-items: center;
        gap: 0.75rem;
        min-height: 52px;
      }
      .dnd-zone.is-over {
        border-color: var(--color-cyan);
        background: var(--color-cyan-glow);
        transform: scale(1.01);
      }
      .dnd-zone.is-correct  { border-color: var(--color-success); background: rgba(0,230,118,0.05); }
      .dnd-zone.is-incorrect { border-color: var(--color-error);  background: rgba(255,68,68,0.05); }
      .dnd-zone__label {
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        font-weight: 700;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .dnd-zone__slot { display: flex; align-items: center; }
      .dnd-zone__placeholder {
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        padding: 0.4rem 0.75rem;
        border: 1px dashed var(--color-border);
        border-radius: var(--radius-xs);
        white-space: nowrap;
      }
      .dnd-zone__hint { color: var(--color-amber); }
      .dnd-zone__size-label { color: var(--color-text-muted); text-align: right; }

      /* Animations */
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Flash animations */
      .flash-correct  { animation: success-pop 500ms ease; }
      .flash-incorrect { animation: shake 450ms ease; }
      .flash-hint { animation: highlight-flash 1s ease; }

      /* Completion banner */
      .dnd-complete-banner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 0.75rem 1.5rem;
        background: rgba(0,230,118,0.1);
        border: 1px solid var(--color-success);
        border-radius: var(--radius-md);
        font-family: var(--font-display);
        font-size: var(--text-md);
        font-weight: 700;
        color: var(--color-success);
      }
    `);
    document.head.appendChild(style);
  }
}

/**
 * Factory — always create a new instance per module.
 * Drag-drop engines are per-component, not global singletons.
 */
export function createDragDropEngine() {
  return new DragDropEngine();
}

export { DragDropEngine };
