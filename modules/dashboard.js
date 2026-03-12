/**
 * dashboard.js — Home / Dashboard Module
 *
 * Phase 9 upgrade:
 *   - Live per-category completion rings
 *   - Stats bar (modules done, exam best score, streak)
 *   - Keyboard shortcut reference
 *   - Module cards show completed state via data attribute
 *
 * Depends on: eventBus, stateManager
 */

import { eventBus }    from '../js/eventBus.js';
import { stateManager } from '../js/stateManager.js';

const MODULE_CATALOG = [
  {
    category: 'Protocol Headers',
    color: 'var(--color-cyan)',
    icon: '📦',
    modules: [
      { route: '/ipv4-header',    icon: '📦', title: 'IPv4 Header Game',        desc: 'Drag and drop all 13 IPv4 header fields into the correct positions.' },
      { route: '/ethernet-frame', icon: '🔗', title: 'Ethernet Frame Game',     desc: 'Assemble a complete Ethernet II frame from its individual components.' },
      { route: '/osi-tcpip',      icon: '📚', title: 'OSI / TCP-IP Visualizer', desc: 'Map protocols to OSI layers and animate the encapsulation process.' },
      { route: '/ip-classes',     icon: '🗂',  title: 'IP Address Classes',      desc: 'Explore Class A–E ranges, private RFC 1918 space, and live lookup.' },
    ],
  },
  {
    category: 'Network Simulations',
    color: 'var(--color-amber)',
    icon: '🔬',
    modules: [
      { route: '/packet-journey', icon: '🚀', title: 'Packet Journey',          desc: 'Follow a complete HTTP request: DNS → ARP → TCP → NAT → routing.' },
      { route: '/ttl-simulation', icon: '⏱',  title: 'TTL Simulation',          desc: 'Watch TTL decrement at each router hop and trigger ICMP expiry.' },
      { route: '/arp-simulation', icon: '📡', title: 'ARP Simulator',           desc: 'Broadcast ARP request, flood, unicast reply, cache population.' },
      { route: '/mac-table',      icon: '🔀', title: 'MAC Table Learning',      desc: 'See how a switch dynamically learns MACs and switches flood vs. forward.' },
      { route: '/routing-table',  icon: '🗺',  title: 'Routing Table Sim',       desc: 'Enter any destination IP and watch Longest Prefix Match in action.' },
    ],
  },
  {
    category: 'Subnetting Tools',
    color: 'var(--color-green)',
    icon: '🧮',
    modules: [
      { route: '/subnet-practice',   icon: '🧮', title: 'Subnet Practice',      desc: '15 exam-style drills across 3 difficulty tiers with guided explanations.' },
      { route: '/vlsm-design',       icon: '📐', title: 'VLSM Design',          desc: 'Design variable-length allocations with address space visualisation.' },
      { route: '/subnet-calculator', icon: '🔢', title: 'Subnet Calculator',     desc: 'Live binary visualisation and step-by-step subnet derivation.' },
    ],
  },
  {
    category: 'Exam & Reference',
    color: 'var(--color-error)',
    icon: '📝',
    modules: [
      { route: '/exam',      icon: '📝', title: 'CCNA Exam Mode',      desc: 'Timed 60-question exam with per-topic breakdown and full review.' },
      { route: '/resources', icon: '📖', title: 'Resource Library',    desc: 'Protocol reference, CIDR cheat sheet, port tables, and glossary.' },
    ],
  },
];

const TOTAL_MODULES = MODULE_CATALOG.reduce((n, c) => n + c.modules.length, 0);

const SHORTCUTS = [
  { keys: 'Ctrl + /',  desc: 'Go to Home'  },
  { keys: 'Ctrl + E',  desc: 'Open Exam'   },
  { keys: 'Esc',       desc: 'Close modal' },
];

class Dashboard {
  constructor() {
    this.container    = null;
    this._unsubscribe = null;
  }

  init(containerEl) {
    this.container = containerEl;
    this._render();

    this._unsubscribe = stateManager.subscribe('userProgress', () => {
      this._updateLiveRegions();
    });
  }

  _render() {
    const progress  = stateManager.getState('userProgress');
    const completed = new Set(progress.completedModules || []);
    const doneCount = completed.size;
    const examBest  = progress.bestExamScore || 0;
    const history   = stateManager.getState('examHistory') || [];

    this.container.innerHTML = `
      <div class="dashboard">

        <!-- ── Hero ───────────────────────────────────────── -->
        <div class="dashboard__hero">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:1.5rem; margin-bottom:2rem;">
            <div>
              <div class="text-mono text-xs text-muted" style="text-transform:uppercase; letter-spacing:0.1em; margin-bottom:0.75rem;">
                <span class="status-dot"></span> Network Learning Platform
              </div>
              <h1 style="
                font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 800; line-height: 1.1; margin-bottom: 1rem;
                background: linear-gradient(135deg, #e8f4fd 40%, #00d4ff);
                -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
              ">Master<br>Networking</h1>
              <p style="font-size:1.0625rem; color:var(--color-text-secondary); max-width:520px; line-height:1.8;">
                Interactive simulations, protocol visualisers, subnetting tools,
                and CCNA exam preparation — all in one platform.
              </p>
            </div>

            <!-- Overall progress widget -->
            <div class="card" style="min-width:180px; text-align:center; flex-shrink:0;">
              <div class="text-mono text-xs text-muted" style="text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.5rem;">Progress</div>
              <div id="db-progress-count" style="font-size:2.5rem; font-weight:800; font-family:var(--font-mono); color:var(--color-cyan); line-height:1;">
                ${doneCount}<span style="font-size:1rem; color:var(--color-text-muted);">/${TOTAL_MODULES}</span>
              </div>
              <div class="text-sm text-secondary" style="margin-top:0.2rem;">modules completed</div>
              <div style="margin-top:0.75rem; height:6px; background:var(--color-bg-raised); border-radius:99px; overflow:hidden;">
                <div id="db-progress-bar" style="
                  height:100%; border-radius:99px;
                  background:linear-gradient(90deg, var(--color-cyan), var(--color-amber));
                  width:${TOTAL_MODULES > 0 ? ((doneCount / TOTAL_MODULES) * 100).toFixed(1) : 0}%;
                  transition:width 0.6s ease;
                "></div>
              </div>
            </div>
          </div>

          <!-- Stats bar -->
          <div class="dashboard__stats">
            ${this._renderStatCard(doneCount, 'Modules Done',    'var(--color-cyan)')}
            ${this._renderStatCard(TOTAL_MODULES - doneCount, 'Remaining',  'var(--color-text-muted)')}
            ${this._renderStatCard(examBest ? examBest + '%' : '—', 'Best Exam Score', examBest >= 70 ? 'var(--color-success)' : 'var(--color-warning)')}
            ${this._renderStatCard(history.length, 'Exams Taken',     'var(--color-amber)')}
          </div>
        </div>

        <!-- ── Category grids ──────────────────────────────── -->
        <div id="db-categories">
          ${MODULE_CATALOG.map((cat, ci) => this._renderCategory(cat, ci, completed)).join('')}
        </div>

        <!-- ── Keyboard shortcuts ──────────────────────────── -->
        <div style="margin-top:3rem; padding-top:1.5rem; border-top:1px solid var(--color-border);">
          <div style="display:flex; gap:1.5rem; flex-wrap:wrap; align-items:center;">
            <span class="text-mono text-xs text-muted" style="text-transform:uppercase; letter-spacing:0.06em;">Shortcuts</span>
            ${SHORTCUTS.map(s => `
              <div style="display:flex; align-items:center; gap:0.35rem; font-size:var(--text-xs); color:var(--color-text-muted);">
                <kbd class="kbd">${s.keys}</kbd>
                <span>${s.desc}</span>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;
  }

  _renderStatCard(value, label, color) {
    return `
      <div class="stat-card">
        <div class="stat-card__value" style="color:${color};">${value}</div>
        <div class="stat-card__label">${label}</div>
      </div>
    `;
  }

  _renderCategory(cat, catIndex, completedSet) {
    const catDone  = cat.modules.filter(m => completedSet.has(m.route)).length;
    const catTotal = cat.modules.length;
    const pct      = catTotal > 0 ? Math.round((catDone / catTotal) * 100) : 0;

    return `
      <div class="anim-fade-in-up anim-delay-${catIndex + 1}" style="margin-bottom:3rem;">

        <!-- Category header -->
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1.25rem; flex-wrap:wrap;">
          <div style="width:4px; height:24px; background:${cat.color}; border-radius:99px; flex-shrink:0;"></div>
          <h2 style="font-size:1.0625rem; font-weight:700; color:var(--color-text-secondary); text-transform:uppercase; letter-spacing:0.07em; margin:0;">
            ${cat.category}
          </h2>
          <div style="margin-left:auto; display:flex; align-items:center; gap:0.5rem;">
            <span style="font-family:var(--font-mono); font-size:var(--text-xs); color:${cat.color};">${catDone}/${catTotal}</span>
            <div style="width:48px; height:4px; background:var(--color-bg-raised); border-radius:99px; overflow:hidden;">
              <div style="height:100%; width:${pct}%; background:${cat.color}; border-radius:99px; transition:width 0.5s ease;"></div>
            </div>
          </div>
        </div>

        <!-- Module cards -->
        <div class="module-grid">
          ${cat.modules.map(mod => {
            const done = completedSet.has(mod.route);
            return `
              <a href="#${mod.route}"
                class="module-card"
                data-route="${mod.route}"
                data-completed="${done}"
                style="--card-color:${cat.color}">
                <div class="module-card__icon">${mod.icon}</div>
                <div class="module-card__title">${mod.title}</div>
                <div class="module-card__desc">${mod.desc}</div>
                ${done ? `
                  <div class="badge badge-success" style="margin-top:0.75rem; align-self:flex-start;">✓ Completed</div>
                ` : ''}
              </a>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ── Live update — called when stateManager fires ───────────────

  _updateLiveRegions() {
    const progress  = stateManager.getState('userProgress');
    const completed = new Set(progress.completedModules || []);
    const doneCount = completed.size;
    const examBest  = progress.bestExamScore || 0;

    // Progress count + bar
    const countEl = this.container?.querySelector('#db-progress-count');
    const barEl   = this.container?.querySelector('#db-progress-bar');
    if (countEl) countEl.innerHTML = `${doneCount}<span style="font-size:1rem; color:var(--color-text-muted);">/${TOTAL_MODULES}</span>`;
    if (barEl)   barEl.style.width = `${((doneCount / TOTAL_MODULES) * 100).toFixed(1)}%`;

    // Mark module cards
    this.container?.querySelectorAll('.module-card').forEach(card => {
      const route = card.getAttribute('data-route');
      const done  = completed.has(route);
      card.setAttribute('data-completed', done);
      if (done && !card.querySelector('.badge-success')) {
        const badge = document.createElement('div');
        badge.className = 'badge badge-success';
        badge.style.marginTop = '0.75rem';
        badge.style.alignSelf = 'flex-start';
        badge.textContent = '✓ Completed';
        card.appendChild(badge);
      }
    });

    // Update sidebar completion dots
    document.querySelectorAll('.sidebar__nav-item[data-route]').forEach(link => {
      const route = link.getAttribute('data-route');
      link.setAttribute('data-completed', completed.has(route));
    });
  }

  start() {}
  step()  {}

  reset() {
    this._render();
  }

  destroy() {
    if (this._unsubscribe) this._unsubscribe();
    this.container = null;
  }
}

export default new Dashboard();
