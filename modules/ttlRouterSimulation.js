/**
 * ttlRouterSimulation.js — TTL Router Hop Simulator (Complete Rework)
 *
 * Teaches:
 * - Routers decrement IPv4 TTL by 1 at each Layer-3 hop
 * - TTL=0 causes drop + ICMP Time Exceeded back to source
 * - traceroute uses incremental TTL probes to map the path
 */

import { createNetworkDiagram } from '../components/networkDiagram.js';
import { stateManager } from '../js/stateManager.js';
import { sleep, showToast, resolveInjectedCssTokens } from '../utils/helperFunctions.js';

const TOPOLOGY = {
  zones: [
    {
      id: 'source-lan',
      x: 22,
      y: 112,
      width: 360,
      height: 268,
      title: 'Source LAN',
      subnet: '10.10.1.0/24',
      fill: 'rgba(144, 238, 144, 0.12)',
      stroke: 'rgba(144, 238, 144, 0.55)',
      strokeDasharray: '4 3',
    },
    {
      id: 'dest-lan',
      x: 988,
      y: 112,
      width: 360,
      height: 268,
      title: 'Destination LAN',
      subnet: '203.0.113.0/24',
      fill: 'rgba(120, 210, 255, 0.12)',
      stroke: 'rgba(120, 210, 255, 0.55)',
      strokeDasharray: '4 3',
    },
  ],
  nodes: [
    { id: 'src', type: 'pc', label: 'PC1', x: 92, y: 186, ip: '10.10.1.10' },
    { id: 'src2', type: 'pc', label: 'PC2', x: 92, y: 308, ip: '10.10.1.20' },
    { id: 'sw1', type: 'switch', label: 'SW1', x: 270, y: 248 },
    { id: 'r1', type: 'router', label: 'R1', x: 446, y: 248, ip: '10.10.1.1' },
    { id: 'r2', type: 'router', label: 'R2', x: 626, y: 170, ip: '172.16.12.2' },
    { id: 'r3', type: 'router', label: 'R3', x: 810, y: 248, ip: '172.16.23.3' },
    { id: 'sw2', type: 'switch', label: 'SW2', x: 1068, y: 248 },
    { id: 'dst', type: 'server', label: 'Dest Server', x: 1248, y: 186, ip: '203.0.113.10' },
    { id: 'dst2', type: 'pc', label: 'PC4', x: 1248, y: 308, ip: '203.0.113.20' },
  ],
  links: [
    { from: 'src', to: 'sw1', label: 'G0/1' },
    { from: 'src2', to: 'sw1', label: 'G0/2' },
    { from: 'sw1', to: 'r1', label: 'G0/0' },
    { from: 'r1', to: 'r2', label: 'G0/1' },
    { from: 'r2', to: 'r3', label: 'G0/0' },
    { from: 'r3', to: 'sw2', label: 'G0/1' },
    { from: 'sw2', to: 'dst', label: 'G0/1' },
    { from: 'sw2', to: 'dst2', label: 'G0/2' },
  ],
};

const FORWARD_PATH = ['src', 'sw1', 'r1', 'r2', 'r3', 'sw2', 'dst'];
const ROUTER_HOPS = new Set(['r1', 'r2', 'r3']);

const SCENARIOS = [
  {
    id: 'normal',
    label: 'Normal Delivery',
    title: 'Normal Delivery (TTL=8)',
    mode: 'single',
    initialTTL: 8,
    description: 'Packet crosses three routers. TTL is decremented at each router and reaches destination safely.',
  },
  {
    id: 'expiry',
    label: 'TTL Expiry',
    title: 'TTL Expiry Demo (TTL=2)',
    mode: 'single',
    initialTTL: 2,
    description: 'Packet expires at R2. Router drops packet and returns ICMP Time Exceeded to source.',
  },
  {
    id: 'traceroute',
    label: 'Traceroute',
    title: 'Traceroute Mechanics (TTL=1..4)',
    mode: 'traceroute',
    initialTTL: 1,
    probeTTLs: [1, 2, 3, 4],
    description: 'Incremental probes reveal R1, R2, R3, then destination.',
  },
];

class TtlRouterSimulation {
  constructor() {
    this.container = null;
    this._diagram = null;
    this._running = false;
    this._isDestroyed = false;
    this._runToken = 0;
    this._scenarioId = 'normal';
    this._ttlBase = 8;
  }

  init(containerEl) {
    this.container = containerEl;
    this._diagram = createNetworkDiagram();
    this._isDestroyed = false;
    this._injectStyles();
    this._render();
  }

  start() {
    if (!this._running) this._runScenario();
  }

  step() {
    this.start();
  }

  reset() {
    this._runToken += 1;
    this._running = false;
    if (this._diagram) this._diagram.reset();
    if (this.container) this._render();
  }

  destroy() {
    this._runToken += 1;
    this._running = false;
    this._isDestroyed = true;
    if (this._diagram) this._diagram.destroy();
    this._diagram = null;
    this.container = null;
  }

  _render() {
    const sc = this._getScenario();

    this.container.innerHTML = `
      <div class="ttlx-wrap">
        <div class="module-header">
          <div class="module-header__breadcrumb">
            <a href="#/">Home</a> › <span>Simulations</span>
          </div>
          <h1 class="module-header__title">TTL Router Hop Simulator</h1>
          <p class="module-header__description">
            Every router decrements TTL by 1 before forwarding. If TTL becomes 0, the packet is dropped and an ICMP Time Exceeded message is generated.
          </p>
        </div>

        <div class="ttlx-grid">
          <section class="ttlx-main">
            <div class="ttlx-card">
              <div class="ttlx-card__head">
                <span>Scenario</span>
              </div>
              <div class="ttlx-scenarios">
                ${SCENARIOS.map((s) => `
                  <button class="ttlx-scenario ${s.id === this._scenarioId ? 'is-active' : ''}" data-scenario="${s.id}">
                    ${s.label}
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="ttlx-card ttlx-topology">
              <div class="ttlx-card__head">
                <span>Network Topology</span>
                <span id="ttlx-scenario-title" class="ttlx-subhead">${sc.title}</span>
              </div>
              <div class="ttlx-canvas" id="ttlx-canvas"></div>
            </div>

            <div class="ttlx-controls">
              <button class="btn btn-primary" id="ttlx-run-btn">Run Scenario</button>
              <button class="btn btn-ghost" id="ttlx-reset-btn">Reset</button>
            </div>

            <div class="ttlx-card">
              <div class="ttlx-gauge-row">
                <span class="ttlx-label">Current TTL</span>
                <span class="ttlx-ttl" id="ttlx-ttl-value">${sc.initialTTL}</span>
              </div>
              <div class="ttlx-gauge">
                <div class="ttlx-gauge__bar" id="ttlx-ttl-bar"></div>
              </div>
            </div>

            <div class="ttlx-card">
              <div class="ttlx-status" id="ttlx-status-title">${sc.title}</div>
              <p class="ttlx-status__desc" id="ttlx-status-desc">${sc.description}</p>
            </div>
          </section>

          <aside class="ttlx-side">
            <div class="ttlx-card">
              <div class="ttlx-card__head"><span>Hop Log</span></div>
              <div class="ttlx-log">
                <div class="ttlx-log__head">
                  <span>Hop</span><span>Device</span><span>TTL In→Out</span><span>Result</span>
                </div>
                <div class="ttlx-log__body" id="ttlx-log-body">
                  <div class="ttlx-log__empty">Awaiting simulation...</div>
                </div>
              </div>
            </div>

            <div class="ttlx-card">
              <div class="ttlx-card__head"><span>TTL Notes</span></div>
              <div class="ttlx-notes">
                <p><strong>Loop protection:</strong> TTL prevents infinite forwarding loops.</p>
                <p><strong>Decrement point:</strong> TTL changes only at Layer-3 hops (routers), not switches.</p>
                <p><strong>ICMP trigger:</strong> Router sends Time Exceeded when post-decrement TTL is 0.</p>
                <p><strong>traceroute:</strong> Probes with TTL=1,2,3... reveal each router in the path.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    `;

    this._diagram.init(
      this.container.querySelector('#ttlx-canvas'),
      TOPOLOGY,
      {
        width: 1380,
        height: 520,
        labelMode: 'compact',
        compactPortLabels: true,
        linkBadge: false,
      }
    );

    this._prepareScenario();
    this._bindControls();
  }

  _bindControls() {
    this.container.querySelectorAll('.ttlx-scenario').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this._running) return;
        this._scenarioId = btn.getAttribute('data-scenario') || 'normal';
        this._diagram?.reset();
        this._prepareScenario();
        this._syncScenarioButtons();
      });
    });

    this.container.querySelector('#ttlx-run-btn')?.addEventListener('click', () => {
      if (!this._running) this._runScenario();
    });

    this.container.querySelector('#ttlx-reset-btn')?.addEventListener('click', () => {
      this.reset();
    });
  }

  _getScenario() {
    return SCENARIOS.find((s) => s.id === this._scenarioId) || SCENARIOS[0];
  }

  _syncScenarioButtons() {
    this.container?.querySelectorAll('.ttlx-scenario').forEach((btn) => {
      const active = btn.getAttribute('data-scenario') === this._scenarioId;
      btn.classList.toggle('is-active', active);
    });
  }

  _prepareScenario() {
    const sc = this._getScenario();
    this._ttlBase = sc.initialTTL;
    this._setTTLDisplay(sc.initialTTL, sc.initialTTL);
    this._clearLog();
    this._setStatus(sc.title, sc.description, 'info');
    const title = this.container?.querySelector('#ttlx-scenario-title');
    if (title) title.textContent = sc.title;
  }

  _isAborted(token) {
    return (
      this._isDestroyed ||
      !this.container ||
      !this._diagram ||
      token !== this._runToken ||
      !this._running
    );
  }

  async _sleepSafe(ms, token) {
    if (this._isAborted(token)) return false;
    await sleep(ms);
    return !this._isAborted(token);
  }

  async _animateSafe(path, options, token) {
    if (this._isAborted(token)) return false;
    await this._diagram.animatePacket(path, options);
    return !this._isAborted(token);
  }

  async _runScenario() {
    if (this._running) return;

    const sc = this._getScenario();
    const token = ++this._runToken;
    this._running = true;

    const runBtn = this.container?.querySelector('#ttlx-run-btn');
    if (runBtn) runBtn.setAttribute('disabled', 'true');

    this._diagram?.reset();
    this._clearLog();
    this._setStatus(sc.title, sc.description, 'info');

    if (sc.mode === 'traceroute') {
      for (let i = 0; i < sc.probeTTLs.length; i++) {
        const probeTTL = sc.probeTTLs[i];
        const ok = await this._simulateProbe(probeTTL, token, i + 1, true);
        if (!ok || this._isAborted(token)) break;
        await this._sleepSafe(400, token);
        this._diagram?.reset();
      }

      if (!this._isAborted(token)) {
        this._setStatus(
          'Traceroute Completed',
          'Probes mapped the route as R1 -> R2 -> R3 -> destination.',
          'success'
        );
      }
    } else {
      await this._simulateProbe(sc.initialTTL, token, 1, false);
    }

    if (token === this._runToken) {
      this._running = false;
      if (runBtn) runBtn.removeAttribute('disabled');
    }
  }

  async _simulateProbe(initialTTL, token, probeIndex, isTraceroute) {
    let ttl = initialTTL;
    this._ttlBase = initialTTL;
    this._setTTLDisplay(ttl, initialTTL);

    this._appendLog(
      isTraceroute ? `P${probeIndex}` : 'TX',
      'SRC',
      `${ttl}`,
      isTraceroute ? `Probe launched (TTL=${ttl})` : 'Packet sent from source',
      'info'
    );

    for (let i = 0; i < FORWARD_PATH.length - 1; i++) {
      const from = FORWARD_PATH[i];
      const to = FORWARD_PATH[i + 1];

      const moved = await this._animateSafe(
        [from, to],
        { type: 'data', label: `TTL ${ttl}`, speed: 430 },
        token
      );
      if (!moved) return false;

      if (ROUTER_HOPS.has(to)) {
        const ttlBefore = ttl;
        ttl = ttl - 1;
        this._setTTLDisplay(ttl, initialTTL);

        if (ttl <= 0) {
          this._diagram.highlightNode(to, 'error', 1500);
          this._appendLog(
            isTraceroute ? `P${probeIndex}` : `H${i + 1}`,
            to.toUpperCase(),
            `${ttlBefore}->0`,
            'Drop + ICMP Time Exceeded',
            'error'
          );
          this._setStatus(
            'TTL Expired',
            `${to.toUpperCase()} decremented TTL to 0 and dropped the packet. ICMP Time Exceeded returned to source.`,
            'error'
          );

          const reversePath = this._buildReturnPath(to);
          const icmpOk = await this._animateSafe(
            reversePath,
            { type: 'icmp', label: 'ICMP Time Exceeded', speed: 390 },
            token
          );
          if (!icmpOk) return false;

          this._diagram.highlightNode('src', 'error', 1000);
          this._appendLog(
            isTraceroute ? `P${probeIndex}` : 'ICMP',
            'SRC',
            '--',
            `Time Exceeded received from ${to.toUpperCase()}`,
            'error'
          );
          return true;
        }

        this._diagram.highlightNode(to, 'hop', 850);
        this._appendLog(
          isTraceroute ? `P${probeIndex}` : `H${i + 1}`,
          to.toUpperCase(),
          `${ttlBefore}->${ttl}`,
          'Forwarded',
          'success'
        );

        const stillAlive = await this._sleepSafe(180, token);
        if (!stillAlive) return false;
      } else if (to === 'dst') {
        this._diagram.highlightNode('dst', 'success', 1700);
        this._appendLog(
          isTraceroute ? `P${probeIndex}` : 'RX',
          'DST',
          `${ttl}`,
          'Packet delivered',
          'success'
        );
        this._setStatus(
          'Packet Delivered',
          `Destination received packet with TTL=${ttl}.`,
          'success'
        );

        if (isTraceroute) {
          const replyOk = await this._animateSafe(
            this._buildReturnPath('dst'),
            { type: 'icmp', label: 'Echo Reply', speed: 370 },
            token
          );
          if (!replyOk) return false;
          this._appendLog(`P${probeIndex}`, 'SRC', '--', 'Echo Reply received', 'success');
        } else {
          showToast('Packet delivered successfully', 'success', 2500);
          stateManager.mergeState('userProgress', {
            completedModules: [
              ...new Set([
                ...(stateManager.getState('userProgress')?.completedModules || []),
                '/ttl-simulation',
              ]),
            ],
          });
        }
        return true;
      }
    }

    return true;
  }

  _buildReturnPath(nodeId) {
    const idx = FORWARD_PATH.indexOf(nodeId);
    if (idx <= 0) return ['src'];
    return FORWARD_PATH.slice(0, idx + 1).reverse();
  }

  _setTTLDisplay(ttl, base = this._ttlBase) {
    const ttlEl = this.container?.querySelector('#ttlx-ttl-value');
    const barEl = this.container?.querySelector('#ttlx-ttl-bar');
    if (!ttlEl || !barEl) return;

    ttlEl.textContent = String(ttl);
    ttlEl.classList.remove('is-warning', 'is-error');
    if (ttl <= 0) ttlEl.classList.add('is-error');
    else if (ttl <= 2) ttlEl.classList.add('is-warning');

    const pct = Math.max(0, Math.min(100, (ttl / Math.max(1, base)) * 100));
    barEl.style.width = `${pct}%`;
    barEl.classList.remove('is-warning', 'is-error');
    if (ttl <= 0) barEl.classList.add('is-error');
    else if (ttl <= 2) barEl.classList.add('is-warning');
  }

  _setStatus(title, desc, tone = 'info') {
    const titleEl = this.container?.querySelector('#ttlx-status-title');
    const descEl = this.container?.querySelector('#ttlx-status-desc');
    if (titleEl) {
      titleEl.textContent = title;
      titleEl.className = `ttlx-status is-${tone}`;
    }
    if (descEl) descEl.textContent = desc;
  }

  _clearLog() {
    const body = this.container?.querySelector('#ttlx-log-body');
    if (!body) return;
    body.innerHTML = '<div class="ttlx-log__empty">Awaiting simulation...</div>';
  }

  _appendLog(hop, device, ttl, result, tone = 'info') {
    const body = this.container?.querySelector('#ttlx-log-body');
    if (!body) return;
    const empty = body.querySelector('.ttlx-log__empty');
    if (empty) empty.remove();

    const row = document.createElement('div');
    row.className = `ttlx-log__row is-${tone}`;
    row.innerHTML = `
      <span>${hop}</span>
      <span>${device}</span>
      <span>${ttl}</span>
      <span>${result}</span>
    `;
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
  }

  _injectStyles() {
    if (document.getElementById('ttlx-styles')) return;

    const style = document.createElement('style');
    style.id = 'ttlx-styles';
    style.textContent = resolveInjectedCssTokens(`
      .ttlx-wrap {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .ttlx-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 390px;
        gap: 1rem;
        align-items: start;
      }
      .ttlx-main, .ttlx-side {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
      }
      .ttlx-card {
        background: #0f172a;
        border: 1px solid #1f2a44;
        border-radius: 12px;
        padding: 0.75rem;
      }
      .ttlx-card__head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #93c5fd;
        font: 700 0.72rem var(--font-mono);
        text-transform: uppercase;
        letter-spacing: 0.07em;
        margin-bottom: 0.6rem;
      }
      .ttlx-subhead {
        color: #7dd3fc;
        font-size: 0.66rem;
        text-transform: none;
        letter-spacing: 0;
      }
      .ttlx-scenarios {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }
      .ttlx-scenario {
        border: 1px solid #334155;
        background: #111827;
        color: #a5b4fc;
        border-radius: 8px;
        padding: 0.4rem 0.65rem;
        font: 600 0.72rem var(--font-mono);
        cursor: pointer;
      }
      .ttlx-scenario.is-active {
        border-color: #22d3ee;
        color: #22d3ee;
        background: rgba(34, 211, 238, 0.12);
      }
      .ttlx-topology {
        padding-bottom: 0.5rem;
      }
      .ttlx-canvas {
        min-height: 520px;
        background: linear-gradient(180deg, #050c17 0%, #071021 100%);
        border-radius: 10px;
        border: 1px solid #1e293b;
      }
      .ttlx-controls {
        display: flex;
        gap: 0.6rem;
      }
      .ttlx-gauge-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.45rem;
      }
      .ttlx-label {
        color: #94a3b8;
        font: 600 0.72rem var(--font-mono);
        text-transform: uppercase;
        letter-spacing: 0.07em;
      }
      .ttlx-ttl {
        color: #22d3ee;
        font: 800 1rem var(--font-mono);
      }
      .ttlx-ttl.is-warning {
        color: #fbbf24;
      }
      .ttlx-ttl.is-error {
        color: #ef4444;
      }
      .ttlx-gauge {
        height: 10px;
        background: #0b1223;
        border: 1px solid #243447;
        border-radius: 999px;
        overflow: hidden;
      }
      .ttlx-gauge__bar {
        height: 100%;
        width: 100%;
        background: linear-gradient(90deg, #22d3ee, #06b6d4);
        transition: width 280ms ease, background 280ms ease;
      }
      .ttlx-gauge__bar.is-warning {
        background: #f59e0b;
      }
      .ttlx-gauge__bar.is-error {
        background: #ef4444;
      }
      .ttlx-status {
        font: 700 0.95rem var(--font-display);
        color: #cbd5e1;
        margin-bottom: 0.45rem;
      }
      .ttlx-status.is-success {
        color: #22c55e;
      }
      .ttlx-status.is-error {
        color: #ef4444;
      }
      .ttlx-status.is-info {
        color: #60a5fa;
      }
      .ttlx-status__desc {
        color: #94a3b8;
        margin: 0;
        line-height: 1.65;
        font-size: 0.84rem;
      }
      .ttlx-log {
        border: 1px solid #1e293b;
        border-radius: 10px;
        overflow: hidden;
      }
      .ttlx-log__head, .ttlx-log__row {
        display: grid;
        grid-template-columns: 56px 78px 98px 1fr;
        gap: 0.45rem;
        align-items: center;
        padding: 0.45rem 0.55rem;
        font-family: var(--font-mono);
        font-size: 0.68rem;
      }
      .ttlx-log__head {
        background: #0b1223;
        color: #7dd3fc;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        border-bottom: 1px solid #1f2a44;
      }
      .ttlx-log__body {
        max-height: 380px;
        overflow: auto;
        background: #070d18;
      }
      .ttlx-log__row {
        border-bottom: 1px solid #172135;
        color: #cbd5e1;
      }
      .ttlx-log__row.is-error {
        background: rgba(239, 68, 68, 0.08);
      }
      .ttlx-log__row.is-success {
        background: rgba(34, 197, 94, 0.06);
      }
      .ttlx-log__empty {
        color: #64748b;
        text-align: center;
        padding: 0.9rem 0.4rem;
        font-size: 0.75rem;
      }
      .ttlx-notes p {
        margin: 0 0 0.55rem 0;
        color: #94a3b8;
        font-size: 0.78rem;
        line-height: 1.55;
      }
      .ttlx-notes strong {
        color: #f8fafc;
      }
      @media (max-width: 1300px) {
        .ttlx-grid {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `);

    document.head.appendChild(style);
  }
}

export default new TtlRouterSimulation();
