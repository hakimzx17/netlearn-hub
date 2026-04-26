import { renderTokenIcon } from '../utils/tokenIcons.js';
import { createDragDropEngine } from './dragDropEngine.js';
import { collectDefinitionPairs, escapeHtml } from './simulationEngineUtils.js';

export class DiagramBuilderEngine {
  constructor(options = {}) {
    this.topic = options.topic || null;
    this.container = null;
    this._pairs = collectDefinitionPairs(this.topic, 6);
    this._dnd = null;
    this._boundAction = this._handleAction.bind(this);
  }

  mount(containerEl) {
    this.container = containerEl;
    this.container.addEventListener('click', this._boundAction);
    this._render();
    this._initBoard();
  }

  destroy() {
    if (this.container) {
      this.container.removeEventListener('click', this._boundAction);
    }
    this._dnd?.destroy();
    this._dnd = null;
    this.container = null;
  }

  _handleAction(event) {
    const actionEl = event.target.closest('[data-diagram-action]');
    if (!actionEl || !this._dnd) return;

    const action = actionEl.dataset.diagramAction;
    const scoreEl = this.container?.querySelector('#diagram-builder-score');

    if (action === 'check') {
      const result = this._dnd.checkState();
      this._dnd.showFeedback();
      if (scoreEl) {
        scoreEl.textContent = `${result.score}/${result.total} matched correctly`;
      }
      return;
    }

    if (action === 'reveal') {
      this._dnd.revealAnswer();
      if (scoreEl) {
        scoreEl.textContent = `Answers revealed · ${this._pairs.length} total matches`;
      }
      return;
    }

    if (action === 'reset') {
      this._dnd.reset();
      if (scoreEl) {
        scoreEl.textContent = 'Drag each concept into its matching explanation';
      }
    }
  }

  _render() {
    if (!this.container) return;

    if (this._pairs.length < 3) {
      this.container.innerHTML = `
        <div class="sim-engine-card">
          <p class="sim-engine-card__eyebrow">${renderTokenIcon('LEARN', 'learning-token-icon')} Diagram / table builder unavailable</p>
          <h4 class="sim-engine-card__title">No matching dataset is attached to this lesson yet.</h4>
          <p class="sim-engine-card__body">This engine expects key terms or a structured table in the theory content so it can turn the concept into a matching exercise.</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = `
      <style>
        .sim-engine-card {
          padding: 1.1rem;
          border-radius: 16px;
          border: 1px solid rgba(124, 77, 255, 0.16);
          background: linear-gradient(180deg, rgba(12, 20, 34, 0.96), rgba(9, 14, 24, 0.94));
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
        }
        .sim-engine-card__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          margin: 0 0 0.65rem;
          color: var(--color-accent);
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .sim-engine-card__title {
          margin: 0;
          font-size: 1.08rem;
          color: var(--color-text-primary);
        }
        .sim-engine-card__body {
          margin: 0.7rem 0 0;
          color: var(--color-text-secondary);
          line-height: 1.65;
        }
        .diagram-builder__grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
          margin-top: 1.1rem;
        }
        .diagram-builder__panel {
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          padding: 0.85rem;
        }
        .diagram-builder__panel h5 {
          margin: 0 0 0.7rem;
          color: var(--color-text-primary);
          font-size: 0.88rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .diagram-builder__controls {
          display: flex;
          flex-wrap: wrap;
          gap: 0.7rem;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
        }
        .diagram-builder__score {
          color: var(--color-text-secondary);
          font-size: 0.82rem;
        }
        @media (max-width: 880px) {
          .diagram-builder__grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
      <div class="sim-engine-card diagram-builder">
        <p class="sim-engine-card__eyebrow">${renderTokenIcon('LEARN', 'learning-token-icon')} Diagram / table builder</p>
        <h4 class="sim-engine-card__title">Match each concept to its correct operational description</h4>
        <p class="sim-engine-card__body">This lesson already contains structured theory data, so the engine turned it into a quick matching drill. Drag the items from the tray into the most accurate definition slots, then check your board.</p>
        <div class="diagram-builder__grid">
          <section class="diagram-builder__panel">
            <h5>Available concepts</h5>
            <div id="diagram-builder-items"></div>
          </section>
          <section class="diagram-builder__panel">
            <h5>Target descriptions</h5>
            <div id="diagram-builder-zones"></div>
          </section>
        </div>
        <div class="diagram-builder__controls">
          <div class="diagram-builder__score" id="diagram-builder-score">Drag each concept into its matching explanation</div>
          <div style="display:flex; gap:0.65rem; flex-wrap:wrap;">
            <button type="button" class="btn btn-primary" data-diagram-action="check">Check result</button>
            <button type="button" class="btn btn-secondary" data-diagram-action="reveal">Reveal answers</button>
            <button type="button" class="btn btn-ghost" data-diagram-action="reset">Reset board</button>
          </div>
        </div>
      </div>
    `;
  }

  _initBoard() {
    if (!this.container || this._pairs.length < 3) return;
    const itemsContainerEl = this.container.querySelector('#diagram-builder-items');
    const zonesContainerEl = this.container.querySelector('#diagram-builder-zones');
    if (!itemsContainerEl || !zonesContainerEl) return;

    this._dnd?.destroy();
    this._dnd = createDragDropEngine();
    this._dnd.init({
      itemsContainerEl,
      zonesContainerEl,
      items: this._pairs.map((pair) => ({
        id: pair.id,
        label: pair.itemLabel,
      })),
      zones: this._pairs.map((pair) => ({
        id: `zone-${pair.id}`,
        label: pair.zoneLabel,
        accepts: pair.id,
      })),
    });
  }
}
