/**
 * routingTableSimulator.js — Routing Table & Longest Prefix Match Simulator
 * COMPLETE REWORK
 *
 * Layout: Left column (topology + table + lookup + result) | Right column (Cisco CLI panels)
 * Routing table: C, EIGRP, OSPF, S* routes with color-coded rows
 * Interaction: Animated per-row LPM evaluation, packet animation, step-by-step explanation
 *
 * Module contract: init(el), start(), reset(), destroy()
 * Depends on: networkDiagram, ipUtils, stateManager, helperFunctions
 */

import { createNetworkDiagram } from '../components/networkDiagram.js';
import { isValidIP, isSameSubnet } from '../utils/ipUtils.js';
import { stateManager }          from '../js/stateManager.js';
import { sleep, showToast, escapeHtml } from '../utils/helperFunctions.js';

// ─── Topology ─────────────────────────────────────────────────────────────────

const TOPOLOGY = {
  nodes: [
    { id: 'pca', type: 'pc',     label: 'PC-A',     x: 75,  y: 110, ip: '10.0.1.10' },
    { id: 'sw1', type: 'switch', label: 'SW-A',     x: 205, y: 110 },
    { id: 'pcb', type: 'pc',     label: 'PC-B',     x: 75,  y: 260, ip: '10.0.2.10' },
    { id: 'sw2', type: 'switch', label: 'SW-B',     x: 205, y: 260 },
    { id: 'r1',  type: 'router', label: 'R1',       x: 400, y: 185 },
    { id: 'r2',  type: 'router', label: 'R2',       x: 615, y: 110, ip: '172.16.0.1' },
    { id: 'isp', type: 'cloud',  label: 'Internet', x: 615, y: 260, ip: '203.0.113.1' },
  ],
  links: [
    { from: 'pca', to: 'sw1', label: 'Fa0/1', subnet: '10.0.1.0/24' },
    { from: 'sw1', to: 'r1',  label: 'Gi0/0', subnet: '10.0.1.0/24' },
    { from: 'pcb', to: 'sw2', label: 'Fa0/2', subnet: '10.0.2.0/24' },
    { from: 'sw2', to: 'r1',  label: 'Gi0/1', subnet: '10.0.2.0/24' },
    { from: 'r1',  to: 'r2',  label: 'Gi0/2', subnet: '172.16.0.0/16' },
    { from: 'r1',  to: 'isp', label: 'Gi0/3', subnet: '203.0.113.0/24' },
  ],
};

// ─── Routing Table ─────────────────────────────────────────────────────────────

const ROUTING_TABLE = [
  {
    network: '10.0.1.0', prefix: 24, nextHop: 'Directly Connected',
    iface: 'Gi0/0', ad: 0, metric: 0, source: 'C', nodeId: 'sw1', type: 'connected',
    desc: 'LAN-A — directly connected via Gi0/0',
  },
  {
    network: '10.0.2.0', prefix: 24, nextHop: 'Directly Connected',
    iface: 'Gi0/1', ad: 0, metric: 0, source: 'C', nodeId: 'sw2', type: 'connected',
    desc: 'LAN-B — directly connected via Gi0/1',
  },
  {
    network: '10.0.0.0', prefix: 8, nextHop: '172.16.0.1',
    iface: 'Gi0/2', ad: 90, metric: 156, source: 'EIGRP', nodeId: 'r2', type: 'dynamic',
    desc: 'Learned via EIGRP from R2 — aggregates entire 10/8 space',
  },
  {
    network: '172.16.0.0', prefix: 16, nextHop: '172.16.0.1',
    iface: 'Gi0/2', ad: 90, metric: 100, source: 'EIGRP', nodeId: 'r2', type: 'dynamic',
    desc: 'Learned via EIGRP from R2 — 172.16/16 enterprise block',
  },
  {
    network: '192.168.1.0', prefix: 24, nextHop: '172.16.0.1',
    iface: 'Gi0/2', ad: 110, metric: 20, source: 'OSPF', nodeId: 'r2', type: 'dynamic',
    desc: 'Learned via OSPF from R2 — remote corporate LAN',
  },
  {
    network: '0.0.0.0', prefix: 0, nextHop: '203.0.113.1',
    iface: 'Gi0/3', ad: 1, metric: 0, source: 'S*', nodeId: 'isp', type: 'default',
    desc: 'Default route via ISP — gateway of last resort',
  },
];

// Source code → display color (matching Cisco IOS conventions)
const SRC_COLOR = {
  'C':     '#00e676',
  'EIGRP': '#facc15',
  'OSPF':  '#facc15',
  'S*':    '#fb923c',
  'RIP':   '#facc15',
};

const TYPE_CLASS = {
  connected: 'rt-route-connected',
  static:    'rt-route-static',
  dynamic:   'rt-route-dynamic',
  default:   'rt-route-default',
};

// Quick-test destinations with explanation labels
const QUICK_TESTS = [
  { ip: '10.0.1.55',   label: '10.0.1.55'   },
  { ip: '10.0.2.100',  label: '10.0.2.100'  },
  { ip: '10.5.5.5',    label: '10.5.5.5'    },
  { ip: '172.16.5.1',  label: '172.16.5.1'  },
  { ip: '192.168.1.50',label: '192.168.1.50' },
  { ip: '8.8.8.8',     label: '8.8.8.8'     },
];

// ─── Module Class ──────────────────────────────────────────────────────────────

class RoutingTableSimulator {
  constructor() {
    this.container   = null;
    this._diagram    = null;
    this._running    = false;
    this._destroyed  = false;
  }

  // ── LIFECYCLE ──────────────────────────────────────────────────────────────

  init(containerEl) {
    this.container  = containerEl;
    this._diagram   = createNetworkDiagram();
    this._destroyed = false;
    this._injectStyles();
    this._render();
  }

  start() {}
  step()  {}

  reset() {
    this._running = false;
    if (this._diagram) this._diagram.reset();
    if (this.container) this._render();
  }

  destroy() {
    this._running   = false;
    this._destroyed = true;
    if (this._diagram) { this._diagram.destroy(); this._diagram = null; }
    this.container = null;
  }

  // ── RENDER ────────────────────────────────────────────────────────────────

  _render() {
    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <span>Simulations</span>
        </div>
        <h1 class="module-header__title">Routing Table Simulator</h1>
        <p class="module-header__description">
          A router compares the destination IP of every incoming packet against its routing table using
          <strong>Longest Prefix Match</strong> — the most specific matching route always wins.
          Enter a destination IP and send a packet to watch the lookup happen step by step.
        </p>
      </div>

      <div class="rt-layout">

        <!-- ── LEFT COLUMN ──────────────────────── -->
        <div class="rt-left">

          <!-- Topology Canvas -->
          <div class="rt-canvas-wrap" id="rt-canvas"></div>

          <!-- Interface Map -->
          <div class="rt-iface-card">
            <div class="rt-iface-card__header">
              <span>🧭</span>
              <span>R1 Interface Map</span>
            </div>
            <div class="rt-iface-list">
              <div class="rt-iface-row"><span>Gi0/0</span><span>10.0.1.1</span></div>
              <div class="rt-iface-row"><span>Gi0/1</span><span>10.0.2.1</span></div>
              <div class="rt-iface-row"><span>Gi0/2</span><span>172.16.0.2</span></div>
              <div class="rt-iface-row"><span>Gi0/3</span><span>203.0.113.1</span></div>
            </div>
          </div>

          <!-- Learning Panel -->
          <div class="rt-learn-card">
            <div class="rt-learn-card__header">
              <span>🧠</span>
              <span>Router Decision Process</span>
            </div>
            <div class="rt-learn-steps" id="rt-learn-steps">
              ${[
                'Packet arrives at router',
                'Router reads destination IP',
                'Routing table entries scanned',
                'Longest Prefix Match applied',
                'Forward out selected interface',
              ].map((t, i) => `
                <div class="rt-learn-step" data-step="${i}">
                  <span class="rt-learn-step__idx">${i + 1}</span>
                  <span class="rt-learn-step__text">${t}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Routing Table Card -->
          <div class="rt-table-card">
            <div class="rt-table-card__header">
              <span class="rt-table-card__icon">📋</span>
              <span>R1 ROUTING TABLE</span>
            </div>
            <div class="rt-table-wrap">
              <table class="rt-table">
                <thead>
                  <tr>
                    <th>Src</th>
                    <th>Network</th>
                    <th>Next Hop</th>
                    <th>Interface</th>
                    <th>AD/Metric</th>
                  </tr>
                </thead>
                <tbody id="rt-tbody">
                  ${ROUTING_TABLE.map((r, i) => this._rowHTML(r, i)).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Lookup Tool -->
          <div class="rt-lookup-card">
            <div class="rt-lookup-card__label">PACKET SENDER</div>
            <div class="rt-lookup-row">
              <label class="sr-only" for="rt-dest-input">Destination IP address</label>
              <input
                type="text"
                id="rt-dest-input"
                class="rt-dest-input"
                value="10.0.1.55"
                placeholder="Enter destination IP"
                autocomplete="off"
              />
              <button class="btn btn-primary rt-lookup-btn" id="rt-lookup-btn">
                🚀 SEND PACKET
              </button>
              <button class="btn btn-ghost rt-reset-btn" id="rt-reset-btn">↺ RESET SIM</button>
            </div>
            <div class="rt-quick-btns">
              ${QUICK_TESTS.map(t => `
                <button class="rt-quick-btn" data-ip="${t.ip}">${t.label}</button>
              `).join('')}
            </div>
          </div>

          <!-- LPM Result Panel -->
          <div class="rt-result-card">
            <div class="rt-result-card__header">
              <span>🔍</span>
              <span id="rt-result-title">LONGEST PREFIX MATCH</span>
            </div>
            <div class="rt-result-body" id="rt-result-log">
              Enter a destination IP and press <strong>Send Packet</strong> to see which route wins
              and why. The most specific (longest) matching prefix always takes priority.
            </div>
          </div>

        </div><!-- /rt-left -->

        <!-- ── RIGHT COLUMN ─────────────────────── -->
        <div class="rt-right">

          <!-- show ip interface brief -->
          <div class="rt-cli-panel">
            <div class="rt-cli-header">
              <span class="rt-cli-prompt">R1#</span>
              <span class="rt-cli-cmd">SHOW IP INTERFACE BRIEF</span>
            </div>
            <div class="rt-cli-body">
              <div class="rt-cli-line rt-cli-comment">Interface&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;IP-Address&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;OK?</div>
              <div class="rt-cli-line rt-cli-comment">Method&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Status&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Protocol</div>
              ${[
                { iface: 'Gi0/0', ip: '10.0.1.1' },
                { iface: 'Gi0/1', ip: '10.0.2.1' },
                { iface: 'Gi0/2', ip: '172.16.0.2' },
                { iface: 'Gi0/3', ip: '203.0.113.1' },
              ].map(({ iface, ip }) => `
                <div class="rt-cli-line rt-cli-iface">${iface.padEnd(13)}${ip.padEnd(15)}YES</div>
                <div class="rt-cli-line rt-cli-status">manual&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;up&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;up</div>
              `).join('')}
            </div>
          </div>

          <!-- show ip route -->
          <div class="rt-cli-panel">
            <div class="rt-cli-header">
              <span class="rt-cli-prompt">R1#</span>
              <span class="rt-cli-cmd">SHOW IP ROUTE</span>
            </div>
            <div class="rt-cli-body">
              <div class="rt-cli-line rt-cli-comment">Codes: C - Connected, S - Static,</div>
              <div class="rt-cli-line rt-cli-comment">E - EIGRP, O - OSPF</div>
              <div style="height:6px;"></div>
               <div class="rt-cli-line rt-cli-route" data-route-index="0" style="color:#00e676;">C 10.0.1.0/24 is directly</div>
               <div class="rt-cli-line rt-cli-indent rt-cli-route" data-route-index="0" style="color:#00e676;">&nbsp;&nbsp;connected, Gi0/0</div>
               <div class="rt-cli-line rt-cli-route" data-route-index="1" style="color:#00e676;">C 10.0.2.0/24 is directly</div>
               <div class="rt-cli-line rt-cli-indent rt-cli-route" data-route-index="1" style="color:#00e676;">&nbsp;&nbsp;connected, Gi0/1</div>
               <div class="rt-cli-line rt-cli-route" data-route-index="2" style="color:#facc15;">D 10.0.0.0/8 [90/156] via</div>
               <div class="rt-cli-line rt-cli-route" data-route-index="2" style="color:#facc15;">&nbsp;&nbsp;172.16.0.1, Gi0/2</div>
               <div class="rt-cli-line rt-cli-route" data-route-index="3" style="color:#facc15;">D 172.16.0.0/16 [90/100] via</div>
               <div class="rt-cli-line rt-cli-route" data-route-index="3" style="color:#facc15;">&nbsp;&nbsp;172.16.0.1, Gi0/2</div>
               <div class="rt-cli-line rt-cli-route" data-route-index="4" style="color:#facc15;">O 192.168.1.0/24 [110/20] via</div>
               <div class="rt-cli-line rt-cli-route" data-route-index="4" style="color:#facc15;">&nbsp;&nbsp;172.16.0.1, Gi0/2</div>
               <div class="rt-cli-line rt-cli-route" data-route-index="5" style="color:#fb923c;">S* 0.0.0.0/0 [1/0] via</div>
               <div class="rt-cli-line rt-cli-route" data-route-index="5" style="color:#fb923c;">&nbsp;&nbsp;203.0.113.1, Gi0/3</div>
             </div>
           </div>

        </div><!-- /rt-right -->

      </div><!-- /rt-layout -->
    `;

    // Mount topology
    this._diagram.init(
      this.container.querySelector('#rt-canvas'),
      TOPOLOGY,
      { width: 730, height: 320 }
    );

    this._bindControls();
  }

  // ── ROW HTML ──────────────────────────────────────────────────────────────

  _rowHTML(route, index, state = 'idle') {
    const color = SRC_COLOR[route.source] || 'var(--color-text-muted)';
    const nextHopDisplay = route.nextHop.length > 22
      ? route.nextHop.slice(0, 20) + '…'
      : route.nextHop;

    const stateStyle = state === 'scanning'
      ? 'background:rgba(255,184,0,0.10); outline:1px solid rgba(255,184,0,0.4);'
      : state === 'match'
        ? 'background:rgba(0,230,118,0.08); outline:1px solid rgba(0,230,118,0.4);'
        : state === 'winner'
          ? 'background:rgba(0,212,255,0.14); outline:2px solid var(--color-cyan);'
          : '';

    const typeClass = TYPE_CLASS[route.type] || '';
    return `
      <tr id="rt-row-${index}" class="rt-row ${typeClass}" style="${stateStyle} transition:all 0.3s ease;">
        <td>
          <span class="rt-src-badge" style="color:${color}; border-color:${color}44; background:${color}12;">
            ${escapeHtml(route.source)}
          </span>
        </td>
        <td>
          <span class="rt-network">${escapeHtml(route.network)}</span>
          <span class="rt-prefix">/${route.prefix}</span>
        </td>
        <td>
          <span class="rt-nexthop" title="${escapeHtml(route.nextHop)}">${escapeHtml(nextHopDisplay)}</span>
        </td>
        <td>
          <span class="rt-iface-chip">${escapeHtml(route.iface)}</span>
        </td>
        <td>
          <span class="rt-admetric">${route.ad}/${route.metric}</span>
        </td>
      </tr>
    `;
  }

  // ── CONTROLS ──────────────────────────────────────────────────────────────

  _bindControls() {
    const doLookup = () => {
      if (this._running) return;
      const ip = this.container.querySelector('#rt-dest-input')?.value?.trim();
      if (ip) this._runLookup(ip);
    };

    this.container.querySelector('#rt-lookup-btn')
      ?.addEventListener('click', doLookup);

    this.container.querySelector('#rt-dest-input')
      ?.addEventListener('keydown', e => { if (e.key === 'Enter') doLookup(); });

    this.container.querySelector('#rt-reset-btn')
      ?.addEventListener('click', () => {
        this._running = false;
        this._resetTable();
        this._diagram.reset();
        this._setResult('🔍 LONGEST PREFIX MATCH',
          'Enter a destination IP and press <strong>Send Packet</strong> to see which route wins and why. The most specific (longest) matching prefix always takes priority.');
      });

    this.container.querySelectorAll('.rt-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this._running) return;
        const ip = btn.getAttribute('data-ip');
        const input = this.container.querySelector('#rt-dest-input');
        if (input) input.value = ip;
        this._runLookup(ip);
      });
    });
  }

  // ── LPM LOOKUP ────────────────────────────────────────────────────────────

  async _runLookup(destIP) {
    if (!isValidIP(destIP)) {
      this._setResult('⚠ Invalid Input',
        `<span style="color:var(--color-error);">"${escapeHtml(destIP)}" is not a valid IPv4 address.</span>`);
      return;
    }

    this._running = true;
    const abort = () => this._destroyed || !this._running || !this.container;

    this._resetTable();
    this._diagram.reset();
    this._setResult(`🔍 Evaluating: ${destIP}`, 'Scanning routing table entries...');

    let bestRoute    = null;
    let bestPrefix   = -1;
    let bestIndex    = -1;
    const matchedIdxs = [];

    // Scan each row with animated delay
    for (let i = 0; i < ROUTING_TABLE.length; i++) {
      if (abort()) { this._running = false; return; }

      const route = ROUTING_TABLE[i];
      this._setRowState(i, 'scanning');
      await sleep(180);
      if (abort()) { this._running = false; return; }

      const matched = isSameSubnet(destIP, route.network, route.prefix);

      if (matched) {
        matchedIdxs.push(i);
        this._setRowState(i, 'match');
        if (route.prefix > bestPrefix) {
          bestPrefix = route.prefix;
          bestRoute  = route;
          bestIndex  = i;
        }
      } else {
        this._setRowState(i, 'idle');
      }
    }

    if (abort()) { this._running = false; return; }

    if (bestRoute) {
      // Dim non-winners, highlight winner
      for (let i = 0; i < ROUTING_TABLE.length; i++) {
        if (i === bestIndex) {
          this._setRowState(i, 'winner');
        } else if (matchedIdxs.includes(i)) {
          this._setRowState(i, 'idle');
        }
      }

      this._showResult(destIP, bestRoute, bestIndex, matchedIdxs);

      // Animate topology
      await sleep(200);
      if (abort()) { this._running = false; return; }

      this._diagram.highlightNode('r1', 'active', 1000);
      await sleep(500);
      if (abort()) { this._running = false; return; }

      await this._diagram.animatePacket(['r1', bestRoute.nodeId], {
        type: 'data', label: destIP, speed: 600,
      });

      if (abort()) { this._running = false; return; }
      this._diagram.highlightNode(bestRoute.nodeId, 'success', 2000);

      stateManager.mergeState('userProgress', {
        completedModules: [
          ...new Set([
            ...(stateManager.getState('userProgress').completedModules || []),
            '/routing-table',
          ]),
        ],
      });
    } else {
      this._resetTable();
      this._diagram.highlightNode('r1', 'error', 2000);
      this._setResult('✕ No Route Found',
        `<span style="color:var(--color-error);">Destination <strong>${escapeHtml(destIP)}</strong> does not match any entry — packet would be dropped (unreachable).</span>`);
    }

    this._running = false;
  }

  // ── RESULT RENDERING ─────────────────────────────────────────────────────

  _showResult(destIP, route, winnerIdx, matchedIdxs) {
    const color  = SRC_COLOR[route.source] || 'var(--color-text-muted)';
    const others = matchedIdxs.filter(i => i !== winnerIdx);

    const competingHTML = others.length > 0
      ? `<div class="rt-result-competing">
          Also matched (shorter prefix): ${others.map(i =>
            `<span class="rt-result-badge" style="color:${SRC_COLOR[ROUTING_TABLE[i].source] || '#aaa'};">${ROUTING_TABLE[i].network}/${ROUTING_TABLE[i].prefix}</span>`
          ).join(' ')}
        </div>`
      : '';

    this._setResult(
      `✓ Route Selected: ${route.network}/${route.prefix}`,
      `
        <div class="rt-result-winner">
          <span class="rt-src-badge" style="color:${color}; border-color:${color}44; background:${color}12; font-size:var(--text-sm); padding:0.25rem 0.75rem;">
            ${escapeHtml(route.source)}
          </span>
          <span class="rt-result-cidr">${escapeHtml(route.network)}/${route.prefix}</span>
          wins — <strong>longest prefix match</strong> (/${route.prefix} bits match).
        </div>
        <div class="rt-result-details">
          <div><span class="rt-result-key">Next Hop:</span> <span class="rt-result-val" style="color:var(--color-cyan);">${escapeHtml(route.nextHop)}</span></div>
          <div><span class="rt-result-key">Interface:</span> <span class="rt-result-val" style="color:var(--color-amber);">${escapeHtml(route.iface)}</span></div>
          <div><span class="rt-result-key">Source:</span> <span class="rt-result-val">${escapeHtml(route.source)} (AD=${route.ad}, metric=${route.metric})</span></div>
        </div>
        <div class="rt-result-desc">${escapeHtml(route.desc)}</div>
        ${competingHTML}
      `
    );
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────

  _setRowState(index, state) {
    const row = this.container?.querySelector(`#rt-row-${index}`);
    if (!row) return;

    row.style.background = '';
    row.style.outline    = '';

    if (state === 'scanning') {
      row.style.background = 'rgba(255,184,0,0.10)';
      row.style.outline    = '1px solid rgba(255,184,0,0.4)';
    } else if (state === 'match') {
      row.style.background = 'rgba(0,230,118,0.07)';
      row.style.outline    = '1px solid rgba(0,230,118,0.35)';
    } else if (state === 'winner') {
      row.style.background = 'rgba(0,212,255,0.13)';
      row.style.outline    = '2px solid var(--color-cyan)';
    }
  }

  _resetTable() {
    ROUTING_TABLE.forEach((_, i) => this._setRowState(i, 'idle'));
  }

  _setResult(title, bodyHTML) {
    const t = this.container?.querySelector('#rt-result-title');
    const b = this.container?.querySelector('#rt-result-log');
    if (t) t.textContent = title;
    if (b) b.innerHTML   = bodyHTML;
  }

  // ── STYLES ────────────────────────────────────────────────────────────────

  _injectStyles() {
    if (document.getElementById('rt-sim-styles')) return;
    const s = document.createElement('style');
    s.id = 'rt-sim-styles';
    s.textContent = `

      /* ── Layout ── */
      .rt-layout {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 1.25rem;
        align-items: flex-start;
      }
      .rt-left  { display: flex; flex-direction: column; gap: 1rem; }
      .rt-right { display: flex; flex-direction: column; gap: 1rem; position: sticky; top: 1rem; }

      /* ── Canvas ── */
      .rt-canvas-wrap {
        background: var(--color-bg-dark);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        overflow: hidden;
        min-height: 300px;
      }
      .rt-canvas-wrap svg { display: block; }

      /* ── Routing Table Card ── */
      .rt-table-card {
        background: var(--color-bg-panel);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        overflow: hidden;
      }
      .rt-table-card__header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        background: var(--color-bg-raised);
        border-bottom: 1px solid var(--color-border);
        font-family: var(--font-display);
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--color-text-secondary);
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .rt-table-card__icon { font-size: 1rem; }
      .rt-table-wrap { overflow-x: auto; }

      /* ── Table ── */
      .rt-table {
        width: 100%;
        border-collapse: collapse;
        font-family: var(--font-mono);
        font-size: var(--text-xs);
      }
      .rt-table thead tr {
        border-bottom: 1px solid var(--color-border);
      }
      .rt-table th {
        padding: 0.55rem 1rem;
        text-align: left;
        color: var(--color-text-muted);
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        background: var(--color-bg-medium);
      }
      .rt-row {
        border-bottom: 1px solid var(--color-border);
      }
      .rt-row:last-child { border-bottom: none; }
      .rt-row td { padding: 0.6rem 1rem; vertical-align: middle; }

      .rt-src-badge {
        display: inline-block;
        padding: 0.15rem 0.55rem;
        border-radius: 4px;
        border: 1px solid;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        font-family: var(--font-mono);
        white-space: nowrap;
      }
      .rt-network {
        color: var(--color-text-primary);
        font-weight: 600;
        font-size: var(--text-sm);
      }
      .rt-prefix {
        margin-left: 0.25rem;
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        font-family: var(--font-mono);
      }
      .rt-nexthop {
        display: block;
        color: var(--color-text-secondary);
        font-size: var(--text-xs);
      }
      .rt-iface-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        padding: 0.18rem 0.5rem;
        border-radius: 999px;
        background: rgba(255,184,0,0.12);
        border: 1px solid rgba(255,184,0,0.35);
        color: var(--color-amber);
        font-size: 0.68rem;
        font-weight: 700;
        font-family: var(--font-mono);
      }
      .rt-admetric {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
      }

      .rt-route-connected .rt-network { color: #9fffd4; }
      .rt-route-static .rt-network { color: #7dd3fc; }
      .rt-route-dynamic .rt-network { color: #ffe59f; }
      .rt-route-default .rt-network { color: #ffc08a; }

      /* ── Lookup Card ── */
      .rt-lookup-card {
        background: var(--color-bg-panel);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: 1rem 1.25rem;
      }
      .rt-lookup-card__label {
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 0.65rem;
      }
      .rt-lookup-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 0.75rem;
      }
      .rt-dest-input {
        flex: 1;
        min-width: 160px;
        padding: 0.5rem 0.75rem;
        background: var(--color-bg-raised);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        color: var(--color-text-primary);
        font-family: var(--font-mono);
        font-size: var(--text-base);
        outline: none;
        transition: border-color var(--transition-fast);
      }
      .rt-dest-input:focus { border-color: var(--color-cyan); }
      .rt-lookup-btn { font-size: var(--text-xs) !important; padding: 0.45rem 1rem !important; }
      .rt-reset-btn  { font-size: var(--text-xs) !important; padding: 0.45rem 0.75rem !important; }

      .rt-quick-btns {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      .rt-quick-btn {
        padding: 0.2rem 0.6rem;
        background: var(--color-bg-raised);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        color: var(--color-text-secondary);
        font-family: var(--font-mono);
        font-size: 0.7rem;
        cursor: pointer;
        transition: all var(--transition-fast);
      }
      .rt-quick-btn:hover {
        border-color: var(--color-cyan);
        color: var(--color-cyan);
        background: var(--color-cyan-glow);
      }

      /* ── Interface Card ── */
      .rt-iface-card {
        background: var(--color-bg-panel);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        overflow: hidden;
      }
      .rt-iface-card__header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 1.25rem;
        background: var(--color-bg-raised);
        border-bottom: 1px solid var(--color-border);
        font-family: var(--font-display);
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--color-text-secondary);
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .rt-iface-list {
        display: grid;
        gap: 0.35rem;
        padding: 0.8rem 1.25rem 1rem;
        font-family: var(--font-mono);
        font-size: var(--text-xs);
      }
      .rt-iface-row {
        display: flex;
        justify-content: space-between;
        padding: 0.35rem 0.6rem;
        border-radius: var(--radius-sm);
        background: var(--color-bg-medium);
        color: var(--color-text-secondary);
      }
      .rt-iface-row span:first-child {
        color: var(--color-cyan);
        font-weight: 700;
      }

      /* ── Result Card ── */
      .rt-result-card {
        background: var(--color-bg-panel);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        overflow: hidden;
      }
      .rt-result-card__header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 1.25rem;
        background: var(--color-bg-raised);
        border-bottom: 1px solid var(--color-border);
        font-family: var(--font-display);
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--color-text-secondary);
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .rt-result-body {
        padding: 1rem 1.25rem;
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        line-height: 1.75;
      }
      .rt-result-winner {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        flex-wrap: wrap;
        margin-bottom: 0.75rem;
        font-size: var(--text-sm);
        color: var(--color-text-primary);
      }
      .rt-result-cidr {
        font-family: var(--font-mono);
        font-weight: 700;
        color: var(--color-cyan);
        font-size: var(--text-sm);
      }
      .rt-result-details {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        padding: 0.65rem 0.85rem;
        background: var(--color-bg-medium);
        border-radius: var(--radius-sm);
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        margin-bottom: 0.6rem;
      }
      .rt-result-key { color: var(--color-text-muted); margin-right: 0.4rem; }
      .rt-result-val { font-weight: 600; }
      .rt-result-desc {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        line-height: 1.6;
        margin-bottom: 0.4rem;
      }
      .rt-result-badge {
        display: inline-block;
        margin: 0 0.15rem;
        font-family: var(--font-mono);
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.1rem 0.4rem;
        background: rgba(255,255,255,0.05);
        border-radius: 3px;
      }
      .rt-result-competing {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        padding-top: 0.35rem;
        border-top: 1px solid var(--color-border);
      }

      /* ── Learning Panel ── */
      .rt-learn-card {
        background: var(--color-bg-panel);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        overflow: hidden;
      }
      .rt-learn-card__header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 1.25rem;
        background: var(--color-bg-raised);
        border-bottom: 1px solid var(--color-border);
        font-family: var(--font-display);
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--color-text-secondary);
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .rt-learn-steps {
        padding: 0.85rem 1.25rem 1rem;
        display: grid;
        gap: 0.55rem;
      }
      .rt-learn-step {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.4rem 0.6rem;
        border-radius: var(--radius-sm);
        border: 1px solid transparent;
        background: rgba(255,255,255,0.02);
        color: var(--color-text-secondary);
        transition: all var(--transition-base);
      }
      .rt-learn-step__idx {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-family: var(--font-mono);
        background: var(--color-bg-medium);
        border: 1px solid var(--color-border);
        color: var(--color-text-muted);
      }
      .rt-learn-step.is-active {
        border-color: rgba(0,212,255,0.4);
        background: rgba(0,212,255,0.08);
        color: var(--color-text-primary);
      }
      .rt-learn-step.is-active .rt-learn-step__idx {
        background: var(--color-cyan);
        color: var(--color-text-inverse);
        border-color: transparent;
      }

      /* ── CLI Panels ── */
      .rt-cli-panel {
        background: #0b111c;
        border: 1px solid rgba(0,212,255,0.2);
        border-radius: var(--radius-lg);
        overflow: hidden;
        font-family: var(--font-mono);
      }
      .rt-cli-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.55rem 1rem;
        background: rgba(0,212,255,0.07);
        border-bottom: 1px solid rgba(0,212,255,0.15);
      }
      .rt-cli-prompt {
        color: #00e676;
        font-size: var(--text-xs);
        font-weight: 700;
      }
      .rt-cli-cmd {
        color: var(--color-amber);
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.05em;
      }
      .rt-cli-body {
        padding: 0.75rem 1rem;
      }
      .rt-cli-line {
        font-size: 0.7rem;
        line-height: 1.75;
        white-space: pre;
        color: var(--color-text-secondary);
      }
      .rt-cli-route.is-active {
        background: rgba(0, 212, 255, 0.12);
        color: #e8f4fd;
        border-radius: 4px;
        padding-left: 0.25rem;
      }
      .rt-cli-comment { color: #4a6d8a; }
      .rt-cli-iface   { color: var(--color-cyan); }
      .rt-cli-status  { color: var(--color-text-muted); }
      .rt-cli-indent  { padding-left: 0.5rem; }

      /* ── Responsive ── */
      @media (max-width: 960px) {
        .rt-layout {
          grid-template-columns: 1fr;
        }
        .rt-right {
          position: static;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 640px) {
        .rt-right { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(s);
  }
}

export default new RoutingTableSimulator();
