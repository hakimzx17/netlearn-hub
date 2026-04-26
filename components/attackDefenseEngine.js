import { renderTokenIcon } from '../utils/tokenIcons.js';
import { collectTheorySteps, escapeHtml } from './simulationEngineUtils.js';

const SCENARIO_LIBRARY = [
  {
    test: /dhcp snooping/i,
    title: 'Rogue DHCP server containment',
    attack: 'An unauthorized device starts answering DHCP Discover messages before the legitimate server responds.',
    impact: 'Clients receive the wrong default gateway or DNS information and traffic can be redirected or blackholed.',
    correct: 'Enable DHCP snooping, trust only uplinks toward legitimate DHCP servers, and keep access ports untrusted.',
    options: [
      'Enable DHCP snooping, trust only uplinks toward legitimate DHCP servers, and keep access ports untrusted.',
      'Disable STP on access ports so DHCP packets converge faster.',
      'Permit all DHCP replies and rely on endpoint antivirus to detect the issue.',
      'Change the native VLAN on every trunk without validating DHCP trust boundaries.',
    ],
  },
  {
    test: /dynamic arp inspection|arp/i,
    title: 'ARP poisoning mitigation',
    attack: 'A host sends forged ARP replies so traffic for the default gateway maps to the attacker MAC address.',
    impact: 'Victim traffic can be intercepted, modified, or dropped before it reaches the real gateway.',
    correct: 'Use DHCP snooping bindings with Dynamic ARP Inspection so invalid ARP messages are dropped on untrusted ports.',
    options: [
      'Use DHCP snooping bindings with Dynamic ARP Inspection so invalid ARP messages are dropped on untrusted ports.',
      'Disable MAC learning on all switchports permanently.',
      'Move the default gateway into the native VLAN only.',
      'Increase the ARP timeout so forged entries remain stable.',
    ],
  },
  {
    test: /port security/i,
    title: 'Unauthorized endpoint on an access port',
    attack: 'A user connects an unknown device or mini-switch to an access port that should support only known endpoints.',
    impact: 'The access layer can learn unexpected MAC addresses, expanding the attack surface on a trusted edge port.',
    correct: 'Configure Port Security with an appropriate maximum MAC count, secure MAC learning, and a violation action.',
    options: [
      'Configure Port Security with an appropriate maximum MAC count, secure MAC learning, and a violation action.',
      'Convert the access port to a trunk so the endpoint can choose a VLAN.',
      'Disable duplex negotiation to stop unknown MAC addresses.',
      'Remove all VLAN assignments from the switch.',
    ],
  },
  {
    test: /vtp/i,
    title: 'VTP revision overwrite risk',
    attack: 'A switch with a higher VTP revision number is introduced and advertises an unintended VLAN database.',
    impact: 'Existing VLANs can be overwritten across the domain, disrupting access-layer forwarding.',
    correct: 'Use the correct VTP mode/domain controls and reset revision state before introducing switches into production.',
    options: [
      'Use the correct VTP mode/domain controls and reset revision state before introducing switches into production.',
      'Increase every access-port speed to force the database to resync.',
      'Disable CDP so VTP advertisements are encrypted.',
      'Move all hosts into VLAN 1 before adding the switch.',
    ],
  },
  {
    test: /social engineering/i,
    title: 'Credential harvesting attempt',
    attack: 'A message pressures a user to open a link and enter credentials into a fake portal.',
    impact: 'The attacker gains valid credentials and can bypass perimeter controls as a trusted identity.',
    correct: 'Train users, validate unusual requests out-of-band, and enforce MFA plus reporting workflows.',
    options: [
      'Train users, validate unusual requests out-of-band, and enforce MFA plus reporting workflows.',
      'Disable DNS for the entire site whenever a suspicious email arrives.',
      'Permit the login if the user recognizes the logo.',
      'Only change switchport duplex settings after the user reports the message.',
    ],
  },
  {
    test: /firewall|ips/i,
    title: 'Malicious traffic crossing a security boundary',
    attack: 'Traffic from an untrusted zone attempts to reach internal services using suspicious patterns.',
    impact: 'Without inspection or policy enforcement, unwanted sessions can reach protected resources.',
    correct: 'Apply firewall policy and IPS inspection at the boundary, then log and tune detections.',
    options: [
      'Apply firewall policy and IPS inspection at the boundary, then log and tune detections.',
      'Remove all ACLs so the IPS can see more traffic after compromise.',
      'Disable logging because alerts slow down packet forwarding.',
      'Move every server into the user VLAN.',
    ],
  },
];

function buildFallbackScenario(topic) {
  const steps = collectTheorySteps(topic, 3);
  const clue = steps[0]?.detail || topic?.description || 'A control weakness appears in the current topic scenario.';
  return {
    title: `${topic?.title || 'Security'} mitigation decision`,
    attack: clue,
    impact: 'The symptom must be classified before the correct mitigation can be chosen.',
    correct: 'Classify the symptom, apply the matching control, and verify the result with operational evidence.',
    options: [
      'Classify the symptom, apply the matching control, and verify the result with operational evidence.',
      'Apply a random configuration change and skip validation.',
      'Assume the issue is solved if the first packet succeeds once.',
      'Ignore logs and remove the security control from the path.',
    ],
  };
}

function buildScenarios(topic) {
  const text = `${topic?.id || ''} ${topic?.title || ''} ${topic?.description || ''}`;
  const matches = SCENARIO_LIBRARY.filter((scenario) => scenario.test.test(text));
  return matches.length ? matches : [buildFallbackScenario(topic)];
}

export class AttackDefenseEngine {
  constructor(options = {}) {
    this.topic = options.topic || null;
    this.scenarios = Array.isArray(options.scenarios) ? options.scenarios : buildScenarios(this.topic);
    this.container = null;
    this._scenarioIndex = 0;
    this._feedback = null;
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

  _getScenario() {
    return this.scenarios[this._scenarioIndex] || null;
  }

  _handleClick(event) {
    const actionEl = event.target.closest('[data-defense-action], [data-defense-option]');
    if (!actionEl) return;

    if (actionEl.dataset.defenseOption) {
      const scenario = this._getScenario();
      const selected = scenario?.options?.[Number(actionEl.dataset.defenseOption)] || '';
      const correct = selected === scenario.correct;
      this._feedback = {
        correct,
        message: correct
          ? 'Correct mitigation. The defense matches the attack mechanism and includes validation.'
          : `Not the safest mitigation. Best answer: ${scenario.correct}`,
      };
      this._render();
      return;
    }

    const action = actionEl.dataset.defenseAction;
    if (action === 'next') {
      this._scenarioIndex = Math.min(this._scenarioIndex + 1, this.scenarios.length - 1);
      this._feedback = null;
      this._render();
      return;
    }
    if (action === 'prev') {
      this._scenarioIndex = Math.max(this._scenarioIndex - 1, 0);
      this._feedback = null;
      this._render();
      return;
    }
    if (action === 'reset') {
      this._scenarioIndex = 0;
      this._feedback = null;
      this._render();
    }
  }

  _render() {
    if (!this.container) return;
    const scenario = this._getScenario();

    if (!scenario) {
      this.container.innerHTML = `
        <div class="sim-engine-card">
          <p class="sim-engine-card__eyebrow">${renderTokenIcon('LOCK', 'learning-token-icon')} Attack / defense unavailable</p>
          <h4 class="sim-engine-card__title">No security scenario is attached to this lesson yet.</h4>
          <p class="sim-engine-card__body">Add a topic-specific attack/mitigation scenario to activate this engine.</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = `
      <style>
        .sim-engine-card { padding: 1.15rem; border-radius: 18px; border: 1px solid var(--color-border); background: linear-gradient(180deg, var(--color-bg-panel), var(--color-bg-dark)); box-shadow: var(--shadow-md); }
        .sim-engine-card__eyebrow { display: inline-flex; align-items: center; gap: 0.45rem; margin: 0 0 0.65rem; color: var(--color-primary); font-size: 0.76rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
        .sim-engine-card__title { margin: 0; font-size: 1.1rem; color: var(--color-text-primary); }
        .sim-engine-card__body { margin: 0.72rem 0 0; color: var(--color-text-secondary); line-height: 1.7; }
        .attack-defense__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-top: 1.1rem; }
        .attack-defense__panel { border: 1px solid var(--color-border); border-radius: 16px; background: color-mix(in srgb, var(--color-bg-dark) 82%, transparent); padding: 0.95rem; }
        .attack-defense__panel h5 { margin: 0 0 0.55rem; color: var(--color-text-primary); font-size: 0.86rem; letter-spacing: 0.12em; text-transform: uppercase; }
        .attack-defense__options { display: grid; gap: 0.7rem; margin-top: 1rem; }
        .attack-defense__option { text-align: left; border: 1px solid var(--color-border); border-radius: 14px; background: color-mix(in srgb, var(--color-bg-panel) 72%, transparent); color: var(--color-text-primary); padding: 0.86rem 0.92rem; font: inherit; line-height: 1.55; transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast); }
        .attack-defense__option:hover, .attack-defense__option:focus-visible { outline: none; transform: translateY(-1px); border-color: var(--color-border-hover); background: var(--color-cyan-glow); }
        .attack-defense__feedback { margin-top: 0.9rem; border: 1px solid var(--color-border); border-radius: 14px; padding: 0.85rem 0.95rem; color: var(--color-text-secondary); background: color-mix(in srgb, var(--color-bg-panel) 80%, transparent); }
        .attack-defense__feedback.is-correct { border-color: color-mix(in srgb, var(--color-success) 45%, transparent); background: color-mix(in srgb, var(--color-success) 12%, transparent); }
        .attack-defense__feedback.is-wrong { border-color: color-mix(in srgb, var(--color-warning) 45%, transparent); background: color-mix(in srgb, var(--color-warning) 12%, transparent); }
        .attack-defense__actions { display: flex; flex-wrap: wrap; gap: 0.65rem; margin-top: 0.9rem; }
        @media (max-width: 880px) { .attack-defense__grid { grid-template-columns: 1fr; } }
      </style>
      <div class="sim-engine-card attack-defense">
        <p class="sim-engine-card__eyebrow">${renderTokenIcon('LOCK', 'learning-token-icon')} Attack / defense scenario</p>
        <h4 class="sim-engine-card__title">${escapeHtml(scenario.title)}</h4>
        <p class="sim-engine-card__body">Read the attack path, predict the operational impact, then choose the mitigation that directly addresses the mechanism.</p>
        <div class="attack-defense__grid">
          <section class="attack-defense__panel">
            <h5>Before mitigation</h5>
            <p class="sim-engine-card__body">${escapeHtml(scenario.attack)}</p>
          </section>
          <section class="attack-defense__panel">
            <h5>Likely impact</h5>
            <p class="sim-engine-card__body">${escapeHtml(scenario.impact)}</p>
          </section>
        </div>
        <div class="attack-defense__options" aria-label="Mitigation choices">
          ${scenario.options.map((option, index) => `
            <button type="button" class="attack-defense__option" data-defense-option="${index}">${escapeHtml(option)}</button>
          `).join('')}
        </div>
        ${this._feedback ? `<div class="attack-defense__feedback ${this._feedback.correct ? 'is-correct' : 'is-wrong'}" role="status" aria-live="polite">${escapeHtml(this._feedback.message)}</div>` : ''}
        <div class="attack-defense__actions">
          <button type="button" class="btn btn-ghost" data-defense-action="prev" ${this._scenarioIndex === 0 ? 'disabled' : ''}>Previous scenario</button>
          <button type="button" class="btn btn-secondary" data-defense-action="next" ${this._scenarioIndex === this.scenarios.length - 1 ? 'disabled' : ''}>Next scenario</button>
          <button type="button" class="btn btn-ghost" data-defense-action="reset">Reset</button>
        </div>
      </div>
    `;
  }
}
