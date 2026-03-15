/**
 * arpSimulator.js — ARP Resolution Simulator
 *
 * Responsibility:
 *   Full interactive simulation of the ARP request/reply process.
 *   Renders SVG topology, animates packet travel, updates ARP cache,
 *   and provides step-by-step plain-English explanations.
 *
 * Dependencies: EventBus, StateManager (optional)
 * Mount point : #view-root (passed via init)
 */

import { eventBus } from '../js/eventBus.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEVICES = {
  PCA: {
    id: 'PCA', label: 'PC-A',
    mac: 'AA:AA:AA:AA:AA:AA', ip: '192.168.1.10',
    x: 100, y: 110,
  },
  SW1: {
    id: 'SW1', label: 'SW1',
    mac: null, ip: null,
    x: 350, y: 110,
    isSwitch: true,
  },
  PCB: {
    id: 'PCB', label: 'PC-B',
    mac: 'BB:BB:BB:BB:BB:BB', ip: '192.168.1.20',
    x: 550, y: 110,
  },
  PCC: {
    id: 'PCC', label: 'PC-C',
    mac: 'CC:CC:CC:CC:CC:CC', ip: '192.168.1.30',
    x: 350, y: 30,
  },
  ROUTER: {
    id: 'ROUTER', label: 'Router',
    mac: 'DD:DD:DD:DD:DD:01', ip: '192.168.1.1',
    x: 350, y: 190,
    isRouter: true,
    sublabel: 'Default Gateway',
  },
};

const LINKS = [
  { from: 'PCA', to: 'SW1' },
  { from: 'SW1', to: 'PCB' },
  { from: 'SW1', to: 'PCC' },
  { from: 'SW1', to: 'ROUTER' },
];

// Each step: what to animate, what to show in the info panels
const SCENARIO_STEPS = [
  {
    title: 'Ready to Start',
    text: 'PC-A wants to send data to <span class="hl-cyan">192.168.1.20</span> (PC-B) but does not know its MAC address. It will send an <span class="hl-amber">ARP Broadcast</span> to every device on the network.',
    layer: null,
    activeDevice: null,
    opCode: null,
    animation: null,
    arpFields: {
      senderMAC: 'AA:AA:AA:AA:AA:AA',
      senderIP:  '192.168.1.10',
      targetMAC: 'FF:FF:FF:FF:FF:FF',
      targetIP:  '192.168.1.20',
      opCode: '1 = Request',
    },
  },
  {
    title: 'Step 1 — PC-A Sends ARP Broadcast',
    text: 'PC-A builds an <span class="hl-amber">ARP Request</span> frame with destination MAC <span class="hl-amber">FF:FF:FF:FF:FF:FF</span> (broadcast). It asks: <em>"Who has 192.168.1.20? Tell AA:AA:AA:AA:AA:AA"</em>',
    layer: 'L2',
    activeDevice: 'PCA',
    opCode: 'request',
    animation: { type: 'travel', from: 'PCA', to: 'SW1', color: '#06b6d4' },
    arpFields: {
      senderMAC: 'AA:AA:AA:AA:AA:AA',
      senderIP:  '192.168.1.10',
      targetMAC: 'FF:FF:FF:FF:FF:FF',
      targetIP:  '192.168.1.20',
      opCode: '1 = Request',
    },
  },
  {
    title: 'Step 2 — Switch Floods All Ports',
    text: 'SW1 receives the broadcast frame. Since the destination is <span class="hl-amber">FF:FF:FF:FF:FF:FF</span>, it <span class="hl-amber">floods</span> the frame out every port except the one it arrived on. Both PC-B and PC-C receive this frame.',
    layer: 'L2',
    activeDevice: 'SW1',
    opCode: 'request',
    animation: { type: 'flood', from: 'SW1', targets: ['PCB', 'PCC', 'ROUTER'], color: '#f59e0b' },
    arpFields: {
      senderMAC: 'AA:AA:AA:AA:AA:AA',
      senderIP:  '192.168.1.10',
      targetMAC: 'FF:FF:FF:FF:FF:FF',
      targetIP:  '192.168.1.20',
      opCode: '1 = Request',
    },
  },
  {
    title: 'Step 3 — PC-C & Router Ignore',
    text: 'PC-C receives the ARP Request and checks the <span class="hl-cyan">Target IP</span>: 192.168.1.20. That does not match its own IP (192.168.1.30). PC-C <span class="hl-amber">silently discards</span> the frame. The Router also ignores it (different subnet context).',
    layer: 'L2',
    activeDevice: 'PCC',
    opCode: 'request',
    animation: { type: 'ignore-multiple', devices: ['PCC', 'ROUTER'] },
    arpFields: {
      senderMAC: 'AA:AA:AA:AA:AA:AA',
      senderIP:  '192.168.1.10',
      targetMAC: 'FF:FF:FF:FF:FF:FF',
      targetIP:  '192.168.1.20',
      opCode: '1 = Request',
    },
  },
  {
    title: 'Step 4 — PC-B Recognizes Its IP',
    text: 'PC-B receives the ARP Request and checks the Target IP: 192.168.1.20. <span class="hl-cyan">That matches!</span> PC-B will send a <span class="hl-cyan">unicast ARP Reply</span> directly back to PC-A.',
    layer: 'L3',
    activeDevice: 'PCB',
    opCode: 'request',
    animation: { type: 'match', device: 'PCB' },
    arpFields: {
      senderMAC: 'AA:AA:AA:AA:AA:AA',
      senderIP:  '192.168.1.10',
      targetMAC: 'FF:FF:FF:FF:FF:FF',
      targetIP:  '192.168.1.20',
      opCode: '1 = Request',
    },
  },
  {
    title: 'Step 5 — PC-B Sends ARP Reply',
    text: 'PC-B sends a <span class="hl-cyan">unicast ARP Reply</span> directly to PC-A: <em>"I am 192.168.1.20. My MAC is BB:BB:BB:BB:BB:BB"</em>. This is unicast — only PC-A receives it.',
    layer: 'L2',
    activeDevice: 'PCB',
    opCode: 'reply',
    animation: { type: 'travel', from: 'PCB', to: 'SW1', color: '#06b6d4' },
    arpFields: {
      senderMAC: 'BB:BB:BB:BB:BB:BB',
      senderIP:  '192.168.1.20',
      targetMAC: 'AA:AA:AA:AA:AA:AA',
      targetIP:  '192.168.1.10',
      opCode: '2 = Reply',
    },
  },
  {
    title: 'Step 6 — Reply Forwarded to PC-A',
    text: 'SW1 receives the unicast reply and forwards it <span class="hl-cyan">only to PC-A</span> — no flooding needed since the destination MAC is known.',
    layer: 'L2',
    activeDevice: 'SW1',
    opCode: 'reply',
    animation: { type: 'travel', from: 'SW1', to: 'PCA', color: '#06b6d4' },
    arpFields: {
      senderMAC: 'BB:BB:BB:BB:BB:BB',
      senderIP:  '192.168.1.20',
      targetMAC: 'AA:AA:AA:AA:AA:AA',
      targetIP:  '192.168.1.10',
      opCode: '2 = Reply',
    },
  },
  {
    title: 'Step 7 — ARP Cache Updated',
    text: 'PC-A receives the reply and stores the mapping <span class="hl-cyan">192.168.1.20 → BB:BB:BB:BB:BB:BB</span> in its <span class="hl-cyan">ARP cache</span>. Future packets to this IP will skip ARP entirely.',
    layer: 'L3',
    activeDevice: 'PCA',
    opCode: 'reply',
    animation: { type: 'cache', device: 'PCA' },
    cacheEntry: { ip: '192.168.1.20', mac: 'BB:BB:BB:BB:BB:BB', device: 'PC-B' },
    arpFields: {
      senderMAC: 'BB:BB:BB:BB:BB:BB',
      senderIP:  '192.168.1.20',
      targetMAC: 'AA:AA:AA:AA:AA:AA',
      targetIP:  '192.168.1.10',
      opCode: '2 = Reply',
    },
  },
];

// Cache Hit scenario (pre-populated ARP cache - no broadcast needed)
const CACHE_HIT_STEPS = [
  {
    title: 'Ready to Start',
    text: 'PC-A wants to send data to <span class="hl-cyan">192.168.1.20</span> (PC-B). Let\'s check if the MAC address is already in the ARP cache.',
    layer: null,
    activeDevice: null,
    opCode: null,
    animation: null,
    arpFields: {
      senderMAC: 'AA:AA:AA:AA:AA:AA',
      senderIP:  '192.168.1.10',
      targetMAC: 'BB:BB:BB:BB:BB:BB', // Already known!
      targetIP:  '192.168.1.20',
      opCode: '1 = Request',
    },
  },
  {
    title: 'Step 1 — Cache Hit!',
    text: 'PC-A checks its ARP cache and finds <span class="hl-cyan">192.168.1.20 → BB:BB:BB:BB:BB:BB</span> already stored! No ARP broadcast needed — we can send directly.',
    layer: 'L3',
    activeDevice: 'PCA',
    opCode: 'cache-hit',
    animation: { type: 'cache-hit', device: 'PCA' },
    cacheEntry: { ip: '192.168.1.20', mac: 'BB:BB:BB:BB:BB:BB', device: 'PC-B' },
    arpFields: {
      senderMAC: 'AA:AA:AA:AA:AA:AA',
      senderIP:  '192.168.1.10',
      targetMAC: 'BB:BB:BB:BB:BB:BB',
      targetIP:  '192.168.1.20',
      opCode: '1 = Request',
    },
  },
  {
    title: 'Step 2 — Direct Frame Send',
    text: 'PC-A directly addresses the Ethernet frame to <span class="hl-cyan">BB:BB:BB:BB:BB:BB</span> and sends the data. No ARP Request, no broadcast — much faster!',
    layer: 'L2',
    activeDevice: 'PCA',
    opCode: 'cache-hit',
    animation: { type: 'travel', from: 'PCA', to: 'SW1', color: '#10b981' },
    arpFields: {
      senderMAC: 'AA:AA:AA:AA:AA:AA',
      senderIP:  '192.168.1.10',
      targetMAC: 'BB:BB:BB:BB:BB:BB',
      targetIP:  '192.168.1.20',
      opCode: '1 = Request',
    },
  },
  {
    title: 'Step 3 — PC-B Responds',
    text: 'SW1 forwards the frame directly to PC-B (no flooding!). PC-B receives the data and sends an acknowledgment back. Communication complete without any ARP needed.',
    layer: 'L2',
    activeDevice: 'PCB',
    opCode: 'cache-hit',
    animation: { type: 'travel', from: 'SW1', to: 'PCB', color: '#10b981' },
    arpFields: {
      senderMAC: 'AA:AA:AA:AA:AA:AA',
      senderIP:  '192.168.1.10',
      targetMAC: 'BB:BB:BB:BB:BB:BB',
      targetIP:  '192.168.1.20',
      opCode: '1 = Request',
    },
  },
];

// Scenario registry
const SCENARIOS = {
  'arp-request': {
    name: 'ARP Request/Reply',
    enabled: true,
    steps: SCENARIO_STEPS,
    description: 'Full ARP broadcast and reply process',
  },
  'cache-hit': {
    name: 'Cache Hit',
    enabled: true,
    steps: CACHE_HIT_STEPS,
    description: 'MAC already in cache - no broadcast needed',
  },
  'gratuitous': {
    name: 'Gratuitous ARP',
    enabled: false,
    steps: [],
    description: 'Device announces its IP/MAC to network',
  },
};

// ─── Inline CSS ────────────────────────────────────────────────────────────────

const STYLES = `
  .arp-sim-root {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 0 0 32px 0;
    font-family: 'Nunito', sans-serif;
    color: #e2e8f0;
  }

  /* ── Header ── */
  .arp-header { margin-bottom: 4px; }
  .arp-breadcrumb {
    font-size: 11px;
    color: #475569;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .arp-breadcrumb a { color: #06b6d4; text-decoration: none; }

  /* Scenario tabs */
  .arp-scenario-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .arp-scenario-tab {
    padding: 8px 16px;
    border-radius: 6px;
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid #334155;
    background: #1e293b;
    color: #94a3b8;
    transition: all 0.15s;
  }
  .arp-scenario-tab:hover:not(.disabled) {
    background: #334155;
    color: #e2e8f0;
  }
  .arp-scenario-tab.active {
    background: #06b6d4;
    color: #0f172a;
    border-color: #06b6d4;
  }
  .arp-scenario-tab.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .arp-title {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0 0 6px 0;
  }
  .arp-subtitle {
    font-size: 14px;
    color: #94a3b8;
    line-height: 1.5;
    max-width: 680px;
    margin: 0;
  }

  /* ── Main layout ── */
  .arp-body {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }
  .arp-left  { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
  .arp-right { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; }

  /* ── Topology card ── */
  .arp-topology-card {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
  }
  .arp-topology-card svg {
    display: block;
    width: 100%;
    height: auto;
  }

  /* ── Controls ── */
  .arp-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 10px;
  }
  .arp-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: 6px;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
  }
  .arp-btn-primary {
    background: #06b6d4;
    color: #0f172a;
  }
  .arp-btn-primary:hover { background: #22d3ee; }
  .arp-btn-primary:disabled { background: #164e63; color: #0e7490; cursor: not-allowed; }
  .arp-btn-secondary {
    background: #1e293b;
    color: #94a3b8;
    border: 1px solid #334155;
  }
  .arp-btn-secondary:hover { background: #334155; color: #e2e8f0; }
  .arp-btn-danger {
    background: transparent;
    color: #64748b;
    border: 1px solid #334155;
  }
  .arp-btn-danger:hover { color: #f87171; border-color: #f87171; }

  .arp-step-counter {
    margin-left: auto;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #475569;
  }
  .arp-step-counter span { color: #06b6d4; }

  /* ── Speed slider ── */
  .arp-speed-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 8px;
  }
  .arp-speed-label { font-size: 11px; color: #475569; }
  .arp-speed-value { font-size: 11px; color: #06b6d4; width: 48px; }
  .arp-speed-slider {
    -webkit-appearance: none;
    width: 80px;
    height: 4px;
    border-radius: 2px;
    background: #1e293b;
    outline: none;
  }
  .arp-speed-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #06b6d4;
    cursor: pointer;
  }

  /* ── Explanation box ── */
  .arp-explanation {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-left: 3px solid #1e293b;
    border-radius: 10px;
    padding: 14px 16px;
    transition: border-color 0.3s;
  }
  .arp-explanation.layer-l2 { border-left-color: #f59e0b; }
  .arp-explanation.layer-l3 { border-left-color: #06b6d4; }
  .arp-explanation.layer-l4 { border-left-color: #8b5cf6; }

  .arp-explanation-title {
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0 0 6px 0;
  }
  .arp-explanation-text {
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.65;
    margin: 0;
  }
  .hl-cyan  { color: #06b6d4; font-weight: 600; }
  .hl-amber { color: #f59e0b; font-weight: 600; }

  /* ── Right panel cards ── */
  .arp-panel-card {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 10px;
    overflow: hidden;
  }
  .arp-panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-bottom: 1px solid #1e293b;
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #64748b;
  }
  .arp-panel-header .dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #334155;
    flex-shrink: 0;
  }
  .arp-panel-body { padding: 10px 14px; }

  /* ── ARP Cache ── */
  .arp-cache-empty {
    font-size: 12px;
    color: #334155;
    font-style: italic;
    padding: 6px 0;
  }
  .arp-cache-entry {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    border-radius: 6px;
    margin-bottom: 4px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    background: #0d1b2a;
    border: 1px solid #1e3a5f;
    animation: cacheFlash 1.2s ease-out;
  }
  @keyframes cacheFlash {
    0%   { background: rgba(6,182,212,0.25); border-color: #06b6d4; }
    100% { background: #0d1b2a; border-color: #1e3a5f; }
  }
  .arp-cache-ip  { color: #06b6d4; }
  .arp-cache-mac { color: #94a3b8; }
  .arp-cache-dev { color: #475569; font-size: 10px; }

  /* ── ARP Packet Fields ── */
  .arp-field-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 7px 0;
    border-bottom: 1px solid #0f172a;
  }
  .arp-field-row:last-child { border-bottom: none; }
  .arp-field-left { flex: 1; }
  .arp-field-name {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #475569;
    margin: 0 0 2px 0;
  }
  .arp-field-desc {
    font-size: 10px;
    color: #334155;
    margin: 0;
  }
  .arp-field-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #06b6d4;
    text-align: right;
    flex-shrink: 0;
    margin-left: 8px;
  }
  .arp-field-value.broadcast { color: #f59e0b; }

  /* ── Op Code row ── */
  .arp-opcode-row {
    display: flex;
    justify-content: space-between;
    padding: 7px 0 0;
  }
  .arp-opcode-item {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #334155;
    transition: color 0.3s, font-weight 0.3s;
  }
  .arp-opcode-item.active-request { color: #06b6d4; font-weight: 700; }
  .arp-opcode-item.active-reply   { color: #f59e0b; font-weight: 700; }

  /* ── SVG device ── */
  .device-label {
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 13px;
    fill: #06b6d4;
    text-anchor: middle;
  }
  .device-mac {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px;
    fill: #475569;
    text-anchor: middle;
  }
  .device-ip {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px;
    fill: #38bdf8;
    text-anchor: middle;
  }
  .device-icon-bg {
    transition: opacity 0.3s;
  }
  .device-icon-bg.dim { opacity: 0.25; }
  .device-icon-bg.pulse-green { filter: drop-shadow(0 0 8px #10b981); }
  .device-icon-bg.pulse-amber { filter: drop-shadow(0 0 8px #f59e0b); }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .arp-body { flex-direction: column; }
    .arp-right { width: 100%; }
  }
  @media (max-width: 560px) {
    .arp-controls { flex-wrap: wrap; }
    .arp-step-counter { margin-left: 0; }
  }
`;

// ─── SVG Helpers ────────────────────────────────────────────────────────────────

function svgNS(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

// ─── Main Factory ─────────────────────────────────────────────────────────────

export function createArpSimulator() {
  // ── State ──
  let _root       = null;
  let _stepIndex  = 0;
  let _autoTimer  = null;
  let _animating  = false;
  let _cacheEntries = [];
  let _speedMs    = 1800; // ms between auto-play steps
  let _currentScenario = 'arp-request';

  // ── DOM refs (populated in render) ──
  let _svgEl        = null;
  let _packetLayer  = null;   // SVG group for animated packets
  let _deviceGroups = {};     // id → SVG group element
  let _explanTitle  = null;
  let _explanText   = null;
  let _explanBox    = null;
  let _stepCounter  = null;
  let _btnStep      = null;
  let _btnAuto      = null;
  let _cacheBody    = null;
  let _fieldValues  = {};     // fieldName → DOM element

  // ─────────────────────────────────────────────────────────────────________
  // BUILD HTML
  // _________________________________________________________________________

  function _buildHTML(container) {
    // Inject styles once
    if (!document.getElementById('arp-sim-styles')) {
      const style = document.createElement('style');
      style.id = 'arp-sim-styles';
      style.textContent = STYLES;
      document.head.appendChild(style);
    }

    container.innerHTML = `
      <div class="arp-sim-root">

        <!-- Header -->
        <div class="arp-header">
          <p class="arp-breadcrumb"><a href="#/">HOME</a> › SIMULATIONS</p>
          <h1 class="arp-title">ARP Resolution Simulator</h1>
          <p class="arp-subtitle">
            Address Resolution Protocol translates IP addresses to MAC addresses
            on a local network. Watch how a broadcast request resolves to a
            unicast reply and populates the ARP cache.
          </p>
        </div>

        <!-- Scenario Tabs -->
        <div class="arp-scenario-tabs" id="arp-scenario-tabs">
          <button class="arp-scenario-tab active" data-scenario="arp-request">ARP Request/Reply</button>
          <button class="arp-scenario-tab" data-scenario="cache-hit">Cache Hit</button>
          <button class="arp-scenario-tab disabled" data-scenario="gratuitous" disabled>Gratuitous ARP (Coming Soon)</button>
        </div>

        <!-- Body -->
        <div class="arp-body">

          <!-- Left column -->
          <div class="arp-left">

            <!-- Topology -->
            <div class="arp-topology-card" id="arp-topo-wrap">
              <!-- SVG injected by JS -->
            </div>

            <!-- Controls -->
            <div class="arp-controls">
              <button class="arp-btn arp-btn-primary"  id="arp-btn-step">▶ STEP</button>
              <button class="arp-btn arp-btn-secondary" id="arp-btn-auto">⚡ AUTO PLAY</button>
              <button class="arp-btn arp-btn-danger"   id="arp-btn-reset">↺ RESET</button>

              <div class="arp-speed-row">
                <span class="arp-speed-label">Speed:</span>
                <span class="arp-speed-value" id="arp-speed-val">Slow</span>
                <input type="range" min="1" max="3" value="1" aria-label="Simulation speed"
                       class="arp-speed-slider" id="arp-speed-slider" />
              </div>

              <div class="arp-step-counter" id="arp-step-counter">
                Step <span>0</span> / ${SCENARIO_STEPS.length - 1}
              </div>
            </div>

            <!-- Explanation -->
            <div class="arp-explanation" id="arp-explanation">
              <p class="arp-explanation-title" id="arp-expl-title">Ready to Start</p>
              <p class="arp-explanation-text"  id="arp-expl-text">
                Press <strong>STEP</strong> or <strong>AUTO PLAY</strong> to begin.
                ARP is triggered whenever a device needs to send a packet to an IP
                on the same subnet but doesn't know the MAC address.
              </p>
            </div>

          </div><!-- /left -->

          <!-- Right column -->
          <div class="arp-right">

            <!-- ARP Cache -->
            <div class="arp-panel-card">
              <div class="arp-panel-header">
                <span class="dot" style="background:#06b6d4"></span>
                ARP CACHE
              </div>
              <div class="arp-panel-body" id="arp-cache-body">
                <p class="arp-cache-empty">Populates at Step 7 when PC-A learns PC-B's MAC</p>
              </div>
            </div>

            <!-- ARP Packet Fields -->
            <div class="arp-panel-card">
              <div class="arp-panel-header">
                <span class="dot"></span>
                ARP PACKET FIELDS
              </div>
              <div class="arp-panel-body">

                <div class="arp-field-row">
                  <div class="arp-field-left">
                    <p class="arp-field-name">Sender MAC</p>
                    <p class="arp-field-desc">Requester's hardware address</p>
                  </div>
                  <span class="arp-field-value" id="af-senderMAC">AA:AA:AA:AA:AA:AA</span>
                </div>

                <div class="arp-field-row">
                  <div class="arp-field-left">
                    <p class="arp-field-name">Sender IP</p>
                    <p class="arp-field-desc">Requester's protocol address</p>
                  </div>
                  <span class="arp-field-value" id="af-senderIP">192.168.1.10</span>
                </div>

                <div class="arp-field-row">
                  <div class="arp-field-left">
                    <p class="arp-field-name">Target MAC</p>
                    <p class="arp-field-desc">Unknown (broadcast in request)</p>
                  </div>
                  <span class="arp-field-value broadcast" id="af-targetMAC">FF:FF:FF:FF:FF:FF</span>
                </div>

                <div class="arp-field-row">
                  <div class="arp-field-left">
                    <p class="arp-field-name">Target IP</p>
                    <p class="arp-field-desc">IP address being resolved</p>
                  </div>
                  <span class="arp-field-value" id="af-targetIP">192.168.1.20</span>
                </div>

                <div class="arp-field-row">
                  <div class="arp-field-left">
                    <p class="arp-field-name">Op Code</p>
                  </div>
                  <div class="arp-opcode-row">
                    <span class="arp-opcode-item" id="af-opRequest">1 = Request</span>
                    <span class="arp-opcode-item" id="af-opReply">&nbsp;&nbsp;2 = Reply</span>
                  </div>
                </div>

              </div>
            </div>

          </div><!-- /right -->

        </div><!-- /body -->
      </div><!-- /root -->
    `;
  }

  // ─────────────────────────────────────────────────────────────────________
  // BUILD SVG TOPOLOGY
  // _________________________________________________________________________

  function _buildSVG() {
    const wrap = document.getElementById('arp-topo-wrap');
    if (!wrap) return;

    const svg = svgNS('svg', {
      viewBox: '0 0 700 220',
      preserveAspectRatio: 'xMidYMid meet',
      width: '100%',
    });

    // Background grid dots
    const defs = svgNS('defs');
    const pat  = svgNS('pattern', {
      id: 'arp-grid', x: '0', y: '0',
      width: '24', height: '24',
      patternUnits: 'userSpaceOnUse',
    });
    const dot = svgNS('circle', {
      cx: '1', cy: '1', r: '1',
      fill: 'rgba(255,255,255,0.03)',
    });
    pat.appendChild(dot);
    defs.appendChild(pat);
    svg.appendChild(defs);

    const bg = svgNS('rect', {
      x: '0', y: '0', width: '700', height: '220',
      fill: 'url(#arp-grid)',
    });
    svg.appendChild(bg);

    // Link lines (draw before devices so devices sit on top)
    const linkGroup = svgNS('g', { id: 'arp-links' });
    LINKS.forEach(link => {
      const from = DEVICES[link.from];
      const to   = DEVICES[link.to];
      const line = svgNS('line', {
        x1: from.x, y1: from.y,
        x2: to.x,   y2: to.y,
        stroke: '#1e3a5f',
        'stroke-width': '2',
        'stroke-dasharray': '6 4',
      });
      line.setAttribute('id', `arp-link-${link.from}-${link.to}`);
      linkGroup.appendChild(line);
    });
    svg.appendChild(linkGroup);

    // Packet animation layer (always on top)
    _packetLayer = svgNS('g', { id: 'arp-packet-layer' });
    // will be appended after devices

    // Device groups
    const deviceGroup = svgNS('g', { id: 'arp-devices' });
    Object.values(DEVICES).forEach(dev => {
      const g = svgNS('g', {
        id: `arp-dev-${dev.id}`,
        transform: `translate(${dev.x},${dev.y})`,
      });

      if (dev.isSwitch) {
        _buildSwitchIcon(g, dev);
      } else if (dev.isRouter) {
        _buildRouterIcon(g, dev);
      } else {
        _buildPCIcon(g, dev);
      }

      deviceGroup.appendChild(g);
      _deviceGroups[dev.id] = g;
    });

    svg.appendChild(deviceGroup);
    svg.appendChild(_packetLayer);

    wrap.appendChild(svg);
    _svgEl = svg;
  }

  function _buildPCIcon(g, dev) {
    // Monitor body
    const monitor = svgNS('g', { class: 'device-icon-bg', id: `arp-icon-${dev.id}` });

    // Outer glow rect
    const glow = svgNS('rect', {
      x: '-22', y: '-28', width: '44', height: '36',
      rx: '4', ry: '4',
      fill: '#0f172a',
      stroke: '#1e3a5f',
      'stroke-width': '1.5',
    });
    // Screen
    const screen = svgNS('rect', {
      x: '-17', y: '-24', width: '34', height: '24',
      rx: '2', fill: '#0d2137',
    });
    // Screen shine
    const shine = svgNS('rect', {
      x: '-15', y: '-22', width: '30', height: '20',
      rx: '1', fill: '#0a2744', opacity: '0.7',
    });
    // Stand
    const stand = svgNS('rect', {
      x: '-4', y: '8', width: '8', height: '8',
      fill: '#1e3a5f',
    });
    const base = svgNS('rect', {
      x: '-10', y: '16', width: '20', height: '3',
      rx: '1', fill: '#1e3a5f',
    });

    [glow, screen, shine, stand, base].forEach(el => monitor.appendChild(el));
    g.appendChild(monitor);

    // Labels
    const nameText = svgNS('text', { class: 'device-label', y: '36' });
    nameText.textContent = dev.label;
    g.appendChild(nameText);

    if (dev.mac) {
      const macText = svgNS('text', { class: 'device-mac', y: '50' });
      macText.textContent = dev.mac;
      g.appendChild(macText);
    }
    if (dev.ip) {
      const ipText = svgNS('text', { class: 'device-ip', y: '63' });
      ipText.textContent = dev.ip;
      g.appendChild(ipText);
    }
  }

  function _buildSwitchIcon(g, dev) {
    const icon = svgNS('g', { class: 'device-icon-bg', id: `arp-icon-${dev.id}` });

    // Switch body
    const body = svgNS('rect', {
      x: '-28', y: '-14', width: '56', height: '28',
      rx: '4',
      fill: '#1a0a3a',
      stroke: '#4c1d95',
      'stroke-width': '1.5',
    });
    icon.appendChild(body);

    // Port LEDs
    [-16, -8, 0, 8, 16].forEach((px, i) => {
      const led = svgNS('circle', {
        cx: px, cy: '0', r: '3.5',
        fill: i % 2 === 0 ? '#7c3aed' : '#6d28d9',
      });
      icon.appendChild(led);
    });

    // Side notches
    [-1, 1].forEach(side => {
      const notch = svgNS('rect', {
        x: side === -1 ? '-32' : '28',
        y: '-6', width: '4', height: '12',
        rx: '1', fill: '#2d1b69',
      });
      icon.appendChild(notch);
    });

    g.appendChild(icon);

    const nameText = svgNS('text', {
      class: 'device-label',
      y: '30',
      style: 'fill:#a78bfa',
    });
    nameText.textContent = dev.label;
    g.appendChild(nameText);
  }

  function _buildRouterIcon(g, dev) {
    const icon = svgNS('g', { class: 'device-icon-bg', id: `arp-icon-${dev.id}` });

    // Router body (circle with lines)
    const body = svgNS('circle', {
      cx: '0', cy: '0', r: '22',
      fill: '#1a0a3a',
      stroke: '#4c1d95',
      'stroke-width': '1.5',
    });
    icon.appendChild(body);

    // Inner circle
    const inner = svgNS('circle', {
      cx: '0', cy: '0', r: '14',
      fill: 'none',
      stroke: '#6d28d9',
      'stroke-width': '1',
    });
    icon.appendChild(inner);

    // Arrow up
    const arrow = svgNS('path', {
      d: 'M -6 -4 L 0 -10 L 6 -4',
      fill: 'none',
      stroke: '#a78bfa',
      'stroke-width': '2',
      'stroke-linecap': 'round',
    });
    icon.appendChild(arrow);

    // Two horizontal lines
    const line1 = svgNS('line', {
      x1: '-10', y1: '0', x2: '10', y2: '0',
      stroke: '#6d28d9',
      'stroke-width': '1.5',
    });
    const line2 = svgNS('line', {
      x1: '-6', y1: '6', x2: '6', y2: '6',
      stroke: '#6d28d9',
      'stroke-width': '1',
    });
    icon.appendChild(line1);
    icon.appendChild(line2);

    g.appendChild(icon);

    // Labels
    const nameText = svgNS('text', { class: 'device-label', y: '36', style: 'fill:#a78bfa' });
    nameText.textContent = dev.label;
    g.appendChild(nameText);

    if (dev.mac) {
      const macText = svgNS('text', { class: 'device-mac', y: '50' });
      macText.textContent = dev.mac;
      g.appendChild(macText);
    }
    if (dev.ip) {
      const ipText = svgNS('text', { class: 'device-ip', y: '63' });
      ipText.textContent = dev.ip;
      g.appendChild(ipText);
    }
    if (dev.sublabel) {
      const subText = svgNS('text', {
        class: 'device-ip',
        y: '76',
        style: 'fill:#64748b;font-size:8px;',
      });
      subText.textContent = dev.sublabel;
      g.appendChild(subText);
    }
  }

  // ─────────────────────────────────────────────────────────────────________
  // STEP LOGIC
  // _________________________________________________________________________

  function _getCurrentSteps() {
    return SCENARIOS[_currentScenario].steps;
  }

  function _applyStep(index) {
    const currentSteps = _getCurrentSteps();
    if (index < 0 || index >= currentSteps.length) return;
    _stepIndex = index;

    const step = currentSteps[index];

    // Update explanation
    _explanBox.className  = 'arp-explanation' + (step.layer ? ` layer-${step.layer.toLowerCase()}` : '');
    _explanTitle.textContent = step.title;
    _explanText.innerHTML    = step.text;

    // Update step counter
    _stepCounter.innerHTML = `Step <span>${index}</span> / ${currentSteps.length - 1}`;

    // Update ARP fields
    if (step.arpFields) {
      _updateARPFields(step.arpFields);
    }

    // Update Op Code highlight
    _updateOpCode(step.opCode);

    // Highlight active device
    _highlightDevice(step.activeDevice);

    // Run animation
    if (step.animation) {
      _runAnimation(step.animation);
    }

    // Add cache entry
    if (step.cacheEntry) {
      _addCacheEntry(step.cacheEntry);
    }

    // Disable step button at end
    _btnStep.disabled = (index >= currentSteps.length - 1);
  }

  function _updateARPFields(fields) {
    const sMAC = document.getElementById('af-senderMAC');
    const sIP  = document.getElementById('af-senderIP');
    const tMAC = document.getElementById('af-targetMAC');
    const tIP  = document.getElementById('af-targetIP');
    if (sMAC) sMAC.textContent = fields.senderMAC;
    if (sIP)  sIP.textContent  = fields.senderIP;
    if (tMAC) {
      const wasBroadcast = tMAC.textContent === 'FF:FF:FF:FF:FF:FF';
      const isNowUnicast = fields.targetMAC !== 'FF:FF:FF:FF:FF:FF';
      
      tMAC.textContent = fields.targetMAC;
      tMAC.className   = 'arp-field-value' +
        (fields.targetMAC === 'FF:FF:FF:FF:FF:FF' ? ' broadcast' : '');
      
      // Flash animation when transitioning from broadcast to unicast (reply)
      if (wasBroadcast && isNowUnicast) {
        tMAC.style.transition = 'background 0.3s, color 0.3s';
        tMAC.style.background = 'rgba(6,182,212,0.3)';
        tMAC.style.color = '#06b6d4';
        setTimeout(() => {
          tMAC.style.background = '';
        }, 500);
      }
    }
    if (tIP)  tIP.textContent  = fields.targetIP;
  }

  function _updateOpCode(opCode) {
    const req = document.getElementById('af-opRequest');
    const rep = document.getElementById('af-opReply');
    if (!req || !rep) return;
    
    // Reset both first
    req.className = 'arp-opcode-item';
    rep.className = 'arp-opcode-item';
    
    if (opCode === 'request') {
      req.classList.add('active-request');
      rep.style.opacity = '0.3';
      req.style.opacity = '1';
    } else if (opCode === 'reply') {
      rep.classList.add('active-reply');
      req.style.opacity = '0.3';
      rep.style.opacity = '1';
    } else if (opCode === 'cache-hit') {
      req.classList.add('active-request');
      req.style.color = '#10b981';
      req.style.fontWeight = '700';
      rep.style.opacity = '0.3';
    } else {
      // Reset to default
      req.style.opacity = '1';
      rep.style.opacity = '1';
      req.style.color = '';
      rep.style.color = '';
    }
  }

  function _highlightDevice(activeId) {
    Object.entries(_deviceGroups).forEach(([id, g]) => {
      const icon = g.querySelector('.device-icon-bg');
      if (!icon) return;
      icon.classList.remove('pulse-green', 'pulse-amber', 'dim');
      if (activeId && id !== activeId) {
        icon.classList.add('dim');
      }
    });
  }

  function _addCacheEntry(entry) {
    if (!_cacheBody) return;
    // Clear placeholder
    const empty = _cacheBody.querySelector('.arp-cache-empty');
    if (empty) empty.remove();

    const row = document.createElement('div');
    row.className = 'arp-cache-entry';
    row.innerHTML = `
      <span class="arp-cache-ip">${entry.ip}</span>
      <span class="arp-cache-mac">${entry.mac}</span>
      <span class="arp-cache-dev">${entry.device}</span>
    `;
    _cacheBody.appendChild(row);
    _cacheEntries.push(entry);

    // Pulse the cache panel header dot
    const dot = _cacheBody.closest('.arp-panel-card').querySelector('.dot');
    if (dot) {
      dot.style.background = '#06b6d4';
      dot.style.boxShadow  = '0 0 6px #06b6d4';
      setTimeout(() => {
        dot.style.background = '#06b6d4';
        dot.style.boxShadow  = 'none';
      }, 1500);
    }
  }

  // ─────────────────────────────────────────────────────────────────________
  // PACKET ANIMATION
  // _________________________________________________________________________

  function _runAnimation(anim) {
    if (!_packetLayer) return;

    if (anim.type === 'travel') {
      _animateTravel(
        DEVICES[anim.from],
        DEVICES[anim.to],
        anim.color,
        600,
      );
    } else if (anim.type === 'flood') {
      anim.targets.forEach((targetId, i) => {
        setTimeout(() => {
          _animateTravel(
            DEVICES[anim.from],
            DEVICES[targetId],
            anim.color,
            600,
          );
        }, i * 80);
      });
    } else if (anim.type === 'ignore') {
      const icon = _deviceGroups[anim.device]?.querySelector('.device-icon-bg');
      if (icon) {
        icon.classList.add('pulse-amber');
        setTimeout(() => {
          icon.classList.remove('pulse-amber');
          icon.classList.add('dim');
        }, 600);
      }
    } else if (anim.type === 'ignore-multiple') {
      // Handle both PC-C and Router ignoring
      anim.devices.forEach(deviceId => {
        const icon = _deviceGroups[deviceId]?.querySelector('.device-icon-bg');
        if (icon) {
          icon.classList.add('pulse-amber');
          setTimeout(() => {
            icon.classList.remove('pulse-amber');
            icon.classList.add('dim');
          }, 600);
        }
      });
    } else if (anim.type === 'match') {
      const icon = _deviceGroups[anim.device]?.querySelector('.device-icon-bg');
      if (icon) {
        icon.classList.add('pulse-green');
      }
    } else if (anim.type === 'cache') {
      const icon = _deviceGroups[anim.device]?.querySelector('.device-icon-bg');
      if (icon) {
        icon.classList.remove('dim');
        icon.classList.add('pulse-green');
      }
    } else if (anim.type === 'cache-hit') {
      // Show cache hit - green pulse on PC-A
      const icon = _deviceGroups[anim.device]?.querySelector('.device-icon-bg');
      if (icon) {
        icon.classList.remove('dim');
        icon.classList.add('pulse-green');
        setTimeout(() => icon.classList.remove('pulse-green'), 800);
      }
      // Pre-populate the cache display
      if (_cacheBody) {
        const empty = _cacheBody.querySelector('.arp-cache-empty');
        if (empty) empty.remove();
        const row = document.createElement('div');
        row.className = 'arp-cache-entry';
        row.innerHTML = `
          <span class="arp-cache-ip">192.168.1.20</span>
          <span class="arp-cache-mac">BB:BB:BB:BB:BB:BB</span>
          <span class="arp-cache-dev">PC-B</span>
        `;
        _cacheBody.appendChild(row);
      }
    }
  }

  function _animateTravel(fromDev, toDev, color, duration) {
    const dot = svgNS('circle', {
      r: '8',
      fill: color,
      filter: `drop-shadow(0 0 6px ${color})`,
      cx: fromDev.x,
      cy: fromDev.y,
    });
    _packetLayer.appendChild(dot);

    const startX = fromDev.x;
    const startY = fromDev.y;
    const endX   = toDev.x;
    const endY   = toDev.y;
    const start  = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5
        ? 2 * t * t
        : -1 + (4 - 2 * t) * t; // ease in-out quad

      dot.setAttribute('cx', startX + (endX - startX) * eased);
      dot.setAttribute('cy', startY + (endY - startY) * eased);

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        // Pulse destination device with scale effect
        const icon = _deviceGroups[toDev.id]?.querySelector('.device-icon-bg');
        if (icon) {
          const orig = icon.style.filter;
          const origTransform = icon.getAttribute('transform') || '';
          icon.style.filter = `drop-shadow(0 0 10px ${color})`;
          // Add scale effect
          icon.style.transition = 'transform 0.15s ease';
          icon.style.transform = 'scale(1.15)';
          setTimeout(() => { 
            icon.style.filter = orig;
            icon.style.transform = 'scale(1)';
          }, 300);
        }
        // Remove dot after brief pause
        setTimeout(() => dot.remove(), 150);
      }
    }

    requestAnimationFrame(tick);
  }

  // ─────────────────────────────────────────────────────────────────________
  // RESET
  // _________________________________________________________________________

  function _reset() {
    // Stop auto play
    if (_autoTimer) {
      clearInterval(_autoTimer);
      _autoTimer = null;
      _btnAuto.textContent = '⚡ AUTO PLAY';
      _btnAuto.classList.remove('arp-btn-primary');
      _btnAuto.classList.add('arp-btn-secondary');
    }

    _stepIndex = 0;
    _cacheEntries = [];
    _animating = false;

    // Clear packet layer
    if (_packetLayer) {
      while (_packetLayer.firstChild) _packetLayer.removeChild(_packetLayer.firstChild);
    }

    // Reset device appearances
    Object.values(_deviceGroups).forEach(g => {
      const icon = g.querySelector('.device-icon-bg');
      if (icon) {
        icon.classList.remove('dim', 'pulse-green', 'pulse-amber');
        icon.style.filter = '';
      }
    });

    // Reset ARP cache panel - show appropriate message based on scenario
    const currentSteps = _getCurrentSteps();
    const cacheMsg = _currentScenario === 'cache-hit' 
      ? 'Pre-populated: 192.168.1.20 → BB:BB:BB:BB:BB:BB'
      : 'Populates at Step 7 when PC-A learns PC-B\'s MAC';
    if (_cacheBody) {
      _cacheBody.innerHTML = `<p class="arp-cache-empty">${cacheMsg}</p>`;
    }
    
    // Pre-populate cache for cache-hit scenario
    if (_currentScenario === 'cache-hit') {
      _cacheEntries = [{ ip: '192.168.1.20', mac: 'BB:BB:BB:BB:BB:BB', device: 'PC-B' }];
    }

    // Reset explanation
    _explanBox.className = 'arp-explanation';
    _explanTitle.textContent = 'Ready to Start';
    _explanText.innerHTML = 'Press <strong>STEP</strong> or <strong>AUTO PLAY</strong> to begin. ARP is triggered whenever a device needs to send a packet to an IP on the same subnet but doesn\'t know the MAC address.';

    // Reset step counter
    _stepCounter.innerHTML = `Step <span>0</span> / ${currentSteps.length - 1}`;

    // Reset op code
    _updateOpCode(null);

    // Reset ARP fields to defaults
    _updateARPFields(currentSteps[0].arpFields);

    // Re-enable step button
    _btnStep.disabled = false;
  }

  // ─────────────────────────────────────────────────────────────────________
  // EVENT WIRING
  // _________________________________________________________________________

  function _wireEvents() {
    _btnStep = document.getElementById('arp-btn-step');
    _btnAuto = document.getElementById('arp-btn-auto');
    const btnReset = document.getElementById('arp-btn-reset');
    const speedSlider = document.getElementById('arp-speed-slider');
    const speedVal    = document.getElementById('arp-speed-val');

    _explanBox   = document.getElementById('arp-explanation');
    _explanTitle = document.getElementById('arp-expl-title');
    _explanText  = document.getElementById('arp-expl-text');
    _stepCounter = document.getElementById('arp-step-counter');
    _cacheBody   = document.getElementById('arp-cache-body');

    _btnStep.addEventListener('click', () => {
      const currentSteps = _getCurrentSteps();
      if (_stepIndex < currentSteps.length - 1) {
        _applyStep(_stepIndex + 1);
      }
    });

    // Scenario tab clicks
    document.querySelectorAll('.arp-scenario-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const scenario = e.target.dataset.scenario;
        if (!scenario || SCENARIOS[scenario].enabled === false) return;
        
        // Update active tab
        document.querySelectorAll('.arp-scenario-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        
        // Switch scenario
        _currentScenario = scenario;
        _reset();
      });
    });

    _btnAuto.addEventListener('click', () => {
      const currentSteps = _getCurrentSteps();
      if (_autoTimer) {
        clearInterval(_autoTimer);
        _autoTimer = null;
        _btnAuto.textContent = '⚡ AUTO PLAY';
        _btnAuto.classList.remove('arp-btn-primary');
        _btnAuto.classList.add('arp-btn-secondary');
      } else {
        _btnAuto.textContent = '⏸ PAUSE';
        _btnAuto.classList.add('arp-btn-primary');
        _btnAuto.classList.remove('arp-btn-secondary');
        _autoTimer = setInterval(() => {
          if (_stepIndex >= currentSteps.length - 1) {
            clearInterval(_autoTimer);
            _autoTimer = null;
            _btnAuto.textContent = '⚡ AUTO PLAY';
            _btnAuto.classList.remove('arp-btn-primary');
            _btnAuto.classList.add('arp-btn-secondary');
          } else {
            _applyStep(_stepIndex + 1);
          }
        }, _speedMs);
      }
    });

    btnReset.addEventListener('click', _reset);

    speedSlider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      const labels = { 1: 'Slow', 2: 'Medium', 3: 'Fast' };
      const delays = { 1: 1800, 2: 900, 3: 380 };
      speedVal.textContent = labels[v];
      _speedMs = delays[v];

      // If auto-play is running, restart with new speed
      if (_autoTimer) {
        clearInterval(_autoTimer);
        _autoTimer = setInterval(() => {
          if (_stepIndex >= SCENARIO_STEPS.length - 1) {
            clearInterval(_autoTimer);
            _autoTimer = null;
            _btnAuto.textContent = '⚡ AUTO PLAY';
            _btnAuto.classList.remove('arp-btn-primary');
            _btnAuto.classList.add('arp-btn-secondary');
          } else {
            _applyStep(_stepIndex + 1);
          }
        }, _speedMs);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────________
  // LIFECYCLE
  // _________________________________________________________________________

  function init(container) {
    _root = container;
    if (!_root) return;

    _buildHTML(_root);
    _buildSVG();
    _wireEvents();

    // Apply step 0 defaults
    _updateARPFields(SCENARIO_STEPS[0].arpFields);
  }

  function start(container) {
    init(container);
  }

  function reset() {
    _reset();
  }

  function destroy() {
    if (_autoTimer) {
      clearInterval(_autoTimer);
      _autoTimer = null;
    }
    if (_root) {
      _root.innerHTML = '';
    }
    _deviceGroups = {};
    _cacheEntries = [];
    _packetLayer  = null;
    _svgEl        = null;
  }

  return { init, start, reset, destroy };
}

// Default export: singleton-style factory call
export default createArpSimulator();
