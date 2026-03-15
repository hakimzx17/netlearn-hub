/**
 * vlsmDesignEngine.js — Variable Length Subnet Masking Design Tool
 *
 * Teaches: VLSM concept, why variable-length masks conserve address space,
 *          how to allocate subnets largest-first, and how to read/verify
 *          the resulting allocation table.
 *
 * Two modes:
 *   1. Guided designer — user enters network and host requirements
 *   2. Worked examples  — pre-built scenarios showing the algorithm
 *
 * Depends on: networkMath, ipUtils, binaryUtils, helperFunctions
 */

import {
  vlsmAllocate, calculateSubnet,
} from '../utils/networkMath.js';

import {
  isValidIP, parseCIDR, getHostCount,
} from '../utils/ipUtils.js';

import { escapeHtml, showToast } from '../utils/helperFunctions.js';
import { stateManager }          from '../js/stateManager.js';

// ── Pre-built VLSM scenarios ──────────────────────────────────────────
const SCENARIOS = [
  {
    id: 'office',
    title: 'Small Office Network',
    description: 'A company needs four network segments from a single 192.168.1.0/24 block. Design a VLSM allocation that wastes the fewest addresses.',
    base: { network: '192.168.1.0', prefix: 24 },
    needs: [
      { name: 'Staff LAN',      hosts: 100 },
      { name: 'Guest Wi-Fi',    hosts: 50  },
      { name: 'Server VLAN',    hosts: 14  },
      { name: 'Router P2P',     hosts: 2   },
    ],
  },
  {
    id: 'enterprise',
    title: 'Enterprise Campus',
    description: 'Allocate from 10.0.0.0/16 for a multi-department enterprise with widely varying host requirements.',
    base: { network: '10.0.0.0', prefix: 16 },
    needs: [
      { name: 'Engineering',    hosts: 500 },
      { name: 'Sales',          hosts: 200 },
      { name: 'HR',             hosts: 60  },
      { name: 'Finance',        hosts: 25  },
      { name: 'Management',     hosts: 10  },
      { name: 'WAN Link 1',     hosts: 2   },
      { name: 'WAN Link 2',     hosts: 2   },
    ],
  },
  {
    id: 'isp',
    title: 'ISP Customer Allocation',
    description: 'An ISP must allocate 172.16.0.0/20 across multiple customers with known size needs.',
    base: { network: '172.16.0.0', prefix: 20 },
    needs: [
      { name: 'Customer A',     hosts: 1000 },
      { name: 'Customer B',     hosts: 500  },
      { name: 'Customer C',     hosts: 200  },
      { name: 'Customer D',     hosts: 50   },
    ],
  },
];

// Visual colour palette for allocation rows
const ROW_COLORS = [
  'rgba(0,212,255,0.08)',   // cyan
  'rgba(255,184,0,0.08)',   // amber
  'rgba(0,230,118,0.08)',   // green
  'rgba(171,71,188,0.08)',  // purple
  'rgba(255,112,67,0.08)',  // orange
  'rgba(38,166,154,0.08)',  // teal
  'rgba(92,107,192,0.08)',  // indigo
];

const ROW_BORDER = [
  'var(--color-cyan)',
  'var(--color-amber)',
  'var(--color-success)',
  '#ab47bc',
  '#ff7043',
  '#26a69a',
  '#5c6bc0',
];

class VlsmDesignEngine {
  constructor() {
    this.container    = null;
    this._mode        = 'designer';  // 'designer' | 'examples'
    this._scenario    = 'office';
    this._customBase  = '192.168.0.0/24';
    this._customNeeds = [
      { name: 'Network A', hosts: 50 },
      { name: 'Network B', hosts: 25 },
      { name: 'Network C', hosts: 10 },
    ];
  }

  init(containerEl) {
    this.container = containerEl;
    this._render();
  }

  _render() {
    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <span>Subnetting</span>
        </div>
        <h1 class="module-header__title">VLSM Design Tool</h1>
        <p class="module-header__description">
          Variable Length Subnet Masking allows different subnets within the same
          network to have different prefix lengths. This conserves address space by
          giving each segment exactly as many hosts as it needs — no more.
        </p>
      </div>

      <!-- Mode toggle -->
      <div style="display:flex; gap:0.4rem; margin-bottom:1.5rem;">
        <button class="btn ${this._mode === 'designer' ? 'btn-primary' : 'btn-ghost'} vlsm-mode-btn" data-mode="designer">
          🛠 Design Tool
        </button>
        <button class="btn ${this._mode === 'examples' ? 'btn-primary' : 'btn-ghost'} vlsm-mode-btn" data-mode="examples">
          📚 Worked Examples
        </button>
      </div>

      <!-- Content area -->
      <div id="vlsm-content">
        ${this._mode === 'designer' ? this._renderDesigner() : this._renderExamples()}
      </div>
    `;

    this._bindModeBtns();
  }

  // ── DESIGNER MODE ────────────────────────────────────────────────────

  _renderDesigner() {
    return `
      <div class="layout-main-sidebar" style="align-items:flex-start;">
        <!-- Left: Input form -->
        <div>
          <div class="card" style="margin-bottom:1rem;">
            <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase;">Base Network</div>
            <div style="display:flex; gap:0.5rem; align-items:flex-end; flex-wrap:wrap;">
              <div style="flex:1; min-width:160px;">
                <label for="vlsm-base-input" style="font-size:var(--text-xs); color:var(--color-text-muted); display:block; margin-bottom:0.3rem;">Network / Prefix (CIDR)</label>
                <input type="text" id="vlsm-base-input"
                  value="${this._customBase}"
                  placeholder="e.g. 192.168.0.0/24"
                  style="width:100%; padding:0.45rem 0.75rem;
                    background:var(--color-bg-raised); border:1px solid var(--color-border);
                    border-radius:var(--radius-sm); color:var(--color-text-primary);
                    font-family:var(--font-mono); font-size:var(--text-sm); outline:none;" />
              </div>
            </div>
          </div>

          <div class="card" style="margin-bottom:1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
              <div class="text-mono text-xs text-muted" style="text-transform:uppercase;">Subnet Requirements</div>
              <button class="btn btn-ghost" id="vlsm-add-row-btn" style="font-size:var(--text-xs); padding:0.2rem 0.5rem;">+ Add</button>
            </div>
            <div id="vlsm-needs-list">
              ${this._renderNeedsRows()}
            </div>
          </div>

          <div class="control-bar">
            <button class="btn btn-primary" id="vlsm-allocate-btn">⚙ Allocate VLSM</button>
            <button class="btn btn-ghost"   id="vlsm-clear-btn">↺ Clear</button>
          </div>

          <!-- Allocation result -->
          <div id="vlsm-result" style="margin-top:1rem;"></div>
        </div>

        <!-- Right: Info panel -->
        <div>
          <div class="info-panel">
            <div class="info-panel__title">📐 VLSM Algorithm</div>
            <p class="text-secondary text-sm" style="margin-bottom:0.75rem; line-height:1.8;">
              VLSM uses a <strong>largest-first</strong> allocation strategy:
            </p>
            <ol style="padding-left:1.25rem; display:flex; flex-direction:column; gap:0.5rem;">
              ${[
                'Sort requirements from largest to smallest host count.',
                'For the largest need, find the smallest prefix that satisfies it (2^n - 2 ≥ hosts).',
                'Align the block to its natural boundary.',
                'Assign the subnet. Advance the pointer past it.',
                'Repeat for the next requirement.',
              ].map((step, i) => `
                <li style="font-size:var(--text-xs); color:var(--color-text-secondary); line-height:1.6;">
                  <strong style="color:var(--color-cyan);">${i+1}.</strong> ${step}
                </li>
              `).join('')}
            </ol>
          </div>

          <div class="card" style="margin-top:1rem;">
            <div class="text-mono text-xs text-muted" style="margin-bottom:0.6rem; text-transform:uppercase;">Why Largest First?</div>
            <p style="font-size:var(--text-xs); color:var(--color-text-secondary); line-height:1.7;">
              Large blocks have strict alignment requirements (e.g. a /23 must start
              on a multiple of 512). Allocating them first ensures natural boundary
              alignment without wasted gaps.
            </p>
            <div style="margin-top:0.75rem; padding:0.5rem 0.6rem;
              background:var(--color-bg-raised); border-radius:var(--radius-sm);
              font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-amber);">
              /25 → 128 addrs → must start at .0 or .128<br>
              /26 → 64 addrs → .0, .64, .128, .192<br>
              /30 → 4 addrs → any multiple of 4
            </div>
          </div>

          <!-- Quick prefix lookup -->
          <div class="card" style="margin-top:1rem;">
            <div class="text-mono text-xs text-muted" style="margin-bottom:0.6rem; text-transform:uppercase;">Hosts → Prefix</div>
            ${[
              [2,'  /30'], [6,'/29'], [14,'/28'], [30,'/27'],
              [62,'/26'], [126,'/25'], [254,'/24'], [510,'/23'],
              [1022,'/22'],[2046,'/21'],[4094,'/20'],
            ].map(([h, p]) => `
              <div style="display:flex; justify-content:space-between; padding:2px 0;
                border-bottom:1px solid var(--color-border); font-family:var(--font-mono); font-size:var(--text-xs);">
                <span style="color:var(--color-text-muted);">≤ ${h} hosts</span>
                <span style="color:var(--color-cyan);">${p}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  _renderNeedsRows() {
    return this._customNeeds.map((need, i) => `
      <div class="vlsm-needs-row" data-index="${i}"
        style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.4rem;">
        <input type="text" class="vlsm-name-input" aria-label="Subnet name" value="${escapeHtml(need.name)}"
          placeholder="Subnet name"
          style="flex:2; padding:0.35rem 0.6rem; background:var(--color-bg-raised);
            border:1px solid var(--color-border); border-radius:var(--radius-xs);
            color:var(--color-text-primary); font-size:var(--text-xs); font-family:var(--font-mono); outline:none;" />
        <input type="number" class="vlsm-hosts-input" aria-label="Host count" value="${need.hosts}" min="1" max="65534"
          placeholder="hosts"
          style="width:80px; padding:0.35rem 0.5rem; background:var(--color-bg-raised);
            border:1px solid var(--color-border); border-radius:var(--radius-xs);
            color:var(--color-cyan); font-size:var(--text-xs); font-family:var(--font-mono); outline:none;" />
        <span style="font-size:var(--text-xs); color:var(--color-text-muted); font-family:var(--font-mono);">hosts</span>
        <button class="vlsm-remove-btn btn btn-ghost"
          style="padding:0.2rem 0.4rem; font-size:var(--text-xs); color:var(--color-error); border-color:var(--color-error)44;"
          data-index="${i}">✕</button>
      </div>
    `).join('');
  }

  // ── EXAMPLES MODE ────────────────────────────────────────────────────

  _renderExamples() {
    const sc = SCENARIOS.find(s => s.id === this._scenario);
    let allocation;
    let allocError = null;
    try {
      allocation = vlsmAllocate(sc.base.network, sc.base.prefix, sc.needs);
    } catch (e) {
      allocError = e.message;
    }

    return `
      <!-- Scenario selector -->
      <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:1.25rem;">
        ${SCENARIOS.map(s => `
          <button class="btn ${s.id === this._scenario ? 'btn-primary' : 'btn-ghost'} scenario-btn"
            data-scenario="${s.id}" style="font-size:var(--text-xs); padding:0.3rem 0.75rem;">
            ${s.title}
          </button>
        `).join('')}
      </div>

      <div class="card" style="margin-bottom:1rem;">
        <h3 style="margin-bottom:0.4rem;">${sc.title}</h3>
        <p style="font-size:var(--text-sm); color:var(--color-text-secondary); line-height:1.7; margin-bottom:0.75rem;">${sc.description}</p>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
          <div>
            <span class="text-mono text-xs text-muted">Base network: </span>
            <code style="color:var(--color-cyan); font-family:var(--font-mono); font-size:var(--text-sm);">
              ${sc.base.network}/${sc.base.prefix}
            </code>
          </div>
          <div>
            <span class="text-mono text-xs text-muted">Available hosts: </span>
            <code style="color:var(--color-amber); font-family:var(--font-mono); font-size:var(--text-sm);">
              ${getHostCount(sc.base.prefix).toLocaleString()}
            </code>
          </div>
        </div>
      </div>

      ${allocError ? `
        <div style="padding:1rem; background:rgba(255,68,68,0.1); border:1px solid var(--color-error); border-radius:var(--radius-md); color:var(--color-error);">
          ✕ Allocation error: ${escapeHtml(allocError)}
        </div>
      ` : `
        <!-- Requirements vs allocation table -->
        ${this._renderAllocationTable(sc.needs, allocation)}
        <!-- Address space visualisation -->
        ${this._renderAddressSpaceBar(sc.base, allocation)}
        <!-- Key takeaways -->
        ${this._renderTakeaways(sc, allocation)}
      `}
    `;
  }

  _renderAllocationTable(needs, allocation) {
    const totalUsed  = allocation.reduce((sum, a) => sum + a.allocated.totalAddresses, 0);
    const totalHosts = allocation.reduce((sum, a) => sum + a.hostsNeeded, 0);

    return `
      <div class="card" style="margin-bottom:1rem; overflow-x:auto;">
        <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase;">
          VLSM Allocation Table
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:var(--text-xs); font-family:var(--font-mono);">
          <thead>
            <tr style="border-bottom:2px solid var(--color-border);">
              ${['Name','Hosts Req.','Prefix','Network','First Host','Last Host','Broadcast','Wasted'].map(h =>
                `<th style="padding:5px 8px; text-align:left; color:var(--color-text-muted); white-space:nowrap;">${h}</th>`
              ).join('')}
            </tr>
          </thead>
          <tbody>
            ${allocation.map((a, i) => {
              const wasted = a.allocated.usableHosts - a.hostsNeeded;
              const color  = ROW_BORDER[i % ROW_BORDER.length];
              return `
                <tr style="border-bottom:1px solid var(--color-border); background:${ROW_COLORS[i % ROW_COLORS.length]};">
                  <td style="padding:5px 8px; font-weight:700; color:var(--color-text-primary); border-left:3px solid ${color};">${escapeHtml(a.name)}</td>
                  <td style="padding:5px 8px; color:${color};">${a.hostsNeeded}</td>
                  <td style="padding:5px 8px; color:var(--color-cyan); font-weight:700;">/${a.allocated.prefix}</td>
                  <td style="padding:5px 8px; color:var(--color-text-primary);">${a.allocated.networkAddress}</td>
                  <td style="padding:5px 8px; color:var(--color-success);">${a.allocated.firstHost}</td>
                  <td style="padding:5px 8px; color:var(--color-success);">${a.allocated.lastHost}</td>
                  <td style="padding:5px 8px; color:var(--color-text-secondary);">${a.allocated.broadcastAddress}</td>
                  <td style="padding:5px 8px; color:${wasted > a.hostsNeeded ? 'var(--color-warning)' : 'var(--color-text-muted)'};">${wasted}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid var(--color-border);">
              <td style="padding:5px 8px; font-weight:700; color:var(--color-text-primary);">Totals</td>
              <td style="padding:5px 8px; color:var(--color-amber); font-weight:700;">${totalHosts} needed</td>
              <td colspan="5"></td>
              <td style="padding:5px 8px; color:var(--color-text-muted);">${allocation.reduce((s,a) => s + a.allocated.usableHosts - a.hostsNeeded, 0)} wasted</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  _renderAddressSpaceBar(base, allocation) {
    const baseInfo   = calculateSubnet(base.network, base.prefix);
    const totalAddrs = baseInfo.totalAddresses;

    return `
      <div class="card" style="margin-bottom:1rem;">
        <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase;">
          Address Space Visualisation
          <span style="margin-left:0.5rem;">(/${base.prefix} = ${totalAddrs.toLocaleString()} total addresses)</span>
        </div>
        <div style="height:36px; display:flex; border-radius:var(--radius-sm); overflow:hidden; border:1px solid var(--color-border);">
          ${allocation.map((a, i) => {
            const pct   = (a.allocated.totalAddresses / totalAddrs) * 100;
            const color = ROW_BORDER[i % ROW_BORDER.length];
            return `
              <div title="${escapeHtml(a.name)}: ${a.allocated.networkAddress}/${a.allocated.prefix} (${pct.toFixed(1)}%)"
                style="width:${pct}%; background:${ROW_COLORS[i % ROW_COLORS.length]};
                  border-right:2px solid ${color};
                  display:flex; align-items:center; justify-content:center; overflow:hidden;
                  font-family:var(--font-mono); font-size:9px; color:${color};
                  white-space:nowrap; padding:0 3px; min-width:0;">
                ${pct > 5 ? `${escapeHtml(a.name).slice(0,10)}` : ''}
              </div>
            `;
          }).join('')}
          <!-- Remaining unused space -->
          ${(() => {
            const usedAddrs = allocation.reduce((s,a) => s + a.allocated.totalAddresses, 0);
            const remaining = totalAddrs - usedAddrs;
            const pct       = (remaining / totalAddrs) * 100;
            return remaining > 0 ? `
              <div title="Unused: ${remaining.toLocaleString()} addresses"
                style="flex:1; background:var(--color-bg-raised); display:flex; align-items:center;
                  justify-content:center; font-family:var(--font-mono); font-size:9px; color:var(--color-text-muted);">
                ${pct > 8 ? `${remaining.toLocaleString()} unused` : ''}
              </div>
            ` : '';
          })()}
        </div>
        <!-- Legend -->
        <div style="display:flex; gap:0.6rem; flex-wrap:wrap; margin-top:0.5rem;">
          ${allocation.map((a, i) => `
            <div style="display:flex; align-items:center; gap:0.3rem; font-size:var(--text-xs);">
              <div style="width:10px; height:10px; border-radius:2px; background:${ROW_BORDER[i % ROW_BORDER.length]};"></div>
              <span style="color:var(--color-text-muted);">${escapeHtml(a.name)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  _renderTakeaways(sc, allocation) {
    const usedAddrs  = allocation.reduce((s,a) => s + a.allocated.totalAddresses, 0);
    const baseInfo   = calculateSubnet(sc.base.network, sc.base.prefix);
    const efficiency = Math.round((usedAddrs / baseInfo.totalAddresses) * 100);

    return `
      <div class="card">
        <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase;">Key Takeaways</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-bottom:0.75rem;">
          ${[
            ['Subnets allocated', allocation.length],
            ['Total hosts needed', allocation.reduce((s,a) => s + a.hostsNeeded, 0).toLocaleString()],
            ['Addresses used', usedAddrs.toLocaleString()],
            ['Space efficiency', `${efficiency}%`],
          ].map(([k, v]) => `
            <div style="background:var(--color-bg-raised); border-radius:var(--radius-sm); padding:0.5rem 0.6rem;">
              <div style="font-size:var(--text-xs); color:var(--color-text-muted); font-family:var(--font-mono); margin-bottom:0.15rem;">${k}</div>
              <div style="font-family:var(--font-mono); font-size:var(--text-sm); font-weight:700; color:var(--color-cyan);">${v}</div>
            </div>
          `).join('')}
        </div>
        <p style="font-size:var(--text-xs); color:var(--color-text-secondary); line-height:1.7;">
          With FLSM (equal-size subnets), you would need a /25 for every segment —
          giving each only 126 usable hosts regardless of need, and requiring more
          total address space. VLSM avoids this waste by right-sizing each subnet.
        </p>
      </div>
    `;
  }

  // ── Event binding ────────────────────────────────────────────────────

  _bindModeBtns() {
    this.container.querySelectorAll('.vlsm-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._mode = btn.getAttribute('data-mode');
        this._render();
      });
    });

    this.container.querySelectorAll('.scenario-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._scenario = btn.getAttribute('data-scenario');
        const content = this.container.querySelector('#vlsm-content');
        if (content) {
          content.innerHTML = this._renderExamples();
          this._bindExampleEvents();
        }
      });
    });

    this._bindDesignerEvents();
    this._bindExampleEvents();
  }

  _bindDesignerEvents() {
    const addBtn      = this.container.querySelector('#vlsm-add-row-btn');
    const allocBtn    = this.container.querySelector('#vlsm-allocate-btn');
    const clearBtn    = this.container.querySelector('#vlsm-clear-btn');
    const needsList   = this.container.querySelector('#vlsm-needs-list');

    addBtn?.addEventListener('click', () => {
      this._syncNeedsFromDOM();
      this._customNeeds.push({ name: `Network ${this._customNeeds.length + 1}`, hosts: 10 });
      if (needsList) {
        needsList.innerHTML = this._renderNeedsRows();
        this._bindRemoveButtons();
      }
    });

    clearBtn?.addEventListener('click', () => {
      this._customNeeds = [
        { name: 'Network A', hosts: 50 },
        { name: 'Network B', hosts: 25 },
        { name: 'Network C', hosts: 10 },
      ];
      this._customBase = '192.168.0.0/24';
      this._render();
    });

    allocBtn?.addEventListener('click', () => {
      this._syncNeedsFromDOM();
      this._runAllocation();
    });

    this._bindRemoveButtons();
  }

  _bindRemoveButtons() {
    this.container.querySelectorAll('.vlsm-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.getAttribute('data-index'), 10);
        this._syncNeedsFromDOM();
        this._customNeeds.splice(i, 1);
        const needsList = this.container.querySelector('#vlsm-needs-list');
        if (needsList) {
          needsList.innerHTML = this._renderNeedsRows();
          this._bindRemoveButtons();
        }
      });
    });
  }

  _syncNeedsFromDOM() {
    const rows = this.container.querySelectorAll('.vlsm-needs-row');
    this._customNeeds = Array.from(rows).map(row => ({
      name:  row.querySelector('.vlsm-name-input')?.value  || 'Subnet',
      hosts: parseInt(row.querySelector('.vlsm-hosts-input')?.value, 10) || 2,
    }));
    const baseInput = this.container.querySelector('#vlsm-base-input');
    if (baseInput) this._customBase = baseInput.value.trim();
  }

  _runAllocation() {
    const resultEl = this.container.querySelector('#vlsm-result');
    if (!resultEl) return;

    const parsed = parseCIDR(this._customBase);
    if (!parsed) {
      resultEl.innerHTML = `<div style="color:var(--color-error); font-size:var(--text-sm); padding:0.5rem;">✕ Invalid base network — use CIDR format, e.g. 192.168.1.0/24</div>`;
      return;
    }

    if (!this._customNeeds.length) {
      resultEl.innerHTML = `<div style="color:var(--color-error); font-size:var(--text-sm); padding:0.5rem;">✕ Add at least one subnet requirement.</div>`;
      return;
    }

    let allocation;
    try {
      allocation = vlsmAllocate(parsed.ip, parsed.prefix, this._customNeeds);
    } catch (e) {
      resultEl.innerHTML = `<div style="padding:0.75rem; background:rgba(255,68,68,0.1); border:1px solid var(--color-error); border-radius:var(--radius-md); color:var(--color-error); font-size:var(--text-sm);">✕ ${escapeHtml(e.message)}</div>`;
      return;
    }

    resultEl.innerHTML = `
      <div style="animation:fadeInUp 300ms ease;">
        ${this._renderAllocationTable(this._customNeeds, allocation)}
        ${this._renderAddressSpaceBar({ network: parsed.ip, prefix: parsed.prefix }, allocation)}
      </div>
    `;

    showToast(`✓ Allocated ${allocation.length} subnets from ${this._customBase}`, 'success');

    stateManager.mergeState('userProgress', {
      completedModules: [...new Set([
        ...(stateManager.getState('userProgress').completedModules || []),
        '/vlsm-design'
      ])]
    });
  }

  _bindExampleEvents() {
    this.container.querySelectorAll('.scenario-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._scenario = btn.getAttribute('data-scenario');
        const content  = this.container.querySelector('#vlsm-content');
        if (content) {
          content.innerHTML = this._renderExamples();
          this._bindExampleEvents();
        }
      });
    });
  }

  start()  {}
  step()   {}

  reset() {
    this._mode       = 'designer';
    this._customBase = '192.168.0.0/24';
    this._customNeeds = [
      { name: 'Network A', hosts: 50 },
      { name: 'Network B', hosts: 25 },
      { name: 'Network C', hosts: 10 },
    ];
    this._render();
  }

  destroy() {
    this.container = null;
  }
}

export default new VlsmDesignEngine();
