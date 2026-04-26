import { renderTokenIcon } from '../utils/tokenIcons.js';
import { escapeHtml } from './simulationEngineUtils.js';
import { getConfigLabScenario } from '../data/simulationScenarios/configLabScenarios.js';

export class ConfigLabEngine {
  constructor(options = {}) {
    this.topic = options.topic || null;
    this.scenario = getConfigLabScenario(this.topic?.id);
    this.container = null;
    this._currentStepIndex = 0;
    this._answers = {};
    this._feedback = null;
    this._completedStepIds = new Set();
    this._boundClick = this._handleClick.bind(this);
  }

  mount(containerEl) {
    this.container = containerEl;
    this.container.addEventListener('click', this._boundClick);
    this._render();
  }

  destroy() {
    if (this.container) {
      this.container.removeEventListener('click', this._boundClick);
    }
    this.container = null;
  }

  _handleClick(event) {
    const actionEl = event.target.closest('[data-config-action], [data-config-select]');
    if (!actionEl || !this.scenario) return;

    if (actionEl.dataset.configAction === 'goto') {
      const nextIndex = Number(actionEl.dataset.stepIndex || 0);
      if (nextIndex >= 0 && nextIndex < this.scenario.steps.length) {
        this._currentStepIndex = nextIndex;
        this._feedback = null;
        this._render();
      }
      return;
    }

    if (actionEl.dataset.configAction === 'check') {
      this._checkCurrentStep();
      return;
    }

    if (actionEl.dataset.configAction === 'next') {
      this._currentStepIndex = Math.min(this._currentStepIndex + 1, this.scenario.steps.length - 1);
      this._feedback = null;
      this._render();
      return;
    }

    if (actionEl.dataset.configAction === 'reset') {
      const step = this._getCurrentStep();
      if (step) {
        this._answers[step.id] = {};
      }
      this._feedback = null;
      this._render();
      return;
    }

    if (actionEl.dataset.configSelect) {
      const [stepId, slotKey, valueIndex] = actionEl.dataset.configSelect.split('::');
      const step = this.scenario.steps.find((entry) => entry.id === stepId);
      const slot = step?.slots.find((entry) => entry.key === slotKey);
      if (!slot) return;

      this._answers[stepId] ||= {};
      this._answers[stepId][slotKey] = slot.options[Number(valueIndex)] || '';
      this._feedback = null;
      this._render();
    }
  }

  _getCurrentStep() {
    return this.scenario?.steps?.[this._currentStepIndex] || null;
  }

  _checkCurrentStep() {
    const step = this._getCurrentStep();
    if (!step) return;

    const answers = this._answers[step.id] || {};
    const missingSlot = step.slots.find((slot) => !answers[slot.key]);
    if (missingSlot) {
      this._feedback = {
        type: 'warning',
        message: `Complete the ${missingSlot.label.toLowerCase()} slot before validating this step.`,
      };
      this._render();
      return;
    }

    const isCorrect = step.slots.every((slot) => answers[slot.key] === slot.correct);
    if (isCorrect) {
      this._completedStepIds.add(step.id);
      this._feedback = {
        type: 'success',
        message: step.successNote || 'Checkpoint complete.',
      };
    } else {
      this._feedback = {
        type: 'error',
        message: 'One or more selections do not match the intended config logic yet. Re-check the command preview and try again.',
      };
    }

    this._render();
  }

  _renderCommandPreview(step) {
    const answers = this._answers[step.id] || {};
    const slotMarkup = step.slots.map((slot) => {
      const value = answers[slot.key] || `[${slot.label}]`;
      return `<span class="config-lab__token ${answers[slot.key] ? 'is-filled' : ''}">${escapeHtml(value)}</span>`;
    }).join(' ');

    return `
      <div class="config-lab__command-line">
        ${step.prefix ? `<span class="config-lab__prefix">${escapeHtml(step.prefix)}</span>` : ''}
        ${slotMarkup}
        ${step.suffix ? `<span class="config-lab__suffix">${escapeHtml(step.suffix)}</span>` : ''}
      </div>
    `;
  }

  _render() {
    if (!this.container) return;

    if (!this.scenario) {
      this.container.innerHTML = `
        <div class="sim-engine-card">
          <p class="sim-engine-card__eyebrow">${renderTokenIcon('CONFIG', 'learning-token-icon')} Config lab unavailable</p>
          <h4 class="sim-engine-card__title">No config-lab scenario is attached to this topic yet.</h4>
          <p class="sim-engine-card__body">This engine is ready, but the current lesson still needs a topic-specific scenario map before it can become interactive.</p>
        </div>
      `;
      return;
    }

    const step = this._getCurrentStep();
    const answers = this._answers[step.id] || {};
    const allComplete = this._completedStepIds.size === this.scenario.steps.length;

    this.container.innerHTML = `
      <style>
        .sim-engine-card {
          padding: 1.15rem;
          border-radius: 18px;
          border: 1px solid rgba(0, 212, 255, 0.14);
          background: radial-gradient(circle at top right, rgba(124, 77, 255, 0.16), transparent 34%), linear-gradient(180deg, rgba(10, 17, 29, 0.98), rgba(8, 12, 22, 0.96));
          box-shadow: 0 22px 44px rgba(0, 0, 0, 0.28);
        }
        .sim-engine-card__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          margin: 0 0 0.65rem;
          color: var(--color-primary);
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .sim-engine-card__title {
          margin: 0;
          font-size: 1.1rem;
          color: var(--color-text-primary);
        }
        .sim-engine-card__body {
          margin: 0.72rem 0 0;
          color: var(--color-text-secondary);
          line-height: 1.7;
        }
        .config-lab__hero {
          display: grid;
          grid-template-columns: minmax(0, 0.86fr) minmax(0, 1.14fr);
          gap: 1rem;
          margin-top: 1rem;
        }
        .config-lab__panel {
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          padding: 0.9rem;
        }
        .config-lab__panel-title {
          margin: 0 0 0.7rem;
          color: var(--color-text-primary);
          font-size: 0.84rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .config-lab__step-list {
          display: grid;
          gap: 0.65rem;
        }
        .config-lab__step-btn {
          width: 100%;
          text-align: left;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
          color: var(--color-text-primary);
          padding: 0.8rem 0.85rem;
          font: inherit;
          cursor: pointer;
          transition: all 180ms ease;
        }
        .config-lab__step-btn.is-active {
          border-color: rgba(0,212,255,0.24);
          background: rgba(0,212,255,0.08);
        }
        .config-lab__step-btn.is-done {
          border-color: rgba(0,230,118,0.22);
        }
        .config-lab__step-meta {
          color: var(--color-text-secondary);
          font-size: 0.78rem;
          display: block;
          margin-top: 0.3rem;
        }
        .config-lab__step-index {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.55rem;
          height: 1.55rem;
          margin-right: 0.55rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.05);
          font-size: 0.74rem;
          font-family: var(--font-mono);
        }
        .config-lab__workspace-title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: 1rem;
          font-weight: 700;
        }
        .config-lab__workspace-sub {
          margin: 0.35rem 0 0.85rem;
          color: var(--color-text-secondary);
          line-height: 1.65;
        }
        .config-lab__command-line {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          align-items: center;
          padding: 0.9rem;
          border-radius: 14px;
          background: rgba(5, 10, 18, 0.88);
          border: 1px solid rgba(0,212,255,0.12);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
          margin-bottom: 0.95rem;
        }
        .config-lab__prefix,
        .config-lab__suffix,
        .config-lab__token {
          font-family: var(--font-mono);
          font-size: 0.83rem;
          line-height: 1.5;
        }
        .config-lab__prefix,
        .config-lab__suffix {
          color: #8dcfff;
        }
        .config-lab__token {
          padding: 0.32rem 0.55rem;
          border-radius: 10px;
          border: 1px dashed rgba(255,255,255,0.12);
          color: var(--color-text-secondary);
          background: rgba(255,255,255,0.03);
        }
        .config-lab__token.is-filled {
          color: var(--color-text-primary);
          border-style: solid;
          border-color: rgba(124,77,255,0.28);
          background: rgba(124,77,255,0.12);
        }
        .config-lab__slot-grid {
          display: grid;
          gap: 0.85rem;
        }
        .config-lab__slot-group {
          padding: 0.85rem;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
        }
        .config-lab__slot-label {
          display: block;
          color: var(--color-text-primary);
          font-size: 0.84rem;
          font-weight: 700;
          margin-bottom: 0.55rem;
        }
        .config-lab__option-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
        }
        .config-lab__option {
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: var(--color-text-secondary);
          padding: 0.45rem 0.72rem;
          font: inherit;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 180ms ease;
        }
        .config-lab__option.is-selected {
          color: var(--color-bg);
          border-color: transparent;
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          font-weight: 700;
        }
        .config-lab__feedback {
          margin-top: 1rem;
          padding: 0.9rem 1rem;
          border-radius: 14px;
          line-height: 1.6;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .config-lab__feedback.is-success {
          background: rgba(0,230,118,0.09);
          border-color: rgba(0,230,118,0.24);
          color: var(--color-text-primary);
        }
        .config-lab__feedback.is-error {
          background: rgba(255,184,0,0.09);
          border-color: rgba(255,184,0,0.24);
          color: var(--color-text-primary);
        }
        .config-lab__feedback.is-warning {
          background: rgba(124,77,255,0.09);
          border-color: rgba(124,77,255,0.24);
          color: var(--color-text-primary);
        }
        .config-lab__actions {
          display: flex;
          gap: 0.7rem;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
        }
        .config-lab__progress {
          color: var(--color-text-secondary);
          font-size: 0.82rem;
        }
        .config-lab__complete {
          margin-top: 1rem;
          padding: 1rem 1.05rem;
          border-radius: 16px;
          border: 1px solid rgba(0,230,118,0.24);
          background: rgba(0,230,118,0.08);
          color: var(--color-text-primary);
        }
        @media (max-width: 960px) {
          .config-lab__hero {
            grid-template-columns: 1fr;
          }
        }
      </style>
      <div class="sim-engine-card config-lab">
        <p class="sim-engine-card__eyebrow">${renderTokenIcon('CONFIG', 'learning-token-icon')} Config lab engine</p>
        <h4 class="sim-engine-card__title">${escapeHtml(this.scenario.title)}</h4>
        <p class="sim-engine-card__body">${escapeHtml(this.scenario.summary)}</p>
        <div class="config-lab__hero">
          <section class="config-lab__panel">
            <h5 class="config-lab__panel-title">Command deck</h5>
            <div class="config-lab__step-list">
              ${this.scenario.steps.map((entry, index) => `
                <button
                  type="button"
                  class="config-lab__step-btn ${index === this._currentStepIndex ? 'is-active' : ''} ${this._completedStepIds.has(entry.id) ? 'is-done' : ''}"
                  data-config-action="goto"
                  data-step-index="${index}"
                >
                  <span class="config-lab__step-index">${this._completedStepIds.has(entry.id) ? 'OK' : index + 1}</span>
                  ${escapeHtml(entry.title)}
                  <span class="config-lab__step-meta">${escapeHtml(entry.prompt)}</span>
                </button>
              `).join('')}
            </div>
          </section>
          <section class="config-lab__panel">
            <h5 class="config-lab__panel-title">Workspace</h5>
            <h5 class="config-lab__workspace-title">${escapeHtml(step.title)}</h5>
            <p class="config-lab__workspace-sub">${escapeHtml(step.prompt)}</p>
            ${this._renderCommandPreview(step)}
            <div class="config-lab__slot-grid">
              ${step.slots.map((slot) => `
                <div class="config-lab__slot-group">
                  <span class="config-lab__slot-label">${escapeHtml(slot.label)}</span>
                  <div class="config-lab__option-grid">
                    ${slot.options.map((option, index) => `
                      <button
                        type="button"
                        class="config-lab__option ${(answers[slot.key] || '') === option ? 'is-selected' : ''}"
                        data-config-select="${step.id}::${slot.key}::${index}"
                      >${escapeHtml(option)}</button>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
            ${this._feedback ? `
              <div class="config-lab__feedback is-${this._feedback.type}">
                <strong>${this._feedback.type === 'success' ? 'Checkpoint complete.' : this._feedback.type === 'warning' ? 'Complete the line first.' : 'Review the command logic.'}</strong>
                ${escapeHtml(this._feedback.message)}
              </div>
            ` : ''}
            <div class="config-lab__actions">
              <div class="config-lab__progress">${this._completedStepIds.size}/${this.scenario.steps.length} checkpoints cleared · ${escapeHtml(this.scenario.tone)}</div>
              <div style="display:flex; gap:0.65rem; flex-wrap:wrap;">
                <button type="button" class="btn btn-primary" data-config-action="check">Validate step</button>
                <button type="button" class="btn btn-secondary" data-config-action="next">Next step</button>
                <button type="button" class="btn btn-ghost" data-config-action="reset">Reset step</button>
              </div>
            </div>
            ${allComplete ? `
              <div class="config-lab__complete">
                <strong>Lab complete.</strong> The command deck sequence is now aligned to the lesson’s intended configuration logic.
              </div>
            ` : ''}
          </section>
        </div>
      </div>
    `;
  }
}
