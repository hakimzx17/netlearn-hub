/**
 * ethernetFrameGame.js — Ethernet Frame Assembly Game
 *
 * Teaches: Ethernet II frame structure — preamble, addressing,
 *          EtherType, payload, and FCS error detection.
 *
 * Depends on: dragDropEngine, eventBus, stateManager
 */

import { createDragDropEngine } from '../components/dragDropEngine.js';
import { eventBus }             from '../js/eventBus.js';
import { stateManager }         from '../js/stateManager.js';
import { showToast }            from '../utils/helperFunctions.js';

const FRAME_FIELDS = [
  { id: 'preamble',  label: 'Preamble',           bits: 7,   desc: 'Alternating 1s and 0s (7 bytes of 0xAA). Used by receivers to synchronize their clock with the sender.' },
  { id: 'sfd',       label: 'SFD',                bits: 1,   desc: 'Start Frame Delimiter (0xAB). The last byte before addressing begins. Signals "header is starting now".' },
  { id: 'dstmac',    label: 'Destination MAC',    bits: 6,   desc: 'The 6-byte MAC address of the intended receiver. FF:FF:FF:FF:FF:FF = broadcast to all devices.' },
  { id: 'srcmac',    label: 'Source MAC',         bits: 6,   desc: 'The 6-byte MAC address of the sending network interface card (NIC).' },
  { id: 'ethertype', label: 'EtherType / Length', bits: 2,   desc: 'Identifies the encapsulated protocol: 0x0800=IPv4, 0x0806=ARP, 0x86DD=IPv6. Values ≥1536 indicate type.' },
  { id: 'payload',   label: 'Payload (Data)',     bits: 46,  desc: 'The encapsulated data from the upper layer (e.g., an IP packet). Minimum 46 bytes — padding added if smaller.' },
  { id: 'fcs',       label: 'FCS',                bits: 4,   desc: 'Frame Check Sequence — CRC-32 checksum. Receiver recalculates it; mismatch = frame discarded silently.' },
];

// ── Ethernet Frame Table Configuration (Equal-sized blocks for clean visual layout) ───────────
// All fields rendered with equal width for a balanced, professional appearance
const ETHERNET_ZONES_TABLE = [
  {
    zones: [
      { id: 'z-preamble',  accepts: 'preamble',  bits: 1 },
      { id: 'z-sfd',       accepts: 'sfd',       bits: 1 },
      { id: 'z-dstmac',    accepts: 'dstmac',    bits: 1 },
      { id: 'z-srcmac',    accepts: 'srcmac',    bits: 1 },
      { id: 'z-ethertype', accepts: 'ethertype', bits: 1 },
      { id: 'z-payload',   accepts: 'payload',   bits: 1 },
      { id: 'z-fcs',       accepts: 'fcs',       bits: 1 },
    ]
  }
];

// Flatten zones for dragDropEngine
const FRAME_ZONES = ETHERNET_ZONES_TABLE.flatMap(row => row.zones);

class EthernetFrameGame {
  constructor() {
    this.container = null;
    this._dnd      = null;
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
          <a href="#/">Home</a> › <span>Data Link Layer</span>
        </div>
        <h1 class="module-header__title">Ethernet Frame Game</h1>
        <p class="module-header__description">
          Assemble a complete Ethernet II frame by placing each field in order.
          Click "Check Result" to see if you got them right!
        </p>
      </div>

      <!-- Control Bar -->
      <div class="control-bar" style="margin-bottom:1.25rem;">
        <button class="btn btn-ghost" id="eth-reset-btn">↺ Reset</button>
        <button class="btn btn-secondary" id="eth-check-btn">OK Check Result</button>
        <button class="btn btn-info" id="eth-show-answer-btn">VIEW Show Answer</button>
        <button class="btn btn-ghost" id="eth-hint-btn">TIP Hints</button>
        <span class="text-mono text-xs text-muted" id="eth-score-label">0 / ${FRAME_ZONES.length} placed</span>
      </div>

      <!-- Ethernet Frame Table (Drop Zones) -->
      <div id="eth-frame-table" style="margin-bottom:2rem;"></div>

      <!-- Available Fields (Drag Items) -->
      <div style="margin-bottom:1.25rem;">
        <div class="text-mono text-xs text-muted" style="margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.08em;">
          Available Fields — Drag to Frame Above
        </div>
        <div id="eth-dnd-mount"></div>
      </div>

      <!-- Feedback Area -->
      <div id="eth-feedback" style="margin-top:1.5rem; margin-bottom:2rem;"></div>

      <!-- QUIZ MODE REDIRECT -->
      <div class="card" style="margin-top:2rem; background:linear-gradient(135deg, rgba(0,206,209,0.06), rgba(206,147,216,0.06)); border:1px solid rgba(0,206,209,0.2);">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
          <div>
            <h2 style="margin:0 0 0.4rem 0; font-size:1.2rem; display:flex; align-items:center; gap:0.5rem;">
              FOCUS Frame Assembly Complete
            </h2>
            <p style="color:var(--color-text-muted); margin:0; font-size:0.85rem; max-width:420px; line-height:1.5;">
              You've built the Ethernet frame. Move on to the Module Quiz to verify your data link knowledge!
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
    const zonesContainer = this.container.querySelector('#eth-frame-table');
    const itemsContainer = this.container.querySelector('#eth-dnd-mount');

    // Shuffle fields for this session
    const shuffledFields = this._shuffleArray([...FRAME_FIELDS]);

    this._dnd.init({
      itemsContainerEl: itemsContainer,
      zonesContainerEl: zonesContainer,
      items: shuffledFields.map(f => ({ id: f.id, label: f.label, bits: f.bits })),
      zones: FRAME_ZONES,
      renderZonesAsTable: true,
      tableConfig: ETHERNET_ZONES_TABLE,
      unitLabel: 'bytes',
      showHints: false,  // We control feedback display
      allowRetry: true,
      onDrop: ({ itemId, correct }) => {
        this._updateScore();
      },
      onComplete: ({ score, total }) => {
        // Completion only if already showing feedback
        if (this._dnd.isFeedbackVisible()) {
          showToast(`DONE Perfect! All ${total} frame fields assembled correctly.`, 'success', 4000);
          stateManager.mergeState('userProgress', {
            completedModules: [
              ...new Set([...(stateManager.getState('userProgress').completedModules || []), '/ethernet-frame'])
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
    this.container.querySelector('#eth-reset-btn')?.addEventListener('click', () => {
      this._dnd.reset();
      this._updateScore();
      const feedback = this.container.querySelector('#eth-feedback');
      if (feedback) feedback.innerHTML = '';
    });

    // Check Result button
    this.container.querySelector('#eth-check-btn')?.addEventListener('click', () => {
      this._dnd.showFeedback();
      this._validateAll();
    });

    // Hints button
    this.container.querySelector('#eth-hint-btn')?.addEventListener('click', () => {
      eventBus.emit('modal:open', {
        title: 'TIP Ethernet Frame Field Reference',
        body: `
          <div style="display:flex; flex-direction:column; gap:0.5rem;">
            ${FRAME_FIELDS.map(f => `
              <div style="display:flex; gap:0.75rem; align-items:flex-start; padding:0.5rem; background:var(--color-bg-raised); border-radius:6px;">
                <span class="text-mono text-xs" style="color:var(--color-cyan); white-space:nowrap; padding-top:2px;">${f.bits} bytes</span>
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
    this.container.querySelector('#eth-show-answer-btn')?.addEventListener('click', () => {
      this._showAnswer();
    });

    // Quiz redirect
    this.container.querySelector('#btn-launch-quiz')?.addEventListener('click', () => {
      const quizTabBtn = document.querySelector('button[data-tab="quiz"]');
      if (quizTabBtn) {
        quizTabBtn.click();
      } else {
        eventBus.emit('nav:route-change', { route: '/paths/fundamentals/ethernet-framing?tab=quiz' });
      }
    });
  }

  _validateAll() {
    const state = this._dnd.checkState();
    const feedback = this.container.querySelector('#eth-feedback');
    
    if (state.score === state.total) {
      feedback.innerHTML = `
        <div style="padding:1rem; background:rgba(0,230,118,0.1); border:1px solid var(--color-success); border-radius:var(--radius-md); color:var(--color-success); font-weight:700; text-align:center;">
          DONE Perfect! All ${state.total} Ethernet frame fields are correctly assembled.
        </div>
      `;
      showToast(`Perfect! Ethernet frame assembled correctly.`, 'success', 4000);
    } else {
      const errors = [];
      FRAME_ZONES.forEach(zone => {
        const placed = state.placements[zone.id];
        if (placed !== zone.accepts) {
          const field = FRAME_FIELDS.find(f => f.id === zone.accepts);
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
    const answerMap = FRAME_ZONES.reduce((acc, zone) => {
      acc[zone.id] = zone.accepts;
      return acc;
    }, {});
    this._dnd.revealAnswer(answerMap);
    
    // Update UI
    this._updateScore();
    
    // Show success message
    const feedback = this.container.querySelector('#eth-feedback');
    if (feedback) {
      feedback.innerHTML = `
        <div style="padding:1rem; background:rgba(0,230,118,0.1); border:1px solid var(--color-success); border-radius:var(--radius-md); color:var(--color-success); font-weight:700; text-align:center;">
          VIEW Complete Ethernet Frame Structure Displayed
        </div>
      `;
    }
    
    showToast('Showing complete Ethernet frame structure', 'info', 3000);
  }

  _updateScore() {
    const result = this._dnd.checkState();
    const label  = this.container.querySelector('#eth-score-label');
    const button = this.container.querySelector('#eth-check-btn');
    
    if (label) label.textContent = `${result.score} / ${result.total} placed`;
    
    if (button) {
      // Enable/disable based on ALL fields being filled (not necessarily correct)
      const allZonesFilled = Object.keys(result.placements).length === result.total;
      if (allZonesFilled) {
        button.removeAttribute('disabled');
        button.classList.remove('btn-disabled');
        button.title = '';
      } else {
        button.setAttribute('disabled', 'disabled');
        button.classList.add('btn-disabled');
        button.title = `Place all ${result.total} fields before checking results`;
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
    this.container = null;
  }
}

export default new EthernetFrameGame();
