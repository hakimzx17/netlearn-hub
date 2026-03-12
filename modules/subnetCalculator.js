/**
 * subnetCalculator.js — Interactive Subnet Calculator
 *
 * Teaches: Full subnet breakdown from any IP/prefix — network address,
 *          broadcast, first/last host, mask, wildcard, binary visualization,
 *          and step-by-step derivation. Live input with instant feedback.
 *
 * Depends on: ipUtils, binaryUtils, networkMath, helperFunctions
 */

import {
  isValidIP, cidrToMask, maskToCIDR,
  getNetworkAddress, getBroadcastAddress,
  getFirstHost, getLastHost, getHostCount, getTotalAddresses,
  parseCIDR, describeIP,
} from '../utils/ipUtils.js';

import {
  ipToBinary, formatBinaryIP,
  buildBinaryHTML, prefixToBinaryMask,
} from '../utils/binaryUtils.js';

import {
  calculateSubnet, getSubnetSteps, divideSubnet,
} from '../utils/networkMath.js';

import { escapeHtml, debounce } from '../utils/helperFunctions.js';

// ── Preset examples for quick exploration ─────────────────────────────
const PRESETS = [
  { label: '/24 — Small office',  ip: '192.168.1.0',  prefix: 24 },
  { label: '/26 — Subnet of /24', ip: '192.168.1.64', prefix: 26 },
  { label: '/30 — Point-to-Point',ip: '10.0.0.0',     prefix: 30 },
  { label: '/16 — Large network', ip: '172.16.0.0',   prefix: 16 },
  { label: '/28 — Small VLAN',    ip: '10.10.10.128',  prefix: 28 },
  { label: '/22 — Medium campus', ip: '10.1.0.0',     prefix: 22 },
];

class SubnetCalculator {
  constructor() {
    this.container  = null;
    this._ip        = '192.168.1.0';
    this._prefix    = 24;
    this._lastResult = null;
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
        <h1 class="module-header__title">Subnet Calculator</h1>
        <p class="module-header__description">
          Enter any IPv4 address and prefix length to instantly compute
          every subnet property — with binary visualization showing
          exactly which bits are network bits and which are host bits.
        </p>
      </div>

      <!-- Input row -->
      <div class="card" style="padding:1rem; margin-bottom:1.25rem;">
        <div style="display:flex; gap:0.6rem; flex-wrap:wrap; align-items:flex-end;">
          <div style="flex:2; min-width:160px;">
            <label style="font-size:var(--text-xs); color:var(--color-text-muted); font-family:var(--font-mono); display:block; margin-bottom:0.3rem; text-transform:uppercase; letter-spacing:0.06em;">IP Address</label>
            <input type="text" id="sc-ip-input" value="${this._ip}"
              placeholder="e.g. 192.168.1.0"
              style="width:100%; padding:0.5rem 0.75rem;
                background:var(--color-bg-raised); border:1px solid var(--color-border);
                border-radius:var(--radius-sm); color:var(--color-text-primary);
                font-family:var(--font-mono); font-size:var(--text-base); outline:none;
                transition: border-color var(--transition-fast);" />
          </div>
          <div style="display:flex; align-items:center; padding-bottom:0.5rem; color:var(--color-text-muted); font-family:var(--font-mono); font-size:1.2rem;">/</div>
          <div style="flex:1; min-width:80px; max-width:120px;">
            <label style="font-size:var(--text-xs); color:var(--color-text-muted); font-family:var(--font-mono); display:block; margin-bottom:0.3rem; text-transform:uppercase; letter-spacing:0.06em;">Prefix</label>
            <input type="number" id="sc-prefix-input" value="${this._prefix}"
              min="0" max="32"
              style="width:100%; padding:0.5rem 0.75rem;
                background:var(--color-bg-raised); border:1px solid var(--color-border);
                border-radius:var(--radius-sm); color:var(--color-text-primary);
                font-family:var(--font-mono); font-size:var(--text-base); outline:none;" />
          </div>
          <button class="btn btn-primary" id="sc-calc-btn" style="padding:0.5rem 1.25rem;">
            Calculate
          </button>
        </div>

        <!-- Prefix slider -->
        <div style="margin-top:0.75rem; display:flex; align-items:center; gap:0.75rem;">
          <span class="text-mono text-xs text-muted">/0</span>
          <input type="range" id="sc-prefix-slider"
            min="0" max="32" value="${this._prefix}"
            style="flex:1; accent-color:var(--color-cyan);" />
          <span class="text-mono text-xs text-muted">/32</span>
          <span class="text-mono text-xs" style="color:var(--color-cyan); min-width:32px;">/${this._prefix}</span>
        </div>

        <!-- Presets -->
        <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-top:0.75rem;">
          ${PRESETS.map(p => `
            <button class="btn btn-ghost sc-preset-btn"
              data-ip="${p.ip}" data-prefix="${p.prefix}"
              style="font-size:var(--text-xs); padding:0.2rem 0.6rem;">
              ${p.label}
            </button>
          `).join('')}
        </div>

        <!-- Validation message -->
        <div id="sc-validation" style="margin-top:0.5rem; font-size:var(--text-xs); min-height:1rem;"></div>
      </div>

      <!-- Results area — empty until calculated -->
      <div id="sc-results"></div>
    `;

    this._bindInputs();
    // Calculate immediately for the default values
    this._calculate();
  }

  _bindInputs() {
    const ipInput     = this.container.querySelector('#sc-ip-input');
    const prefixInput = this.container.querySelector('#sc-prefix-input');
    const slider      = this.container.querySelector('#sc-prefix-slider');
    const calcBtn     = this.container.querySelector('#sc-calc-btn');

    // Sync slider ↔ prefix input
    slider?.addEventListener('input', () => {
      const val = slider.value;
      if (prefixInput) prefixInput.value = val;
      const sliderLabel = this.container.querySelector('#sc-prefix-slider + span + span + span');
      if (sliderLabel) sliderLabel.textContent = `/${val}`;
    });

    prefixInput?.addEventListener('input', () => {
      if (slider) slider.value = prefixInput.value;
    });

    // Auto-calculate on any change (debounced 400ms)
    const debouncedCalc = debounce(() => this._calculate(), 400);
    ipInput?.addEventListener('input', debouncedCalc);
    prefixInput?.addEventListener('input', debouncedCalc);
    slider?.addEventListener('input', debouncedCalc);

    calcBtn?.addEventListener('click', () => this._calculate());

    ipInput?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._calculate();
    });

    // Preset buttons
    this.container.querySelectorAll('.sc-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ip     = btn.getAttribute('data-ip');
        const prefix = btn.getAttribute('data-prefix');
        if (ipInput)     ipInput.value     = ip;
        if (prefixInput) prefixInput.value = prefix;
        if (slider)      slider.value      = prefix;
        this._ip     = ip;
        this._prefix = parseInt(prefix, 10);
        this._calculate();
      });
    });
  }

  _calculate() {
    const ipInput     = this.container.querySelector('#sc-ip-input');
    const prefixInput = this.container.querySelector('#sc-prefix-input');
    const validation  = this.container.querySelector('#sc-validation');
    const results     = this.container.querySelector('#sc-results');

    const ip     = ipInput?.value?.trim() || '';
    const prefix = parseInt(prefixInput?.value, 10);

    // Validate
    if (!isValidIP(ip)) {
      if (validation) validation.innerHTML = `<span style="color:var(--color-error);">✕ Invalid IPv4 address</span>`;
      if (results) results.innerHTML = '';
      return;
    }
    if (isNaN(prefix) || prefix < 0 || prefix > 32) {
      if (validation) validation.innerHTML = `<span style="color:var(--color-error);">✕ Prefix must be 0–32</span>`;
      if (results) results.innerHTML = '';
      return;
    }

    if (validation) validation.innerHTML = `<span style="color:var(--color-success);">✓ Valid input</span>`;

    this._ip     = ip;
    this._prefix = prefix;

    let info;
    try {
      info = calculateSubnet(ip, prefix);
    } catch (e) {
      if (validation) validation.innerHTML = `<span style="color:var(--color-error);">✕ ${escapeHtml(e.message)}</span>`;
      return;
    }

    this._lastResult = info;
    this._renderResults(info);
  }

  _renderResults(info) {
    const results = this.container.querySelector('#sc-results');
    if (!results) return;

    const ipBinaryHTML   = buildBinaryHTML(info.ipBinaryRaw, info.prefix);
    const maskBinaryHTML = buildBinaryHTML(prefixToBinaryMask(info.prefix).padEnd(32,'0'), info.prefix);

    // Enhanced octet breakdown for visualization
    const ipOctets = info.ipBinaryRaw.match(/.{1,8}/g) || [];
    const maskOctets = prefixToBinaryMask(info.prefix).match(/.{1,8}/g) || [];
    const networkBits = info.prefix;
    const hostBits = 32 - info.prefix;

    results.innerHTML = `
      <!-- Quick Reference Memory Card -->
      <div class="card" style="margin-bottom:1.25rem; background:linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(255,184,0,0.08) 100%);">
        <div class="text-mono text-xs" style="margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--color-cyan);">
          Quick Reference
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:0.75rem;">
          <div style="background:var(--color-bg-raised); padding:0.6rem; border-radius:var(--radius-sm);">
            <div style="font-size:var(--text-xs); color:var(--color-text-muted); margin-bottom:0.2rem;">Hosts Formula</div>
            <code style="font-family:var(--font-mono); font-size:var(--text-sm); color:var(--color-cyan);">2<sup>${hostBits}</sup> - 2 = ${info.usableHosts.toLocaleString()}</code>
          </div>
          <div style="background:var(--color-bg-raised); padding:0.6rem; border-radius:var(--radius-sm);">
            <div style="font-size:var(--text-xs); color:var(--color-text-muted); margin-bottom:0.2rem;">Subnet Mask</div>
            <code style="font-family:var(--font-mono); font-size:var(--text-sm); color:var(--color-text-primary);">${info.subnetMask}</code>
          </div>
          <div style="background:var(--color-bg-raised); padding:0.6rem; border-radius:var(--radius-sm);">
            <div style="font-size:var(--text-xs); color:var(--color-text-muted); margin-bottom:0.2rem;">Wildcard Mask</div>
            <code style="font-family:var(--font-mono); font-size:var(--text-sm); color:var(--color-text-secondary);">${info.wildcardMask}</code>
          </div>
          <div style="background:var(--color-bg-raised); padding:0.6rem; border-radius:var(--radius-sm);">
            <div style="font-size:var(--text-xs); color:var(--color-text-muted); margin-bottom:0.2rem;">CIDR Notation</div>
            <code style="font-family:var(--font-mono); font-size:var(--text-sm); color:var(--color-amber);">${info.cidrNotation}</code>
          </div>
        </div>
      </div>

      <!-- Enhanced Binary Visualization with Octet Breakdown -->
      <div class="card" style="margin-bottom:1.25rem;">
        <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase; letter-spacing:0.08em;">
          Binary Visualization — Understanding the Bits
          <span style="margin-left:0.75rem; color:var(--color-cyan);">■</span> Network bits (${networkBits})
          <span style="margin-left:0.5rem; color:var(--color-amber);">■</span> Host bits (${hostBits})
        </div>

        <!-- IP Address with octet annotations -->
        <div style="margin-bottom:1rem;">
          <div style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-text-muted); margin-bottom:0.4rem;">
            IP Address Binary
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.4rem;">
            ${ipOctets.map((octet, i) => `
              <div style="display:flex; flex-direction:column; align-items:center;">
                <span class="binary-display">${buildBinaryHTML(octet.padEnd(32,'0'), info.prefix).split('.'.repeat(i)).join('').slice(i*10,(i+1)*10+ (i<3?1:0))}</span>
                <span style="font-size:9px; color:var(--color-text-muted); margin-top:2px;">Octet ${i+1}</span>
              </div>
            `).join('')}
          </div>
          <div class="binary-display" style="font-size:13px;">${ipBinaryHTML}</div>
          <div style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-text-muted); margin-top:0.3rem;">
            Decimal: ${info.inputIP}
          </div>
        </div>

        <!-- Subnet Mask with octet annotations -->
        <div style="margin-bottom:1rem;">
          <div style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-text-muted); margin-bottom:0.4rem;">
            Subnet Mask Binary
          </div>
          <div class="binary-display" style="font-size:13px;">${maskBinaryHTML}</div>
          <div style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-text-muted); margin-top:0.3rem;">
            Decimal: ${info.subnetMask}
          </div>
        </div>

        <!-- Network/Host Boundary Visual -->
        <div style="padding-top:0.75rem; border-top:1px solid var(--color-border);">
          <div style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-text-muted); margin-bottom:0.5rem;">
            Bit Boundary Visual — 32 Bits Total
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem; font-family:var(--font-mono); font-size:10px;">
            <span style="color:var(--color-text-muted); min-width:80px;">Network</span>
            <div style="display:flex; gap:1px; flex-wrap:nowrap; overflow-x:auto; flex:1;">
              ${Array.from({length: 32}, (_,i) => `
                <div style="
                  width:10px; height:20px; flex-shrink:0;
                  background:${i < info.prefix ? 'var(--color-cyan)' : 'var(--color-amber)'};
                  opacity:${i < info.prefix ? '0.9' : '0.5'};
                  border-radius:2px 2px 0 0;
                  ${i === info.prefix - 1 ? 'border-right:3px solid var(--color-text-primary);' : ''}
                " title="Bit ${i+1}: ${i < info.prefix ? 'Network' : 'Host'}"></div>
              `).join('')}
            </div>
            <span style="color:var(--color-text-muted);">Host</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:0.5rem; font-size:var(--text-xs);">
            <span style="color:var(--color-cyan);">Network: ${info.prefix} bits</span>
            <span style="color:var(--color-amber);">Host: ${32 - info.prefix} bits</span>
          </div>
        </div>
      </div>

      <!-- Subnet Size Comparison Visual -->
      <div class="card" style="margin-bottom:1.25rem;">
        <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase;">
          Subnet Size Reference
        </div>
        <div style="display:flex; flex-direction:column; gap:0.4rem;">
          ${[24, 26, 28, 30, 32].map(p => `
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-text-muted); min-width:45px;">/${p}</span>
              <div style="flex:1; height:12px; background:var(--color-bg-raised); border-radius:2px; overflow:hidden;">
                <div style="
                  width:${Math.min(100, (p / 32) * 100)}%; 
                  height:100%; 
                  background:${p === info.prefix ? 'var(--color-cyan)' : (p < info.prefix ? 'var(--color-amber)' : 'var(--color-text-muted)')};
                  opacity:${p <= info.prefix ? '0.7' : '0.3'};
                  transition:width 0.3s ease;
                "></div>
              </div>
              <span style="font-family:var(--font-mono); font-size:var(--text-xs); color:${p === info.prefix ? 'var(--color-cyan)' : 'var(--color-text-muted)'}; min-width:60px; text-align:right;">
                ${p === 32 ? '1' : p === 31 ? '2' : p === 30 ? '2' : p === 28 ? '14' : p === 26 ? '62' : p === 24 ? '254' : ''} hosts
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Key results grid -->
      <div class="layout-2col" style="gap:1rem; margin-bottom:1.25rem;">
        <div class="card">
          <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase;">Subnet Details</div>
          ${[
            ['CIDR Notation',      info.cidrNotation,                       'var(--color-cyan)'],
            ['Network Address',    info.networkAddress,                     'var(--color-text-primary)'],
            ['Subnet Mask',        info.subnetMask,                         'var(--color-text-primary)'],
            ['Wildcard Mask',      info.wildcardMask,                       'var(--color-text-muted)'],
            ['Broadcast Address',  info.broadcastAddress,                   'var(--color-text-primary)'],
            ['First Usable Host',  info.prefix <= 30 ? info.firstHost : 'N/A (special)',  'var(--color-success)'],
            ['Last Usable Host',   info.prefix <= 30 ? info.lastHost  : 'N/A (special)',  'var(--color-success)'],
          ].map(([k,v,c]) => `
            <div style="display:flex; justify-content:space-between; align-items:baseline; padding:0.35rem 0; border-bottom:1px solid var(--color-border);">
              <span style="font-size:var(--text-xs); color:var(--color-text-muted); font-family:var(--font-mono);">${k}</span>
              <span style="font-size:var(--text-xs); font-family:var(--font-mono); font-weight:700; color:${c};">${escapeHtml(String(v))}</span>
            </div>
          `).join('')}
        </div>

        <div class="card">
          <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase;">Capacity</div>
          <div style="text-align:center; padding:1rem 0;">
            <div style="font-family:var(--font-mono); font-size:2.5rem; font-weight:800; color:var(--color-cyan); line-height:1;">
              ${info.usableHosts.toLocaleString()}
            </div>
            <div style="font-size:var(--text-xs); color:var(--color-text-muted); font-family:var(--font-mono); margin-top:0.25rem;">
              USABLE HOST ADDRESSES
            </div>
            <div style="margin-top:0.75rem; font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-text-muted);">
              Total IPs: ${info.totalAddresses.toLocaleString()}
            </div>
            ${info.isPointToPoint ? `<div class="badge badge-amber" style="margin-top:0.5rem;">Point-to-Point (/31)</div>` : ''}
            ${info.isHostRoute    ? `<div class="badge badge-cyan" style="margin-top:0.5rem;">Host Route (/32)</div>` : ''}
          </div>

          <div style="padding-top:0.75rem; border-top:1px solid var(--color-border);">
            <div class="text-mono text-xs text-muted" style="margin-bottom:0.4rem;">Address Type</div>
            <div style="font-size:var(--text-xs); color:var(--color-amber); font-family:var(--font-mono);">
              ${escapeHtml(describeIP(info.inputIP))}
            </div>
          </div>
        </div>
      </div>

      <!-- Step-by-step derivation -->
      <div class="card" style="margin-bottom:1.25rem;">
        <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase;">
          Step-by-Step Derivation
        </div>
        <div id="sc-steps-list">
          ${this._renderSteps(info)}
        </div>
      </div>

      <!-- Subnet division tool -->
      ${info.prefix < 32 ? `
        <div class="card">
          <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase;">
            Subdivide This Network
          </div>
          <div style="display:flex; gap:0.5rem; align-items:flex-end; flex-wrap:wrap; margin-bottom:0.75rem;">
            <div>
              <label style="font-size:var(--text-xs); color:var(--color-text-muted); display:block; margin-bottom:0.3rem;">New prefix (/${info.prefix+1} – /30)</label>
              <select id="sc-subdivide-prefix"
                style="padding:0.4rem 0.6rem; background:var(--color-bg-raised);
                  border:1px solid var(--color-border); border-radius:var(--radius-sm);
                  color:var(--color-text-primary); font-family:var(--font-mono); font-size:var(--text-sm);">
                ${Array.from({length: Math.min(30, 32) - info.prefix}, (_,i) => {
                  const p = info.prefix + 1 + i;
                  return `<option value="${p}">/${p} — ${Math.pow(2, p - info.prefix)} subnets</option>`;
                }).join('')}
              </select>
            </div>
            <button class="btn btn-secondary" id="sc-subdivide-btn">Subdivide</button>
          </div>
          <div id="sc-subdivide-results"></div>
        </div>
      ` : ''}
    `;

    this._injectBinaryStyles();
    this._bindSubdivide(info);
  }

  _renderSteps(info) {
    const steps = getSubnetSteps(info.inputIP, info.prefix);
    
    // Add enhanced binary breakdown for key steps
    const binaryBreakdown = this._getBinaryBreakdown(info);
    
    return steps.map(s => `
      <div style="display:flex; gap:0.75rem; align-items:flex-start; padding:0.6rem 0; border-bottom:1px solid var(--color-border);">
        <span style="
          width:22px; height:22px; border-radius:50%;
          background:var(--color-cyan); color:var(--color-bg-deepest);
          display:flex; align-items:center; justify-content:center;
          font-family:var(--font-mono); font-size:10px; font-weight:800;
          flex-shrink:0; margin-top:2px;
        ">${s.step}</span>
        <div style="flex:1;">
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.2rem; gap:0.5rem; flex-wrap:wrap;">
            <span style="font-size:var(--text-sm); font-weight:700; color:var(--color-text-primary);">${s.title}</span>
            <code style="font-family:var(--font-mono); font-size:var(--text-sm); color:var(--color-cyan); font-weight:700; white-space:nowrap;">${escapeHtml(s.value)}</code>
          </div>
          <p style="font-size:var(--text-xs); color:var(--color-text-muted); margin:0; line-height:1.6;">${s.explanation}</p>
          ${s.step === 3 ? binaryBreakdown.networkCalc : ''}
          ${s.step === 4 ? binaryBreakdown.broadcastCalc : ''}
        </div>
      </div>
    `).join('');
  }

  _getBinaryBreakdown(info) {
    const ipBinary = formatBinaryIP(info.ipBinaryRaw);
    const maskBinary = formatBinaryIP(prefixToBinaryMask(info.prefix));
    const networkBinary = formatBinaryIP(info.networkBinary);
    const wildcardBinary = formatBinaryIP(ipToBinary(info.wildcardMask));
    const broadcastBinary = formatBinaryIP(ipToBinary(info.broadcastAddress));
    
    return {
      networkCalc: `
        <div style="margin-top:0.5rem; padding:0.5rem; background:var(--color-bg-deepest); border-radius:var(--radius-sm); font-family:var(--font-mono); font-size:10px; overflow-x:auto;">
          <div style="color:var(--color-text-muted); margin-bottom:0.25rem;">AND Operation (Network = IP × Mask):</div>
          <div style="color:var(--color-text-secondary);">IP:    ${ipBinary}</div>
          <div style="color:var(--color-text-muted);">Mask:  ${maskBinary}</div>
          <div style="border-top:1px dashed var(--color-border); margin:0.25rem 0;"></div>
          <div style="color:var(--color-cyan);">${networkBinary} ← Network Address</div>
        </div>
      `,
      broadcastCalc: `
        <div style="margin-top:0.5rem; padding:0.5rem; background:var(--color-bg-deepest); border-radius:var(--radius-sm); font-family:var(--font-mono); font-size:10px; overflow-x:auto;">
          <div style="color:var(--color-text-muted); margin-bottom:0.25rem;">OR Operation (Broadcast = Network | Wildcard):</div>
          <div style="color:var(--color-cyan);">Net:  ${networkBinary}</div>
          <div style="color:var(--color-amber);">Wild: ${wildcardBinary}</div>
          <div style="border-top:1px dashed var(--color-border); margin:0.25rem 0;"></div>
          <div style="color:var(--color-text-secondary);">${broadcastBinary} ← Broadcast</div>
        </div>
      `
    };
  }

  _bindSubdivide(parentInfo) {
    const btn = this.container.querySelector('#sc-subdivide-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const sel       = this.container.querySelector('#sc-subdivide-prefix');
      const newPrefix = parseInt(sel?.value, 10);
      if (isNaN(newPrefix)) return;

      let subnets;
      try {
        subnets = divideSubnet(parentInfo.networkAddress, parentInfo.prefix, newPrefix);
      } catch (e) {
        return;
      }

      const resultsEl = this.container.querySelector('#sc-subdivide-results');
      if (!resultsEl) return;

      const maxShow = 16;
      const showing = subnets.slice(0, maxShow);

      resultsEl.innerHTML = `
        <div style="font-size:var(--text-xs); color:var(--color-text-muted); margin-bottom:0.5rem;">
          ${subnets.length} subnets of /${newPrefix} (showing first ${Math.min(subnets.length, maxShow)}):
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:var(--text-xs); font-family:var(--font-mono);">
            <thead>
              <tr style="border-bottom:1px solid var(--color-border);">
                ${['#','Network','Broadcast','First Host','Last Host','Hosts'].map(h =>
                  `<th style="padding:4px 6px; text-align:left; color:var(--color-text-muted);">${h}</th>`
                ).join('')}
              </tr>
            </thead>
            <tbody>
              ${showing.map((s, i) => `
                <tr style="border-bottom:1px solid var(--color-border);">
                  <td style="padding:4px 6px; color:var(--color-text-muted);">${i+1}</td>
                  <td style="padding:4px 6px; color:var(--color-cyan);">${s.networkAddress}/${s.prefix}</td>
                  <td style="padding:4px 6px; color:var(--color-text-secondary);">${s.broadcastAddress}</td>
                  <td style="padding:4px 6px; color:var(--color-success);">${s.firstHost}</td>
                  <td style="padding:4px 6px; color:var(--color-success);">${s.lastHost}</td>
                  <td style="padding:4px 6px; color:var(--color-text-primary);">${s.usableHosts}</td>
                </tr>
              `).join('')}
              ${subnets.length > maxShow ? `
                <tr>
                  <td colspan="6" style="padding:4px 6px; color:var(--color-text-muted); font-style:italic;">
                    … and ${subnets.length - maxShow} more subnets
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      `;
    });
  }

  _injectBinaryStyles() {
    if (document.getElementById('binary-display-styles')) return;
    const style = document.createElement('style');
    style.id = 'binary-display-styles';
    style.textContent = `
      .binary-display {
        font-family: var(--font-mono);
        font-size: 13px;
        letter-spacing: 0.02em;
        line-height: 1;
      }
      .binary-bit {
        display: inline-block;
        width: 12px;
        text-align: center;
        border-radius: 2px;
        padding: 1px 0;
        transition: all 0.2s ease;
        cursor: default;
      }
      .binary-bit:hover {
        transform: scale(1.3);
        z-index: 1;
        position: relative;
      }
      .binary-bit.is-network {
        color: var(--color-cyan);
        font-weight: 700;
      }
      .binary-bit.is-host {
        color: var(--color-amber);
        opacity: 0.85;
      }
      .binary-bit.is-one.is-network {
        background: rgba(0,212,255,0.15);
      }
      .binary-bit.is-one.is-host {
        background: rgba(255,184,0,0.15);
      }
      .binary-bit.is-zero.is-network {
        background: rgba(0,212,255,0.05);
      }
      .binary-bit.is-zero.is-host {
        background: rgba(255,184,0,0.05);
      }
      .binary-octet-sep {
        color: var(--color-text-muted);
        margin: 0 1px;
      }
      @keyframes pulse-cyan {
        0%, 100% { box-shadow: 0 0 0 0 rgba(0,212,255,0.4); }
        50% { box-shadow: 0 0 0 4px rgba(0,212,255,0); }
      }
      @keyframes pulse-amber {
        0%, 100% { box-shadow: 0 0 0 0 rgba(255,184,0,0.4); }
        50% { box-shadow: 0 0 0 4px rgba(255,184,0,0); }
      }
    `;
    document.head.appendChild(style);
  }

  start()  {}
  reset()  { this._render(); }
  step()   {}
  destroy() { this.container = null; }
}

export default new SubnetCalculator();
