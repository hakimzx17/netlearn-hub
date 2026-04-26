import { renderTokenIcon } from '../utils/tokenIcons.js';
import { collectCommandCandidates, escapeHtml } from './simulationEngineUtils.js';

function normalizeCommand(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function outputHtml(value) {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

export class CliSandboxEngine {
  constructor(options = {}) {
    this.topic = options.topic || null;
    this.container = null;
    this._steps = this._buildScenario(options.scenario);
    this._stepIndex = 0;
    this._input = '';
    this._feedback = null;
    this._completed = new Set();
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

  _buildScenario(scenario) {
    const providedSteps = Array.isArray(scenario?.steps) ? scenario.steps : null;
    if (providedSteps?.length) return providedSteps;

    return collectCommandCandidates(this.topic, 5).map((entry, index) => ({
      id: `cli-step-${index}`,
      title: entry.purpose,
      prompt: `Enter the IOS verification command that best satisfies checkpoint ${index + 1}.`,
      command: entry.command,
      accepted: [entry.command],
      output: entry.output,
      hint: `Look for the command family that validates: ${entry.purpose}`,
    }));
  }

  _getStep() {
    return this._steps[this._stepIndex] || null;
  }

  _handleClick(event) {
    const actionEl = event.target.closest('[data-cli-action], [data-cli-command], [data-cli-step-index]');
    if (!actionEl) return;

    if (actionEl.dataset.cliStepIndex) {
      const nextIndex = Number(actionEl.dataset.cliStepIndex || 0);
      if (nextIndex >= 0 && nextIndex < this._steps.length) {
        this._stepIndex = nextIndex;
        this._input = '';
        this._feedback = null;
        this._render();
      }
      return;
    }

    if (actionEl.dataset.cliCommand) {
      this._input = actionEl.dataset.cliCommand;
      this._feedback = null;
      this._render();
      return;
    }

    const action = actionEl.dataset.cliAction;
    if (action === 'check') {
      const inputEl = this.container?.querySelector('#cli-command-input');
      this._input = inputEl?.value || '';
      this._checkCurrentStep();
      return;
    }

    if (action === 'next') {
      this._stepIndex = Math.min(this._stepIndex + 1, this._steps.length - 1);
      this._input = '';
      this._feedback = null;
      this._render();
      return;
    }

    if (action === 'prev') {
      this._stepIndex = Math.max(this._stepIndex - 1, 0);
      this._input = '';
      this._feedback = null;
      this._render();
      return;
    }

    if (action === 'hint') {
      const step = this._getStep();
      this._feedback = {
        type: 'hint',
        message: step?.hint || 'Use a show command that verifies the target state.',
      };
      this._render();
      return;
    }

    if (action === 'reset') {
      this._stepIndex = 0;
      this._input = '';
      this._feedback = null;
      this._completed.clear();
      this._render();
    }
  }

  _checkCurrentStep() {
    const step = this._getStep();
    if (!step) return;

    const submitted = normalizeCommand(this._input);
    const accepted = (step.accepted || [step.command]).map(normalizeCommand);

    if (!submitted) {
      this._feedback = {
        type: 'warning',
        message: 'Enter a command before validating the checkpoint.',
      };
    } else if (accepted.includes(submitted)) {
      this._completed.add(step.id);
      this._feedback = {
        type: 'success',
        message: 'Command accepted. Read the expected output and move to the next checkpoint.',
      };
    } else {
      this._feedback = {
        type: 'error',
        message: `Not quite. Expected command: ${step.command}`,
      };
    }

    this._render();
  }

  _render() {
    if (!this.container) return;

    if (this._steps.length === 0) {
      this.container.innerHTML = `
        <div class="sim-engine-card">
          <p class="sim-engine-card__eyebrow">${renderTokenIcon('CLI', 'learning-token-icon')} CLI sandbox unavailable</p>
          <h4 class="sim-engine-card__title">No command checkpoints are attached to this lesson yet.</h4>
          <p class="sim-engine-card__body">Add command candidates or CLI-focused theory notes to enable guided command validation.</p>
        </div>
      `;
      return;
    }

    const step = this._getStep();
    const completedCount = this._completed.size;
    const commandChoices = this._steps.map((entry) => entry.command);

    this.container.innerHTML = `
      <style>
        .sim-engine-card { padding: 1.15rem; border-radius: 18px; border: 1px solid var(--color-border); background: linear-gradient(180deg, var(--color-bg-panel), var(--color-bg-dark)); box-shadow: var(--shadow-md); }
        .sim-engine-card__eyebrow { display: inline-flex; align-items: center; gap: 0.45rem; margin: 0 0 0.65rem; color: var(--color-primary); font-size: 0.76rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
        .sim-engine-card__title { margin: 0; font-size: 1.1rem; color: var(--color-text-primary); }
        .sim-engine-card__body { margin: 0.72rem 0 0; color: var(--color-text-secondary); line-height: 1.7; }
        .cli-sandbox__grid { display: grid; grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr); gap: 1rem; margin-top: 1rem; }
        .cli-sandbox__panel { border: 1px solid var(--color-border); border-radius: 16px; background: color-mix(in srgb, var(--color-bg-dark) 82%, transparent); padding: 0.95rem; }
        .cli-sandbox__steps { display: grid; gap: 0.55rem; }
        .cli-sandbox__step { border: 1px solid var(--color-border); border-radius: 13px; background: color-mix(in srgb, var(--color-bg-panel) 70%, transparent); color: var(--color-text-secondary); padding: 0.72rem 0.8rem; text-align: left; font: inherit; }
        .cli-sandbox__step.is-active { border-color: var(--color-border-active); color: var(--color-text-primary); background: var(--color-cyan-glow); }
        .cli-sandbox__step.is-done { border-color: color-mix(in srgb, var(--color-success) 42%, transparent); }
        .cli-sandbox__label { display: block; color: var(--color-text-muted); font-family: var(--font-mono); font-size: 0.66rem; letter-spacing: 0.11em; text-transform: uppercase; margin-bottom: 0.45rem; }
        .cli-sandbox__input { width: 100%; min-height: 3rem; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-bg-deepest); color: var(--color-text-primary); padding: 0.8rem 0.9rem; font-family: var(--font-mono); }
        .cli-sandbox__quick { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.8rem 0; }
        .cli-sandbox__quick button { border: 1px solid var(--color-border); border-radius: var(--radius-full); color: var(--color-text-secondary); background: color-mix(in srgb, var(--color-bg-panel) 75%, transparent); padding: 0.42rem 0.65rem; font-family: var(--font-mono); font-size: 0.72rem; }
        .cli-sandbox__output { margin-top: 0.85rem; border-radius: 14px; border: 1px solid var(--color-border); background: var(--color-bg-deepest); color: var(--color-text-secondary); padding: 0.9rem; font-family: var(--font-mono); font-size: 0.8rem; line-height: 1.55; }
        .cli-sandbox__feedback { margin-top: 0.8rem; border-radius: 14px; border: 1px solid var(--color-border); padding: 0.78rem 0.9rem; color: var(--color-text-secondary); background: color-mix(in srgb, var(--color-bg-panel) 80%, transparent); }
        .cli-sandbox__feedback.is-success { border-color: color-mix(in srgb, var(--color-success) 45%, transparent); background: color-mix(in srgb, var(--color-success) 12%, transparent); }
        .cli-sandbox__feedback.is-error, .cli-sandbox__feedback.is-warning { border-color: color-mix(in srgb, var(--color-warning) 45%, transparent); background: color-mix(in srgb, var(--color-warning) 12%, transparent); }
        .cli-sandbox__actions { display: flex; flex-wrap: wrap; gap: 0.65rem; margin-top: 0.9rem; }
        @media (max-width: 880px) { .cli-sandbox__grid { grid-template-columns: 1fr; } }
      </style>
      <div class="sim-engine-card cli-sandbox">
        <p class="sim-engine-card__eyebrow">${renderTokenIcon('CLI', 'learning-token-icon')} CLI sandbox</p>
        <h4 class="sim-engine-card__title">Validate the lesson with IOS-style show commands</h4>
        <p class="sim-engine-card__body">Type the command that verifies each checkpoint. The sandbox checks intent, then reveals the expected output pattern you should recognize on real gear.</p>
        <div class="cli-sandbox__grid">
          <section class="cli-sandbox__panel">
            <span class="cli-sandbox__label">Checkpoint queue · ${completedCount}/${this._steps.length} complete</span>
            <div class="cli-sandbox__steps">
              ${this._steps.map((entry, index) => `
                <button type="button" class="cli-sandbox__step ${index === this._stepIndex ? 'is-active' : ''} ${this._completed.has(entry.id) ? 'is-done' : ''}" data-cli-step-index="${index}" ${index === this._stepIndex ? 'aria-current="step"' : ''}>
                  <strong>${index + 1}. ${escapeHtml(entry.title)}</strong>
                </button>
              `).join('')}
            </div>
          </section>
          <section class="cli-sandbox__panel">
            <span class="cli-sandbox__label">Current prompt</span>
            <p class="sim-engine-card__body">${escapeHtml(step.prompt)}</p>
            <label class="cli-sandbox__label" for="cli-command-input">Command input</label>
            <input id="cli-command-input" class="cli-sandbox__input" value="${escapeHtml(this._input)}" placeholder="show ..." autocomplete="off" spellcheck="false" />
            <div class="cli-sandbox__quick" aria-label="Quick command candidates">
              ${commandChoices.map((command) => `<button type="button" data-cli-command="${escapeHtml(command)}">${escapeHtml(command)}</button>`).join('')}
            </div>
            <div class="cli-sandbox__actions">
              <button type="button" class="btn btn-primary" data-cli-action="check">Check command</button>
              <button type="button" class="btn btn-secondary" data-cli-action="hint">Hint</button>
              <button type="button" class="btn btn-ghost" data-cli-action="prev" ${this._stepIndex === 0 ? 'disabled' : ''}>Previous</button>
              <button type="button" class="btn btn-secondary" data-cli-action="next" ${this._stepIndex === this._steps.length - 1 ? 'disabled' : ''}>Next</button>
              <button type="button" class="btn btn-ghost" data-cli-action="reset">Reset</button>
            </div>
            ${this._feedback ? `<div class="cli-sandbox__feedback is-${escapeHtml(this._feedback.type)}" role="status" aria-live="polite">${escapeHtml(this._feedback.message)}</div>` : ''}
            ${this._completed.has(step.id) ? `<div class="cli-sandbox__output"><strong>Expected output</strong><br>${outputHtml(step.output)}</div>` : ''}
          </section>
        </div>
      </div>
    `;
  }
}
