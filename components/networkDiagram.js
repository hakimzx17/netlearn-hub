/**
 * networkDiagram.js — SVG Network Topology Renderer
 *
 * Responsibility:
 *   Renders network topologies as interactive SVG diagrams.
 *   Animates packet movement along paths between nodes.
 *   Used by ALL simulation modules.
 *
 * Events emitted:
 *   diagram:node-clicked   — { nodeId, nodeData }
 *   diagram:anim-complete  — { packetId }
 *
 * Topology config:
 *   {
 *     nodes: [{ id, type, label, x, y, ip?, mac? }],
 *     links: [{ from, to, label? }]
 *   }
 * Node types: 'pc' | 'switch' | 'router' | 'server' | 'cloud'
 *
 * Depends on: eventBus.js
 */

import { eventBus }    from '../js/eventBus.js';
import { generateId, sleep } from '../utils/helperFunctions.js';

// SVG dimensions and node sizing constants
const SVG_DEFAULTS = { width: 1000, height: 650 };
const NODE_SIZES   = { pc: 56, switch: 62, router: 64, server: 56, cloud: 68 };

// Device icon paths (inline SVG symbols)
const DEVICE_ICONS = {
  pc: `<rect x="-22" y="-24" width="44" height="32" rx="4" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="2"/>
       <rect x="-17" y="-18" width="34" height="24" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
       <rect x="-10" y="8" width="20" height="5" rx="1" fill="currentColor" opacity="0.5"/>
       <rect x="-14" y="14" width="28" height="4" rx="1" fill="currentColor" opacity="0.3"/>`,

  switch: `<rect x="-28" y="-18" width="56" height="36" rx="5" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="2.5"/>
            <circle cx="-18" cy="0" r="4" fill="currentColor" opacity="0.8"/>
            <circle cx="-8"  cy="0" r="4" fill="currentColor" opacity="0.8"/>
            <circle cx="2"   cy="0" r="4" fill="currentColor" opacity="0.8"/>
            <circle cx="12"   cy="0" r="4" fill="currentColor" opacity="0.8"/>
            <line x1="-22" y1="-9" x2="-22" y2="-18" stroke="currentColor" stroke-width="3"/>
            <line x1="22"  y1="-9" x2="22"  y2="-18" stroke="currentColor" stroke-width="3"/>`,

  router: `<polygon points="0,-20 20,10 -20,10" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="1.5"/>
           <circle cx="0" cy="-2" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
           <line x1="-8" y1="8" x2="8" y2="8" stroke="currentColor" stroke-width="1.5"/>
           <line x1="0" y1="-2" x2="0" y2="8" stroke="currentColor" stroke-width="1"/>`,

  server: `<rect x="-14" y="-18" width="28" height="36" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5"/>
           <line x1="-14" y1="-8" x2="14" y2="-8" stroke="currentColor" stroke-width="0.5" opacity="0.4"/>
           <line x1="-14" y1="2"  x2="14" y2="2"  stroke="currentColor" stroke-width="0.5" opacity="0.4"/>
           <circle cx="-8" cy="-13" r="2" fill="currentColor" opacity="0.5"/>
           <circle cx="-8" cy="-3"  r="2" fill="currentColor" opacity="0.5"/>`,

  cloud: `<ellipse cx="0" cy="5" rx="18" ry="10" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="-8" cy="2" r="8"  fill="currentColor" opacity="0.1" stroke="currentColor" stroke-width="1"/>
          <circle cx="8"  cy="2" r="8"  fill="currentColor" opacity="0.1" stroke="currentColor" stroke-width="1"/>
          <circle cx="0"  cy="-4" r="9" fill="currentColor" opacity="0.1" stroke="currentColor" stroke-width="1"/>`,
};

// Device color CSS variables
const DEVICE_COLOR_VAR = {
  pc:     'var(--color-pc)',
  switch: 'var(--color-switch)',
  router: 'var(--color-router)',
  server: 'var(--color-server)',
  cloud:  'var(--color-cloud)',
};

class NetworkDiagram {
  constructor() {
    this._container  = null;
    this._topology   = null;
    this._svgEl      = null;
    this._animQueue  = [];
    this._isAnimating = false;
    this._nodeEls    = {};   // nodeId → SVG group element
    this._linkEls    = {};   // 'from-to' → SVG line element
    this._packets    = {};   // packetId → circle element
  }

  /**
   * Initialize and render an SVG topology.
   *
   * @param {HTMLElement} containerEl
   * @param {Object} topology — { nodes: [], links: [] }
   * @param {Object} [options]
   * @param {number} [options.width]
   * @param {number} [options.height]
   */
  init(containerEl, topology, options = {}) {
    this._container = containerEl;
    this._topology  = topology;
    this._nodeEls   = {};
    this._linkEls   = {};
    this._packets   = {};

    const width  = options.width  || SVG_DEFAULTS.width;
    const height = options.height || SVG_DEFAULTS.height;

    this._svgEl = this._createSVG(width, height);
    this._container.innerHTML = '';
    this._container.appendChild(this._svgEl);

    this._renderLinks();
    this._renderNodes();
    this._bindNodeEvents();
  }

  /**
   * Animate a packet traveling along a node path.
   *
   * @param {string[]} nodePath   — Ordered array of node IDs
   * @param {Object}   [options]
   * @param {string}   [options.type='data']   — 'data'|'arp'|'icmp'|'broadcast'
   * @param {string}   [options.label='']      — Label shown near packet
   * @param {number}   [options.speed=500]     — ms per hop
   * @param {string}   [options.packetId]      — Optional ID for tracking
   * @returns {Promise<void>} Resolves when animation completes
   */
  async animatePacket(nodePath, options = {}) {
    if (!this._svgEl || nodePath.length < 2) return;

    const {
      type     = 'data',
      label    = '',
      speed    = 500,
      packetId = generateId('pkt'),
    } = options;

    // Create packet circle element
    const startNode  = this._topology.nodes.find(n => n.id === nodePath[0]);
    if (!startNode) return;

    const packetEl = this._createPacketElement(packetId, type, startNode.x, startNode.y);
    let   labelEl  = null;

    if (label) {
      labelEl = this._createPacketLabel(label, startNode.x, startNode.y);
      this._svgEl.appendChild(labelEl);
    }

    this._svgEl.appendChild(packetEl);
    this._packets[packetId] = packetEl;

    // Hop through each segment
    for (let i = 0; i < nodePath.length - 1; i++) {
      const fromId  = nodePath[i];
      const toId    = nodePath[i + 1];
      const fromNode = this._topology.nodes.find(n => n.id === fromId);
      const toNode   = this._topology.nodes.find(n => n.id === toId);

      if (!fromNode || !toNode) continue;

      // Highlight the traversed link
      this._highlightLink(fromId, toId, true);

      // Animate packet from fromNode to toNode
      await this._animateMove(packetEl, labelEl, fromNode, toNode, speed);

      // Hop pulse on arrival
      this.highlightNode(toId, 'hop');
      this._highlightLink(fromId, toId, false);
    }

    // Cleanup
    packetEl.remove();
    if (labelEl) labelEl.remove();
    delete this._packets[packetId];

    eventBus.emit('diagram:anim-complete', { packetId });
  }

  /**
   * Animate a broadcast — packet fans out from one node to all connected nodes.
   *
   * @param {string}   originNodeId
   * @param {string[]} targetNodeIds
   * @param {Object}   [options]
   */
  async animateBroadcast(originNodeId, targetNodeIds, options = {}) {
    const animations = targetNodeIds.map(targetId =>
      this.animatePacket([originNodeId, targetId], {
        ...options,
        type:  options.type || 'broadcast',
        speed: options.speed || 600,
      })
    );
    await Promise.all(animations);
  }

  /**
   * Visually emphasize a node.
   * @param {string} nodeId
   * @param {'active'|'hop'|'error'|'success'} [style='active']
   * @param {number} [duration=1200] — ms (0 = permanent until reset)
   */
  highlightNode(nodeId, style = 'active', duration = 1200) {
    const group = this._nodeEls[nodeId];
    if (!group) return;

    const colorMap = {
      active:  'var(--color-cyan)',
      hop:     'var(--color-packet)',
      error:   'var(--color-error)',
      success: 'var(--color-success)',
    };

    // Apply glow filter via temporary attribute
    group.setAttribute('data-highlight', style);
    group.style.filter = `drop-shadow(0 0 8px ${colorMap[style] || colorMap.active})`;

    if (duration > 0) {
      setTimeout(() => {
        if (group) {
          group.removeAttribute('data-highlight');
          group.style.filter = '';
        }
      }, duration);
    }
  }

  /**
   * Update a node's sub-label (e.g. showing TTL value or ARP cache entry).
   * @param {string} nodeId
   * @param {string} text — New sub-label text
   */
  updateNodeLabel(nodeId, text) {
    const group    = this._nodeEls[nodeId];
    if (!group) return;
    const sublabel = group.querySelector('.node-sublabel');
    if (sublabel) sublabel.textContent = text;
  }

  /**
   * Show a floating info label at a position (for packet tooltips).
   * Auto-removes after duration.
   * @param {string} text
   * @param {{ x: number, y: number }} pos
   * @param {number} [duration=2000]
   */
  showPacketLabel(text, pos, duration = 2000) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    el.setAttribute('x', pos.x);
    el.setAttribute('y', pos.y - 10);
    el.setAttribute('text-anchor', 'middle');
    el.setAttribute('fill', 'var(--color-packet)');
    el.setAttribute('font-family', 'JetBrains Mono, monospace');
    el.setAttribute('font-size', '11');
    el.setAttribute('font-weight', '700');
    el.textContent = text;
    this._svgEl.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  /**
   * Reset all animations and node highlights.
   */
  reset() {
    // Remove all packet elements
    Object.values(this._packets).forEach(el => el.remove());
    this._packets = {};

    // Clear all highlights
    Object.keys(this._nodeEls).forEach(id => {
      const group = this._nodeEls[id];
      if (group) {
        group.removeAttribute('data-highlight');
        group.style.filter = '';
      }
    });

    // Reset link states
    Object.values(this._linkEls).forEach(el => {
      el.classList.remove('is-active');
    });
  }

  /**
   * Remove SVG and all event listeners.
   */
  destroy() {
    this.reset();
    if (this._container) {
      this._container.innerHTML = '';
    }
    this._container = null;
    this._svgEl     = null;
    this._nodeEls   = {};
    this._linkEls   = {};
  }

  // ─── Private: SVG Construction ─────────────

  _createSVG(width, height) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width',  '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('style',  'overflow:visible;');

    // Add defs for reusable elements
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="var(--color-border)" />
      </marker>
    `;
    svg.appendChild(defs);

    return svg;
  }

  _renderLinks() {
    const { links, nodes } = this._topology;
    links.forEach(link => {
      const from = nodes.find(n => n.id === link.from);
      const to   = nodes.find(n => n.id === link.to);
      if (!from || !to) return;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', from.x);
      line.setAttribute('y1', from.y);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y);
      line.setAttribute('class', 'network-link');
      line.setAttribute('stroke', 'var(--color-border)');
      line.setAttribute('stroke-width', '2');

      // Midpoint label
      if (link.label) {
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        
        // Detect vertical link and offset badge upward to avoid device text
        const isVerticalLink = Math.abs(from.y - to.y) > Math.abs(from.x - to.x);
        const yOffset = isVerticalLink ? -40 : -20;
        
        // Background for label
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('x', midX - 26);
        bgRect.setAttribute('y', midY + yOffset);
        bgRect.setAttribute('width', 52);
        bgRect.setAttribute('height', 20);
        bgRect.setAttribute('rx', 6);
        bgRect.setAttribute('fill', '#1a1a2e');
        bgRect.setAttribute('stroke', '#FFD93D');
        bgRect.setAttribute('stroke-width', '2');
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', midX);
        text.setAttribute('y', midY + yOffset + 15);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#FFD93D');
        text.setAttribute('font-size', '11');
        text.setAttribute('font-family', 'JetBrains Mono, monospace');
        text.setAttribute('font-weight', '700');
        text.textContent = link.label;
        
        // Store badge elements for later addition (after lines)
        this._pendingBadges = this._pendingBadges || [];
        this._pendingBadges.push(bgRect, text);
      }

      this._svgEl.appendChild(line);
      const key = `${link.from}-${link.to}`;
      const key2 = `${link.to}-${link.from}`;
      this._linkEls[key]  = line;
      this._linkEls[key2] = line;
    });
  }

  _renderNodes() {
    const { nodes } = this._topology;
    nodes.forEach(node => {
      const group = this._createNodeGroup(node);
      this._svgEl.appendChild(group);
      this._nodeEls[node.id] = group;
    });
  }

  _createNodeGroup(node) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
    group.setAttribute('class', `device-node device-${node.type}`);
    group.setAttribute('data-node-id', node.id);
    group.setAttribute('style', `color: ${DEVICE_COLOR_VAR[node.type] || 'var(--color-text-secondary)'}; cursor:pointer;`);

    const iconSvg = DEVICE_ICONS[node.type] || DEVICE_ICONS.pc;
    group.innerHTML = `
      ${iconSvg}
      <text class="node-label" text-anchor="middle" y="50"
        fill="${DEVICE_COLOR_VAR[node.type]}"
        font-size="16" font-family="JetBrains Mono, monospace"
        font-weight="700">
        ${node.label}
      </text>
      ${node.mac ? `
        <text class="node-sublabel" text-anchor="middle" y="70"
          fill="#4ECDC4"
          font-size="10" font-family="JetBrains Mono, monospace">
          ${node.mac}
        </text>
      ` : ''}
      ${node.ip ? `
        <text class="node-sublabel" text-anchor="middle" y="${node.mac ? 84 : 70}"
          fill="var(--color-text-muted)"
          font-size="12" font-family="JetBrains Mono, monospace">
          ${node.ip}
        </text>
      ` : ''}
    `;

    return group;
  }

  _createPacketElement(packetId, type, x, y) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '12');
    circle.setAttribute('class', `packet-dot ${type}`);
    circle.setAttribute('id', `packet-${packetId}`);
    return circle;
  }

  _createPacketLabel(text, x, y) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Background rect for better visibility
    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('x', x);
    textEl.setAttribute('y', y - 20);
    textEl.setAttribute('text-anchor', 'middle');
    textEl.setAttribute('fill', '#FFD93D');
    textEl.setAttribute('font-family', 'JetBrains Mono, monospace');
    textEl.setAttribute('font-size', '12');
    textEl.setAttribute('font-weight', '700');
    textEl.setAttribute('stroke', '#1a1a2e');
    textEl.setAttribute('stroke-width', '0.8');
    textEl.textContent = text;
    
    g.appendChild(textEl);
    return g;
  }

  /**
   * Animate a single element from one node position to another.
   * Uses requestAnimationFrame for smooth movement.
   */
  _animateMove(circleEl, labelEl, fromNode, toNode, duration) {
    return new Promise(resolve => {
      const startX = fromNode.x;
      const startY = fromNode.y;
      const endX   = toNode.x;
      const endY   = toNode.y;
      const start  = performance.now();

      const step = (now) => {
        const elapsed = now - start;
        const t       = Math.min(elapsed / duration, 1);
        // Ease in-out cubic
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const x = startX + (endX - startX) * eased;
        const y = startY + (endY - startY) * eased;

        circleEl.setAttribute('cx', x);
        circleEl.setAttribute('cy', y);

        if (labelEl) {
          labelEl.setAttribute('x', x);
          labelEl.setAttribute('y', y - 14);
        }

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(step);
    });
  }

  _highlightLink(fromId, toId, active) {
    const key  = `${fromId}-${toId}`;
    const line = this._linkEls[key];
    if (!line) return;

    if (active) {
      line.setAttribute('stroke', 'var(--color-cyan)');
      line.setAttribute('stroke-width', '2.5');
    } else {
      line.setAttribute('stroke', 'var(--color-border)');
      line.setAttribute('stroke-width', '2');
    }
  }

  _bindNodeEvents() {
    Object.entries(this._nodeEls).forEach(([nodeId, group]) => {
      group.addEventListener('click', () => {
        const nodeData = this._topology.nodes.find(n => n.id === nodeId);
        eventBus.emit('diagram:node-clicked', { nodeId, nodeData });
      });
    });
  }
}

// Factory — each simulation module gets its OWN diagram instance
export function createNetworkDiagram() { return new NetworkDiagram(); }
export { NetworkDiagram };
