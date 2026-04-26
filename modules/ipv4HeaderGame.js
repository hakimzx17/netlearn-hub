/**
 * ipv4HeaderGame.js — IPv4 Header Field Drag-and-Drop Game
 *
 * Teaches: IPv4 header structure — all 13 fields, their sizes,
 *          and their purpose in routing and delivery.
 *
 * Depends on: dragDropEngine, eventBus, stateManager, helperFunctions
 */

import { createDragDropEngine } from '../components/dragDropEngine.js';
import { eventBus }             from '../js/eventBus.js';
import { stateManager }         from '../js/stateManager.js';
import { showToast }            from '../utils/helperFunctions.js';

// ── IPv4 Header Field Definitions ─────────────────────────────────────
// Each field includes its name, bit-size, and an educational description.
const IPV4_FIELDS = [
  { id: 'version',    label: 'Version',                bits: 4,   desc: 'IP version number. For IPv4, this is always 4 (0100 in binary).' },
  { id: 'ihl',        label: 'IHL',                    bits: 4,   desc: 'Internet Header Length — number of 32-bit words in the header. Minimum is 5 (20 bytes).' },
  { id: 'dscp',       label: 'DSCP / ToS',             bits: 8,   desc: 'Differentiated Services Code Point — used for QoS traffic prioritization.' },
  { id: 'totallen',   label: 'Total Length',           bits: 16,  desc: 'Total size of the IP packet (header + data) in bytes. Maximum is 65,535 bytes.' },
  { id: 'id',         label: 'Identification',         bits: 16,  desc: 'Unique ID for a packet — used to reassemble fragmented packets.' },
  { id: 'flags',      label: 'Flags',                  bits: 3,   desc: 'Controls fragmentation: DF (Do not Fragment) and MF (More Fragments) bits.' },
  { id: 'fragoffset', label: 'Fragment Offset',        bits: 13,  desc: 'Indicates where this fragment belongs in the original packet.' },
  { id: 'ttl',        label: 'TTL',                    bits: 8,   desc: 'Time To Live — decremented by 1 at each router. Packet dropped when TTL reaches 0.' },
  { id: 'protocol',   label: 'Protocol',               bits: 8,   desc: 'Identifies the encapsulated protocol: 6=TCP, 17=UDP, 1=ICMP.' },
  { id: 'checksum',   label: 'Header Checksum',        bits: 16,  desc: 'Error detection for the header only. Recalculated at every router hop (TTL changes).' },
  { id: 'srcip',      label: 'Source IP Address',      bits: 32,  desc: 'IPv4 address of the originating host (sender).' },
  { id: 'dstip',      label: 'Destination IP Address', bits: 32,  desc: 'IPv4 address of the intended recipient (receiver).' },
  { id: 'options',    label: 'Options (if IHL > 5)',   bits: 0,   desc: 'Optional fields for timestamping, security, or source routing. Rarely used today.' },
];

// ── IPv4 Header Table Configuration ───────────────────────────────────
// Mirrors the actual 32-bit IPv4 header layout
const IPV4_ZONES_TABLE = [
  {
    zones: [
      { id: 'z-version',  accepts: 'version',    bits: 4 },
      { id: 'z-ihl',      accepts: 'ihl',        bits: 4 },
      { id: 'z-dscp',     accepts: 'dscp',       bits: 8 },
      { id: 'z-totallen', accepts: 'totallen',   bits: 16 },
    ]
  },
  {
    zones: [
      { id: 'z-id',        accepts: 'id',         bits: 16 },
      { id: 'z-flags',     accepts: 'flags',      bits: 3 },
      { id: 'z-fragoffset',accepts: 'fragoffset', bits: 13 },
    ]
  },
  {
    zones: [
      { id: 'z-ttl',      accepts: 'ttl',       bits: 8 },
      { id: 'z-protocol', accepts: 'protocol',  bits: 8 },
      { id: 'z-checksum', accepts: 'checksum',  bits: 16 },
    ]
  },
  {
    zones: [
      { id: 'z-srcip',    accepts: 'srcip',     bits: 32 },
    ]
  },
  {
    zones: [
      { id: 'z-dstip',    accepts: 'dstip',     bits: 32 },
    ]
  },
  {
    zones: [
      { id: 'z-options',  accepts: 'options',   bits: 32 },
    ]
  },
];

// Flatten zones to provide to dragDropEngine
const IPV4_ZONES = IPV4_ZONES_TABLE.flatMap(row => row.zones);

class Ipv4HeaderGame {
  constructor() {
    this.container  = null;
    this._dnd       = null;
    this._unsubscribe = null;
  }

  init(containerEl) {
    this.container = containerEl;
    this._dnd = createDragDropEngine();
    this._render();
  }

  _render() {
    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <span>Protocol Headers</span>
        </div>
        <h1 class="module-header__title">IPv4 Header Game</h1>
        <p class="module-header__description">
          Drag each IPv4 header field into its correct position.
          Click "Check Result" to see if you got them right!
        </p>
      </div>

      <!-- Control Bar -->
      <div class="control-bar" style="margin-bottom:1.25rem;">
        <button class="btn btn-ghost" id="ipv4-reset-btn">↺ Reset</button>
        <button class="btn btn-secondary" id="ipv4-check-btn">OK Check Result</button>
        <button class="btn btn-info" id="ipv4-show-answer-btn">VIEW Show Answer</button>
        <button class="btn btn-ghost" id="ipv4-hint-btn">TIP Hints</button>
        <span class="text-mono text-xs text-muted" id="ipv4-score-label">0 / ${IPV4_ZONES.length} placed</span>
      </div>

      <!-- IPv4 Header Table (Drop Zones) -->
      <div id="ipv4-header-table" style="margin-bottom:2rem;"></div>

      <!-- Available Fields (Drag Items) -->
      <div style="margin-bottom:1.25rem;">
        <div class="text-mono text-xs text-muted" style="margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.08em;">
          Available Fields — Drag to Table Above
        </div>
        <div id="ipv4-dnd-mount"></div>
      </div>

      <!-- Feedback Area -->
      <div id="ipv4-feedback" style="margin-top:1.5rem; margin-bottom:2rem;"></div>

      <!-- QUIZ MODE REDIRECT -->
      <div class="card" style="margin-top:2rem; background:linear-gradient(135deg, rgba(0,206,209,0.06), rgba(206,147,216,0.06)); border:1px solid rgba(0,206,209,0.2);">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
          <div>
            <h2 style="margin:0 0 0.4rem 0; font-size:1.2rem; display:flex; align-items:center; gap:0.5rem;">
              FOCUS Full Mastery
            </h2>
            <p style="color:var(--color-text-muted); margin:0; font-size:0.85rem; max-width:420px; line-height:1.5;">
              You've mapped out the header fields. Now, jump into the Module Quiz to prove your protocol expertise!
            </p>
          </div>
          <button class="btn btn-primary" id="btn-launch-quiz" style="
            padding:0.75rem 1.75rem; border-radius:12px; font-size:1rem; font-weight:700;
            background:linear-gradient(135deg, #00CED1, #7C4DFF);
            border:none; color:white; cursor:pointer;
            box-shadow:0 4px 20px rgba(0,206,209,0.3);
            transition:all 0.3s ease;
          " onmouseover="this.style.transform='translateY(-2px) scale(1.03)';this.style.boxShadow='0 6px 30px rgba(0,206,209,0.45)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 20px rgba(0,206,209,0.3)'">
            Ready to take Quiz →
          </button>
        </div>
      </div>
    `;

    // Initialize the drag-drop engine with separate containers
    const zonesContainer = this.container.querySelector('#ipv4-header-table');
    const itemsContainer = this.container.querySelector('#ipv4-dnd-mount');

    // Shuffle fields for this session
    const shuffledFields = this._shuffleArray([...IPV4_FIELDS]);

    this._dnd.init({
      itemsContainerEl: itemsContainer,
      zonesContainerEl: zonesContainer,
      items: shuffledFields.map(f => ({ id: f.id, label: f.label, bits: f.bits })),
      zones: IPV4_ZONES,
      renderZonesAsTable: true,
      tableConfig: IPV4_ZONES_TABLE,
      compactTable: false,
      unitLabel: 'bits',
      showHints: false,  // We control feedback display
      allowRetry: true,
      onDrop: ({ itemId, correct }) => {
        this._updateScore();
      },
      onComplete: ({ score, total }) => {
        // Completion only if already showing feedback
        if (this._dnd.isFeedbackVisible()) {
          showToast(`DONE Perfect! All ${total} fields placed correctly.`, 'success', 4000);
          stateManager.mergeState('userProgress', {
            completedModules: [
              ...new Set([...(stateManager.getState('userProgress').completedModules || []), '/ipv4-header'])
            ]
          });
        }
      },
    });

    this._bindControls();
    this._updateScore();  // Initialize button disabled state
  }

  _bindControls() {
    // Reset button
    this.container.querySelector('#ipv4-reset-btn')?.addEventListener('click', () => {
      this._dnd.reset();
      this._updateScore();
      const feedback = this.container.querySelector('#ipv4-feedback');
      if (feedback) feedback.innerHTML = '';
    });

    // Check Result button
    this.container.querySelector('#ipv4-check-btn')?.addEventListener('click', () => {
      this._dnd.showFeedback();
      this._validateAll();
    });

    // Hints button
    this.container.querySelector('#ipv4-hint-btn')?.addEventListener('click', () => {
      eventBus.emit('modal:open', {
        title: 'TIP IPv4 Header Field Reference',
        body: `
          <div style="display:flex; flex-direction:column; gap:0.5rem;">
            ${IPV4_FIELDS.map(f => `
              <div style="display:flex; gap:0.75rem; align-items:flex-start; padding:0.5rem; background:var(--color-bg-raised); border-radius:6px;">
                <span class="text-mono text-xs" style="color:var(--color-cyan); white-space:nowrap; padding-top:2px;">${f.bits} bits</span>
                <div>
                  <div style="font-weight:700; font-size:var(--text-sm);">${f.label}</div>
                  <div style="font-size:var(--text-xs); color:var(--color-text-secondary);">${f.desc}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `,
        wide: true,
      });
    });

    // Show Answer button
    this.container.querySelector('#ipv4-show-answer-btn')?.addEventListener('click', () => {
      this._showAnswer();
    });

    // Quiz redirect
    this.container.querySelector('#btn-launch-quiz')?.addEventListener('click', () => {
      const quizTabBtn = document.querySelector('button[data-tab="quiz"]');
      if (quizTabBtn) {
        quizTabBtn.click();
      } else {
        eventBus.emit('nav:route-change', { route: '/paths/fundamentals/ipv4-header?tab=quiz' });
      }
    });
  }

  _validateAll() {
    const state = this._dnd.checkState();
    const feedback = this.container.querySelector('#ipv4-feedback');
    
    if (state.score === state.total) {
      feedback.innerHTML = `
        <div style="padding:1rem; background:rgba(0,230,118,0.1); border:1px solid var(--color-success); border-radius:var(--radius-md); color:var(--color-success); font-weight:700; text-align:center;">
          DONE Perfect! All ${state.total} fields are correctly placed.
        </div>
      `;
      showToast(`Perfect! All ${state.total} IPv4 header fields placed correctly.`, 'success', 4000);
    } else {
      const errors = [];
      IPV4_ZONES.forEach(zone => {
        const placed = state.placements[zone.id];
        if (placed !== zone.accepts) {
          const field = IPV4_FIELDS.find(f => f.id === zone.accepts);
          errors.push(field ? field.label : 'Unknown');
        }
      });
      
      feedback.innerHTML = `
        <div style="padding:1rem; background:rgba(255,68,68,0.1); border:1px solid var(--color-error); border-radius:var(--radius-md); color:var(--color-error); font-weight:700;">
          ${state.score} / ${state.total} correct. Still missing: ${errors.join(', ')}
        </div>
      `;
    }
  }

  _showAnswer() {
    // Use engine public API to avoid direct internal mutation.
    const answerMap = IPV4_ZONES.reduce((acc, zone) => {
      acc[zone.id] = zone.accepts;
      return acc;
    }, {});
    this._dnd.revealAnswer(answerMap);
    
    // Update UI
    this._updateScore();
    
    // Show success message
    const feedback = this.container.querySelector('#ipv4-feedback');
    if (feedback) {
      feedback.innerHTML = `
        <div style="padding:1rem; background:rgba(0,230,118,0.1); border:1px solid var(--color-success); border-radius:var(--radius-md); color:var(--color-success); font-weight:700; text-align:center;">
          VIEW Complete IPv4 Header Structure Displayed
        </div>
      `;
    }
    
    showToast('Showing complete IPv4 header structure', 'info', 3000);
  }

  _updateScore() {
    const result = this._dnd.checkState();
    const label  = this.container.querySelector('#ipv4-score-label');
    if (label) label.textContent = `${result.score} / ${result.total} placed`;

    // Enable/disable Check Result button based on ALL fields being filled (not necessarily correct)
    const checkBtn = this.container.querySelector('#ipv4-check-btn');
    if (checkBtn) {
      const allZonesFilled = Object.keys(result.placements).length === result.total;
      if (allZonesFilled) {
        checkBtn.removeAttribute('disabled');
        checkBtn.classList.remove('btn-disabled');
        checkBtn.title = 'Check your results!';
      } else {
        checkBtn.setAttribute('disabled', 'disabled');
        checkBtn.classList.add('btn-disabled');
        checkBtn.title = 'Place all fields before checking results';
      }
    }
  }

  _shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  start()  {}
  reset()  { if (this._dnd) this._dnd.reset(); }
  step()   {}

  destroy() {
    if (this._dnd) this._dnd.destroy();
    if (this._unsubscribe) this._unsubscribe();
    this.container = null;
  }
}

export default new Ipv4HeaderGame();
