/**
 * routingTableSimulator.js — Complete Rework
 * Interactive Routing Table & Longest Prefix Match Educational Simulator
 * 
 * Features:
 * - Interactive topology with animated packet flow
 * - Step-by-step routing decision teaching
 * - Longest Prefix Match visualization
 * - Multiple routing protocol explanations
 * - Real-time CLI integration
 * - Learning mode with explanations
 * 
 * Module contract: init(el), start(), reset(), destroy()
 */

import { createNetworkDiagram } from '../components/networkDiagram.js';
import { isValidIP, isSameSubnet, ipToInt, intToIP } from '../utils/ipUtils.js';
import { stateManager } from '../js/stateManager.js';
import { sleep, showToast, escapeHtml } from '../utils/helperFunctions.js';

// ══════════════════════════════════════════════════════════════════════════
//  TOPOLOGY CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════

const TOPOLOGY = {
  nodes: [
    { id: 'pca', type: 'pc', label: 'PC-A', x: 80, y: 100, ip: '10.0.1.10' },
    { id: 'sw1', type: 'switch', label: 'SW1', x: 220, y: 100 },
    { id: 'pcb', type: 'pc', label: 'PC-B', x: 80, y: 280, ip: '10.0.2.10' },
    { id: 'sw2', type: 'switch', label: 'SW2', x: 220, y: 280 },
    { id: 'r1', type: 'router', label: 'R1', x: 420, y: 190 },
    { id: 'r2', type: 'router', label: 'R2', x: 620, y: 100, ip: '172.16.0.1' },
    { id: 'isp', type: 'cloud', label: 'Internet', x: 620, y: 280, ip: '203.0.113.1' },
    { id: 'server', type: 'server', label: 'Server', x: 720, y: 100, ip: '192.168.1.10' },
  ],
  links: [
    { from: 'pca', to: 'sw1', label: 'Fa0/1' },
    { from: 'sw1', to: 'r1', label: 'Gi0/0', subnet: '10.0.1.0/24' },
    { from: 'pcb', to: 'sw2', label: 'Fa0/1' },
    { from: 'sw2', to: 'r1', label: 'Gi0/1', subnet: '10.0.2.0/24' },
    { from: 'r1', to: 'r2', label: 'Gi0/2', subnet: '172.16.0.0/30' },
    { from: 'r1', to: 'isp', label: 'Gi0/3', subnet: '203.0.113.0/30' },
    { from: 'r2', to: 'server', label: 'Gi0/1', subnet: '192.168.1.0/24' },
  ],
};

// ══════════════════════════════════════════════════════════════════════════
//  ROUTING TABLE ENTRIES
// ══════════════════════════════════════════════════════════════════════════

const ROUTING_TABLE = [
  {
    id: 0,
    network: '10.0.1.0',
    prefix: 24,
    nextHop: 'Direct',
    iface: 'Gi0/0',
    ad: 0,
    metric: 0,
    source: 'C',
    sourceLabel: 'Connected',
    nodeId: 'sw1',
    desc: 'LAN-A Network',
    color: '#00e676',
  },
  {
    id: 1,
    network: '10.0.2.0',
    prefix: 24,
    nextHop: 'Direct',
    iface: 'Gi0/1',
    ad: 0,
    metric: 0,
    source: 'C',
    sourceLabel: 'Connected',
    nodeId: 'sw2',
    desc: 'LAN-B Network',
    color: '#00e676',
  },
  {
    id: 2,
    network: '10.0.0.0',
    prefix: 8,
    nextHop: '172.16.0.1',
    iface: 'Gi0/2',
    ad: 90,
    metric: 156160,
    source: 'D',
    sourceLabel: 'EIGRP',
    nodeId: 'r2',
    desc: 'EIGRP Summary Route',
    color: '#ffb800',
  },
  {
    id: 3,
    network: '172.16.0.0',
    prefix: 16,
    nextHop: '172.16.0.1',
    iface: 'Gi0/2',
    ad: 90,
    metric: 28160,
    source: 'D',
    sourceLabel: 'EIGRP',
    nodeId: 'r2',
    desc: 'Enterprise Network',
    color: '#ffb800',
  },
  {
    id: 4,
    network: '172.16.1.0',
    prefix: 24,
    nextHop: '172.16.0.1',
    iface: 'Gi0/2',
    ad: 110,
    metric: 20,
    source: 'O',
    sourceLabel: 'OSPF',
    nodeId: 'r2',
    desc: 'OSPF Route',
    color: '#ef4444',
  },
  {
    id: 5,
    network: '192.168.1.0',
    prefix: 24,
    nextHop: '172.16.0.1',
    iface: 'Gi0/2',
    ad: 110,
    metric: 30,
    source: 'O',
    sourceLabel: 'OSPF',
    nodeId: 'server',
    desc: 'DMZ Network',
    color: '#ef4444',
  },
  {
    id: 6,
    network: '0.0.0.0',
    prefix: 0,
    nextHop: '203.0.113.1',
    iface: 'Gi0/3',
    ad: 1,
    metric: 0,
    source: 'S*',
    sourceLabel: 'Static',
    nodeId: 'isp',
    desc: 'Default Gateway',
    color: '#00d4ff',
  },
];

// ══════════════════════════════════════════════════════════════════════════
//  TEST SCENARIOS
// ══════════════════════════════════════════════════════════════════════════

const SCENARIOS = [
  { ip: '10.0.1.55', label: 'Local LAN-A', desc: 'Same subnet as PC-A' },
  { ip: '10.0.2.100', label: 'Local LAN-B', desc: 'Reachable via Gi0/1' },
  { ip: '10.5.5.5', label: '10.x.x.x Network', desc: 'Matches EIGRP summary' },
  { ip: '172.16.5.1', label: '172.16.x.x', desc: 'Matches EIGRP 172.16/16' },
  { ip: '172.16.1.50', label: 'Specific /24', desc: 'Longest match: OSPF /24' },
  { ip: '192.168.1.50', label: 'DMZ Server', desc: 'Matches OSPF /24' },
  { ip: '8.8.8.8', label: 'Internet', desc: 'Default route' },
];

// ══════════════════════════════════════════════════════════════════════════
//  MODULE CLASS
// ══════════════════════════════════════════════════════════════════════════

class RoutingTableSimulator {
  constructor() {
    this.container = null;
    this._diagram = null;
    this._running = false;
    this._destroyed = false;
    this._currentStep = 0;
    this._learningMode = true;
  }

  // ── LIFECYCLE ─────────────────────────────────────────────────────────────

  init(containerEl) {
    this.container = containerEl;
    this._diagram = createNetworkDiagram();
    this._destroyed = false;
    this._injectStyles();
    this._render();
  }

  start() {}
  step() {}

  reset() {
    this._running = false;
    this._currentStep = 0;
    if (this._diagram) this._diagram.reset();
    if (this.container) this._render();
  }

  destroy() {
    this._running = false;
    this._destroyed = true;
    if (this._diagram) {
      this._diagram.destroy();
      this._diagram = null;
    }
    this.container = null;
  }

  // ── RENDER ─────────────────────────────────────────────────────────────

  _render() {
    this.container.innerHTML = `
      <div class="rts-wrapper">
        <!-- Header -->
        <div class="rts-header">
          <div class="rts-header__breadcrumb">
            <a href="#/">Home</a> › <span>Simulations</span> › <span>Routing Table</span>
          </div>
          <h1 class="rts-header__title">
            <span class="rts-header__icon">🌐</span>
            Routing Table Simulator
          </h1>
          <p class="rts-header__desc">
            Learn how routers make forwarding decisions using <strong>Longest Prefix Match</strong>. 
            Send packets and watch the router evaluate each route entry step-by-step.
          </p>
        </div>

        <!-- Main Grid -->
        <div class="rts-grid">
          
          <!-- Left Column -->
          <div class="rts-left">
            
            <!-- Topology -->
            <div class="rts-card rts-topology">
              <div class="rts-card__header">
                <span>🖥️</span>
                <span>Network Topology</span>
                <button class="rts-mode-toggle" id="rts-mode-toggle">
                  ${this._learningMode ? '🎓 Learning Mode: ON' : '🎯 Practice Mode'}
                </button>
              </div>
              <div class="rts-topology__canvas" id="rts-canvas"></div>
              <div class="rts-topology__legend">
                <span class="rts-legend-item"><span class="rts-dot" style="background:#00e676"></span>Connected</span>
                <span class="rts-legend-item"><span class="rts-dot" style="background:#ffb800"></span>EIGRP</span>
                <span class="rts-legend-item"><span class="rts-dot" style="background:#ef4444"></span>OSPF</span>
                <span class="rts-legend-item"><span class="rts-dot" style="background:#00d4ff"></span>Static</span>
              </div>
            </div>

            <!-- Learning Panel -->
            <div class="rts-card rts-learning" id="rts-learning-panel">
              <div class="rts-card__header">
                <span>🧠</span>
                <span>Router Decision Process</span>
              </div>
              <div class="rts-learning__steps" id="rts-learning-steps">
                ${this._renderLearningSteps()}
              </div>
            </div>

            <!-- Packet Sender -->
            <div class="rts-card rts-sender">
              <div class="rts-card__header">
                <span>📤</span>
                <span>Packet Sender</span>
              </div>
              <div class="rts-sender__content">
                <div class="rts-sender__input-group">
                  <label>Destination IP:</label>
                  <input type="text" id="rts-dest-ip" class="rts-sender__input" 
                         value="10.0.1.55" placeholder="e.g., 192.168.1.1">
                </div>
                <div class="rts-sender__actions">
                  <button class="rts-btn rts-btn--primary" id="rts-send-btn">
                    🚀 Send Packet
                  </button>
                  <button class="rts-btn rts-btn--secondary" id="rts-reset-btn">
                    ↺ Reset
                  </button>
                </div>
              </div>
              <div class="rts-sender__scenarios">
                <span class="rts-sender__label">Quick Tests:</span>
                <div class="rts-scenario-btns">
                  ${SCENARIOS.map(s => `
                    <button class="rts-scenario-btn" data-ip="${s.ip}" title="${s.desc}">
                      ${s.label}
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Result Panel -->
            <div class="rts-card rts-result">
              <div class="rts-card__header">
                <span id="rts-result-icon">📋</span>
                <span id="rts-result-title">Routing Decision</span>
              </div>
              <div class="rts-result__body" id="rts-result-body">
                <p>Enter a destination IP address and click <strong>Send Packet</strong> to see how the router selects the best route.</p>
                <div class="rts-result__hint">
                  <strong>Tip:</strong> The router uses Longest Prefix Match — the route with the most specific (longest) prefix wins!
                </div>
              </div>
            </div>

          </div>

          <!-- Right Column -->
          <div class="rts-right">
            
            <!-- Routing Table -->
            <div class="rts-card rts-table-card">
              <div class="rts-card__header">
                <span>📋</span>
                <span>R1 Routing Table</span>
                <span class="rts-table__entries">${ROUTING_TABLE.length} entries</span>
              </div>
              <div class="rts-table-wrapper">
                <table class="rts-table">
                  <thead>
                    <tr>
                      <th>Src</th>
                      <th>Network/Prefix</th>
                      <th>Next Hop</th>
                      <th>Intf</th>
                      <th>AD/Metric</th>
                    </tr>
                  </thead>
                  <tbody id="rts-tbody">
                    ${ROUTING_TABLE.map((r, i) => this._renderTableRow(r, i)).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- CLI Panel 1 -->
            <div class="rts-card rts-cli">
              <div class="rts-cli__header">
                <span class="rts-cli__prompt">R1#</span>
                <span class="rts-cli__cmd">show ip route</span>
              </div>
              <div class="rts-cli__body" id="rts-cli-route">
                ${this._renderCliRoute()}
              </div>
            </div>

            <!-- CLI Panel 2 -->
            <div class="rts-card rts-cli">
              <div class="rts-cli__header">
                <span class="rts-cli__prompt">R1#</span>
                <span class="rts-cli__cmd">show ip int brief</span>
              </div>
              <div class="rts-cli__body">
                ${this._renderCliIntf()}
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    // Initialize topology
    this._diagram.init(
      this.container.querySelector('#rts-canvas'),
      TOPOLOGY,
      { width: 860, height: 360 }
    );

    this._bindEvents();
  }

  _renderLearningSteps() {
    const steps = [
      { num: 1, title: 'Packet Arrives', desc: 'Router receives packet' },
      { num: 2, title: 'Read Destination', desc: 'Extract destination IP' },
      { num: 3, title: 'Scan Table', desc: 'Check each route entry' },
      { num: 4, title: 'Find Matches', desc: 'Identify matching routes' },
      { num: 5, title: 'LPM', desc: 'Select longest prefix' },
      { num: 6, title: 'Forward', desc: 'Send out interface' },
    ];
    
    return steps.map((s, i) => `
      <div class="rts-learning__step" data-step="${i}" id="rts-step-${i}">
        <span class="rts-learning__step-num">${s.num}</span>
        <div class="rts-learning__step-content">
          <span class="rts-learning__step-title">${s.title}</span>
          <span class="rts-learning__step-desc">${s.desc}</span>
        </div>
      </div>
    `).join('');
  }

  _renderTableRow(route, index) {
    const prefixDisplay = `${route.network}/${route.prefix}`;
    const nextHopDisplay = route.nextHop === 'Direct' ? 'Directly Connected' : route.nextHop;
    const metricDisplay = route.metric > 1000 
      ? `${(route.metric / 1000).toFixed(1)}k` 
      : route.metric;
    
    return `
      <tr class="rts-table__row" data-index="${index}" id="rts-row-${index}">
        <td>
          <span class="rts-table__src" style="background:${route.color}22;color:${route.color}">
            ${route.source}
          </span>
        </td>
        <td>
          <span class="rts-table__network">${route.network}</span>
          <span class="rts-table__prefix">/${route.prefix}</span>
        </td>
        <td>
          <span class="rts-table__nexthop">${nextHopDisplay}</span>
        </td>
        <td>
          <span class="rts-table__iface">${route.iface}</span>
        </td>
        <td>
          <span class="rts-table__metric">${route.ad}/${metricDisplay}</span>
        </td>
      </tr>
    `;
  }

  _renderCliRoute() {
    const routeLines = ROUTING_TABLE.map(r => {
      const code = r.source;
      const color = r.color;
      const line = r.source === 'C' 
        ? `C      ${r.network}/${r.prefix} is directly connected, ${r.iface}`
        : r.source === 'S*'
        ? `S*     ${r.network}/${r.prefix} [${r.ad}/${r.metric}] via ${r.nextHop}, ${r.iface}`
        : `${code}      ${r.network}/${r.prefix} [${r.ad}/${r.metric}] via ${r.nextHop}, ${r.iface}`;
      return `<div class="rts-cli__line" data-route="${r.id}" style="color:${color}">${line}</div>`;
    });
    
    return `
      <div class="rts-cli__comment">Codes: C - Connected, S - Static,</div>
      <div class="rts-cli__comment">D - EIGRP, O - OSPF, S* - Default</div>
      <div style="height:8px"></div>
      ${routeLines.join('')}
    `;
  }

  _renderCliIntf() {
    const ifaces = [
      { name: 'Gi0/0', ip: '10.0.1.1', status: 'up', proto: 'up' },
      { name: 'Gi0/1', ip: '10.0.2.1', status: 'up', proto: 'up' },
      { name: 'Gi0/2', ip: '172.16.0.2', status: 'up', proto: 'up' },
      { name: 'Gi0/3', ip: '203.0.113.2', status: 'up', proto: 'up' },
    ];
    
    return ifaces.map(i => `
      <div class="rts-cli__line" style="color:#00d4ff">${i.name.padEnd(10)}${i.ip.padEnd(15)}${i.status}   ${i.proto}</div>
    `).join('');
  }

  // ── EVENT BINDING ─────────────────────────────────────────────────────

  _bindEvents() {
    // Send button
    this.container.querySelector('#rts-send-btn')?.addEventListener('click', () => {
      const ip = this.container.querySelector('#rts-dest-ip')?.value?.trim();
      if (ip) this._runSimulation(ip);
    });

    // Enter key
    this.container.querySelector('#rts-dest-ip')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const ip = e.target.value?.trim();
        if (ip) this._runSimulation(ip);
      }
    });

    // Reset button
    this.container.querySelector('#rts-reset-btn')?.addEventListener('click', () => {
      this._resetSimulation();
    });

    // Scenario buttons
    this.container.querySelectorAll('.rts-scenario-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ip = btn.dataset.ip;
        const input = this.container.querySelector('#rts-dest-ip');
        if (input) input.value = ip;
        this._runSimulation(ip);
      });
    });

    // Mode toggle
    this.container.querySelector('#rts-mode-toggle')?.addEventListener('click', () => {
      this._learningMode = !this._learningMode;
      this.container.querySelector('#rts-mode-toggle').innerHTML = 
        this._learningMode ? '🎓 Learning Mode: ON' : '🎯 Practice Mode';
    });
  }

  // ── SIMULATION ─────────────────────────────────────────────────────────

  async _runSimulation(destIP) {
    if (this._running) return;
    
    if (!isValidIP(destIP)) {
      this._showResult('❌ Invalid IP', `
        <p style="color:#ef4444">"${escapeHtml(destIP)}" is not a valid IPv4 address.</p>
        <p>Please enter a valid IP like 192.168.1.1</p>
      `, 'error');
      return;
    }

    this._running = true;
    const abort = () => this._destroyed || !this._running || !this.container;

    // Reset state
    this._resetHighlight();
    this._setLearningStep(-1);

    // Step 1: Packet arrives
    this._setLearningStep(0);
    this._showResult('📥 Packet Received', `
      <p>Router received packet destined for <strong>${destIP}</strong></p>
      <p class="rts-result__sub">Analyzing routing table...</p>
    `, 'processing');
    
    await this._animatePacketFromSource(destIP);
    if (abort()) return;

    // Step 2: Read destination
    this._setLearningStep(1);
    await sleep(this._learningMode ? 400 : 100);

    // Step 3: Scan table
    this._setLearningStep(2);
    this._showResult('🔍 Scanning Routes', `
      <p>Router scanning each route entry...</p>
      <p class="rts-result__sub">Looking for matching network</p>
    `, 'processing');

    let bestRoute = null;
    let bestPrefix = -1;
    let bestIndex = -1;
    const matchedIndices = [];

    for (let i = 0; i < ROUTING_TABLE.length; i++) {
      if (abort()) { this._running = false; return; }

      const route = ROUTING_TABLE[i];
      
      // Highlight current row
      this._highlightRow(i, 'scanning');
      this._highlightCliRoute(i, 'scanning');
      
      await sleep(this._learningMode ? 300 : 150);
      if (abort()) return;

      const matched = isSameSubnet(destIP, route.network, route.prefix);

      if (matched) {
        matchedIndices.push(i);
        this._highlightRow(i, 'matched');
        this._highlightCliRoute(i, 'matched');
        
        // Check if this is a longer prefix
        if (route.prefix > bestPrefix) {
          // Demote previous best if exists
          if (bestIndex >= 0) {
            this._highlightRow(bestIndex, 'matched');
            this._highlightCliRoute(bestIndex, 'matched');
          }
          bestPrefix = route.prefix;
          bestRoute = route;
          bestIndex = i;
          this._highlightRow(i, 'best');
          this._highlightCliRoute(i, 'best');
          
          this._showResult('✅ Route Match!', `
            <p><strong>${route.network}/${route.prefix}</strong> matches!</p>
            <p class="rts-result__sub">Prefix length: /${route.prefix}</p>
          `, 'matched');
        }
      } else {
        this._highlightRow(i, 'no-match');
      }
      
      await sleep(this._learningMode ? 200 : 100);
    }

    if (abort()) return;

    // Step 4 & 5: LPM Selection
    this._setLearningStep(4);

    if (bestRoute) {
      // Show LPM explanation if multiple matches
      if (matchedIndices.length > 1) {
        const otherMatches = matchedIndices
          .filter(i => i !== bestIndex)
          .map(i => ROUTING_TABLE[i])
          .map(r => `<span style="color:${r.color}">${r.network}/${r.prefix}</span>`)
          .join(', ');
        
        this._showResult('🎯 Longest Prefix Match', `
          <p>Multiple routes match! Router selects the <strong>longest prefix</strong>.</p>
          <p>Matched: ${otherMatches}</p>
          <p>Winner: <strong style="color:${bestRoute.color}">${bestRoute.network}/${bestRoute.prefix}</strong> (/${bestRoute.prefix} bits)</p>
        `, 'success');
        await sleep(this._learningMode ? 800 : 400);
      }

      // Step 6: Forward
      this._setLearningStep(5);
      
      this._highlightRow(bestIndex, 'winner');
      this._highlightCliRoute(bestIndex, 'winner');

      this._showResult('🚀 Forwarding Packet', `
        <div class="rts-result__winner">
          <span class="rts-result__route">
            <strong style="color:${bestRoute.color}">${bestRoute.network}/${bestRoute.prefix}</strong>
          </span>
          <span>Selected</span>
        </div>
        <div class="rts-result__details">
          <div><span>Next Hop:</span> <strong>${bestRoute.nextHop}</strong></div>
          <div><span>Interface:</span> <strong>${bestRoute.iface}</strong></div>
          <div><span>Route Type:</span> <strong style="color:${bestRoute.color}">${bestRoute.sourceLabel}</strong></div>
          <div><span>AD/Metric:</span> <strong>${bestRoute.ad}/${bestRoute.metric}</strong></div>
        </div>
        <p class="rts-result__desc">${bestRoute.desc}</p>
      `, 'success');

      // Animate packet through network
      await this._animatePacketFlow(destIP, bestRoute);

      // Mark complete
      this._diagram.highlightNode(bestRoute.nodeId, 'success', 2000);
      
      // Save progress
      this._saveProgress();
      
    } else {
      // No route found
      this._showResult('❌ No Route Found', `
        <p>Destination <strong>${destIP}</strong> does not match any route in the table.</p>
        <p>The packet would be <strong>dropped</strong> (undeliverable).</p>
        <p class="rts-result__hint">This would trigger an ICMP Destination Unreachable message.</p>
      `, 'error');
      
      this._diagram.highlightNode('r1', 'error', 2000);
    }

    this._running = false;
  }

  async _animatePacketFromSource(destIP) {
    const abort = () => this._destroyed || !this._running || !this.container;
    
    // Start from PC-A (source)
    await this._diagram.animatePacket(['pca', 'sw1'], {
      type: 'data', label: destIP, speed: 500,
    });
    if (abort()) return;
    
    await this._diagram.animatePacket(['sw1', 'r1'], {
      type: 'data', label: destIP, speed: 500,
    });
  }

  async _animatePacketFlow(destIP, route) {
    const abort = () => this._destroyed || !this._running || !this.container;
    
    // Highlight router processing
    this._diagram.highlightNode('r1', 'active', 500);
    await sleep(500);
    if (abort()) return;
    
    // Forward to next hop
    await this._diagram.animatePacket(['r1', route.nodeId], {
      type: 'data', label: destIP, speed: 600,
    });
  }

  // ── HIGHLIGHTING ─────────────────────────────────────────────────────

  _highlightRow(index, state) {
    const row = this.container?.querySelector(`#rts-row-${index}`);
    if (!row) return;
    
    row.className = 'rts-table__row';
    row.classList.add(`rts-table__row--${state}`);
  }

  _highlightCliRoute(index, state) {
    const lines = this.container?.querySelectorAll('#rts-cli-route .rts-cli__line');
    lines?.forEach((line, i) => {
      if (i === index + 3) { // Skip comments
        line.className = 'rts-cli__line';
        if (state !== 'no-match') line.classList.add(`rts-cli__line--${state}`);
      }
    });
  }

  _resetHighlight() {
    ROUTING_TABLE.forEach((_, i) => {
      this._highlightRow(i, '');
    });
    
    const lines = this.container?.querySelectorAll('#rts-cli-route .rts-cli__line');
    lines?.forEach(line => {
      line.className = 'rts-cli__line';
    });
  }

  _setLearningStep(step) {
    if (!this._learningMode) return;
    
    const steps = this.container?.querySelectorAll('.rts-learning__step');
    steps?.forEach((el, i) => {
      el.classList.remove('active', 'completed');
      if (i < step) el.classList.add('completed');
      if (i === step) el.classList.add('active');
    });
  }

  // ── RESULTS ─────────────────────────────────────────────────────────

  _showResult(title, html, type = 'info') {
    const icon = this.container?.querySelector('#rts-result-icon');
    const titleEl = this.container?.querySelector('#rts-result-title');
    const body = this.container?.querySelector('#rts-result-body');
    
    if (icon) icon.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : '📋';
    if (titleEl) titleEl.textContent = title;
    if (body) body.innerHTML = html;
  }

  _resetSimulation() {
    this._running = false;
    this._currentStep = 0;
    
    this._resetHighlight();
    this._setLearningStep(-1);
    this._diagram?.reset();
    
    this._showResult('📋 Routing Decision', `
      <p>Enter a destination IP address and click <strong>Send Packet</strong> to see how the router selects the best route.</p>
      <div class="rts-result__hint">
        <strong>Tip:</strong> The router uses Longest Prefix Match — the route with the most specific (longest) prefix wins!
      </div>
    `, 'info');
    
    const input = this.container?.querySelector('#rts-dest-ip');
    if (input) input.value = '10.0.1.55';
  }

  _saveProgress() {
    stateManager.mergeState('userProgress', {
      completedModules: [
        ...new Set([
          ...(stateManager.getState('userProgress')?.completedModules || []),
          '/routing-table',
        ]),
      ],
    });
  }

  // ── STYLES ─────────────────────────────────────────────────────────

  _injectStyles() {
    if (document.getElementById('rts-styles')) return;
    
    const s = document.createElement('style');
    s.id = 'rts-styles';
    s.textContent = `
      .rts-wrapper {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      /* Header */
      .rts-header {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 1.5rem 2rem;
      }
      .rts-header__breadcrumb {
        font-size: 0.75rem;
        color: #64748b;
        margin-bottom: 0.5rem;
      }
      .rts-header__breadcrumb a { color: #94a3b8; text-decoration: none; }
      .rts-header__breadcrumb a:hover { color: #00d4ff; }
      .rts-header__title {
        font: 700 1.75rem 'Syne', sans-serif;
        color: #f1f5f9;
        margin: 0 0 0.5rem 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .rts-header__icon { font-size: 1.5rem; }
      .rts-header__desc {
        color: #94a3b8;
        font-size: 0.95rem;
        line-height: 1.6;
        margin: 0;
      }
      .rts-header__desc strong { color: #00d4ff; }

      /* Grid Layout */
      .rts-grid {
        display: grid;
        grid-template-columns: 1fr 420px;
        gap: 1.25rem;
        align-items: start;
      }
      .rts-left { display: flex; flex-direction: column; gap: 1rem; }
      .rts-right { display: flex; flex-direction: column; gap: 1rem; position: sticky; top: 1rem; }

      /* Cards */
      .rts-card {
        background: #111827;
        border: 1px solid #1e293b;
        border-radius: 12px;
        overflow: hidden;
      }
      .rts-card__header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: #0f172a;
        border-bottom: 1px solid #1e293b;
        font: 600 0.8rem 'Syne', sans-serif;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .rts-card__header span:first-child { font-size: 1rem; }

      /* Topology */
      .rts-topology__canvas {
        background: #0a0f1a;
        min-height: 360px;
      }
      .rts-topology__legend {
        display: flex;
        gap: 1rem;
        padding: 0.75rem 1rem;
        background: #0f172a;
        border-top: 1px solid #1e293b;
        flex-wrap: wrap;
      }
      .rts-legend-item {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.7rem;
        color: #64748b;
      }
      .rts-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      .rts-mode-toggle {
        margin-left: auto;
        background: #1e293b;
        border: 1px solid #334155;
        color: #94a3b8;
        padding: 0.35rem 0.75rem;
        border-radius: 6px;
        font-size: 0.7rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      .rts-mode-toggle:hover {
        border-color: #00d4ff;
        color: #00d4ff;
      }

      /* Learning Panel */
      .rts-learning__steps {
        display: flex;
        gap: 0.5rem;
        padding: 0.75rem;
        overflow-x: auto;
      }
      .rts-learning__step {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: #1e293b;
        border-radius: 8px;
        border: 1px solid transparent;
        transition: all 0.3s;
        flex-shrink: 0;
      }
      .rts-learning__step.active {
        background: rgba(0, 212, 255, 0.1);
        border-color: #00d4ff;
      }
      .rts-learning__step.completed {
        background: rgba(34, 197, 94, 0.1);
        border-color: #22c55e;
      }
      .rts-learning__step-num {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #334155;
        border-radius: 50%;
        font: 700 0.65rem 'JetBrains Mono', monospace;
        color: #94a3b8;
      }
      .rts-learning__step.active .rts-learning__step-num {
        background: #00d4ff;
        color: #000;
      }
      .rts-learning__step.completed .rts-learning__step-num {
        background: #22c55e;
        color: #000;
      }
      .rts-learning__step-content {
        display: flex;
        flex-direction: column;
      }
      .rts-learning__step-title {
        font: 600 0.7rem 'Syne', sans-serif;
        color: #e2e8f0;
      }
      .rts-learning__step-desc {
        font-size: 0.6rem;
        color: #64748b;
      }

      /* Packet Sender */
      .rts-sender__content {
        padding: 1rem;
      }
      .rts-sender__input-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .rts-sender__input-group label {
        font-size: 0.8rem;
        color: #94a3b8;
        white-space: nowrap;
      }
      .rts-sender__input {
        flex: 1;
        padding: 0.6rem 0.875rem;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 8px;
        color: #f1f5f9;
        font: 600 0.9rem 'JetBrains Mono', monospace;
        outline: none;
        transition: border-color 0.2s;
      }
      .rts-sender__input:focus {
        border-color: #00d4ff;
      }
      .rts-sender__actions {
        display: flex;
        gap: 0.75rem;
      }
      .rts-btn {
        flex: 1;
        padding: 0.65rem 1rem;
        border: none;
        border-radius: 8px;
        font: 600 0.8rem 'Syne', sans-serif;
        cursor: pointer;
        transition: all 0.2s;
      }
      .rts-btn--primary {
        background: linear-gradient(135deg, #00d4ff 0%, #0891b2 100%);
        color: #000;
      }
      .rts-btn--primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
      }
      .rts-btn--secondary {
        background: #1e293b;
        border: 1px solid #334155;
        color: #94a3b8;
      }
      .rts-btn--secondary:hover {
        border-color: #64748b;
        color: #e2e8f0;
      }
      .rts-sender__scenarios {
        padding: 0.75rem 1rem;
        background: #0f172a;
        border-top: 1px solid #1e293b;
      }
      .rts-sender__label {
        font-size: 0.7rem;
        color: #64748b;
        display: block;
        margin-bottom: 0.5rem;
      }
      .rts-scenario-btns {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      .rts-scenario-btn {
        padding: 0.3rem 0.6rem;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 6px;
        color: #94a3b8;
        font: 500 0.65rem 'JetBrains Mono', monospace;
        cursor: pointer;
        transition: all 0.2s;
      }
      .rts-scenario-btn:hover {
        border-color: #00d4ff;
        color: #00d4ff;
        background: rgba(0, 212, 255, 0.1);
      }

      /* Result Panel */
      .rts-result__body {
        padding: 1rem;
        font-size: 0.85rem;
        color: #cbd5e1;
        line-height: 1.7;
      }
      .rts-result__sub {
        color: #64748b;
        font-size: 0.8rem;
        margin-top: 0.5rem;
      }
      .rts-result__hint {
        margin-top: 1rem;
        padding: 0.75rem;
        background: #0f172a;
        border-radius: 8px;
        font-size: 0.75rem;
        color: #64748b;
      }
      .rts-result__winner {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: rgba(0, 212, 255, 0.1);
        border: 1px solid #00d4ff;
        border-radius: 8px;
        margin-bottom: 0.75rem;
      }
      .rts-result__route {
        font-family: 'JetBrains Mono', monospace;
      }
      .rts-result__details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        padding: 0.75rem;
        background: #0f172a;
        border-radius: 8px;
        font-size: 0.75rem;
        margin-bottom: 0.75rem;
      }
      .rts-result__details span:first-child {
        color: #64748b;
      }
      .rts-result__details strong {
        color: #e2e8f0;
        font-family: 'JetBrains Mono', monospace;
      }
      .rts-result__desc {
        color: #64748b;
        font-size: 0.75rem;
        padding: 0.5rem;
        background: #0f172a;
        border-radius: 6px;
      }

      /* Routing Table */
      .rts-table__entries {
        margin-left: auto;
        font-size: 0.65rem;
        color: #64748b;
        background: #1e293b;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
      }
      .rts-table-wrapper {
        overflow-x: auto;
      }
      .rts-table {
        width: 100%;
        border-collapse: collapse;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
      }
      .rts-table thead tr {
        background: #0f172a;
      }
      .rts-table th {
        padding: 0.6rem 0.5rem;
        text-align: left;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid #1e293b;
      }
      .rts-table td {
        padding: 0.55rem 0.5rem;
        border-bottom: 1px solid #1e293b;
        color: #cbd5e1;
      }
      .rts-table__row {
        transition: all 0.2s;
      }
      .rts-table__row--scanning {
        background: rgba(255, 184, 0, 0.1) !important;
      }
      .rts-table__row--matched {
        background: rgba(34, 197, 94, 0.1);
      }
      .rts-table__row--best {
        background: rgba(255, 184, 0, 0.15);
        border-left: 3px solid #ffb800;
      }
      .rts-table__row--winner {
        background: rgba(0, 212, 255, 0.15) !important;
        border-left: 3px solid #00d4ff;
      }
      .rts-table__row--no-match {
        opacity: 0.4;
      }
      .rts-table__src {
        display: inline-block;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        font-weight: 700;
        font-size: 0.65rem;
      }
      .rts-table__network {
        color: #f1f5f9;
        font-weight: 600;
      }
      .rts-table__prefix {
        color: #64748b;
      }
      .rts-table__nexthop {
        color: #94a3b8;
        font-size: 0.65rem;
      }
      .rts-table__iface {
        color: #ffb800;
        font-weight: 600;
      }
      .rts-table__metric {
        color: #64748b;
        font-size: 0.65rem;
      }

      /* CLI Panels */
      .rts-cli__header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: rgba(0, 212, 255, 0.05);
        border-bottom: 1px solid rgba(0, 212, 255, 0.1);
      }
      .rts-cli__prompt {
        color: #22c55e;
        font: 600 0.7rem 'JetBrains Mono', monospace;
      }
      .rts-cli__cmd {
        color: #ffb800;
        font: 500 0.65rem 'JetBrains Mono', monospace;
      }
      .rts-cli__body {
        padding: 0.75rem;
        background: #050a10;
        font: 500 0.65rem 'JetBrains Mono', monospace;
        line-height: 1.8;
        max-height: 200px;
        overflow-y: auto;
      }
      .rts-cli__comment {
        color: #475569;
      }
      .rts-cli__line {
        transition: all 0.2s;
      }
      .rts-cli__line--scanning {
        background: rgba(255, 184, 0, 0.1);
      }
      .rts-cli__line--matched {
        background: rgba(34, 197, 94, 0.1);
      }
      .rts-cli__line--best {
        background: rgba(255, 184, 0, 0.15);
        font-weight: 700;
      }
      .rts-cli__line--winner {
        background: rgba(0, 212, 255, 0.15);
        font-weight: 700;
      }

      /* Responsive */
      @media (max-width: 1100px) {
        .rts-grid {
          grid-template-columns: 1fr;
        }
        .rts-right {
          position: static;
        }
      }
      @media (max-width: 640px) {
        .rts-header {
          padding: 1rem;
        }
        .rts-header__title {
          font-size: 1.25rem;
        }
        .rts-learning__steps {
          flex-wrap: wrap;
        }
        .rts-learning__step {
          flex: 1 1 calc(50% - 0.25rem);
        }
      }
    `;
    document.head.appendChild(s);
  }
}

export default new RoutingTableSimulator();
