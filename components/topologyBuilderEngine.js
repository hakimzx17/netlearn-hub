import { renderTokenIcon } from '../utils/tokenIcons.js';
import { createDragDropEngine } from './dragDropEngine.js';
import { collectDefinitionPairs, escapeHtml, slugify } from './simulationEngineUtils.js';

const TOPOLOGY_SCENARIOS = [
  {
    test: /multi-area ospf/i,
    title: 'Place OSPF roles into the correct multi-area topology position',
    pairs: [
      ['Backbone Area 0', 'Transit area that all other OSPF areas must connect through.'],
      ['ABR', 'Router with interfaces in Area 0 and at least one nonbackbone area.'],
      ['Internal Router', 'Router whose OSPF interfaces all belong to the same area.'],
      ['ASBR', 'Router that injects external routes into the OSPF domain.'],
      ['Nonbackbone Area', 'Area that relies on an ABR to reach other areas.'],
    ],
  },
  {
    test: /wireless lan architecture|capwap|wlc/i,
    title: 'Map wireless architecture components to their control-plane role',
    pairs: [
      ['Lightweight AP', 'Forwards client traffic and depends on a controller for centralized management.'],
      ['WLC', 'Terminates control sessions and centralizes WLAN policy decisions.'],
      ['CAPWAP Tunnel', 'Carries AP-to-controller control traffic and may carry data traffic.'],
      ['Client VLAN', 'Layer 2 segment where wireless clients are ultimately placed.'],
      ['Management Network', 'Reachability path used by APs and controllers to form control sessions.'],
    ],
  },
  {
    test: /voice vlan/i,
    title: 'Place voice VLAN elements into the access-edge design',
    pairs: [
      ['IP Phone', 'Endpoint that tags voice traffic while bridging a downstream PC.'],
      ['Access Port', 'Switchport configured to carry the data VLAN and voice VLAN policy.'],
      ['Voice VLAN', 'Logical segment used to separate latency-sensitive voice traffic.'],
      ['Data VLAN', 'Logical segment used by the attached workstation.'],
      ['QoS Trust Boundary', 'Design point where voice markings may be accepted or enforced.'],
    ],
  },
  {
    test: /vlan|trunk/i,
    title: 'Place VLAN and trunking roles into a switched campus path',
    pairs: [
      ['Access Port', 'Carries one user VLAN toward an endpoint.'],
      ['Trunk Port', 'Carries multiple VLANs between infrastructure devices.'],
      ['Native VLAN', 'VLAN associated with untagged frames on an 802.1Q trunk.'],
      ['Allowed VLAN List', 'Controls which VLANs may traverse the trunk.'],
      ['SVI', 'Logical Layer 3 interface often used as a VLAN gateway.'],
    ],
  },
];

function buildPairs(topic, maxPairs = 6) {
  const text = `${topic?.id || ''} ${topic?.title || ''} ${topic?.description || ''}`;
  const scenario = TOPOLOGY_SCENARIOS.find((entry) => entry.test.test(text));
  if (scenario) {
    return {
      title: scenario.title,
      pairs: scenario.pairs.map(([itemLabel, zoneLabel], index) => ({
        id: `${slugify(topic?.id || 'topic')}-topology-${index}`,
        itemLabel,
        zoneLabel,
      })),
    };
  }

  return {
    title: `Assemble the ${topic?.title || 'lesson'} topology map`,
    pairs: collectDefinitionPairs(topic, maxPairs),
  };
}

export class TopologyBuilderEngine {
  constructor(options = {}) {
    this.topic = options.topic || null;
    const built = buildPairs(this.topic, options.maxPairs || 6);
    this.title = options.title || built.title;
    this._pairs = built.pairs;
    this.container = null;
    this._dnd = null;
    this._boundClick = this._handleClick.bind(this);
  }

  mount(containerEl) {
    this.container = containerEl;
    this.container.addEventListener('click', this._boundClick);
    this._render();
    this._initBoard();
  }

  destroy() {
    if (this.container) {
      this.container.removeEventListener('click', this._boundClick);
    }
    this._dnd?.destroy();
    this._dnd = null;
    this.container = null;
  }

  _handleClick(event) {
    const actionEl = event.target.closest('[data-topology-action]');
    if (!actionEl || !this._dnd) return;

    const scoreEl = this.container?.querySelector('#topology-builder-score');
    const action = actionEl.dataset.topologyAction;

    if (action === 'check') {
      const result = this._dnd.checkState();
      this._dnd.showFeedback();
      if (scoreEl) scoreEl.textContent = `${result.score}/${result.total} topology roles placed correctly`;
      return;
    }

    if (action === 'reveal') {
      this._dnd.revealAnswer();
      if (scoreEl) scoreEl.textContent = `Answers revealed · ${this._pairs.length} topology roles`;
      return;
    }

    if (action === 'reset') {
      this._dnd.reset();
      if (scoreEl) scoreEl.textContent = 'Drag each component into the matching topology role';
      const keyboardScoreEl = this.container?.querySelector('#topology-keyboard-score');
      this.container?.querySelectorAll('[data-topology-select]').forEach((selectEl) => {
        selectEl.value = '';
      });
      if (keyboardScoreEl) keyboardScoreEl.textContent = 'Keyboard placements reset';
      return;
    }

    if (action === 'check-keyboard') {
      const selects = [...(this.container?.querySelectorAll('[data-topology-select]') || [])];
      const total = selects.length;
      const score = selects.filter((selectEl) => selectEl.value && selectEl.value === selectEl.dataset.accepts).length;
      const keyboardScoreEl = this.container?.querySelector('#topology-keyboard-score');
      if (keyboardScoreEl) keyboardScoreEl.textContent = `${score}/${total} keyboard placements matched correctly`;
      return;
    }

    if (action === 'reset-keyboard') {
      this.container?.querySelectorAll('[data-topology-select]').forEach((selectEl) => {
        selectEl.value = '';
      });
      const keyboardScoreEl = this.container?.querySelector('#topology-keyboard-score');
      if (keyboardScoreEl) keyboardScoreEl.textContent = 'Choose a component for each topology role';
    }
  }

  _render() {
    if (!this.container) return;

    if (this._pairs.length < 3) {
      this.container.innerHTML = `
        <div class="sim-engine-card">
          <p class="sim-engine-card__eyebrow">${renderTokenIcon('NET', 'learning-token-icon')} Topology builder unavailable</p>
          <h4 class="sim-engine-card__title">No topology dataset is attached to this lesson yet.</h4>
          <p class="sim-engine-card__body">This engine can run from structured role/definition pairs, tables, or a topic-specific topology scenario.</p>
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
        .topology-builder__canvas { display: grid; gap: 1rem; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); margin-top: 1.1rem; }
        .topology-builder__panel { border: 1px solid var(--color-border); border-radius: 16px; background: color-mix(in srgb, var(--color-bg-dark) 82%, transparent); padding: 0.95rem; }
        .topology-builder__panel h5 { margin: 0 0 0.7rem; color: var(--color-text-primary); font-size: 0.84rem; letter-spacing: 0.12em; text-transform: uppercase; }
        .topology-builder__controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.7rem; margin-top: 1rem; }
        .topology-builder__score { color: var(--color-text-secondary); font-size: 0.84rem; }
        .topology-builder__actions { display: flex; flex-wrap: wrap; gap: 0.65rem; }
        .topology-builder__keyboard { margin-top: 1rem; border: 1px solid var(--color-border); border-radius: 16px; background: color-mix(in srgb, var(--color-bg-dark) 82%, transparent); padding: 0.95rem; }
        .topology-builder__keyboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; margin-top: 0.8rem; }
        .topology-builder__keyboard-field { display: grid; gap: 0.35rem; }
        .topology-builder__keyboard-field label { color: var(--color-text-secondary); font-size: 0.78rem; line-height: 1.45; }
        .topology-builder__keyboard-field select { width: 100%; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-bg-deepest); color: var(--color-text-primary); padding: 0.65rem 0.75rem; }
        @media (max-width: 880px) { .topology-builder__canvas { grid-template-columns: 1fr; } }
      </style>
      <div class="sim-engine-card topology-builder">
        <p class="sim-engine-card__eyebrow">${renderTokenIcon('NET', 'learning-token-icon')} Topology builder</p>
        <h4 class="sim-engine-card__title">${escapeHtml(this.title)}</h4>
        <p class="sim-engine-card__body">Treat each draggable item as a device, role, or logical segment. Place it next to the operational description that best matches its job in the design.</p>
        <div class="topology-builder__canvas">
          <section class="topology-builder__panel">
            <h5>Components</h5>
            <div id="topology-builder-items"></div>
          </section>
          <section class="topology-builder__panel">
            <h5>Topology roles</h5>
            <div id="topology-builder-zones"></div>
          </section>
        </div>
        <div class="topology-builder__controls">
          <div class="topology-builder__score" id="topology-builder-score" role="status" aria-live="polite">Drag each component into the matching topology role</div>
          <div class="topology-builder__actions">
            <button type="button" class="btn btn-primary" data-topology-action="check">Check topology</button>
            <button type="button" class="btn btn-secondary" data-topology-action="reveal">Reveal answer</button>
            <button type="button" class="btn btn-ghost" data-topology-action="reset">Reset</button>
          </div>
        </div>
        <section class="topology-builder__keyboard" aria-labelledby="topology-keyboard-title">
          <h5 id="topology-keyboard-title">Keyboard placement fallback</h5>
          <p class="sim-engine-card__body">Prefer keyboard input? Select the matching component for each topology role, then check your placements.</p>
          <div class="topology-builder__keyboard-grid">
            ${this._pairs.map((pair, index) => `
              <div class="topology-builder__keyboard-field">
                <label for="topology-select-${index}">${escapeHtml(pair.zoneLabel)}</label>
                <select id="topology-select-${index}" data-topology-select data-accepts="${escapeHtml(pair.id)}">
                  <option value="">Choose component…</option>
                  ${this._pairs.map((optionPair) => `<option value="${escapeHtml(optionPair.id)}">${escapeHtml(optionPair.itemLabel)}</option>`).join('')}
                </select>
              </div>
            `).join('')}
          </div>
          <div class="topology-builder__controls">
            <div class="topology-builder__score" id="topology-keyboard-score" role="status" aria-live="polite">Choose a component for each topology role</div>
            <div class="topology-builder__actions">
              <button type="button" class="btn btn-primary" data-topology-action="check-keyboard">Check keyboard placements</button>
              <button type="button" class="btn btn-ghost" data-topology-action="reset-keyboard">Reset keyboard choices</button>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  _initBoard() {
    if (!this.container || this._pairs.length < 3) return;
    const itemsContainerEl = this.container.querySelector('#topology-builder-items');
    const zonesContainerEl = this.container.querySelector('#topology-builder-zones');
    if (!itemsContainerEl || !zonesContainerEl) return;

    this._dnd?.destroy();
    this._dnd = createDragDropEngine();
    this._dnd.init({
      itemsContainerEl,
      zonesContainerEl,
      items: this._pairs.map((pair) => ({ id: pair.id, label: pair.itemLabel })),
      zones: this._pairs.map((pair) => ({ id: `zone-${pair.id}`, label: pair.zoneLabel, accepts: pair.id })),
    });
  }
}
