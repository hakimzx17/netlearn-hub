/**
 * arpSimulation.js — ARP Resolution Simulator
 *
 * Teaches: How ARP broadcasts a request to discover a MAC address,
 *          how the destination replies directly (unicast), and how
 *          the ARP cache is populated on both hosts.
 *
 * Simulation steps:
 *   1. PC-A wants to send to PC-B but has no MAC for it
 *   2. PC-A sends ARP Request (broadcast FF:FF:FF:FF:FF:FF)
 *   3. Switch floods the broadcast out all ports
 *   4. PC-B recognises its own IP — sends ARP Reply (unicast)
 *   5. PC-A receives reply and caches the MAC
 *   6. Normal data communication begins
 *
 * Depends on: networkDiagram, eventBus, stateManager, helperFunctions
 */

import { createNetworkDiagram } from '../components/networkDiagram.js';
import { eventBus }             from '../js/eventBus.js';
import { stateManager }         from '../js/stateManager.js';
import { sleep, showToast }     from '../utils/helperFunctions.js';

// ── Topology definition ───────────────────────────────────────────────
const TOPOLOGY = {
  nodes: [
    { id: 'pca',    type: 'pc',     label: 'PC-A',    x: 100, y: 200, ip: '192.168.1.10', mac: 'AA:AA:AA:AA:AA:AA' },
    { id: 'pcb',    type: 'pc',     label: 'PC-B',    x: 700, y: 200, ip: '192.168.1.20', mac: 'BB:BB:BB:BB:BB:BB' },
    { id: 'pcc',    type: 'pc',     label: 'PC-C',    x: 400, y: 340, ip: '192.168.1.30', mac: 'CC:CC:CC:CC:CC:CC' },
    { id: 'sw1',    type: 'switch', label: 'SW1',     x: 400, y: 190 },
  ],
  links: [
    { from: 'pca', to: 'sw1', label: 'Fa0/1' },
    { from: 'pcb', to: 'sw1', label: 'Fa0/2' },
    { from: 'pcc', to: 'sw1', label: 'Fa0/3' },
  ],
};

const STEPS = [
  {
    title: 'PC-A Needs to Reach 192.168.1.20',
    log:   'PC-A (192.168.1.10) wants to send data to PC-B (192.168.1.20). Both are on the same subnet, so no router needed — but PC-A has no entry for 192.168.1.20 in its ARP cache.',
    action: 'check_cache',
  },
  {
    title: 'PC-A Sends ARP Request (Broadcast)',
    log:   'PC-A builds an ARP Request: "Who has 192.168.1.20? Tell 192.168.1.10 at AA:AA:AA:AA:AA:AA". The destination MAC is FF:FF:FF:FF:FF:FF — a broadcast sent to every device on the subnet.',
    action: 'arp_request',
  },
  {
    title: 'Switch Floods the Broadcast',
    log:   'SW1 receives the broadcast frame. Switches always flood broadcasts out every port except the one it arrived on (Fa0/1). PC-B and PC-C both receive the frame.',
    action: 'flood',
  },
  {
    title: 'Only PC-B Responds',
    log:   'PC-C checks the target IP (192.168.1.20) — it doesn\'t match, so it drops the frame silently. PC-B recognises its own IP and prepares a unicast ARP Reply.',
    action: 'reply',
  },
  {
    title: 'PC-A Receives Reply and Updates Cache',
    log:   'PC-A receives the ARP Reply: "192.168.1.20 is at BB:BB:BB:BB:BB:BB". PC-A stores this in its ARP cache. Future packets to PC-B will use this MAC immediately.',
    action: 'cache_update',
  },
  {
    title: 'Normal Communication Begins',
    log:   'With the MAC address resolved, PC-A can now address Ethernet frames directly to BB:BB:BB:BB:BB:BB and deliver data to PC-B.',
    action: 'data_flow',
  },
];

class ArpSimulation {
  constructor() {
    this.container  = null;
    this._diagram   = null;
    this._step      = 0;
    this._running   = false;
    this._arpCache  = {};
  }

  init(containerEl) {
    this.container = containerEl;
    this._diagram  = createNetworkDiagram();
    this._step     = 0;
    this._arpCache = {};
    this._render();
  }

  _render() {
    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <span>Simulations</span>
        </div>
        <h1 class="module-header__title">ARP Resolution Simulator</h1>
        <p class="module-header__description">
          Address Resolution Protocol translates IP addresses to MAC addresses
          on a local network. Watch how a broadcast request resolves to a
          unicast reply and populates the ARP cache.
        </p>
      </div>

      <div class="layout-main-sidebar">
        <div>
          <!-- Network diagram canvas -->
          <div class="sim-canvas" id="arp-canvas" style="min-height:280px;"></div>

          <!-- Controls -->
          <div class="control-bar" style="margin-top:1rem;">
            <button class="btn btn-primary" id="arp-step-btn">▶ Step</button>
            <button class="btn btn-secondary" id="arp-auto-btn">⚡ Auto Play</button>
            <button class="btn btn-ghost" id="arp-reset-btn">↺ Reset</button>
            <div class="step-indicator" style="margin-left:auto;">
              ${STEPS.map((_, i) => `<div class="step-indicator__dot" id="arp-dot-${i}"></div>`).join('')}
            </div>
          </div>

          <!-- Step explanation -->
          <div class="info-panel" id="arp-step-panel" style="margin-top:1rem;">
            <div class="info-panel__title" id="arp-step-title">📡 ARP Simulation</div>
            <p id="arp-step-log" class="text-secondary text-sm" style="line-height:1.8;">
              Press <strong>Step</strong> to begin. ARP is triggered whenever a device needs to
              send a packet to an IP on the same subnet but doesn't know the MAC address.
            </p>
          </div>
        </div>

        <div>
          <!-- ARP Cache display -->
          <div class="info-panel">
            <div class="info-panel__title">🗂 ARP Cache</div>
            <div id="arp-cache-display">
              <p class="text-muted text-xs text-mono">No entries yet</p>
            </div>
          </div>

          <!-- ARP packet structure -->
          <div class="card" style="margin-top:1rem;">
            <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase;">ARP Packet Fields</div>
            ${[
              ['Sender MAC','AA:AA:AA:AA:AA:AA','Requester\'s hardware address'],
              ['Sender IP', '192.168.1.10',     'Requester\'s protocol address'],
              ['Target MAC','FF:FF:FF:FF:FF:FF','Unknown (broadcast in request)'],
              ['Target IP', '192.168.1.20',     'IP address being resolved'],
              ['Op Code',   '1 = Request',       '2 = Reply'],
            ].map(([k, v, tip]) => `
              <div style="margin-bottom:0.5rem; padding-bottom:0.5rem; border-bottom:1px solid var(--color-border);">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.15rem;">
                  <span style="font-size:var(--text-xs); color:var(--color-text-muted); font-family:var(--font-mono);">${k}</span>
                  <span style="font-size:var(--text-xs); color:var(--color-cyan); font-family:var(--font-mono);">${v}</span>
                </div>
                <div style="font-size:var(--text-xs); color:var(--color-text-muted);">${tip}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Render SVG diagram
    this._diagram.init(
      this.container.querySelector('#arp-canvas'),
      TOPOLOGY,
      { width: 820, height: 260 }
    );

    this._bindControls();
  }

  _bindControls() {
    this.container.querySelector('#arp-step-btn')?.addEventListener('click', () => {
      if (!this._running) this._runStep();
    });

    this.container.querySelector('#arp-auto-btn')?.addEventListener('click', () => {
      if (!this._running) this._autoPlay();
    });

    this.container.querySelector('#arp-reset-btn')?.addEventListener('click', () => {
      this._running = false;
      this.reset();
    });
  }

  async _runStep() {
    if (this._step >= STEPS.length || this._running) return;
    this._running = true;

    const step = STEPS[this._step];
    this._updateStepPanel(step);
    this._markDot(this._step);
    await this._executeAction(step.action);

    this._step++;
    this._running = false;

    if (this._step >= STEPS.length) {
      this.container.querySelector('#arp-step-btn').textContent = '✓ Complete';
      this.container.querySelector('#arp-step-btn').disabled = true;
      showToast('ARP simulation complete!', 'success');
      stateManager.mergeState('userProgress', {
        completedModules: [...new Set([
          ...(stateManager.getState('userProgress').completedModules || []),
          '/arp-simulation'
        ])]
      });
    }
  }

  async _autoPlay() {
    while (this._step < STEPS.length) {
      await this._runStep();
      await sleep(600);
    }
  }

  async _executeAction(action) {
    switch (action) {
      case 'check_cache':
        this._diagram.highlightNode('pca', 'active', 1200);
        await sleep(900);
        break;

      case 'arp_request':
        this._diagram.highlightNode('pca', 'active', 2000);
        this._diagram.showPacketLabel('ARP Request\n(Broadcast)', { x: 100, y: 160 });
        await this._diagram.animatePacket(['pca', 'sw1'], { type: 'broadcast', label: 'ARP?', speed: 600 });
        break;

      case 'flood':
        this._diagram.highlightNode('sw1', 'hop', 1000);
        await sleep(400);
        // Flood to all ports except source (pca)
        await this._diagram.animateBroadcast('sw1', ['pcb', 'pcc'], { type: 'broadcast', label: 'flood', speed: 500 });
        break;

      case 'reply':
        // PC-C drops silently
        this._diagram.highlightNode('pcc', 'error', 800);
        await sleep(500);
        // PC-B sends unicast reply
        this._diagram.highlightNode('pcb', 'success', 1500);
        await sleep(300);
        await this._diagram.animatePacket(['pcb', 'sw1', 'pca'], { type: 'data', label: 'ARP Reply', speed: 500 });
        break;

      case 'cache_update':
        this._diagram.highlightNode('pca', 'success', 2000);
        this._arpCache['192.168.1.20'] = 'BB:BB:BB:BB:BB:BB';
        this._arpCache['192.168.1.10'] = 'AA:AA:AA:AA:AA:AA'; // PC-B also caches PC-A
        this._updateCacheDisplay();
        stateManager.setState('arpCache', { ...this._arpCache });
        await sleep(800);
        break;

      case 'data_flow':
        await this._diagram.animatePacket(['pca', 'sw1', 'pcb'], { type: 'data', label: 'Data', speed: 400 });
        await sleep(200);
        await this._diagram.animatePacket(['pcb', 'sw1', 'pca'], { type: 'data', label: 'ACK', speed: 400 });
        break;
    }
  }

  _updateStepPanel(step) {
    const title = this.container.querySelector('#arp-step-title');
    const log   = this.container.querySelector('#arp-step-log');
    if (title) title.textContent = `📡 ${step.title}`;
    if (log)   { log.textContent = step.log; log.classList.add('anim-fade-in'); }
  }

  _markDot(index) {
    for (let i = 0; i < STEPS.length; i++) {
      const dot = this.container.querySelector(`#arp-dot-${i}`);
      if (!dot) continue;
      if (i < index)  dot.classList.add('is-done');
      if (i === index) { dot.classList.add('is-active'); dot.classList.remove('is-done'); }
    }
  }

  _updateCacheDisplay() {
    const display = this.container.querySelector('#arp-cache-display');
    if (!display) return;
    const entries = Object.entries(this._arpCache);
    if (!entries.length) { display.innerHTML = '<p class="text-muted text-xs text-mono">No entries yet</p>'; return; }
    display.innerHTML = entries.map(([ip, mac]) => `
      <div style="display:flex; justify-content:space-between; padding:0.3rem 0; border-bottom:1px solid var(--color-border); font-family:var(--font-mono); font-size:var(--text-xs); animation:fadeIn 0.3s ease;">
        <span style="color:var(--color-cyan);">${ip}</span>
        <span style="color:var(--color-text-secondary);">${mac}</span>
      </div>
    `).join('');
  }

  start()  { this._runStep(); }
  step()   { this._runStep(); }

  reset() {
    this._step     = 0;
    this._running  = false;
    this._arpCache = {};
    if (this._diagram) this._diagram.reset();
    if (this.container) this._render();
  }

  destroy() {
    this._running = false;
    if (this._diagram) this._diagram.destroy();
    this.container = null;
  }
}

export default new ArpSimulation();
