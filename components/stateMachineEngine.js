import { renderTokenIcon } from '../utils/tokenIcons.js';
import { collectTheorySteps, escapeHtml } from './simulationEngineUtils.js';

const STATE_SCENARIOS = [
  {
    test: /ospf/i,
    title: 'OSPF neighbor formation state machine',
    states: [
      ['Down', 'No Hellos have been received from the neighbor yet.'],
      ['Init', 'A Hello was received, but two-way communication is not confirmed.'],
      ['2-Way', 'Routers see each other in Hellos; DR/BDR logic may apply on multiaccess links.'],
      ['ExStart', 'Peers negotiate master/slave roles and database description sequencing.'],
      ['Exchange', 'Database description packets summarize LSDB contents.'],
      ['Loading', 'Missing LSAs are requested and delivered.'],
      ['Full', 'Link-state databases are synchronized and the adjacency is usable.'],
    ],
  },
  {
    test: /rstp|spanning tree|stp/i,
    title: 'RSTP convergence state machine',
    states: [
      ['Discarding', 'The port does not forward frames while loop prevention is evaluated.'],
      ['Proposal', 'A designated bridge proposes rapid transition to forwarding.'],
      ['Agreement', 'The downstream switch confirms it can safely accept the proposal.'],
      ['Learning', 'The port learns MAC addresses before forwarding user traffic.'],
      ['Forwarding', 'The port forwards frames and participates in the active tree.'],
    ],
  },
  {
    test: /802\.1x|pnac|authentication/i,
    title: '802.1X access-control state machine',
    states: [
      ['Unauthorized', 'Only authentication traffic is allowed through the controlled port.'],
      ['EAPOL Start', 'The supplicant begins the authentication conversation.'],
      ['RADIUS Exchange', 'The authenticator relays credentials to the authentication server.'],
      ['Authorized', 'Policy permits normal traffic after successful authentication.'],
      ['Reauthentication', 'The session is periodically validated to maintain access.'],
    ],
  },
  {
    test: /hsrp|first hop/i,
    title: 'HSRP role transition state machine',
    states: [
      ['Initial', 'HSRP has not yet started or has no known virtual gateway state.'],
      ['Listen', 'The router knows the virtual IP but is not active or standby.'],
      ['Speak', 'The router sends Hellos and participates in election.'],
      ['Standby', 'The router is ready to take over if the active router fails.'],
      ['Active', 'The router currently forwards traffic for the virtual gateway.'],
    ],
  },
];

function buildStates(topic) {
  const text = `${topic?.id || ''} ${topic?.title || ''} ${topic?.description || ''}`;
  const found = STATE_SCENARIOS.find((scenario) => scenario.test.test(text));
  if (found) {
    return {
      title: found.title,
      states: found.states.map(([name, detail], index) => ({ id: `state-${index}`, name, detail })),
    };
  }

  const steps = collectTheorySteps(topic, 6);
  return {
    title: `${topic?.title || 'Protocol'} checkpoint sequence`,
    states: steps.map((step, index) => ({
      id: step.id || `state-${index}`,
      name: step.title || `State ${index + 1}`,
      detail: step.detail || 'Review this checkpoint before advancing.',
    })),
  };
}

export class StateMachineEngine {
  constructor(options = {}) {
    this.topic = options.topic || null;
    const scenario = buildStates(this.topic);
    this.title = options.title || scenario.title;
    this.states = Array.isArray(options.states) ? options.states : scenario.states;
    this.container = null;
    this._activeIndex = 0;
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
    const actionEl = event.target.closest('[data-state-action], [data-state-index]');
    if (!actionEl) return;

    if (actionEl.dataset.stateIndex) {
      this._activeIndex = Number(actionEl.dataset.stateIndex || 0);
      this._render();
      return;
    }

    const action = actionEl.dataset.stateAction;
    if (action === 'next') this._activeIndex = Math.min(this._activeIndex + 1, this.states.length - 1);
    if (action === 'prev') this._activeIndex = Math.max(this._activeIndex - 1, 0);
    if (action === 'reset') this._activeIndex = 0;
    if (action === 'finish') this._activeIndex = this.states.length - 1;
    this._render();
  }

  _render() {
    if (!this.container) return;

    if (!this.states.length) {
      this.container.innerHTML = `
        <div class="sim-engine-card">
          <p class="sim-engine-card__eyebrow">${renderTokenIcon('TIME', 'learning-token-icon')} State machine unavailable</p>
          <h4 class="sim-engine-card__title">No protocol states are attached to this lesson yet.</h4>
          <p class="sim-engine-card__body">Add ordered theory checkpoints or a protocol-state scenario to enable this animator.</p>
        </div>
      `;
      return;
    }

    const active = this.states[this._activeIndex];
    const progress = Math.round(((this._activeIndex + 1) / this.states.length) * 100);

    this.container.innerHTML = `
      <style>
        .sim-engine-card { padding: 1.15rem; border-radius: 18px; border: 1px solid var(--color-border); background: linear-gradient(180deg, var(--color-bg-panel), var(--color-bg-dark)); box-shadow: var(--shadow-md); }
        .sim-engine-card__eyebrow { display: inline-flex; align-items: center; gap: 0.45rem; margin: 0 0 0.65rem; color: var(--color-primary); font-size: 0.76rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
        .sim-engine-card__title { margin: 0; font-size: 1.1rem; color: var(--color-text-primary); }
        .sim-engine-card__body { margin: 0.72rem 0 0; color: var(--color-text-secondary); line-height: 1.7; }
        .state-machine__rail { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 0.6rem; margin: 1.1rem 0; }
        .state-machine__node { position: relative; border: 1px solid var(--color-border); border-radius: 14px; background: color-mix(in srgb, var(--color-bg-panel) 72%, transparent); color: var(--color-text-secondary); padding: 0.72rem; text-align: left; font: inherit; transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast); }
        .state-machine__node:hover, .state-machine__node:focus-visible { transform: translateY(-1px); border-color: var(--color-border-hover); outline: none; }
        .state-machine__node.is-active { color: var(--color-text-primary); border-color: var(--color-border-active); background: var(--color-cyan-glow); box-shadow: var(--shadow-cyan); }
        .state-machine__node.is-complete { border-color: color-mix(in srgb, var(--color-success) 38%, transparent); }
        .state-machine__node-index { display: inline-flex; align-items: center; justify-content: center; width: 1.45rem; height: 1.45rem; margin-bottom: 0.45rem; border-radius: var(--radius-full); background: var(--color-bg-deepest); color: var(--color-primary); font-family: var(--font-mono); font-size: 0.72rem; }
        .state-machine__active { border: 1px solid var(--color-border); border-radius: 16px; background: color-mix(in srgb, var(--color-bg-dark) 82%, transparent); padding: 1rem; }
        .state-machine__active h5 { margin: 0 0 0.45rem; color: var(--color-text-primary); font-size: 1.05rem; }
        .state-machine__meter { height: 0.55rem; border-radius: var(--radius-full); overflow: hidden; background: var(--color-bg-deepest); border: 1px solid var(--color-border); margin-top: 0.9rem; }
        .state-machine__meter span { display: block; height: 100%; width: ${progress}%; background: linear-gradient(90deg, var(--color-primary), var(--color-info)); }
        .state-machine__actions { display: flex; flex-wrap: wrap; gap: 0.65rem; margin-top: 0.9rem; }
      </style>
      <div class="sim-engine-card state-machine">
        <p class="sim-engine-card__eyebrow">${renderTokenIcon('TIME', 'learning-token-icon')} State machine animator</p>
        <h4 class="sim-engine-card__title">${escapeHtml(this.title)}</h4>
        <p class="sim-engine-card__body">Step through each state in order and connect the transition to the operational signal you would verify while troubleshooting.</p>
        <div class="state-machine__rail" aria-label="Protocol states">
          ${this.states.map((state, index) => `
            <button type="button" class="state-machine__node ${index === this._activeIndex ? 'is-active' : ''} ${index < this._activeIndex ? 'is-complete' : ''}" data-state-index="${index}" ${index === this._activeIndex ? 'aria-current="step"' : ''}>
              <span class="state-machine__node-index">${index + 1}</span>
              <strong>${escapeHtml(state.name)}</strong>
            </button>
          `).join('')}
        </div>
        <section class="state-machine__active">
          <h5>${escapeHtml(active.name)}</h5>
          <p class="sim-engine-card__body">${escapeHtml(active.detail)}</p>
          <div class="state-machine__meter" role="progressbar" aria-label="State machine progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span></span></div>
          <div class="state-machine__actions">
            <button type="button" class="btn btn-ghost" data-state-action="prev" ${this._activeIndex === 0 ? 'disabled' : ''}>Previous state</button>
            <button type="button" class="btn btn-primary" data-state-action="next" ${this._activeIndex === this.states.length - 1 ? 'disabled' : ''}>Next state</button>
            <button type="button" class="btn btn-secondary" data-state-action="finish">Jump to converged</button>
            <button type="button" class="btn btn-ghost" data-state-action="reset">Reset</button>
          </div>
        </section>
      </div>
    `;
  }
}
