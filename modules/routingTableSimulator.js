/**
 * routingTableSimulator.js — Routing Table & Longest Prefix Match Simulator
 *
 * Teaches: How a router selects the best route using Longest Prefix Match.
 *
 * Simulation: Enter a destination IP, watch the routing table evaluated
 *             top-to-bottom, see which entry wins and why.
 */

import { createNetworkDiagram } from '../components/networkDiagram.js';
import { longestPrefixMatch } from '../utils/networkMath.js';
import { isValidIP, isSameSubnet } from '../utils/ipUtils.js';
import { stateManager } from '../js/stateManager.js';
import { sleep, showToast, escapeHtml } from '../utils/helperFunctions.js';

// ── Topology ─────────────────────────────────────────────────────────
const TOPOLOGY = {
  nodes: [
    { id: 'router', type: 'router', label: 'R1', x: 280, y: 180 },
    { id: 'sw1', type: 'switch', label: 'Switch', x: 150, y: 180 },
    { id: 'lan1', type: 'pc', label: '10.0.1.0/24', x: 60, y: 180 },
    { id: 'sw2', type: 'switch', label: 'Switch', x: 150, y: 260 },
    { id: 'lan2', type: 'pc', label: '10.0.2.0/24', x: 60, y: 260 },
    { id: 'r2', type: 'router', label: '172.16.0.0/16', x: 460, y: 180 },
    { id: 'isp', type: 'cloud', label: 'Internet', x: 460, y: 260 },
  ],
  links: [
    { from: 'lan1', to: 'sw1', label: 'Fa0/1' },
    { from: 'sw1', to: 'router', label: 'Gi0/0' },
    { from: 'lan2', to: 'sw2', label: 'Fa0/2' },
    { from: 'sw2', to: 'router', label: 'Gi0/1' },
    { from: 'router', to: 'r2', label: 'Gi0/2' },
    { from: 'router', to: 'isp', label: 'Gi0/3' },
  ],
};

// ── Routing Table ─────────────────────────────────────────────────────
const ROUTING_TABLE = [
  { network: '10.0.1.0', prefix: 24, nextHop: 'Directly Connected', iface: 'Gi0/0', ad: 0, metric: 0, source: 'C', nodeId: 'sw1', desc: 'Directly connected LAN-A subnet' },
  { network: '10.0.2.0', prefix: 24, nextHop: 'Directly Connected', iface: 'Gi0/1', ad: 0, metric: 0, source: 'C', nodeId: 'sw2', desc: 'Directly connected LAN-B subnet' },
  { network: '10.0.0.0', prefix: 8, nextHop: '172.16.0.1', iface: 'Gi0/2', ad: 90, metric: 156, source: 'EIGRP', nodeId: 'r2', desc: 'Learned via EIGRP from R2' },
  { network: '172.16.0.0', prefix: 16, nextHop: '172.16.0.1', iface: 'Gi0/2', ad: 90, metric: 100, source: 'EIGRP', nodeId: 'r2', desc: 'Learned via EIGRP from R2' },
  { network: '192.168.1.0', prefix: 24, nextHop: '172.16.0.1', iface: 'Gi0/2', ad: 110, metric: 20, source: 'OSPF', nodeId: 'r2', desc: 'Learned via OSPF from R2' },
  { network: '0.0.0.0', prefix: 0, nextHop: '203.0.113.1', iface: 'Gi0/3', ad: 1, metric: 0, source: 'S*', nodeId: 'isp', desc: 'Default route via ISP (gateway of last resort)' },
];

const AD_LABELS = { 'C':'Connected','S*':'Static','EIGRP':'EIGRP (90)','OSPF':'OSPF (110)','RIP':'RIP (120)' };

// Pre-built test destinations
const TEST_DESTINATIONS = [
  { ip: '10.0.1.55', label: 'Host on LAN-A', expected: '10.0.1.0/24' },
  { ip: '10.0.2.100', label: 'Host on LAN-B', expected: '10.0.2.0/24' },
  { ip: '10.5.5.5', label: '10.x.x.x — matches /8', expected: '10.0.0.0/8' },
  { ip: '172.16.5.1', label: 'R2 subnet', expected: '172.16.0.0/16' },
  { ip: '192.168.1.50', label: 'OSPF route', expected: '192.168.1.0/24' },
  { ip: '8.8.8.8', label: 'Google DNS — default route', expected: '0.0.0.0/0' },
];

class RoutingTableSimulator {
  constructor() {
    this.container = null;
    this._diagram = null;
    this._running = false;
    this._isDestroyed = false;
  }

  init(containerEl) {
    this.container = containerEl;
    this._diagram = createNetworkDiagram();
    this._isDestroyed = false;
    this._render();
  }

  _render() {
    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <span>Simulations</span>
        </div>
        <h1 class="module-header__title">Routing Table Simulator</h1>
        <p class="module-header__description">
          A router compares the destination IP of every incoming packet against
          its routing table using <strong>Longest Prefix Match</strong> — the most
          specific matching route always wins. Enter a destination IP and watch
          the lookup happen step by step.
        </p>
      </div>

      <div class="layout-main-sidebar" style="display:grid; grid-template-columns:1fr 300px; gap:16px;">
        <div>
          <div class="sim-canvas" id="rt-canvas" style="min-height:280px;"></div>

          <!-- Routing table display -->
          <div class="info-panel" style="margin-top:1rem; padding:0.75rem;">
            <div class="info-panel__title">📋 R1 Routing Table</div>
            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; font-size:var(--text-xs);">
                <thead>
                  <tr style="border-bottom:1px solid var(--color-border);">
                    ${['Src','Network/Prefix','Next Hop','AD/Metric'].map(h =>
                      `<th style="padding:4px 6px; text-align:left; color:var(--color-text-muted); font-family:var(--font-mono); white-space:nowrap;">${h}</th>`
                    ).join('')}
                  </tr>
                </thead>
                <tbody id="rt-table-body">
                  ${ROUTING_TABLE.map((r, i) => this._renderTableRow(r, i)).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Lookup tool -->
          <div class="card" style="margin-top:1rem; padding:1rem;">
            <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase;">Destination IP Lookup</div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
              <label class="sr-only" for="rt-dest-input">Destination IP</label>
              <input type="text" id="rt-dest-input" placeholder="Enter destination IP"
                value="10.0.1.55"
                style="flex:1; min-width:160px; padding:0.45rem 0.75rem;
                       background:var(--color-bg-raised); border:1px solid var(--color-border);
                       border-radius:var(--radius-sm); color:var(--color-text-primary);
                       font-family:var(--font-mono); font-size:var(--text-sm); outline:none;" />
              <button class="btn btn-primary" id="rt-lookup-btn">🔍 Lookup</button>
              <button class="btn btn-ghost" id="rt-reset-btn">↺ Reset</button>
            </div>
            <!-- Quick-test buttons -->
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-top:0.6rem;">
              ${TEST_DESTINATIONS.map(t => `
                <button class="btn btn-ghost rt-quick-btn"
                  data-ip="${t.ip}"
                  style="font-size:var(--text-xs); padding:0.2rem 0.6rem; opacity:0.8;">
                  ${t.ip}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- LPM evaluation steps -->
          <div class="info-panel" style="margin-top:0.75rem;">
            <div class="info-panel__title" id="rt-result-title">🔍 Longest Prefix Match</div>
            <div id="rt-result-log" role="status" aria-live="polite" class="text-secondary text-sm" style="line-height:1.8;">
              Enter a destination IP and press <strong>Lookup</strong> to see which route wins
              and why. The most specific (longest) matching prefix always takes priority.
            </div>
          </div>
        </div>

        <div>
          <!-- CLI Show IP Interface -->
          <div class="card" style="margin-top:1rem; padding:0.75rem; border:1px solid var(--color-amber);">
            <div class="text-mono text-xs text-muted" style="margin-bottom:0.5rem; text-transform:uppercase; display:flex; align-items:center; gap:0.5rem;">
              💻 R1# <span style="color:var(--color-amber);">show ip interface brief</span>
            </div>
            <div style="background:#0d1117; border-radius:4px; padding:0.75rem; font-family:var(--font-mono); font-size:12px; line-height:1.8; overflow-x:auto;">
              <div style="color:#8b949e; margin-bottom:4px;">Interface &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;IP-Address &nbsp;&nbsp;&nbsp;OK? Method &nbsp;&nbsp;Status &nbsp;&nbsp;&nbsp;Protocol</div>
              <div style="color:var(--color-cyan);">Gi0/0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unassigned &nbsp;&nbsp;YES manual &nbsp;&nbsp;up &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;up</div>
              <div style="color:var(--color-cyan);">Gi0/1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unassigned &nbsp;&nbsp;YES manual &nbsp;&nbsp;up &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;up</div>
              <div style="color:var(--color-cyan);">Gi0/2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unassigned &nbsp;&nbsp;YES manual &nbsp;&nbsp;up &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;up</div>
              <div style="color:var(--color-cyan);">Gi0/3 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unassigned &nbsp;&nbsp;YES manual &nbsp;&nbsp;up &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;up</div>
            </div>
          </div>

          <!-- CLI Show IP Route -->
          <div class="card" style="margin-top:1rem; padding:0.75rem; border:1px solid var(--color-cyan);">
            <div class="text-mono text-xs text-muted" style="margin-bottom:0.5rem; text-transform:uppercase; display:flex; align-items:center; gap:0.5rem;">
              💻 R1# <span style="color:var(--color-cyan);">show ip route</span>
            </div>
            <div style="background:#0d1117; border-radius:4px; padding:0.75rem; font-family:var(--font-mono); font-size:12px; line-height:2; overflow-x:auto;">
              <div style="color:#8b949e;">Codes: C - Connected, S - Static, E - EIGRP, O - OSPF</div>
              <div style="color:var(--color-success);">C 10.0.1.0/24 is directly connected, Gi0/0</div>
              <div style="color:var(--color-success);">C 10.0.2.0/24 is directly connected, Gi0/1</div>
              <div style="color:var(--color-amber);">D 10.0.0.0/8 [90/156] via 172.16.0.1, Gi0/2</div>
              <div style="color:var(--color-amber);">D 172.16.0.0/16 [90/100] via 172.16.0.1, Gi0/2</div>
              <div style="color:var(--color-error);">O 192.168.1.0/24 [110/20] via 172.16.0.1, Gi0/2</div>
              <div style="color:var(--color-cyan);">S* 0.0.0.0/0 [1/0] via 203.0.113.1, Gi0/3</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._diagram.init(
      this.container.querySelector('#rt-canvas'),
      TOPOLOGY,
      { width: 560, height: 320 }
    );

    this._bindControls();
  }

  _renderTableRow(route, index, highlight = false, isWinner = false) {
    const srcColors = { C:'var(--color-success)',S:'var(--color-cyan)','S*':'var(--color-cyan)',EIGRP:'var(--color-amber)',OSPF:'var(--color-error)',RIP:'var(--color-text-muted)' };
    const bgStyle = isWinner
      ? 'background:rgba(0,212,255,0.12); outline:1px solid var(--color-cyan);'
      : highlight
        ? 'background:rgba(255,184,0,0.08);'
        : '';

    return `
      <tr id="rt-row-${index}" style="border-bottom:1px solid var(--color-border); ${bgStyle} transition:background 0.3s ease;">
        <td style="padding:5px 6px; font-family:var(--font-mono); font-weight:700; color:${srcColors[route.source] || 'var(--color-text-muted)'};">${route.source}</td>
        <td style="padding:5px 6px; font-family:var(--font-mono); color:var(--color-text-primary); white-space:nowrap;">${route.network}/${route.prefix}</td>
        <td style="padding:5px 6px; font-family:var(--font-mono); color:var(--color-text-secondary); font-size:var(--text-xs);">${route.nextHop.length > 18 ? route.nextHop.slice(0,18)+'…' : route.nextHop}</td>
        <td style="padding:5px 6px; font-family:var(--font-mono); color:var(--color-text-muted);">${route.ad}/${route.metric}</td>
      </tr>
    `;
  }

  _bindControls() {
    const doLookup = () => {
      if (this._running) return;
      const input = this.container.querySelector('#rt-dest-input');
      const ip = input?.value?.trim();
      if (ip) this._runLookup(ip);
    };

    this.container.querySelector('#rt-lookup-btn')?.addEventListener('click', doLookup);
    this.container.querySelector('#rt-dest-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') doLookup();
    });
    this.container.querySelector('#rt-reset-btn')?.addEventListener('click', () => {
      this._running = false;
      this._diagram.reset();
      this._resetTableHighlights();
      const title = this.container.querySelector('#rt-result-title');
      const log = this.container.querySelector('#rt-result-log');
      if (title) title.textContent = '🔍 Longest Prefix Match';
      if (log) log.innerHTML = 'Enter a destination IP and press <strong>Lookup</strong> to see which route wins and why.';
    });

    this.container.querySelectorAll('.rt-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = this.container.querySelector('#rt-dest-input');
        if (input) input.value = btn.getAttribute('data-ip');
        this._runLookup(btn.getAttribute('data-ip'));
      });
    });
  }

  async _runLookup(destIP) {
    if (!isValidIP(destIP)) {
      const log = this.container.querySelector('#rt-result-log');
      if (log) log.innerHTML = `<span style="color:var(--color-error);">✕ Invalid IP address: "${escapeHtml(destIP)}"</span>`;
      return;
    }

    this._running = true;
    const shouldStop = () => this._isDestroyed || !this._running || !this.container;
    this._diagram.reset();
    this._resetTableHighlights();

    const title = this.container.querySelector('#rt-result-title');
    const log = this.container.querySelector('#rt-result-log');
    if (title) title.textContent = `🔍 Looking up: ${destIP}`;
    if (log) log.textContent = 'Evaluating routing table entries…';

    // Animate each row check with a slight delay
    let matchedRoute = null;
    let bestPrefix = -1;

    for (let i = 0; i < ROUTING_TABLE.length; i++) {
      if (shouldStop()) { this._running = false; return; }
      const route = ROUTING_TABLE[i];
      const rowEl = this.container.querySelector(`#rt-row-${i}`);

      // Highlight current row being evaluated
      if (rowEl) {
        rowEl.style.background = 'rgba(255,184,0,0.1)';
        rowEl.style.outline = '1px solid rgba(255,184,0,0.5)';
      }
      await sleep(220);
      if (shouldStop()) { this._running = false; return; }

      // Check if this route matches
      const matched = isSameSubnet(destIP, route.network, route.prefix);

      if (matched && route.prefix > bestPrefix) {
        bestPrefix = route.prefix;
        matchedRoute = route;
        if (rowEl) {
          rowEl.style.background = 'rgba(0,230,118,0.08)';
          rowEl.style.outline = '1px solid rgba(0,230,118,0.4)';
        }
      } else {
        if (rowEl) {
          rowEl.style.background = '';
          rowEl.style.outline = '';
        }
      }
    }

    if (matchedRoute) {
      // Highlight winner
      const winnerIdx = ROUTING_TABLE.indexOf(matchedRoute);
      const winnerEl = this.container.querySelector(`#rt-row-${winnerIdx}`);
      if (winnerEl) {
        winnerEl.style.background = 'rgba(0,212,255,0.15)';
        winnerEl.style.outline = '2px solid var(--color-cyan)';
      }

      // Update explanation panel
      if (title) title.textContent = `✓ Route Selected: ${matchedRoute.network}/${matchedRoute.prefix}`;
      if (log) log.innerHTML = `
        <div style="margin-bottom:0.5rem;">
          <strong style="color:var(--color-cyan);">${matchedRoute.network}/${matchedRoute.prefix}</strong> wins —
          longest matching prefix (/${matchedRoute.prefix} bits match).
        </div>
        <div style="font-family:var(--font-mono); font-size:var(--text-xs); display:flex; flex-direction:column; gap:0.25rem; margin-bottom:0.5rem;">
          <div>→ Next Hop: <span style="color:var(--color-cyan);">${matchedRoute.nextHop}</span></div>
          <div>→ Interface: <span style="color:var(--color-amber);">${matchedRoute.iface}</span></div>
          <div>→ Source: <span style="color:var(--color-text-primary);">${matchedRoute.source} (AD=${matchedRoute.ad}, metric=${matchedRoute.metric})</span></div>
        </div>
        <div style="font-size:var(--text-xs); color:var(--color-text-muted);">${matchedRoute.desc}</div>
      `;

      // Animate packet toward the matched destination node
      this._diagram.highlightNode('router', 'active', 1000);
      await sleep(400);
      if (shouldStop()) { this._running = false; return; }
      await this._diagram.animatePacket(['router', matchedRoute.nodeId], { type: 'data', label: destIP, speed: 500 });
      if (shouldStop()) { this._running = false; return; }
      this._diagram.highlightNode(matchedRoute.nodeId, 'success', 2000);

      stateManager.mergeState('userProgress', {
        completedModules: [...new Set([
          ...(stateManager.getState('userProgress').completedModules || []),
          '/routing-table'
        ])]
      });
    } else {
      if (title) title.textContent = '✕ No Route Found';
      if (log) log.textContent = `No matching route for ${destIP}. Packet would be dropped (unreachable).`;
      this._diagram.highlightNode('router', 'error', 2000);
    }

    this._running = false;
  }

  _resetTableHighlights() {
    ROUTING_TABLE.forEach((_, i) => {
      const row = this.container.querySelector(`#rt-row-${i}`);
      if (row) { row.style.background = ''; row.style.outline = ''; }
    });
  }

  start() {}
  step() {}

  reset() {
    this._running = false;
    if (this._diagram) this._diagram.reset();
    if (this.container) this._render();
  }

  destroy() {
    this._running = false;
    this._isDestroyed = true;
    if (this._diagram) this._diagram.destroy();
    this.container = null;
  }
}

export default new RoutingTableSimulator();
