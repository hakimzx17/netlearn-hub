import { renderTokenIcon } from '../utils/tokenIcons.js';
import { collectTableDatasets, escapeHtml } from './simulationEngineUtils.js';

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export class ComparisonViewerEngine {
  constructor(options = {}) {
    this.topic = options.topic || null;
    this.container = null;
    this._datasets = collectTableDatasets(this.topic);
    this._activeIndex = 0;
    this._challengeSeed = 0;
    this._feedback = null;
    this._handleClick = this._handleClick.bind(this);
  }

  mount(containerEl) {
    this.container = containerEl;
    this.container.addEventListener('click', this._handleClick);
    this._render();
  }

  destroy() {
    if (this.container) {
      this.container.removeEventListener('click', this._handleClick);
    }
    this.container = null;
  }

  _handleClick(event) {
    const selector = event.target.closest('[data-compare-action], [data-compare-option]');
    if (!selector) return;

    if (selector.dataset.compareAction === 'dataset') {
      this._activeIndex = Number(selector.dataset.datasetIndex || 0);
      this._challengeSeed = 0;
      this._feedback = null;
      this._render();
      return;
    }

    if (selector.dataset.compareAction === 'next') {
      this._challengeSeed += 1;
      this._feedback = null;
      this._render();
      return;
    }

    if (selector.dataset.compareOption) {
      const active = this._datasets[this._activeIndex];
      const challenge = this._buildChallenge(active);
      const selectedLabel = selector.dataset.compareOption;
      this._feedback = {
        correct: selectedLabel === challenge.correctLabel,
        selectedLabel,
        challenge,
      };
      this._render();
    }
  }

  _buildChallenge(dataset) {
    if (!dataset || dataset.rows.length === 0) return null;

    const targetIndex = this._challengeSeed % dataset.rows.length;
    const targetRow = dataset.rows[targetIndex];
    const clue = targetRow.cells.slice(1).filter(Boolean).join(' • ');
    const correctLabel = targetRow.cells[0];

    const distractors = dataset.rows
      .filter((row, index) => index !== targetIndex)
      .map((row) => row.cells[0])
      .filter(Boolean)
      .slice(0, 3);

    const options = shuffle([correctLabel, ...distractors]).slice(0, 4);
    return {
      clue: clue || dataset.description || `Match the correct ${dataset.columns[0]?.label || 'item'}`,
      correctLabel,
      options,
    };
  }

  _render() {
    if (!this.container) return;

    if (this._datasets.length === 0) {
      this.container.innerHTML = `
        <div class="sim-engine-card">
          <p class="sim-engine-card__eyebrow">${renderTokenIcon('LAB', 'learning-token-icon')} Comparison lab unavailable</p>
          <h4 class="sim-engine-card__title">No comparison dataset is attached to this lesson yet.</h4>
          <p class="sim-engine-card__body">This engine expects at least one structured comparison table in the lesson theory. Add a table block to make the lab interactive.</p>
        </div>
      `;
      return;
    }

    const safeIndex = this._activeIndex >= 0 && this._activeIndex < this._datasets.length
      ? this._activeIndex
      : 0;
    this._activeIndex = safeIndex;
    const active = this._datasets[safeIndex];
    const challenge = this._buildChallenge(active);

    this.container.innerHTML = `
      <style>
        .sim-engine-card {
          padding: 1.1rem;
          border-radius: 16px;
          border: 1px solid rgba(0, 212, 255, 0.14);
          background: linear-gradient(180deg, rgba(12, 20, 34, 0.96), rgba(9, 14, 24, 0.94));
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
        }
        .sim-engine-card__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          margin: 0 0 0.65rem;
          color: var(--color-primary);
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
        .compare-engine__dataset-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
          margin: 1rem 0 1.2rem;
        }
        .compare-engine__dataset-btn {
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: var(--color-text-secondary);
          border-radius: 999px;
          padding: 0.48rem 0.8rem;
          font: inherit;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 180ms ease;
        }
        .compare-engine__dataset-btn.is-active {
          color: var(--color-bg);
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          border-color: transparent;
          font-weight: 700;
        }
        .compare-engine__grid {
          display: grid;
          gap: 0.85rem;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          margin-bottom: 1.25rem;
        }
        .compare-engine__row-card {
          padding: 0.9rem;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
        }
        .compare-engine__row-title {
          margin: 0 0 0.55rem;
          color: var(--color-text-primary);
          font-size: 0.95rem;
          font-weight: 700;
        }
        .compare-engine__row-meta {
          margin: 0;
          display: grid;
          gap: 0.45rem;
        }
        .compare-engine__row-meta div {
          color: var(--color-text-secondary);
          font-size: 0.82rem;
          line-height: 1.5;
        }
        .compare-engine__row-meta strong {
          color: var(--color-text-primary);
          display: inline-block;
          min-width: 88px;
        }
        .compare-engine__challenge {
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 1rem;
        }
        .compare-engine__challenge-title {
          margin: 0 0 0.35rem;
          color: var(--color-text-primary);
          font-size: 0.96rem;
          font-weight: 700;
        }
        .compare-engine__clue {
          margin: 0 0 0.9rem;
          padding: 0.8rem 0.9rem;
          border-radius: 12px;
          background: rgba(0, 212, 255, 0.08);
          color: var(--color-text-secondary);
          line-height: 1.65;
        }
        .compare-engine__option-grid {
          display: grid;
          gap: 0.7rem;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }
        .compare-engine__option {
          text-align: left;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: var(--color-text-primary);
          padding: 0.85rem 0.9rem;
          font: inherit;
          cursor: pointer;
          transition: all 180ms ease;
        }
        .compare-engine__option:hover {
          transform: translateY(-1px);
          border-color: rgba(0, 212, 255, 0.25);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.18);
        }
        .compare-engine__feedback {
          margin-top: 0.9rem;
          padding: 0.9rem 1rem;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: var(--color-text-secondary);
          line-height: 1.6;
        }
        .compare-engine__feedback.is-correct {
          border-color: rgba(0, 230, 118, 0.24);
          background: rgba(0, 230, 118, 0.08);
        }
        .compare-engine__feedback.is-wrong {
          border-color: rgba(255, 184, 0, 0.24);
          background: rgba(255, 184, 0, 0.08);
        }
        .compare-engine__footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 0.9rem;
        }
      </style>
      <div class="sim-engine-card compare-engine">
        <p class="sim-engine-card__eyebrow">${renderTokenIcon('TABLE', 'learning-token-icon')} Comparison visualizer</p>
        <h4 class="sim-engine-card__title">${escapeHtml(active.title)}</h4>
        ${active.description ? `<p class="sim-engine-card__body">${escapeHtml(active.description)}</p>` : ''}
        ${this._datasets.length > 1 ? `
          <div class="compare-engine__dataset-tabs">
            ${this._datasets.map((dataset, index) => `
              <button
                type="button"
                class="compare-engine__dataset-btn ${index === this._activeIndex ? 'is-active' : ''}"
                data-compare-action="dataset"
                data-dataset-index="${index}"
              >${escapeHtml(dataset.title)}</button>
            `).join('')}
          </div>
        ` : ''}
        <div class="compare-engine__grid">
          ${active.rows.map((row) => `
            <article class="compare-engine__row-card">
              <h5 class="compare-engine__row-title">${escapeHtml(row.cells[0])}</h5>
              <div class="compare-engine__row-meta">
                ${active.columns.slice(1).map((column, columnIndex) => `
                  <div><strong>${escapeHtml(column.label)}:</strong> ${escapeHtml(row.cells[columnIndex + 1] || '—')}</div>
                `).join('')}
              </div>
            </article>
          `).join('')}
        </div>
        ${challenge ? `
          <div class="compare-engine__challenge">
            <h5 class="compare-engine__challenge-title">Quick compare challenge</h5>
            <p class="compare-engine__clue">Which item best matches this clue?<br><strong>${escapeHtml(challenge.clue)}</strong></p>
            <div class="compare-engine__option-grid">
              ${challenge.options.map((label) => `
                <button type="button" class="compare-engine__option" data-compare-option="${escapeHtml(label)}">${escapeHtml(label)}</button>
              `).join('')}
            </div>
            ${this._feedback ? `
              <div class="compare-engine__feedback ${this._feedback.correct ? 'is-correct' : 'is-wrong'}">
                <strong>${this._feedback.correct ? 'Correct.' : 'Not quite.'}</strong>
                ${this._feedback.correct
                  ? `${escapeHtml(this._feedback.challenge.correctLabel)} is the best match for this comparison clue.`
                  : `The best match was ${escapeHtml(this._feedback.challenge.correctLabel)}.`}
              </div>
            ` : ''}
            <div class="compare-engine__footer">
              <button type="button" class="btn btn-secondary" data-compare-action="next">Next prompt</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}
