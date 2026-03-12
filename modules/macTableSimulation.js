/**
 * macTableSimulation.js — Enhanced Switch MAC Table Learning Simulator
 *
 * TEACHES: 
 * - How Layer 2 switches dynamically learn MAC addresses
 * - Source MAC inspection and CAM table population
 * - Flooding vs unicast forwarding decisions
 *
 * VISUALIZATION FEATURES:
 * - Step-by-step animated frame processing
 * - Progressive MAC table under the visualization
 * - Packet type labels (ICMP, ARP, DNS, etc.)
 *
 * Depends on: networkDiagram, eventBus, stateManager, helperFunctions
 */

import { createNetworkDiagram } from '../components/networkDiagram.js';
import { stateManager }         from '../js/stateManager.js';
import { sleep, showToast }     from '../utils/helperFunctions.js';

const TOPOLOGY = {
  nodes: [
    { id: 'pca', type: 'pc',     label: 'PC-A', x: 180,  y: 300, mac: '00:1A:2B:11:22:33', ip: '10.0.0.1' },
    { id: 'pcb', type: 'pc',     label: 'PC-B', x: 500, y: 150,  mac: '00:1A:2B:44:55:66', ip: '10.0.0.2' },
    { id: 'pcc', type: 'pc',     label: 'PC-C', x: 820, y: 300, mac: '00:1A:2B:77:88:99', ip: '10.0.0.3' },
    { id: 'pcd', type: 'pc',     label: 'PC-D', x: 500, y: 480, mac: '00:1A:2B:AA:BB:CC', ip: '10.0.0.4' },
    { id: 'sw1', type: 'switch', label: 'SW1',  x: 500, y: 310 },
  ],
  links: [
    { from: 'pca', to: 'sw1', label: 'Fa0/1' },
    { from: 'pcb', to: 'sw1', label: 'Fa0/2' },
    { from: 'pcc', to: 'sw1', label: 'Fa0/3' },
    { from: 'pcd', to: 'sw1', label: 'Fa0/4' },
  ],
};

const SCENARIOS = [
  {
    id: 1,
    phase: 'LEARNING',
    desc: 'PC-A → PC-C (Unknown Destination)',
    from: 'pca', to: 'pcc',
    srcMac: '00:1A:2B:11:22:33', 
    dstMac: '00:1A:2B:77:88:99',
    srcPort: 'Fa0/1',
    deviceName: 'PC-A',
    packetType: 'ARP REQUEST',
    packetLabel: 'Who has 10.0.0.3?',
    explanation: `<strong>Step 1: Source MAC Learning</strong><br/>
    The switch extracts the SOURCE MAC from the incoming frame and maps it to the port where it arrived.<br/><br/>
    <div style="background:#1a1a2e; padding:12px; border-radius:8px; margin:8px 0;">
      <div style="color:#4ECDC4; font-size:11px; margin-bottom:6px;">INCOMING FRAME</div>
      <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:10px;">
        <span><span style="color:#4ECDC4;">SRC:</span> 00:1A:2B:11:22:33</span>
        <span><span style="color:#FF6B6B;">DST:</span> 00:1A:2B:77:88:99</span>
      </div>
    </div>
    <strong>Dest Unknown → FLOOD to all ports except Fa0/1</strong>`,
  },
  {
    id: 2,
    phase: 'FORWARDING',
    desc: 'PC-C → PC-A (Both MACs Known)',
    from: 'pcc', to: 'pca',
    srcMac: '00:1A:2B:77:88:99', 
    dstMac: '00:1A:2B:11:22:33',
    srcPort: 'Fa0/3',
    deviceName: 'PC-C',
    packetType: 'ARP REPLY',
    packetLabel: 'I am 10.0.0.3',
    explanation: `<strong>Both MACs Now Known!</strong><br/>
    The switch has BOTH devices in its table:<br/><br/>
    <div style="background:#1a1a2e; padding:12px; border-radius:8px; margin:8px 0;">
      <div style="color:#4ECDC4; font-size:11px; margin-bottom:6px;">DIRECT FORWARD</div>
      <div style="font-family:var(--font-mono); font-size:10px; color:#4ECDC4;">
        DEST FOUND → FORWARD TO Fa0/1 (NO FLOOD!)
      </div>
    </div>
    This is the power of MAC learning!`,
  },
  {
    id: 3,
    phase: 'LEARNING',
    desc: 'PC-B → PC-D (Partial Knowledge)',
    from: 'pcb', to: 'pcd',
    srcMac: '00:1A:2B:44:55:66', 
    dstMac: '00:1A:2B:AA:BB:CC',
    srcPort: 'Fa0/2',
    deviceName: 'PC-B',
    packetType: 'ICMP ECHO REQUEST',
    packetLabel: 'Ping 10.0.0.4',
    explanation: `<strong>New Device Learning!</strong><br/>
    The switch learns PC-B's MAC. PC-D still unknown.<br/><br/>
    <div style="background:#1a1a2e; padding:12px; border-radius:8px; margin:8px 0;">
      <div style="color:#FF6B6B; font-size:11px; margin-bottom:6px;">FLOODING (Dest Unknown)</div>
      <div style="font-family:var(--font-mono); font-size:10px; color:#FF6B6B;">
        Dest NOT in table → FLOOD to all ports
      </div>
    </div>`,
  },
  {
    id: 4,
    phase: 'COMPLETE',
    desc: 'PC-D → PC-B (All Known)',
    from: 'pcd', to: 'pcb',
    srcMac: '00:1A:2B:AA:BB:CC', 
    dstMac: '00:1A:2B:44:55:66',
    srcPort: 'Fa0/4',
    deviceName: 'PC-D',
    packetType: 'ICMP ECHO REPLY',
    packetLabel: 'Reply 10.0.0.4',
    explanation: `<strong>CAM TABLE COMPLETE!</strong><br/>
    All 4 devices are now learned:<br/><br/>
    <div style="background:linear-gradient(90deg, #4ECDC4, #45B7D1); padding:12px; border-radius:8px; margin:8px 0;">
      <div style="color:#1a1a2e; font-size:11px; font-weight:bold;">100% EFFICIENCY!</div>
      <div style="color:#1a1a2e; font-family:var(--font-mono); font-size:10px; margin-top:4px;">
        Direct unicast — NO FLOODING!
      </div>
    </div>
    <strong>All future frames are UNICAST!</strong>`,
  },
];

class MacTableSimulation {
  constructor() {
    this.container  = null;
    this._diagram   = null;
    this._macTable  = {};
    this._step      = 0;
    this._running   = false;
  }

  init(containerEl) {
    this.container = containerEl;
    this._diagram = createNetworkDiagram();
    this._macTable = {};
    this._step = 0;
    this._render();
  }

  _render() {
    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <span>Simulations</span> › <span>MAC Table</span>
        </div>
        <h1 class="module-header__title">🔀 Switch MAC Address Table Learning</h1>
        <p class="module-header__description">
          Watch how a Layer 2 switch learns device locations, builds the CAM table, and makes forwarding decisions.
        </p>
      </div>

      <!-- CONTROLS ABOVE THE PLATFORM -->
      <div class="control-bar" style="margin-bottom:1rem; justify-content:center; flex-wrap:wrap; gap:0.5rem; background:#1a1a2e; padding:1rem; border-radius:12px;">
        <button class="btn btn-primary" style="padding:0.75rem 2rem; font-size:1rem;" id="mac-step-btn">▶ Send Frame</button>
        <button class="btn btn-secondary" style="padding:0.75rem 1.5rem;" id="mac-auto-btn">⚡ Auto Play</button>
        <button class="btn btn-ghost" style="padding:0.75rem 1.5rem;" id="mac-reset-btn">↺ Reset</button>
      </div>

      <!-- BIG VISUALIZATION PLATFORM (FULLY ZOOMED) -->
      <div class="sim-canvas" id="mac-canvas" style="min-height:650px; position:relative; background:linear-gradient(180deg, #0d0d1a 0%, #1a1a2e 100%); border-radius:12px; border:2px solid #2d2d44; margin-bottom:1rem;">
        <!-- Info overlays -->
        <div id="frame-info-bar" style="position:absolute; top:12px; left:12px; right:12px; display:flex; justify-content:center; z-index:10; flex-wrap:wrap; gap:1rem;">
          <div style="background:#1a1a2e; padding:0.8rem 1.5rem; border-radius:10px; font-family:var(--font-mono); font-size:1rem; border:2px solid #4ECDC4;">
            <span style="color:#4ECDC4;">📤</span> <span id="packet-type-display" style="color:#FFD93D; font-weight:bold; font-size:1.1rem;">—</span>
          </div>
          <div style="background:#1a1a2e; padding:0.8rem 1.5rem; border-radius:10px; font-family:var(--font-mono); font-size:1rem; border:2px solid #FFD93D; max-width:60%;">
            <span style="color:#4ECDC4;">💬</span> <span id="packet-label-display" style="color:#fff; font-size:1.1rem;">—</span>
          </div>
          <div id="decision-badge" style="background:#1a1a2e; padding:0.6rem 1.5rem; border-radius:10px; font-size:1rem; display:none; border:2px solid;">
            <span id="decision-text" style="font-weight:600; font-size:1rem;"></span>
          </div>
        </div>
        
        <!-- Port labels -->
        <div style="position:absolute; bottom:8px; left:0; right:0; display:flex; justify-content:space-around; padding:0 80px; font-family:var(--font-mono); font-size:0.65rem; color:#6c757d;">
          <span>Fa0/1</span><span>Fa0/2</span><span>Fa0/3</span><span>Fa0/4</span>
        </div>
      </div>

      <!-- EXPLANATION PANEL -->
      <div class="info-panel" style="margin-bottom:1rem; border-left:4px solid #4ECDC4;">
        <p class="text-secondary text-sm" style="line-height:1.8;" id="mac-step-log">
          Press <strong>Send Frame</strong> to start. Watch the switch learn MAC addresses and make forwarding decisions!
        </p>
      </div>

      <!-- MAC TABLE UNDER THE PLATFORM -->
      <div style="display:grid; grid-template-columns:1fr 280px; gap:1rem;">
        
        <!-- MAC Address Table -->
        <div class="card" style="background:#0d0d1a; border:1px solid #2d2d44;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div class="text-mono text-sm" style="color:#4ECDC4; font-weight:600;">📋 MAC Address Table (CAM)</div>
            <div class="text-mono text-xs" style="color:#6c757d;"><span id="entry-count" style="color:#4ECDC4;">0</span>/4 learned</div>
          </div>
          
          <!-- Table header -->
          <div style="display:grid; grid-template-columns:1.5fr 0.8fr 0.7fr 0.8fr; font-family:var(--font-mono); font-size:0.6rem; color:#6c757d; border-bottom:1px solid #3d3d5c; padding-bottom:6px; margin-bottom:6px;">
            <span>MAC ADDRESS</span>
            <span>PORT</span>
            <span>TYPE</span>
            <span>DEVICE</span>
          </div>
          
          <div id="mac-table-display" style="min-height:100px;">
            ${this._renderEmptyTable()}
          </div>
          
          <!-- Progress bar -->
          <div style="margin-top:0.75rem;">
            <div style="height:8px; background:#252538; border-radius:99px; overflow:hidden;">
              <div id="mac-table-bar" style="height:100%; background:linear-gradient(90deg, #4ECDC4, #45B7D1); border-radius:99px; width:0%; transition:width 0.8s ease;"></div>
            </div>
          </div>
        </div>

        <!-- Decision Logic Side Panel -->
        <div>
          <div class="card" style="background:#0d0d1a; border:1px solid #2d2d44; margin-bottom:1rem;">
            <div class="text-mono text-xs" style="color:#FFD93D; margin-bottom:0.75rem;">⚡ Forwarding Decision</div>
            <div id="decision-display" style="display:flex; flex-direction:column; gap:0.5rem;">
              <div class="decision-row" data-type="unknown" style="display:flex; gap:0.5rem; align-items:center; padding:0.5rem; border-radius:6px; background:#1a1a2e; border-left:3px solid #FF6B6B;">
                <span style="width:18px; height:18px; background:#FF6B6B; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.6rem; font-weight:bold; color:#1a1a2e;">?</span>
                <div style="flex:1;">
                  <div class="text-xs" style="font-weight:600;">Unknown Dest</div>
                  <div class="text-xs" style="color:#6c757d; font-size:0.55rem;">Flood all except source</div>
                </div>
              </div>
              <div class="decision-row" data-type="known" style="display:flex; gap:0.5rem; align-items:center; padding:0.5rem; border-radius:6px; background:#1a1a2e; border-left:3px solid #4ECDC4;">
                <span style="width:18px; height:18px; background:#4ECDC4; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.6rem; font-weight:bold; color:#1a1a2e;">✓</span>
                <div style="flex:1;">
                  <div class="text-xs" style="font-weight:600;">Known Dest</div>
                  <div class="text-xs" style="color:#6c757d; font-size:0.55rem;">Forward to port</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Aging Info -->
          <div class="card" style="background:linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%); border:1px solid #2d2d44;">
            <div class="text-mono text-xs" style="color:#6c757d; margin-bottom:0.5rem;">⏱️ MAC Aging Timer</div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="text-xs" style="color:#6c757d;">Default</span>
              <span style="color:#FFD93D; font-weight:bold; font-family:var(--font-mono);">300 sec</span>
            </div>
            <div style="font-size:0.6rem; color:#6c757d; margin-top:0.5rem; line-height:1.4;">
              Entry removed if no frames received. Prevents stale data.
            </div>
          </div>
        </div>
      </div>
    `;

    this._diagram.init(
      this.container.querySelector('#mac-canvas'),
      TOPOLOGY,
      { width: 1000, height: 650 }
    );

    this._bindControls();
  }

  _renderEmptyTable() {
    return `<div style="text-align:center; padding:1.5rem; color:#4a4a5e;">
      <div style="font-size:1.5rem; margin-bottom:0.25rem;">🗂️</div>
      <div style="font-size:0.75rem;">Table Empty</div>
      <div style="font-size:0.6rem; color:#6c757d; margin-top:0.25rem;">Frames will be flooded</div>
    </div>`;
  }

  _renderMacRow(mac, port, isNew = false, deviceName = null, type = 'Dynamic') {
    return `
      <div class="mac-entry" style="display:grid; grid-template-columns:1.5fr 0.8fr 0.7fr 0.8fr; padding:0.5rem 0; border-bottom:1px solid #252538; ${isNew ? 'animation:slideIn 0.6s ease; background:linear-gradient(90deg, rgba(78,205,196,0.1), transparent);' : ''}">
        <div style="font-family:var(--font-mono); font-size:0.65rem;">
          <span style="color:#4ECDC4;">${mac.substring(0,8)}</span><span style="color:#6c757d;">${mac.substring(8)}</span>
        </div>
        <span style="font-family:var(--font-mono); font-size:0.65rem; color:#FFD93D; font-weight:bold;">${port}</span>
        <span style="font-family:var(--font-mono); font-size:0.55rem; color:#4ECDC4;">${type}</span>
        <span style="font-family:var(--font-mono); font-size:0.6rem; color:#FF6B6B;">${deviceName || '—'}</span>
      </div>
    `;
  }

  _bindControls() {
    this.container.querySelector('#mac-step-btn')?.addEventListener('click', () => {
      if (!this._running) this._runScenario();
    });
    this.container.querySelector('#mac-auto-btn')?.addEventListener('click', () => {
      if (!this._running) this._autoPlay();
    });
    this.container.querySelector('#mac-reset-btn')?.addEventListener('click', () => {
      this._running = false;
      this.reset();
    });
  }

  async _runScenario() {
    if (this._step >= SCENARIOS.length || this._running) return;
    this._running = true;

    const scenario = SCENARIOS[this._step];

    this._updatePanel(scenario.explanation);

    // Update packet type and label displays
    const packetTypeDisplay = this.container.querySelector('#packet-type-display');
    const packetLabelDisplay = this.container.querySelector('#packet-label-display');
    if (packetTypeDisplay) packetTypeDisplay.textContent = scenario.packetType;
    if (packetLabelDisplay) packetLabelDisplay.textContent = scenario.packetLabel;

    const decisionBadge = this.container.querySelector('#decision-badge');
    const decisionText = this.container.querySelector('#decision-text');
    
    const alreadyKnownDst = !!this._macTable[scenario.dstMac];

    // Update decision badge
    if (decisionBadge && decisionText) {
      decisionBadge.style.display = 'block';
      if (alreadyKnownDst) {
        decisionBadge.style.borderColor = '#4ECDC4';
        decisionText.textContent = '✅ DIRECT FORWARD';
        decisionText.style.color = '#4ECDC4';
      } else {
        decisionBadge.style.borderColor = '#FF6B6B';
        decisionText.textContent = '📡 FLOOD (Unknown)';
        decisionText.style.color = '#FF6B6B';
      }
    }

    // Highlight decision rows
    const decisionRows = this.container.querySelectorAll('.decision-row');
    decisionRows.forEach(row => {
      if (alreadyKnownDst && row.dataset.type === 'known') {
        row.style.borderLeftWidth = '5px';
        row.style.background = 'rgba(78,205,196,0.2)';
      } else if (!alreadyKnownDst && row.dataset.type === 'unknown') {
        row.style.borderLeftWidth = '5px';
        row.style.background = 'rgba(255,107,107,0.2)';
      } else {
        row.style.borderLeftWidth = '3px';
        row.style.background = '#1a1a2e';
      }
    });

    // SLOWER Step 1: Animate frame arriving at switch
    this._diagram.highlightNode(scenario.from, 'active', 1000);
    await this._diagram.animatePacket([scenario.from, 'sw1'], { type: 'data', label: scenario.packetType, speed: 1200 });
    
    await sleep(500);

    // SLOWER Step 2: Learn source MAC with highlighted animation
    this._macTable[scenario.srcMac] = { port: scenario.srcPort, device: scenario.deviceName };
    this._updateTableDisplay();
    
    this._diagram.highlightNode('sw1', 'hop', 1500);
    await sleep(1000);

    // SLOWER Step 3: Forwarding decision animation
    if (alreadyKnownDst) {
      const dstNode = TOPOLOGY.nodes.find(n => n.mac === scenario.dstMac);
      if (dstNode) {
        await this._diagram.animatePacket(['sw1', dstNode.id], { type: 'unicast', label: scenario.packetType, speed: 1000 });
        this._diagram.highlightNode(dstNode.id, 'success', 1500);
      }
    } else {
      const targets = TOPOLOGY.nodes
        .filter(n => n.id !== 'sw1' && n.id !== scenario.from)
        .map(n => n.id);
      await this._diagram.animateBroadcast('sw1', targets, { type: 'broadcast', label: scenario.packetType, speed: 1000 });
    }

    this._step++;
    this._running = false;

    if (decisionBadge) decisionBadge.style.display = 'none';

    if (this._step >= SCENARIOS.length) {
      const btn = this.container.querySelector('#mac-step-btn');
      if (btn) { btn.textContent = '✓ Complete!'; btn.disabled = true; }
      showToast('🎉 All MAC addresses learned! CAM table complete!', 'success');
      stateManager.mergeState('userProgress', {
        completedModules: [...new Set([
          ...(stateManager.getState('userProgress').completedModules || []),
          '/mac-table'
        ])]
      });
    }
  }

  async _autoPlay() {
    while (this._step < SCENARIOS.length && !this._running) {
      await this._runScenario();
      await sleep(2500);
    }
  }

  _updatePanel(log) {
    const l = this.container.querySelector('#mac-step-log');
    if (l) l.innerHTML = log;
  }

  _updateTableDisplay() {
    const display = this.container.querySelector('#mac-table-display');
    const bar = this.container.querySelector('#mac-table-bar');
    const countEl = this.container.querySelector('#entry-count');

    const entries = Object.entries(this._macTable);
    if (bar) bar.style.width = `${(entries.length / 4) * 100}%`;
    if (countEl) countEl.textContent = entries.length;

    if (!entries.length) {
      if (display) display.innerHTML = this._renderEmptyTable();
      return;
    }

    if (display) {
      display.innerHTML = entries.map(([mac, info], idx) => {
        const isNew = idx === entries.length - 1;
        return this._renderMacRow(mac, info.port, isNew, info.device);
      }).join('');
    }

    stateManager.setState('macTable', { ...this._macTable });
  }

  start() { this._runScenario(); }
  step() { this._runScenario(); }

  reset() {
    this._step = 0;
    this._running = false;
    this._macTable = {};
    if (this._diagram) this._diagram.reset();
    if (this.container) this._render();
  }

  destroy() {
    this._running = false;
    if (this._diagram) this._diagram.destroy();
    this.container = null;
  }
}

export default new MacTableSimulation();
