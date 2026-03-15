/**
 * ttlRouterSimulation.js — TTL Router Hop Simulation
 *
 * Teaches: How each router decrements the TTL field of an IP packet,
 *          what happens when TTL reaches zero (ICMP Time Exceeded),
 *          and why TTL exists (prevents infinite routing loops).
 *
 * Depends on: networkDiagram, eventBus, stateManager, helperFunctions
 */

import { createNetworkDiagram } from '../components/networkDiagram.js';
import { stateManager }         from '../js/stateManager.js';
import { sleep, showToast }     from '../utils/helperFunctions.js';

const TOPOLOGY = {
  nodes: [
    { id: 'src',  type: 'pc',     label: 'Source',  x: 60,  y: 200, ip: '10.0.0.1' },
    { id: 'r1',   type: 'router', label: 'R1',      x: 230, y: 200, ip: '10.1.0.1' },
    { id: 'r2',   type: 'router', label: 'R2',      x: 400, y: 200, ip: '10.2.0.1' },
    { id: 'r3',   type: 'router', label: 'R3',      x: 570, y: 200, ip: '10.3.0.1' },
    { id: 'dst',  type: 'pc',     label: 'Dest',    x: 740, y: 200, ip: '10.4.0.1' },
  ],
  links: [
    { from: 'src', to: 'r1',  label: '' },
    { from: 'r1',  to: 'r2',  label: '' },
    { from: 'r2',  to: 'r3',  label: '' },
    { from: 'r3',  to: 'dst', label: '' },
  ],
};

// Scenarios: normal delivery vs TTL expiry
const SCENARIOS = [
  {
    id: 'normal',
    label: 'Normal Delivery (TTL=64)',
    initialTTL: 64,
    description: 'Standard TTL of 64. Packet traverses 3 routers and arrives safely. Each router decrements TTL by 1.',
  },
  {
    id: 'expiry',
    label: 'TTL Expiry Simulation (TTL=2)',
    initialTTL: 2,
    description: 'TTL set to 2. Packet will expire at R2 — router sends ICMP "Time Exceeded" back to source. This is how traceroute discovers hop addresses.',
  },
  {
    id: 'traceroute',
    label: 'Traceroute Mechanics (TTL=1,2,3)',
    initialTTL: 1,
    description: 'Traceroute sends probes with TTL=1,2,3... Each expiry reveals the next hop. This is how the full path is mapped.',
  },
];

class TtlRouterSimulation {
  constructor() {
    this.container   = null;
    this._diagram    = null;
    this._running    = false;
    this._currentTTL = 64;
    this._scenario   = 'normal';
    this._isDestroyed = false;
  }

  init(containerEl) {
    this.container = containerEl;
    this._diagram  = createNetworkDiagram();
    this._isDestroyed = false;
    this._render();
  }

  _render() {
    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <span>Simulations</span>
        </div>
        <h1 class="module-header__title">TTL Router Hop Simulation</h1>
        <p class="module-header__description">
          Time To Live prevents packets from looping forever. Every router
          that forwards a packet decrements TTL by exactly 1. When TTL
          hits zero, the router drops the packet and sends an ICMP
          Time Exceeded message back to the source.
        </p>
      </div>

      <div class="layout-main-sidebar">
        <div>
          <!-- Scenario selector -->
          <div style="display:flex; gap:0.5rem; margin-bottom:1rem; flex-wrap:wrap;">
            ${SCENARIOS.map(s => `
              <button class="btn ${s.id === this._scenario ? 'btn-primary' : 'btn-ghost'} ttl-scenario-btn"
                data-scenario="${s.id}" style="font-size:var(--text-xs); padding:0.3rem 0.75rem;">
                ${s.label}
              </button>
            `).join('')}
          </div>

          <div class="sim-canvas" id="ttl-canvas" style="min-height:260px;"></div>

          <!-- TTL counter bar -->
          <div style="margin-top:1rem; padding:0.75rem 1rem; background:var(--color-bg-medium); border-radius:var(--radius-md); border:1px solid var(--color-border);">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
              <span class="text-mono text-xs text-muted">PACKET TTL</span>
              <span class="text-mono text-sm" id="ttl-value" style="color:var(--color-cyan); font-weight:700;">64</span>
            </div>
            <div style="height:8px; background:var(--color-bg-raised); border-radius:99px; overflow:hidden;">
              <div id="ttl-bar" style="height:100%; background:var(--color-cyan); border-radius:99px; width:100%; transition:width 0.5s ease, background 0.3s ease;"></div>
            </div>
          </div>

          <div class="control-bar" style="margin-top:0.75rem;">
            <button class="btn btn-primary"   id="ttl-run-btn">▶ Simulate</button>
            <button class="btn btn-ghost"     id="ttl-reset-btn">↺ Reset</button>
          </div>

          <div class="info-panel" style="margin-top:1rem;">
            <div class="info-panel__title" id="ttl-step-title">⏱ TTL Simulation</div>
            <p class="text-secondary text-sm" style="line-height:1.8;" id="ttl-step-log">
              Select a scenario above, then press <strong>Simulate</strong> to watch TTL
              decrement at each hop. A value of 64 or 128 is typical in real packets.
            </p>
          </div>
        </div>

        <div>
          <!-- Hop log -->
          <div class="info-panel">
            <div class="info-panel__title">📊 Hop Log</div>
            <div id="ttl-hop-log" style="font-family:var(--font-mono); font-size:var(--text-xs);">
              <p class="text-muted" style="text-align:center; padding:0.5rem;">Awaiting simulation...</p>
            </div>
          </div>

          <!-- Why TTL exists -->
          <div class="card" style="margin-top:1rem;">
            <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase;">Why TTL Exists</div>
            ${[
              ['Routing Loops',  'Without TTL, a misrouted packet could bounce between routers forever, consuming bandwidth.'],
              ['Default Values', 'Windows: 128. Linux/macOS: 64. Old Unix: 255. Cisco IOS: 255 (routing protocols).'],
              ['traceroute',     'Intentionally sends packets with TTL=1,2,3... to get ICMP replies from each router hop.'],
              ['ping TTL',       'ping shows the TTL of the reply. 64 from a Linux host = 0 hops away. 63 = 1 hop.'],
            ].map(([k, v]) => `
              <div style="margin-bottom:0.6rem; padding-bottom:0.6rem; border-bottom:1px solid var(--color-border);">
                <div style="font-size:var(--text-xs); font-weight:700; color:var(--color-amber); margin-bottom:0.2rem;">${k}</div>
                <p style="font-size:var(--text-xs); color:var(--color-text-muted); margin:0; line-height:1.6;">${v}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this._diagram.init(
      this.container.querySelector('#ttl-canvas'),
      TOPOLOGY,
      { width: 820, height: 250 }
    );

    this._setTTLDisplay(SCENARIOS.find(s => s.id === this._scenario).initialTTL);
    this._bindControls();
  }

  _bindControls() {
    this.container.querySelectorAll('.ttl-scenario-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this._running) return;
        this._scenario = btn.getAttribute('data-scenario');
        this._diagram.reset();
        const sc = SCENARIOS.find(s => s.id === this._scenario);
        this._setTTLDisplay(sc.initialTTL);
        this._clearHopLog();
        this._updatePanel(`⏱ ${sc.label}`, sc.description);

        this.container.querySelectorAll('.ttl-scenario-btn').forEach(b => {
          b.className = `btn ${b.getAttribute('data-scenario') === this._scenario ? 'btn-primary' : 'btn-ghost'} ttl-scenario-btn`;
          b.style.fontSize = 'var(--text-xs)'; b.style.padding = '0.3rem 0.75rem';
        });
      });
    });

    this.container.querySelector('#ttl-run-btn')?.addEventListener('click', () => {
      if (!this._running) this._simulate();
    });
    this.container.querySelector('#ttl-reset-btn')?.addEventListener('click', () => {
      this._running = false;
      this.reset();
    });
  }

  async _simulate() {
    if (this._running) return;
    this._running = true;
    const shouldStop = () => this._isDestroyed || !this._running || !this.container;
    this._clearHopLog();

    const sc = SCENARIOS.find(s => s.id === this._scenario);
    let   ttl = sc.initialTTL;

    // Reset TTL display to initial value
    this._setTTLDisplay(ttl);
    this._updatePanel(`⏱ ${sc.label}`, sc.description);

    if (sc.id === 'traceroute') {
      // Simulate TTL=1, 2, 3 probes
      for (let probe = 1; probe <= 3; probe++) {
        ttl = probe;
        this._setTTLDisplay(ttl);
        this._addHopEntry(`Probe TTL=${probe}`, 'src', ttl, false, true);
        await sleep(300);
        if (shouldStop()) { this._running = false; return; }
        const hops = ['r1', 'r2', 'r3', 'dst'];
        for (let i = 0; i < hops.length; i++) {
          if (shouldStop()) { this._running = false; return; }
          const hop = hops[i];
          await this._diagram.animatePacket([i === 0 ? 'src' : hops[i-1], hop], { type: 'data', speed: 450 });
          if (shouldStop()) { this._running = false; return; }
          ttl--;
          if (ttl <= 0) {
            this._diagram.highlightNode(hop, 'error', 1200);
            this._addHopEntry(`ICMP Time Exceeded ← ${hop}`, hop, 0, true, false);
            this._setTTLDisplay(0);
            await this._diagram.animatePacket([hop, 'src'], { type: 'icmp', label: 'ICMP!', speed: 400 });
            if (shouldStop()) { this._running = false; return; }
            await sleep(400);
            if (shouldStop()) { this._running = false; return; }
            break;
          }
          this._setTTLDisplay(ttl);
          this._addHopEntry(`Hop ${i+1}: ${hop}`, hop, ttl, false, false);
          this._diagram.updateNodeLabel(hop, ttl.toString());
          await sleep(200);
          if (shouldStop()) { this._running = false; return; }
        }
        await sleep(500);
        if (shouldStop()) { this._running = false; return; }
        this._diagram.reset();
      }
      this._updatePanel('🗺 Path Mapped!', 'traceroute complete — each ICMP reply reveals a hop. The full path: Source → R1 → R2 → R3 → Destination.');
    } else {
      // Normal or expiry
      const hops = [
        { from: 'src', to: 'r1' },
        { from: 'r1',  to: 'r2' },
        { from: 'r2',  to: 'r3' },
        { from: 'r3',  to: 'dst' },
      ];

      this._addHopEntry('Source sends packet', 'src', ttl, false, true);

      for (let i = 0; i < hops.length; i++) {
        if (shouldStop()) { this._running = false; return; }
        const { from, to } = hops[i];
        await this._diagram.animatePacket([from, to], { type: 'data', label: `TTL=${ttl}`, speed: 500 });
        if (shouldStop()) { this._running = false; return; }
        this._diagram.highlightNode(to, 'hop', 600);

        if (to !== 'dst') {
          ttl--;
          this._setTTLDisplay(ttl);

          if (ttl <= 0) {
            this._diagram.highlightNode(to, 'error', 2000);
            this._addHopEntry(`TTL=0 at ${to} — packet dropped!`, to, 0, true, false);
            this._updatePanel('⚠ TTL Expired!', `Packet dropped at ${to}. An ICMP Time Exceeded message is sent back to the source (10.0.0.1).`);
            await sleep(400);
            if (shouldStop()) { this._running = false; return; }
            await this._diagram.animatePacket([to, 'src'], { type: 'icmp', label: 'ICMP TE', speed: 400 });
            if (shouldStop()) { this._running = false; return; }
            this._diagram.highlightNode('src', 'error', 1000);
            this._addHopEntry('ICMP Time Exceeded → Source', 'src', 0, false, false);
            break;
          }

          this._addHopEntry(`Router ${to} — TTL decremented`, to, ttl, false, false);
          this._diagram.updateNodeLabel(to, ttl.toString());
        } else {
          this._diagram.highlightNode('dst', 'success', 2000);
          this._addHopEntry('Packet delivered to destination!', 'dst', ttl, false, false);
          this._updatePanel('✓ Packet Delivered!', `Packet reached ${TOPOLOGY.nodes.find(n=>n.id==='dst').ip} with TTL=${ttl} remaining.`);
          showToast('Packet delivered successfully!', 'success');
          stateManager.mergeState('userProgress', {
            completedModules: [...new Set([
              ...(stateManager.getState('userProgress').completedModules || []),
              '/ttl-simulation'
            ])]
          });
        }
        await sleep(300);
        if (shouldStop()) { this._running = false; return; }
      }
    }

    this._running = false;
  }

  _setTTLDisplay(ttl) {
    this._currentTTL = ttl;
    const el  = this.container.querySelector('#ttl-value');
    const bar = this.container.querySelector('#ttl-bar');
    if (el) {
      el.textContent = ttl;
      el.style.color = ttl <= 0 ? 'var(--color-error)' : ttl <= 5 ? 'var(--color-warning)' : 'var(--color-cyan)';
    }
    if (bar) {
      const maxTTL = SCENARIOS.find(s => s.id === this._scenario)?.initialTTL || 64;
      bar.style.width = `${Math.max(0, (ttl / maxTTL) * 100)}%`;
      bar.style.background = ttl <= 0 ? 'var(--color-error)' : ttl <= 5 ? 'var(--color-warning)' : 'var(--color-cyan)';
    }
  }

  _addHopEntry(label, nodeId, ttl, isError, isSource) {
    const log = this.container.querySelector('#ttl-hop-log');
    if (!log) return;
    if (log.querySelector('p')) log.innerHTML = '';
    const color = isError ? 'var(--color-error)' : isSource ? 'var(--color-text-secondary)' : 'var(--color-text-primary)';
    const entry = document.createElement('div');
    entry.style.cssText = `padding:0.3rem 0; border-bottom:1px solid var(--color-border); animation:fadeIn 0.3s ease; font-size:var(--text-xs);`;
    entry.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="color:${color};">${label}</span>
        ${!isSource ? `<span style="color:${ttl <= 0 ? 'var(--color-error)' : 'var(--color-cyan)'}; font-weight:700;">TTL=${ttl}</span>` : ''}
      </div>
    `;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  }

  _clearHopLog() {
    const log = this.container.querySelector('#ttl-hop-log');
    if (log) log.innerHTML = '<p class="text-muted" style="text-align:center; padding:0.5rem;">Awaiting simulation...</p>';
  }

  _updatePanel(title, log) {
    const t = this.container.querySelector('#ttl-step-title');
    const l = this.container.querySelector('#ttl-step-log');
    if (t) t.textContent = title;
    if (l) l.textContent = log;
  }

  start()  { this._simulate(); }
  step()   {}

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

export default new TtlRouterSimulation();
