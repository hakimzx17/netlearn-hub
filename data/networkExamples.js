/**
 * networkExamples.js — Pre-built Network Topologies
 *
 * Pure data file — no imports, no side effects.
 * Used by simulation modules as pre-loaded scenario options
 * and by the Resource Library for topology reference diagrams.
 *
 * Node types: pc | switch | router | server | cloud
 * All coordinates are normalised for an 820×280 canvas.
 */

// ── Topology library ──────────────────────────────────────────────────
export const NETWORK_TOPOLOGIES = {

  // ── 1. Simple LAN ─────────────────────────────────────────────────
  simpleLan: {
    id: 'simpleLan',
    name: 'Simple LAN',
    description: 'Two PCs on the same /24 subnet connected via a single switch.',
    nodes: [
      { id: 'pc1', type: 'pc',     label: 'PC-1', x: 100, y: 160, ip: '192.168.1.10', mac: 'AA:AA:AA:00:00:01' },
      { id: 'pc2', type: 'pc',     label: 'PC-2', x: 700, y: 160, ip: '192.168.1.20', mac: 'BB:BB:BB:00:00:01' },
      { id: 'sw1', type: 'switch', label: 'SW1',  x: 400, y: 160 },
    ],
    links: [
      { from: 'pc1', to: 'sw1', label: 'Fa0/1' },
      { from: 'pc2', to: 'sw1', label: 'Fa0/2' },
    ],
    subnetInfo: { network: '192.168.1.0/24', gateway: null },
  },

  // ── 2. Routed Two-Network ─────────────────────────────────────────
  twoNetworks: {
    id: 'twoNetworks',
    name: 'Two Networks via Router',
    description: 'Two separate /24 subnets connected by a router. Demonstrates inter-subnet routing.',
    nodes: [
      { id: 'pc1', type: 'pc',     label: 'PC-1', x: 60,  y: 160, ip: '192.168.1.10', mac: 'AA:AA:AA:00:00:01' },
      { id: 'sw1', type: 'switch', label: 'SW1',  x: 220, y: 160 },
      { id: 'r1',  type: 'router', label: 'R1',   x: 410, y: 160, ip: '192.168.1.1 / 10.0.0.1' },
      { id: 'sw2', type: 'switch', label: 'SW2',  x: 600, y: 160 },
      { id: 'pc2', type: 'pc',     label: 'PC-2', x: 760, y: 160, ip: '10.0.0.10', mac: 'BB:BB:BB:00:00:01' },
    ],
    links: [
      { from: 'pc1', to: 'sw1', label: '' },
      { from: 'sw1', to: 'r1',  label: 'G0/0\n.1.1' },
      { from: 'r1',  to: 'sw2', label: 'G0/1\n.0.1' },
      { from: 'sw2', to: 'pc2', label: '' },
    ],
    subnetInfo: { network: '192.168.1.0/24 + 10.0.0.0/24', gateway: '192.168.1.1' },
  },

  // ── 3. ARP Resolution ────────────────────────────────────────────
  arpScenario: {
    id: 'arpScenario',
    name: 'ARP Resolution Scenario',
    description: 'PC-A needs to resolve PC-B\'s MAC via ARP broadcast. PC-C receives but discards.',
    nodes: [
      { id: 'pca', type: 'pc',     label: 'PC-A', x: 100, y: 160, ip: '192.168.1.10', mac: 'AA:AA:AA:AA:AA:AA' },
      { id: 'pcb', type: 'pc',     label: 'PC-B', x: 700, y: 90,  ip: '192.168.1.20', mac: 'BB:BB:BB:BB:BB:BB' },
      { id: 'pcc', type: 'pc',     label: 'PC-C', x: 700, y: 230, ip: '192.168.1.30', mac: 'CC:CC:CC:CC:CC:CC' },
      { id: 'sw1', type: 'switch', label: 'SW1',  x: 400, y: 160 },
    ],
    links: [
      { from: 'pca', to: 'sw1', label: 'Fa0/1' },
      { from: 'pcb', to: 'sw1', label: 'Fa0/2' },
      { from: 'pcc', to: 'sw1', label: 'Fa0/3' },
    ],
    subnetInfo: { network: '192.168.1.0/24', gateway: null },
  },

  // ── 4. TTL Traversal ─────────────────────────────────────────────
  ttlTraversal: {
    id: 'ttlTraversal',
    name: 'TTL Traversal — Three Routers',
    description: 'A packet traverses three routers. TTL is decremented at each hop.',
    nodes: [
      { id: 'src', type: 'pc',     label: 'Source', x: 60,  y: 160, ip: '10.0.0.2' },
      { id: 'r1',  type: 'router', label: 'R1',     x: 220, y: 160, ip: '10.0.0.1' },
      { id: 'r2',  type: 'router', label: 'R2',     x: 400, y: 160, ip: '10.0.1.1' },
      { id: 'r3',  type: 'router', label: 'R3',     x: 580, y: 160, ip: '10.0.2.1' },
      { id: 'dst', type: 'pc',     label: 'Dest',   x: 740, y: 160, ip: '10.0.3.2' },
    ],
    links: [
      { from: 'src', to: 'r1' },
      { from: 'r1',  to: 'r2' },
      { from: 'r2',  to: 'r3' },
      { from: 'r3',  to: 'dst' },
    ],
  },

  // ── 5. MAC Learning ──────────────────────────────────────────────
  macLearning: {
    id: 'macLearning',
    name: 'MAC Table Learning',
    description: 'A switch learns source MAC addresses from incoming frames and builds its CAM table.',
    nodes: [
      { id: 'pca', type: 'pc',     label: 'PC-A', x: 80,  y: 160, mac: 'AA:AA', ip: '10.0.0.1' },
      { id: 'pcb', type: 'pc',     label: 'PC-B', x: 390, y: 60,  mac: 'BB:BB', ip: '10.0.0.2' },
      { id: 'pcc', type: 'pc',     label: 'PC-C', x: 720, y: 160, mac: 'CC:CC', ip: '10.0.0.3' },
      { id: 'pcd', type: 'pc',     label: 'PC-D', x: 390, y: 260, mac: 'DD:DD', ip: '10.0.0.4' },
      { id: 'sw1', type: 'switch', label: 'SW1',  x: 390, y: 160 },
    ],
    links: [
      { from: 'pca', to: 'sw1', label: 'Gi0/1' },
      { from: 'pcb', to: 'sw1', label: 'Gi0/2' },
      { from: 'pcc', to: 'sw1', label: 'Gi0/3' },
      { from: 'pcd', to: 'sw1', label: 'Gi0/4' },
    ],
  },

  // ── 6. Small Enterprise ──────────────────────────────────────────
  smallEnterprise: {
    id: 'smallEnterprise',
    name: 'Small Enterprise Network',
    description: 'Two access switches, a distribution router, and internet uplink through a firewall.',
    nodes: [
      { id: 'fw',   type: 'router', label: 'FW',      x: 410, y: 50,  ip: '203.0.113.1' },
      { id: 'isp',  type: 'cloud',  label: 'Internet', x: 410, y: 160  },
      { id: 'r1',   type: 'router', label: 'Core-R',  x: 410, y: 260, ip: '10.0.0.1' },
      { id: 'sw1',  type: 'switch', label: 'SW-A',    x: 200, y: 220, },
      { id: 'sw2',  type: 'switch', label: 'SW-B',    x: 620, y: 220  },
      { id: 'pc1',  type: 'pc',     label: 'HR',      x: 120, y: 160, ip: '10.1.1.10' },
      { id: 'pc2',  type: 'pc',     label: 'Dev',     x: 280, y: 160, ip: '10.1.1.20' },
      { id: 'srv',  type: 'server', label: 'Server',  x: 700, y: 160, ip: '10.2.1.10' },
    ],
    links: [
      { from: 'isp',  to: 'fw' },
      { from: 'fw',   to: 'r1' },
      { from: 'r1',   to: 'sw1', label: 'G0/0' },
      { from: 'r1',   to: 'sw2', label: 'G0/1' },
      { from: 'sw1',  to: 'pc1' },
      { from: 'sw1',  to: 'pc2' },
      { from: 'sw2',  to: 'srv' },
    ],
  },

  // ── 7. Packet Journey (HTTP) ──────────────────────────────────────
  packetJourney: {
    id: 'packetJourney',
    name: 'Full Packet Journey — HTTP Request',
    description: 'Client to web server: DNS, ARP, TCP handshake, NAT, ISP routing, HTTP.',
    nodes: [
      { id: 'client', type: 'pc',     label: 'Client',   x: 70,  y: 160, ip: '192.168.1.10' },
      { id: 'gw',     type: 'router', label: 'GW/NAT',   x: 240, y: 160, ip: '192.168.1.1' },
      { id: 'dns',    type: 'server', label: 'DNS',       x: 240, y: 60,  ip: '8.8.8.8' },
      { id: 'isp1',   type: 'router', label: 'ISP-1',    x: 420, y: 160, ip: '10.10.1.1' },
      { id: 'isp2',   type: 'router', label: 'ISP-2',    x: 590, y: 160, ip: '10.10.2.1' },
      { id: 'web',    type: 'server', label: 'Web',       x: 750, y: 160, ip: '93.184.216.34' },
    ],
    links: [
      { from: 'client', to: 'gw',   label: 'LAN' },
      { from: 'gw',     to: 'dns',  label: '' },
      { from: 'gw',     to: 'isp1', label: 'WAN' },
      { from: 'isp1',   to: 'isp2' },
      { from: 'isp2',   to: 'web'  },
    ],
  },

  // ── 8. Routing Table Lookup ───────────────────────────────────────
  routingLookup: {
    id: 'routingLookup',
    name: 'Routing Table Lookup',
    description: 'Router R1 selects the best route using Longest Prefix Match.',
    nodes: [
      { id: 'router', type: 'router', label: 'R1',        x: 400, y: 180, ip: '10.0.0.1' },
      { id: 'lan1',   type: 'pc',     label: 'LAN-A',     x: 130, y: 80,  ip: '10.0.1.0/24' },
      { id: 'lan2',   type: 'pc',     label: 'LAN-B',     x: 130, y: 280, ip: '10.0.2.0/24' },
      { id: 'r2',     type: 'router', label: 'R2',        x: 670, y: 80,  ip: '172.16.0.0/16' },
      { id: 'isp',    type: 'cloud',  label: 'Internet',  x: 670, y: 280, ip: '0.0.0.0/0' },
    ],
    links: [
      { from: 'router', to: 'lan1', label: 'Gi0/0' },
      { from: 'router', to: 'lan2', label: 'Gi0/1' },
      { from: 'router', to: 'r2',   label: 'Gi0/2' },
      { from: 'router', to: 'isp',  label: 'Gi0/3' },
    ],
  },
};

/**
 * Get all topologies as an array.
 * @returns {Array}
 */
export function getAllTopologies() {
  return Object.values(NETWORK_TOPOLOGIES);
}

/**
 * Get a topology by ID.
 * @param {string} id
 * @returns {Object|null}
 */
export function getTopologyById(id) {
  return NETWORK_TOPOLOGIES[id] || null;
}
