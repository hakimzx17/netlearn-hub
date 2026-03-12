/**
 * subnetPracticeEngine.js — Guided Subnetting Practice
 *
 * Teaches: Exam-style subnetting drills with guided step-by-step hints.
 *          Three difficulty tiers: Identify, Calculate, Design.
 *          Wrong answers show the derivation; correct answers advance.
 *
 * Depends on: networkMath, ipUtils, binaryUtils, helperFunctions
 */

import {
  calculateSubnet, getSubnetSteps,
} from '../utils/networkMath.js';

import {
  isValidIP, cidrToMask, getHostCount, getTotalAddresses,
  getNetworkAddress, getBroadcastAddress, getFirstHost, getLastHost,
} from '../utils/ipUtils.js';

import { buildBinaryHTML, prefixToBinaryMask } from '../utils/binaryUtils.js';
import { escapeHtml, shuffle, showToast }       from '../utils/helperFunctions.js';
import { stateManager }                          from '../js/stateManager.js';

// ── Problem bank ─────────────────────────────────────────────────────
// Each problem specifies what is given and what must be calculated.
const PROBLEMS = [
  // ── Tier 1: Identify components ───────────────────────────────────
  {
    tier: 1, id: 'p1',
    given:    { ip: '192.168.10.50', prefix: 24 },
    question: 'What is the network address for 192.168.10.50/24?',
    field:    'networkAddress',
    hint:     'Apply the subnet mask to the IP using bitwise AND. The host portion becomes all zeros.',
    topic:    'Network Address',
  },
  {
    tier: 1, id: 'p2',
    given:    { ip: '10.0.5.200', prefix: 8 },
    question: 'What is the broadcast address for 10.0.5.200/8?',
    field:    'broadcastAddress',
    hint:     'Set all host bits to 1 in the network address. The host portion is 24 bits.',
    topic:    'Broadcast Address',
  },
  {
    tier: 1, id: 'p3',
    given:    { ip: '172.16.33.1', prefix: 16 },
    question: 'How many usable hosts can 172.16.33.1/16 support?',
    field:    'usableHosts',
    hint:     'Formula: 2^(host bits) - 2. Host bits = 32 - 16 = 16.',
    topic:    'Host Count',
  },
  {
    tier: 1, id: 'p4',
    given:    { ip: '192.168.5.0', prefix: 26 },
    question: 'What is the subnet mask for /26 in dotted-decimal?',
    field:    'subnetMask',
    hint:     '26 ones followed by 6 zeros. First three octets are 255. Last octet: 11000000 = 192.',
    topic:    'Subnet Mask',
  },
  {
    tier: 1, id: 'p5',
    given:    { ip: '10.10.10.130', prefix: 25 },
    question: 'What is the network address for 10.10.10.130/25?',
    field:    'networkAddress',
    hint:     '/25 mask is 255.255.255.128. 130 AND 128 = 128. Network = 10.10.10.128.',
    topic:    'Network Address',
  },
  {
    tier: 1, id: 'p6',
    given:    { ip: '192.168.1.33', prefix: 27 },
    question: 'What is the first usable host in 192.168.1.33/27?',
    field:    'firstHost',
    hint:     'Find the network address first, then add 1. /27 gives blocks of 32.',
    topic:    'First Usable Host',
  },
  // ── Tier 2: Calculate from requirements ──────────────────────────
  {
    tier: 2, id: 'p7',
    given:    { ip: '10.0.0.0', prefix: 28 },
    question: 'What is the broadcast address for 10.0.0.0/28?',
    field:    'broadcastAddress',
    hint:     '/28 = 255.255.255.240. Block size = 16. Network=0, Broadcast=15.',
    topic:    'Broadcast Address',
  },
  {
    tier: 2, id: 'p8',
    given:    { ip: '172.20.5.68', prefix: 29 },
    question: 'How many usable hosts does /29 provide?',
    field:    'usableHosts',
    hint:     '2^(32-29) - 2 = 2^3 - 2 = 8 - 2 = 6 hosts.',
    topic:    'Host Count',
  },
  {
    tier: 2, id: 'p9',
    given:    { ip: '192.168.100.193', prefix: 26 },
    question: 'What is the network address for 192.168.100.193/26?',
    field:    'networkAddress',
    hint:     '/26 gives blocks of 64 (0,64,128,192). 193 is in the 192 block.',
    topic:    'Network Address',
  },
  {
    tier: 2, id: 'p10',
    given:    { ip: '10.1.1.0', prefix: 30 },
    question: 'What is the wildcard mask for /30?',
    field:    'wildcardMask',
    hint:     'Wildcard = inverse of subnet mask. /30 mask is 255.255.255.252. Wildcard = 0.0.0.3.',
    topic:    'Wildcard Mask',
  },
  {
    tier: 2, id: 'p11',
    given:    { ip: '172.16.200.1', prefix: 22 },
    question: 'What is the network address for 172.16.200.1/22?',
    field:    'networkAddress',
    hint:     '/22 means 10 host bits. Block size in 3rd octet = 4. 200 / 4 = 50 remainder 0. Network = 172.16.200.0.',
    topic:    'Network Address',
  },
  {
    tier: 2, id: 'p12',
    given:    { ip: '10.255.255.1', prefix: 24 },
    question: 'What is the last usable host in 10.255.255.1/24?',
    field:    'lastHost',
    hint:     'Broadcast is 10.255.255.255. Last usable = broadcast - 1.',
    topic:    'Last Usable Host',
  },
  // ── Tier 3: Design / Analysis ────────────────────────────────────
  {
    tier: 3, id: 'p13',
    given:    { ip: '192.168.50.64', prefix: 26 },
    question: 'What is the broadcast address of the subnet containing 192.168.50.64/26?',
    field:    'broadcastAddress',
    hint:     '/26 = blocks of 64. 64 starts a block: 64-127. Broadcast = 192.168.50.127.',
    topic:    'Broadcast Address',
  },
  {
    tier: 3, id: 'p14',
    given:    { ip: '10.4.8.200', prefix: 21 },
    question: 'What is the network address for 10.4.8.200/21?',
    field:    'networkAddress',
    hint:     '/21 = 11 host bits. Block size in 3rd octet = 8. 8/8=1 block. Network = 10.4.8.0.',
    topic:    'Network Address',
  },
  {
    tier: 3, id: 'p15',
    given:    { ip: '172.31.16.1', prefix: 20 },
    question: 'How many total IP addresses (including network and broadcast) does /20 provide?',
    field:    'totalAddresses',
    hint:     '2^(32-20) = 2^12 = 4096 total addresses.',
    topic:    'Total Addresses',
  },
];

// What to display for each field type
const FIELD_LABEL = {
  networkAddress:  'Network Address',
  broadcastAddress:'Broadcast Address',
  firstHost:       'First Usable Host',
  lastHost:        'Last Usable Host',
  subnetMask:      'Subnet Mask (dotted-decimal)',
  wildcardMask:    'Wildcard Mask',
  usableHosts:     'Number of Usable Hosts',
  totalAddresses:  'Total IP Addresses',
};

const TIER_LABELS = { 1: 'Identify', 2: 'Calculate', 3: 'Design' };
const TIER_COLORS = { 1: 'var(--color-success)', 2: 'var(--color-warning)', 3: 'var(--color-error)' };

class SubnetPracticeEngine {
  constructor() {
    this.container   = null;
    this._queue      = [];
    this._current    = 0;
    this._correct    = 0;
    this._attempted  = 0;
    this._showHint   = false;
    this._answered   = false;
    this._mode       = 'all';   // 'all' | 'tier1' | 'tier2' | 'tier3'
  }

  init(containerEl) {
    this.container = containerEl;
    this._buildQueue();
    this._render();
  }

  _buildQueue() {
    let pool = [...PROBLEMS];
    if (this._mode !== 'all') {
      const tier = parseInt(this._mode.replace('tier',''), 10);
      pool = pool.filter(p => p.tier === tier);
    }
    this._queue    = shuffle(pool);
    this._current  = 0;
    this._correct  = 0;
    this._attempted = 0;
    this._answered  = false;
    this._showHint  = false;
  }

  _render() {
    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <span>Subnetting</span>
        </div>
        <h1 class="module-header__title">Subnetting Practice</h1>
        <p class="module-header__description">
          Exam-style subnetting drills with three difficulty tiers.
          Work through network address calculation, host ranges, and
          mask derivation — then check your answer with a full explanation.
        </p>
      </div>

      <!-- Mode selector -->
      <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:1.25rem; align-items:center;">
        <span class="text-mono text-xs text-muted" style="margin-right:0.25rem;">Difficulty:</span>
        ${[
          ['all',   'All Problems', 'var(--color-cyan)'],
          ['tier1', 'Tier 1 — Identify', TIER_COLORS[1]],
          ['tier2', 'Tier 2 — Calculate', TIER_COLORS[2]],
          ['tier3', 'Tier 3 — Design', TIER_COLORS[3]],
        ].map(([mode, label, color]) => `
          <button class="btn ${this._mode === mode ? 'btn-primary' : 'btn-ghost'} mode-btn"
            data-mode="${mode}"
            style="${this._mode === mode ? `background:${color};border-color:${color};color:var(--color-bg-deepest);` : `color:${color};border-color:${color}55;`}
            font-size:var(--text-xs); padding:0.25rem 0.6rem;">
            ${label}
          </button>
        `).join('')}
      </div>

      <!-- Score bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
        <span class="text-mono text-xs text-muted">PROGRESS</span>
        <span class="text-mono text-xs" id="sp-score-label" style="color:var(--color-cyan);">
          0 / ${this._queue.length}
        </span>
      </div>
      <div style="height:4px; background:var(--color-bg-raised); border-radius:99px; overflow:hidden; margin-bottom:1.25rem;">
        <div id="sp-progress-bar" style="height:100%; background:linear-gradient(90deg,var(--color-cyan),var(--color-success)); border-radius:99px; width:0%; transition:width 0.4s ease;"></div>
      </div>

      <!-- Question card -->
      <div id="sp-question-area">
        ${this._renderQuestion()}
      </div>
    `;

    this._bindModeButtons();
    this._bindQuestionControls();
  }

  _renderQuestion() {
    if (this._current >= this._queue.length) {
      return this._renderCompletion();
    }

    const prob   = this._queue[this._current];
    const info   = calculateSubnet(prob.given.ip, prob.given.prefix);
    const correct = String(info[prob.field]);
    const tierColor = TIER_COLORS[prob.tier];

    return `
      <div class="card" id="sp-question-card" style="border-color:${tierColor}44;">
        <!-- Question header -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <span class="badge" style="background:${tierColor}22; color:${tierColor}; border-color:${tierColor}66;">
              Tier ${prob.tier} — ${TIER_LABELS[prob.tier]}
            </span>
            <span class="badge badge-cyan">${prob.topic}</span>
          </div>
          <span class="text-mono text-xs text-muted">Q${this._current + 1} of ${this._queue.length}</span>
        </div>

        <!-- Given info -->
        <div style="background:var(--color-bg-raised); border-radius:var(--radius-md); padding:0.75rem; margin-bottom:1rem; font-family:var(--font-mono);">
          <div style="font-size:var(--text-xs); color:var(--color-text-muted); margin-bottom:0.4rem; text-transform:uppercase; letter-spacing:0.06em;">Given</div>
          <div style="font-size:1.1rem; font-weight:700; color:var(--color-cyan);">
            ${escapeHtml(prob.given.ip)} / ${prob.given.prefix}
          </div>
          <div style="font-size:var(--text-xs); color:var(--color-text-muted); margin-top:0.2rem;">
            Subnet mask: ${cidrToMask(prob.given.prefix)}
          </div>
        </div>

        <!-- Binary visualization for context -->
        <div style="margin-bottom:1rem; overflow-x:auto;">
          <div style="font-size:var(--text-xs); color:var(--color-text-muted); margin-bottom:0.3rem; font-family:var(--font-mono);">
            Binary:
            <span style="color:var(--color-cyan);">■ network</span>
            <span style="color:var(--color-amber); margin-left:0.5rem;">■ host</span>
          </div>
          <div class="binary-display" style="white-space:nowrap;">
            ${buildBinaryHTML(
              require_binary(prob.given.ip),
              prob.given.prefix
            )}
          </div>
        </div>

        <!-- Question -->
        <p style="font-size:var(--text-md); font-weight:700; color:var(--color-text-primary); margin-bottom:1rem; line-height:1.6;">
          ${escapeHtml(prob.question)}
        </p>

        <!-- Answer input -->
        <div style="display:flex; gap:0.5rem; align-items:flex-end; flex-wrap:wrap; margin-bottom:0.75rem;" id="sp-answer-row">
          <div style="flex:1; min-width:160px;">
            <label style="font-size:var(--text-xs); color:var(--color-text-muted); display:block; margin-bottom:0.3rem;">
              Your answer — ${FIELD_LABEL[prob.field]}:
            </label>
            <input type="text" id="sp-answer-input"
              placeholder="${_getPlaceholder(prob.field)}"
              style="width:100%; padding:0.5rem 0.75rem;
                background:var(--color-bg-raised); border:1px solid var(--color-border);
                border-radius:var(--radius-sm); color:var(--color-text-primary);
                font-family:var(--font-mono); font-size:var(--text-base); outline:none;"
              ${this._answered ? 'disabled' : ''}
            />
          </div>
          ${!this._answered ? `
            <button class="btn btn-primary" id="sp-submit-btn">Check ✓</button>
          ` : ''}
        </div>

        <!-- Hint -->
        ${!this._answered ? `
          <button class="btn btn-ghost" id="sp-hint-btn" style="font-size:var(--text-xs);">
            💡 ${this._showHint ? 'Hide Hint' : 'Show Hint'}
          </button>
          ${this._showHint ? `
            <div style="margin-top:0.5rem; padding:0.6rem; background:rgba(255,184,0,0.08); border-left:3px solid var(--color-amber); border-radius:var(--radius-sm);">
              <p style="font-size:var(--text-xs); color:var(--color-amber); margin:0; line-height:1.7;">${prob.hint}</p>
            </div>
          ` : ''}
        ` : ''}

        <!-- Feedback (shown after answer) -->
        <div id="sp-feedback"></div>
      </div>
    `;
  }

  _renderCompletion() {
    const pct = this._attempted > 0
      ? Math.round((this._correct / this._attempted) * 100)
      : 0;
    const pass = pct >= 70;

    return `
      <div class="card" style="text-align:center; padding:2rem;">
        <div style="font-size:4rem; margin-bottom:0.75rem;">${pass ? '🎉' : '📚'}</div>
        <h2 style="font-family:var(--font-display); margin-bottom:0.5rem;">
          ${pass ? 'Well Done!' : 'Keep Practising'}
        </h2>
        <div style="font-family:var(--font-mono); font-size:3rem; font-weight:800;
          color:${pass ? 'var(--color-success)' : 'var(--color-warning)'}; margin:0.75rem 0;">
          ${pct}%
        </div>
        <p style="color:var(--color-text-secondary); font-size:var(--text-sm); margin-bottom:1.5rem;">
          ${this._correct} correct out of ${this._attempted} attempted
          ${!pass ? '<br>Review the explanations and try again.' : ''}
        </p>
        <button class="btn btn-primary" id="sp-retry-btn">↺ New Set</button>
      </div>
    `;
  }

  _bindModeButtons() {
    this.container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._mode = btn.getAttribute('data-mode');
        this._buildQueue();
        this._render();
      });
    });
  }

  _bindQuestionControls() {
    const retryBtn = this.container.querySelector('#sp-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this._buildQueue();
        this._render();
      });
      return;
    }

    const submitBtn = this.container.querySelector('#sp-submit-btn');
    const hintBtn   = this.container.querySelector('#sp-hint-btn');
    const input     = this.container.querySelector('#sp-answer-input');

    submitBtn?.addEventListener('click', () => this._checkAnswer());
    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._checkAnswer();
    });

    hintBtn?.addEventListener('click', () => {
      this._showHint = !this._showHint;
      const qa = this.container.querySelector('#sp-question-area');
      if (qa) {
        qa.innerHTML = this._renderQuestion();
        this._bindQuestionControls();
      }
    });
  }

  _checkAnswer() {
    if (this._answered) return;

    const prob    = this._queue[this._current];
    const input   = this.container.querySelector('#sp-answer-input');
    const raw     = input?.value?.trim() || '';

    const info    = calculateSubnet(prob.given.ip, prob.given.prefix);
    const correct = String(info[prob.field]);

    // Normalise: strip whitespace, compare case-insensitively for text values
    const normalise = s => s.replace(/\s/g, '').toLowerCase();
    const isCorrect = normalise(raw) === normalise(correct);

    this._answered  = true;
    this._attempted++;
    if (isCorrect) this._correct++;

    // Update progress
    this._updateProgress();

    // Show feedback
    const feedback = this.container.querySelector('#sp-feedback');
    const steps    = getSubnetSteps(prob.given.ip, prob.given.prefix);

    if (feedback) {
      feedback.innerHTML = `
        <div style="margin-top:1rem; padding:1rem;
          background:${isCorrect ? 'rgba(0,230,118,0.07)' : 'rgba(255,68,68,0.07)'};
          border-left:3px solid ${isCorrect ? 'var(--color-success)' : 'var(--color-error)'};
          border-radius:var(--radius-md); animation: fadeInUp 300ms ease;">
          <div style="font-weight:700; color:${isCorrect ? 'var(--color-success)' : 'var(--color-error)'};
            margin-bottom:0.5rem; font-size:var(--text-md);">
            ${isCorrect ? '✓ Correct!' : `✕ Not quite. The correct answer is: `}
            ${!isCorrect ? `<code style="color:var(--color-cyan); font-family:var(--font-mono);">${escapeHtml(correct)}</code>` : ''}
          </div>
          <p style="font-size:var(--text-xs); color:var(--color-text-secondary); line-height:1.7; margin-bottom:0.75rem;">
            ${prob.hint}
          </p>

          <!-- Full derivation for the field requested -->
          ${this._renderMiniDerivation(steps, prob.field)}
        </div>

        <div style="display:flex; justify-content:flex-end; margin-top:1rem;">
          <button class="btn btn-primary" id="sp-next-btn">
            ${this._current + 1 >= this._queue.length ? '📊 View Results' : 'Next Question →'}
          </button>
        </div>
      `;

      // Remove the submit button and hint button
      const answerRow = this.container.querySelector('#sp-answer-row');
      const submitBtn = this.container.querySelector('#sp-submit-btn');
      const hintBtn   = this.container.querySelector('#sp-hint-btn');
      if (submitBtn) submitBtn.remove();
      if (hintBtn)   hintBtn.remove();
      if (input)     input.disabled = true;

      this.container.querySelector('#sp-next-btn')?.addEventListener('click', () => {
        this._current++;
        this._answered  = false;
        this._showHint  = false;
        this._updateProgress();
        const qa = this.container.querySelector('#sp-question-area');
        if (qa) {
          qa.innerHTML = this._renderQuestion();
          this._bindQuestionControls();
        }
        if (this._current >= this._queue.length) {
          stateManager.mergeState('userProgress', {
            completedModules: [...new Set([
              ...(stateManager.getState('userProgress').completedModules || []),
              '/subnet-practice'
            ])]
          });
        }
      });
    }
  }

  _renderMiniDerivation(steps, targetField) {
    // Find the step that matches the requested field
    const fieldToStep = {
      networkAddress:   3,
      broadcastAddress: 4,
      firstHost:        5,
      lastHost:         6,
      usableHosts:      7,
      totalAddresses:   7,
      subnetMask:       2,
      wildcardMask:     2,
    };

    const targetStep = fieldToStep[targetField] || 3;
    const relevant   = steps.filter(s => s.step <= targetStep);

    return `
      <div style="margin-top:0.5rem;">
        <div style="font-size:var(--text-xs); color:var(--color-text-muted); font-family:var(--font-mono); text-transform:uppercase; margin-bottom:0.4rem;">Derivation Steps</div>
        ${relevant.map(s => `
          <div style="display:flex; gap:0.5rem; margin-bottom:0.3rem; align-items:flex-start;">
            <span style="width:16px; height:16px; border-radius:50%; background:var(--color-bg-surface); border:1px solid var(--color-border);
              display:flex; align-items:center; justify-content:center;
              font-family:var(--font-mono); font-size:9px; color:var(--color-text-muted); flex-shrink:0; margin-top:1px;">
              ${s.step}
            </span>
            <div>
              <span style="font-size:var(--text-xs); color:var(--color-text-secondary);">${s.title}: </span>
              <code style="font-size:var(--text-xs); color:var(--color-cyan); font-family:var(--font-mono);">${escapeHtml(s.value)}</code>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  _updateProgress() {
    const bar   = this.container.querySelector('#sp-progress-bar');
    const label = this.container.querySelector('#sp-score-label');
    if (bar)   bar.style.width   = `${(this._attempted / this._queue.length) * 100}%`;
    if (label) label.textContent = `${this._correct} correct / ${this._attempted} attempted`;
  }

  start()  {}
  step()   {}

  reset() {
    this._buildQueue();
    this._render();
  }

  destroy() {
    this.container = null;
  }
}

// ── Module-level helper (not exported) ────────────────────────────────
function require_binary(ip) {
  return ip.split('.').map(o => parseInt(o,10).toString(2).padStart(8,'0')).join('');
}

function _getPlaceholder(field) {
  const map = {
    networkAddress:  'e.g. 192.168.1.0',
    broadcastAddress:'e.g. 192.168.1.255',
    firstHost:       'e.g. 192.168.1.1',
    lastHost:        'e.g. 192.168.1.254',
    subnetMask:      'e.g. 255.255.255.0',
    wildcardMask:    'e.g. 0.0.0.255',
    usableHosts:     'e.g. 254',
    totalAddresses:  'e.g. 256',
  };
  return map[field] || '';
}

export default new SubnetPracticeEngine();
