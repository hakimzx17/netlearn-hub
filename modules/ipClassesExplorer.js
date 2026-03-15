/**
 * ipClassesExplorer.js — IPv4 Address Classes Explorer
 * Premium Redesign: Interactive binary sandbox, advanced IP analyzer, glowing glassmorphism,
 * and visual space allocation.
 */

import { eventBus } from '../js/eventBus.js';
import { getClass, isPrivate, describeIP, isValidIP, parseIP } from '../utils/ipUtils.js';

const IP_CLASSES = [
  {
    cls: 'A', range: '1.0.0.0 – 126.255.255.255', firstOctet: '1–126',
    defaultMask: '/8 (255.0.0.0)', networks: '126', hosts: '16,777,214',
    private: '10.0.0.0/8', color: '#00CED1', colorVar: 'var(--color-cyan)', binary: '0xxxxxxx',
    use: 'Massive networks, large enterprises, and ISPs. Most blocks are exhausted.',
    spacePct: 50, fixedBits: 1, fixedPattern: '0', icon: '🌍'
  },
  {
    cls: 'B', range: '128.0.0.0 – 191.255.255.255', firstOctet: '128–191',
    defaultMask: '/16 (255.255.0.0)', networks: '16,384', hosts: '65,534',
    private: '172.16.0.0/12', color: '#ffb800', colorVar: 'var(--color-amber)', binary: '10xxxxxx',
    use: 'Medium-to-large companies and universities.',
    spacePct: 25, fixedBits: 2, fixedPattern: '10', icon: '🏢'
  },
  {
    cls: 'C', range: '192.0.0.0 – 223.255.255.255', firstOctet: '192–223',
    defaultMask: '/24 (255.255.255.0)', networks: '2,097,152', hosts: '254',
    private: '192.168.0.0/16', color: '#00e676', colorVar: 'var(--color-green)', binary: '110xxxxx',
    use: 'Home networks and small offices. The most common private range is 192.168.x.x.',
    spacePct: 12.5, fixedBits: 3, fixedPattern: '110', icon: '🏠'
  },
  {
    cls: 'D', range: '224.0.0.0 – 239.255.255.255', firstOctet: '224–239',
    defaultMask: 'N/A', networks: 'N/A', hosts: 'N/A',
    private: 'N/A', color: '#ff4444', colorVar: 'var(--color-error)', binary: '1110xxxx',
    use: 'Multicast groups (OSPF, RIP, mDNS). Data sent to one address reaches multiple hosts.',
    spacePct: 6.25, fixedBits: 4, fixedPattern: '1110', icon: '📡'
  },
  {
    cls: 'E', range: '240.0.0.0 – 255.255.255.254', firstOctet: '240–255',
    defaultMask: 'N/A', networks: 'N/A', hosts: 'N/A',
    private: 'N/A', color: '#ab47bc', colorVar: 'var(--color-switch)', binary: '1111xxxx',
    use: 'Reserved for experimental, research, and future use. Not used in production.',
    spacePct: 6.25, fixedBits: 4, fixedPattern: '1111', icon: '🧪'
  }
];

const SPECIAL_ADDRESSES = [
  { addr: '0.0.0.0', meaning: 'Unspecified / Default route (all networks)' },
  { addr: '127.0.0.1', meaning: 'Loopback — always refers to "this device"' },
  { addr: '127.0.0.0/8', meaning: 'Entire loopback range — never leaves the host' },
  { addr: '169.254.0.0/16', meaning: 'APIPA — auto-configured when DHCP fails' },
  { addr: '255.255.255.255', meaning: 'Limited broadcast — all hosts on local subnet' },
  { addr: '10.0.0.0/8', meaning: 'RFC 1918 private — Class A' },
  { addr: '172.16.0.0/12', meaning: 'RFC 1918 private — Class B' },
  { addr: '192.168.0.0/16', meaning: 'RFC 1918 private — Class C' },
  { addr: '100.64.0.0/10', meaning: 'Shared address space (CGN / carrier-grade NAT)' },
  { addr: '198.51.100.0/24', meaning: 'Documentation / examples only (RFC 5737)' },
];

class IpClassesExplorer {
  constructor() {
    this.container = null;
    this._firstOctet = 192; // Default to a Class C value like 192
    this._lookupIp = '';
  }

  init(containerEl) {
    this.container = containerEl;
    this._render();
  }

  _getDetailsForOctet(octet) {
    if (octet === 127) return { cls: 'Loopback', color: '#7fa8c9', use: 'Reserved for loopback/localhost testing.', icon: '🔄', isSpecial: true };
    if (octet === 0) return { cls: 'Reserved (0)', color: '#7fa8c9', use: 'Reserved for local network identification.', icon: '🚫', isSpecial: true };
    let clsName = 'E';
    if (octet >= 1 && octet <= 126) clsName = 'A';
    else if (octet >= 128 && octet <= 191) clsName = 'B';
    else if (octet >= 192 && octet <= 223) clsName = 'C';
    else if (octet >= 224 && octet <= 239) clsName = 'D';

    return IP_CLASSES.find(c => c.cls === clsName) || { cls: 'Unknown', color: '#7fa8c9', isSpecial: true };
  }

  _render() {
    this.container.innerHTML = `
      <style>
        .ipc-grid { display:grid; grid-template-columns:1fr; gap:1.5rem; }
        @media (min-width: 900px) { .ipc-grid { grid-template-columns:1fr 1fr; } }
        
        /* Glass Cards */
        .ipc-card {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .ipc-card::before {
          content: ''; position: absolute; top:0; left:0; right:0; height:3px;
          background: var(--card-color, rgba(255,255,255,0.1));
          box-shadow: 0 0 15px var(--card-color, transparent);
          transition: all 0.4s ease;
        }

        /* Binary Sandbox */
        .ipc-binary-box {
          display: flex; gap: 8px; justify-content: center; margin: 1.5rem 0;
          flex-wrap: wrap;
        }
        .ipc-bit {
          width: 48px; height: 60px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          user-select: none;
          position: relative;
        }
        .ipc-bit:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.3); }
        .ipc-bit.active {
          background: rgba(255, 255, 255, 0.15);
          border-color: var(--active-color, #fff);
          box-shadow: 0 0 15px var(--active-color-glow, rgba(255,255,255,0.2)), inset 0 0 10px rgba(255,255,255,0.1);
          color: #fff;
        }
        .ipc-bit-val { font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; line-height: 1; margin-bottom: 2px; }
        .ipc-bit-pos { font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-text-muted); }
        .ipc-bit.fixed { cursor: not-allowed; opacity: 0.8; }
        .ipc-bit.fixed::after {
          content: '🔒'; position: absolute; top: -8px; right: -6px; font-size: 10px;
          background: var(--color-bg-deepest); border-radius: 50%; padding: 2px;
        }

        /* Space Allocation Bar */
        .ipc-space-bar {
          display: flex; width: 100%; height: 32px; border-radius: 8px; overflow: hidden;
          background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05);
        }
        .ipc-space-segment {
          height: 100%; display: flex; align-items: center; justify-content: center;
          font-family: var(--font-mono); font-size: 0.75rem; font-weight: 800; color: #000;
          transition: all 0.3s ease; cursor: pointer;
        }
        .ipc-space-segment:hover { filter: brightness(1.2); text-shadow: 0 0 5px rgba(255,255,255,0.5); }

        /* Stats Grid */
        .ipc-stats {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;
        }
        .ipc-stat-item {
          background: rgba(0,0,0,0.25); border-radius: 8px; padding: 0.75rem;
          border-left: 3px solid var(--stat-color, #888);
        }
        .ipc-stat-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 0.2rem; }
        .ipc-stat-val { font-family: var(--font-mono); font-size: 0.9rem; font-weight: 700; color: var(--color-text-primary); word-break: break-all; }

        /* Analyzer Input */
        .ipc-analyzer {
          position: relative; margin-top: 1rem;
        }
        .ipc-analyzer input {
          width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 1.2rem 1.2rem 1.2rem 3rem;
          font-family: var(--font-mono); font-size: 1.2rem; color: #fff;
          transition: all 0.3s ease; outline: none;
        }
        .ipc-analyzer input:focus {
          border-color: #00CED1; box-shadow: 0 0 20px rgba(0,206,209,0.2); background: rgba(0,0,0,0.4);
        }
        .ipc-analyzer label {
          position: absolute; left: 1.2rem; top: 1.2rem; font-size: 1.2rem; color: var(--color-text-muted);
        }
        
        /* Analyzer Results */
        .ipc-result-card {
          margin-top: 1rem; border-radius: 12px; overflow: hidden;
          background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05);
          animation: slideDown 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      </style>

      <div class="module-header">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <span>Protocol Headers</span>
        </div>
        <h1 class="module-header__title">🌐 IPv4 Address Classes</h1>
        <p class="module-header__description">
          Before CIDR (Classless Inter-Domain Routing), IPv4 addresses were rigidly divided by their first octet bits.
          Mastering these classes is essential for recognizing IP ranges, default subnet masks, and private networks.
        </p>
      </div>

      <div class="ipc-grid" style="margin-bottom: 2rem;">
        
        <!-- FIRST OCTET SANDBOX -->
        <div class="ipc-card" id="sandbox-card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <h2 style="font-size: 1.1rem; margin-bottom: 0.2rem;">Binary Sandbox</h2>
              <p style="font-size: 0.8rem; color:var(--color-text-muted); margin:0;">Toggle the bits of the 1st Octet to see how classes are defined.</p>
            </div>
            <div id="sandbox-badge" style="
              padding: 0.4rem 0.8rem; border-radius: 20px; font-weight: 800; font-size: 0.9rem;
              background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
            ">Class C</div>
          </div>

          <div id="sandbox-area">
             <!-- Rendered by JS -->
          </div>

          <div style="text-align: center; margin-top: 1rem;">
            <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.1em;">Decimal Value</div>
            <div id="sandbox-decimal" style="font-family: var(--font-display); font-size: 3.5rem; font-weight: 800; line-height: 1; text-shadow: 0 0 30px rgba(255,255,255,0.2);">
              192
            </div>
          </div>
          
          <div style="margin-top:1.5rem; display:flex; gap:0.5rem; flex-wrap:wrap; justify-content:center;">
             ${IP_CLASSES.map(c => `
               <button class="btn preset-btn" data-octet="${this._getBaseOctet(c.cls)}" style="
                 padding: 0.3rem 0.6rem; font-size: 0.75rem; border-radius: 6px;
                 background: rgba(255,255,255,0.05); border: 1px solid ${c.color}55; color: ${c.color};
               ">Jump to ${c.cls}</button>
             `).join('')}
          </div>
        </div>

        <!-- CLASS DETAILS DASHBOARD -->
        <div class="ipc-card" id="details-card">
           <!-- Rendered by JS -->
        </div>

      </div>

      <!-- VISUAL SPACE ALLOCATION -->
      <div class="ipc-card" style="margin-bottom: 2rem; --card-color: rgba(255,255,255,0.1);">
        <h2 style="font-size: 1.1rem; margin-bottom: 1rem;">IPv4 Address Space Distribution</h2>
        <div class="ipc-space-bar">
          ${IP_CLASSES.map(c => `
            <div class="ipc-space-segment preset-btn" role="button" tabindex="0" aria-label="Select Class ${c.cls}"
              data-octet="${this._getBaseOctet(c.cls)}" title="Class ${c.cls}: ${c.spacePct}%"
              style="width: ${c.spacePct}%; background: ${c.color}; color: ${c.cls === 'B' || c.cls === 'E' ? '#fff' : '#000'};">
              ${c.spacePct > 10 ? `Class ${c.cls}` : c.cls}
            </div>
          `).join('')}
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:0.5rem; font-size:0.75rem; color:var(--color-text-muted);">
          <span>0.0.0.0</span>
          <span>128.0.0.0 (50%)</span>
          <span>192.0.0.0 (75%)</span>
          <span>224.0.0.0 (87.5%)</span>
          <span>255.255.255.255</span>
        </div>
      </div>

      <div class="ipc-grid">
        <!-- ADVANCED IP ANALYZER -->
        <div class="ipc-card" style="--card-color: #00CED1;">
          <h2 style="font-size: 1.1rem; margin-bottom: 0.2rem;">Smart IP Analyzer</h2>
          <p style="font-size: 0.8rem; color:var(--color-text-muted); margin:0;">Type any IPv4 address to instantly decode its properties.</p>
          
            <div class="ipc-analyzer">
              <label class="sr-only" for="ip-analyzer-input">IP address</label>
              <label aria-hidden="true">🔎</label>
              <input type="text" id="ip-analyzer-input" placeholder="e.g. 192.168.1.10" value="192.168.1.10" autocomplete="off" spellcheck="false" />
            </div>
          
          <div id="analyzer-result-area" role="status" aria-live="polite">
             <!-- Rendered by JS -->
          </div>
        </div>

        <!-- SPECIAL ADDRESSES CHEAT SHEET -->
        <div class="ipc-card" style="--card-color: rgba(255,255,255,0.1);">
          <h2 style="font-size: 1.1rem; margin-bottom: 1rem;">Special & Reserved Addresses</h2>
          <div style="max-height: 250px; overflow-y: auto; padding-right: 0.5rem;">
            <div style="display:flex; flex-direction:column; gap:0.5rem;">
              ${SPECIAL_ADDRESSES.map(s => `
                <div style="display:flex; gap:1rem; align-items:center; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 8px;">
                  <code style="min-width:130px; font-size:0.75rem; color:#00CED1; background:rgba(0,206,209,0.1); padding:0.2rem 0.4rem; border-radius:4px; text-align:center;">${s.addr}</code>
                  <span style="font-size:0.8rem; color:var(--color-text-secondary); line-height:1.4;">${s.meaning}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this._updateSandbox();
    this._updateAnalyzer();
    this._bindEvents();
  }

  _getBaseOctet(cls) {
    switch (cls) {
      case 'A': return 10;
      case 'B': return 172;
      case 'C': return 192;
      case 'D': return 224;
      case 'E': return 240;
      default: return 10;
    }
  }

  _toBinaryArray(num) {
    return num.toString(2).padStart(8, '0').split('').map(Number);
  }

  _updateSandbox() {
    const octet = this._firstOctet;
    const bits = this._toBinaryArray(octet);
    const details = this._getDetailsForOctet(octet);
    const color = details.color;
    const isSpecial = details.isSpecial;

    // Determine fixed prefix constraint
    let fixedPattern = '';
    if (!isSpecial) {
      fixedPattern = details.fixedPattern;
    }

    // Update Card Glow
    const sandboxCard = this.container.querySelector('#sandbox-card');
    const detailsCard = this.container.querySelector('#details-card');
    if (sandboxCard) sandboxCard.style.setProperty('--card-color', color);
    if (detailsCard) detailsCard.style.setProperty('--card-color', color);

    // Update Badge
    const badge = this.container.querySelector('#sandbox-badge');
    if (badge) {
      badge.textContent = isSpecial ? details.cls : `Class ${details.cls}`;
      badge.style.color = color;
      badge.style.borderColor = `${color}88`;
      badge.style.background = `${color}22`;
      badge.style.boxShadow = `0 0 15px ${color}44`;
    }

    // Update Decimal
    const decEl = this.container.querySelector('#sandbox-decimal');
    if (decEl) {
      decEl.textContent = octet;
      decEl.style.color = color;
    }

    // Render Bits
    const bitValues = [128, 64, 32, 16, 8, 4, 2, 1];
    const sandboxArea = this.container.querySelector('#sandbox-area');
    if (sandboxArea) {
      sandboxArea.innerHTML = `
        <div class="ipc-binary-box" style="--active-color: ${color}; --active-color-glow: ${color}88;">
          ${bits.map((bit, idx) => {
        const isFixed = !isSpecial && idx < fixedPattern.length;
        return `
              <div class="ipc-bit ${bit ? 'active' : ''} ${isFixed ? 'fixed' : ''}" data-bit="${idx}">
                <div class="ipc-bit-val">${bit}</div>
                <div class="ipc-bit-pos">${bitValues[idx]}</div>
              </div>
            `;
      }).join('')}
        </div>
        ${!isSpecial ? `
          <div style="text-align:center; font-family:var(--font-mono); font-size:0.75rem; color:var(--color-text-muted);">
            Class ${details.cls} requirement: First bits must be <strong style="color:${color}; font-size:0.85rem;">${fixedPattern}</strong>
          </div>
        ` : `<div style="text-align:center; font-size:0.75rem; color:${color};">Special / Reserved Address Block</div>`}
      `;
    }

    // Render Details Dashboard
    if (detailsCard) {
      if (isSpecial) {
        detailsCard.innerHTML = `
          <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem;">
            <div style="font-size:3rem;">${details.icon}</div>
            <div>
              <h2 style="font-size: 1.6rem; margin-bottom: 0.2rem; color:${color};">${details.cls}</h2>
              <div style="font-family:var(--font-mono); font-size:0.85rem; color:var(--color-text-muted);">First Octet: ${octet}</div>
            </div>
          </div>
          <p style="font-size:1rem; line-height:1.6; color:var(--color-text-primary); background:rgba(255,255,255,0.05); padding:1rem; border-radius:8px; border-left:4px solid ${color};">${details.use}</p>
        `;
      } else {
        detailsCard.innerHTML = `
          <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem;">
            <div style="font-size:3rem; filter:drop-shadow(0 0 10px ${color}88);">${details.icon}</div>
            <div>
              <h2 style="font-size: 1.6rem; margin-bottom: 0.2rem; color:${color};">Class ${details.cls}</h2>
              <div style="font-family:var(--font-mono); font-size:0.85rem; color:var(--color-text-muted);">First Octet Range: ${details.firstOctet}</div>
            </div>
          </div>
          
          <div class="ipc-stats" style="--stat-color: ${color};">
            <div class="ipc-stat-item">
              <div class="ipc-stat-label">Default Mask</div>
              <div class="ipc-stat-val">${details.defaultMask}</div>
            </div>
            <div class="ipc-stat-item">
              <div class="ipc-stat-label">Private Range</div>
              <div class="ipc-stat-val">${details.private}</div>
            </div>
            <div class="ipc-stat-item">
              <div class="ipc-stat-label">Networks</div>
              <div class="ipc-stat-val">${details.networks}</div>
            </div>
            <div class="ipc-stat-item">
              <div class="ipc-stat-label">Hosts / Network</div>
              <div class="ipc-stat-val">${details.hosts}</div>
            </div>
          </div>

          <div style="margin-top:1.2rem; padding:1rem; background:rgba(0,0,0,0.25); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
            <div class="ipc-stat-label" style="color:${color}; font-weight:700;">Use Case</div>
            <div style="font-size:0.85rem; color:var(--color-text-secondary); line-height:1.5;">${details.use}</div>
          </div>
        `;
      }
    }

    this._bindBitToggleEvents();
  }

  _bindBitToggleEvents() {
    this.container.querySelectorAll('.ipc-bit').forEach(bitEl => {
      bitEl.addEventListener('click', () => {
        if (bitEl.classList.contains('fixed')) {
          // Visual shake effect for fixed bits
          bitEl.style.transform = 'translate(-2px, 0)';
          setTimeout(() => bitEl.style.transform = 'translate(2px, 0)', 50);
          setTimeout(() => bitEl.style.transform = 'translate(-2px, 0)', 100);
          setTimeout(() => bitEl.style.transform = 'translate(0, 0)', 150);
          return;
        }

        const bitIdx = parseInt(bitEl.dataset.bit);
        let bits = this._toBinaryArray(this._firstOctet);
        bits[bitIdx] = bits[bitIdx] === 1 ? 0 : 1;

        // Calculate new decimal
        const bitValues = [128, 64, 32, 16, 8, 4, 2, 1];
        let newOctet = 0;
        for (let i = 0; i < 8; i++) {
          if (bits[i] === 1) newOctet += bitValues[i];
        }

        this._firstOctet = newOctet;
        this._updateSandbox();
      });
    });
  }

  _updateAnalyzer() {
    const input = this.container.querySelector('#ip-analyzer-input');
    const resultArea = this.container.querySelector('#analyzer-result-area');
    if (!input || !resultArea) return;

    const ip = input.value.trim();
    if (!ip) {
      resultArea.innerHTML = '';
      return;
    }

    if (!isValidIP(ip)) {
      resultArea.innerHTML = `
        <div class="ipc-result-card" style="padding: 1rem; border-color: #ff4444; background: rgba(255,68,68,0.1);">
          <div style="color: #ff4444; font-weight:700; display:flex; align-items:center; gap:0.5rem;">
            <span>❌</span> Invalid IPv4 Address format
          </div>
        </div>
      `;
      return;
    }

    const octets = parseIP(ip);
    const cls = getClass(ip);
    const priv = isPrivate(ip);
    const desc = describeIP(ip);
    const details = this._getDetailsForOctet(octets[0]);
    const color = details.color || '#00CED1';

    // Binary representation
    const binStr = octets.map(o => o.toString(2).padStart(8, '0')).join('<strong style="opacity:0.4;">.</strong>');

    resultArea.innerHTML = `
      <div class="ipc-result-card">
        <div style="padding: 1.25rem; background: linear-gradient(90deg, ${color}22, transparent); border-left: 4px solid ${color};">
          
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem;">
            <div>
              <div style="font-family: var(--font-mono); font-size: 1.6rem; font-weight: 800; color: #fff; letter-spacing: 1px; margin-bottom: 0.2rem;">
                ${ip}
              </div>
              <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.8rem;">
                ${binStr}
              </div>
            </div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
              <span class="badge" style="background:${color}22; color:${color}; border:1px solid ${color}66; font-size:0.75rem; padding:4px 8px;">${desc}</span>
              ${priv ? `<span class="badge" style="background:rgba(255,184,0,0.15); color:#ffb800; border:1px solid rgba(255,184,0,0.4); font-size:0.75rem; padding:4px 8px;">Private (RFC 1918)</span>`
        : `<span class="badge" style="background:rgba(0,206,209,0.15); color:#00CED1; border:1px solid rgba(0,206,209,0.4); font-size:0.75rem; padding:4px 8px;">Public Routeable</span>`}
            </div>
          </div>

          <div style="margin-top: 1rem; display:flex; gap:1.5rem; border-top:1px solid rgba(255,255,255,0.05); padding-top:1rem;">
            ${details.cls !== 'Unknown' && !details.isSpecial ? `
              <div>
                <div style="font-size:0.65rem; color:var(--color-text-muted); text-transform:uppercase;">Class</div>
                <div style="font-size:1rem; font-weight:700; color:${color};">Class ${details.cls}</div>
              </div>
              <div>
                <div style="font-size:0.65rem; color:var(--color-text-muted); text-transform:uppercase;">Default Subnet Mask</div>
                <div style="font-family:var(--font-mono); font-size:0.9rem; font-weight:700; color:#fff;">${details.defaultMask || 'N/A'}</div>
              </div>
            ` : `
              <div>
                <div style="font-size:0.65rem; color:var(--color-text-muted); text-transform:uppercase;">Type</div>
                <div style="font-size:1rem; font-weight:700; color:${color};">${details.cls}</div>
              </div>
            `}
          </div>

        </div>
      </div>
    `;
  }

  _bindEvents() {
    // Top preset buttons
    this.container.querySelectorAll('.preset-btn').forEach(btn => {
      const activate = () => {
        this._firstOctet = parseInt(btn.dataset.octet);
        this._updateSandbox();
        // Scroll slightly to top if needed
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      btn.addEventListener('click', activate);
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });

    // Analyzer input
    const analyzerInput = this.container.querySelector('#ip-analyzer-input');
    if (analyzerInput) {
      let debounceTimer;
      analyzerInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => this._updateAnalyzer(), 300);
      });
      // Initial render check
      this._updateAnalyzer();
    }
  }

  start() { }
  reset() { this._firstOctet = 192; this._render(); }
  step() { }
  destroy() { this.container = null; }
}

export default new IpClassesExplorer();
