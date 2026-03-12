/**
 * networkMath.js — Subnet Calculation Engine
 *
 * Responsibility:
 *   All mathematical operations for subnetting.
 *   Depends on ipUtils and binaryUtils — no DOM access.
 *   Used by: subnetCalculator, subnetPracticeEngine, vlsmDesignEngine,
 *            routingTableSimulator.
 */

import {
  ipToInt, intToIP, cidrToMask, maskToCIDR,
  getNetworkAddress, getBroadcastAddress,
  getFirstHost, getLastHost, getHostCount, getTotalAddresses,
  parseCIDR, isValidIP,
} from './ipUtils.js';

import { ipToBinary, formatBinaryIP, buildBinaryHTML } from './binaryUtils.js';

/**
 * Calculate complete subnet information for a given IP and prefix.
 *
 * @param {string} ipString  — any host IP in the subnet
 * @param {number} prefix    — CIDR prefix length (0–32)
 * @returns {Object} Full subnet info object
 */
export function calculateSubnet(ipString, prefix) {
  if (!isValidIP(ipString)) {
    throw new Error(`Invalid IP address: "${ipString}"`);
  }
  if (prefix < 0 || prefix > 32 || isNaN(prefix)) {
    throw new Error(`Invalid prefix length: "${prefix}"`);
  }

  const mask          = cidrToMask(prefix);
  const networkAddr   = getNetworkAddress(ipString, prefix);
  const broadcastAddr = getBroadcastAddress(ipString, prefix);
  const firstHost     = prefix < 31 ? getFirstHost(networkAddr) : networkAddr;
  const lastHost      = prefix < 31 ? getLastHost(broadcastAddr) : broadcastAddr;
  const hostCount     = getHostCount(prefix);
  const totalAddrs    = getTotalAddresses(prefix);

  // Binary representations
  const ipBinary      = ipToBinary(ipString);
  const maskBinary    = ipToBinary(mask);
  const networkBinary = ipToBinary(networkAddr);

  return {
    // Input
    inputIP:     ipString,
    prefix,

    // Core subnet info
    networkAddress:   networkAddr,
    broadcastAddress: broadcastAddr,
    subnetMask:       mask,
    wildcardMask:     intToIP((~ipToInt(mask)) >>> 0),
    cidrNotation:     `${networkAddr}/${prefix}`,

    // Host range
    firstHost,
    lastHost,
    usableHosts:   hostCount,
    totalAddresses: totalAddrs,

    // Binary
    ipBinary:      formatBinaryIP(ipBinary),
    maskBinary:    formatBinaryIP(maskBinary),
    networkBinary: formatBinaryIP(networkBinary),

    // For binary visualization component
    ipBinaryRaw:   ipBinary,

    // Classification
    isPointToPoint: prefix === 31,
    isHostRoute:    prefix === 32,
  };
}

/**
 * Find the best matching route for a destination IP
 * using the Longest Prefix Match algorithm.
 *
 * @param {string}   destIP   — Destination IP address
 * @param {Array}    routes   — [{ network, prefix, nextHop, interface, metric? }]
 * @returns {Object|null}     — Matched route or null (no match)
 */
export function longestPrefixMatch(destIP, routes) {
  if (!isValidIP(destIP)) return null;

  const destInt = ipToInt(destIP);
  let   bestMatch = null;
  let   bestPrefix = -1;

  for (const route of routes) {
    const prefix   = typeof route.prefix === 'number'
      ? route.prefix
      : maskToCIDR(route.mask || '0.0.0.0');
    const netInt   = ipToInt(route.network);
    const maskInt  = ipToInt(cidrToMask(prefix));

    // Check: (destIP & mask) === networkAddress
    const match = ((destInt & maskInt) >>> 0) === ((netInt & maskInt) >>> 0);

    if (match && prefix > bestPrefix) {
      bestPrefix = prefix;
      bestMatch  = { ...route, prefix, matchedPrefix: prefix };
    }
  }

  return bestMatch;
}

/**
 * Check whether a given host IP falls within a subnet.
 * @param {string} subnetNetwork — Network address
 * @param {number} prefix
 * @param {string} hostIP
 * @returns {boolean}
 */
export function subnetContains(subnetNetwork, prefix, hostIP) {
  if (!isValidIP(hostIP) || !isValidIP(subnetNetwork)) return false;
  const netInt  = ipToInt(getNetworkAddress(subnetNetwork, prefix));
  const hostInt = ipToInt(hostIP);
  const maskInt = ipToInt(cidrToMask(prefix));
  return ((hostInt & maskInt) >>> 0) === netInt;
}

/**
 * Divide a network into equal-size subnets with a new (longer) prefix.
 * e.g. divide('192.168.1.0', 24, 26) → 4 subnets with /26
 *
 * @param {string} networkAddress — Base network
 * @param {number} currentPrefix  — Current prefix length
 * @param {number} newPrefix      — New prefix (must be > currentPrefix)
 * @returns {Array<Object>}       — Array of subnet info objects
 */
export function divideSubnet(networkAddress, currentPrefix, newPrefix) {
  if (newPrefix <= currentPrefix || newPrefix > 32) {
    throw new Error(`newPrefix (${newPrefix}) must be > currentPrefix (${currentPrefix}) and <= 32`);
  }

  const subnetCount = Math.pow(2, newPrefix - currentPrefix);
  const blockSize   = getTotalAddresses(newPrefix);
  const baseInt     = ipToInt(networkAddress);
  const subnets     = [];

  for (let i = 0; i < subnetCount; i++) {
    const netInt = (baseInt + i * blockSize) >>> 0;
    subnets.push(calculateSubnet(intToIP(netInt), newPrefix));
  }

  return subnets;
}

/**
 * VLSM Allocation Algorithm.
 * Allocates subnets from a base network to satisfy requirements,
 * sorted largest-first (RFC-recommended approach).
 *
 * @param {string} baseNetwork — e.g. '10.0.0.0'
 * @param {number} basePrefix  — e.g. 8
 * @param {Array}  needs       — [{ name: string, hosts: number }]
 *   sorted by hosts descending automatically
 * @returns {Array<Object>} — [{ name, hosts, allocated: subnetInfo }]
 *   or throws if base network is too small.
 */
export function vlsmAllocate(baseNetwork, basePrefix, needs) {
  // Sort requirements largest-first for efficient allocation
  const sorted = [...needs].sort((a, b) => b.hosts - a.hosts);
  const results = [];

  let currentInt = ipToInt(getNetworkAddress(baseNetwork, basePrefix));
  const baseEnd  = ipToInt(getBroadcastAddress(baseNetwork, basePrefix));

  for (const need of sorted) {
    // Find smallest prefix that satisfies the host count
    let prefix = 32;
    for (let p = 30; p >= 0; p--) {
      if (getHostCount(p) >= need.hosts) prefix = p;
      else break;
    }
    // More robust: scan from /32 upward
    prefix = 32;
    for (let p = 32; p >= 0; p--) {
      if (getHostCount(p) >= need.hosts) { prefix = p; break; }
    }

    const blockSize = getTotalAddresses(prefix);

    // Align to block boundary
    if (currentInt % blockSize !== 0) {
      currentInt = (Math.ceil(currentInt / blockSize) * blockSize) >>> 0;
    }

    const networkEnd = (currentInt + blockSize - 1) >>> 0;

    if (networkEnd > baseEnd) {
      throw new Error(
        `Base network ${baseNetwork}/${basePrefix} is too small to accommodate ` +
        `"${need.name}" (requires ${need.hosts} hosts, needs /${prefix})`
      );
    }

    const subnetInfo = calculateSubnet(intToIP(currentInt), prefix);
    results.push({
      name:      need.name,
      hostsNeeded: need.hosts,
      allocated: subnetInfo,
    });

    currentInt = (currentInt + blockSize) >>> 0;
  }

  return results;
}

/**
 * Attempt to summarize a list of networks into a single supernet.
 * Returns the summary route if valid, or null if not summarizable.
 *
 * @param {Array<{network: string, prefix: number}>} routes
 * @returns {{ network: string, prefix: number } | null}
 */
export function summarizeRoutes(routes) {
  if (!routes || routes.length === 0) return null;
  if (routes.length === 1) return routes[0];

  // Find common prefix bits across all network addresses
  const binaryNets = routes.map(r => {
    const netInt  = ipToInt(getNetworkAddress(r.network, r.prefix));
    return netInt.toString(2).padStart(32, '0');
  });

  let commonBits = 0;
  for (let i = 0; i < 32; i++) {
    const bit = binaryNets[0][i];
    if (binaryNets.every(b => b[i] === bit)) {
      commonBits++;
    } else {
      break;
    }
  }

  const firstNet = ipToInt(getNetworkAddress(routes[0].network, routes[0].prefix));
  const summaryNet = intToIP((firstNet >> (32 - commonBits) << (32 - commonBits)) >>> 0);

  return { network: summaryNet, prefix: commonBits };
}

/**
 * Check if a set of subnets are contiguous (for valid summarization).
 * @param {Array<{network: string, prefix: number}>} routes
 * @returns {boolean}
 */
export function isContiguous(routes) {
  if (routes.length <= 1) return true;

  // Sort by network address integer
  const sorted = [...routes].sort((a, b) =>
    ipToInt(a.network) - ipToInt(b.network)
  );

  for (let i = 0; i < sorted.length - 1; i++) {
    const currentBroadcast = ipToInt(getBroadcastAddress(sorted[i].network, sorted[i].prefix));
    const nextNetwork      = ipToInt(sorted[i + 1].network);
    if (nextNetwork !== currentBroadcast + 1) return false;
  }

  return true;
}

/**
 * Generate step-by-step subnet calculation explanation.
 * Used by subnetPracticeEngine for guided learning.
 *
 * @param {string} ipString
 * @param {number} prefix
 * @returns {Array<{step: number, title: string, value: string, explanation: string}>}
 */
export function getSubnetSteps(ipString, prefix) {
  const info = calculateSubnet(ipString, prefix);

  return [
    {
      step: 1,
      title:   'Identify the Prefix Length',
      value:   `/${prefix}`,
      explanation: `The /${prefix} tells us that ${prefix} bits are used for the network portion and ${32 - prefix} bits are for hosts.`,
    },
    {
      step: 2,
      title:   'Determine the Subnet Mask',
      value:   info.subnetMask,
      explanation: `${prefix} ones followed by ${32 - prefix} zeros in binary = ${info.subnetMask}`,
    },
    {
      step: 3,
      title:   'Calculate the Network Address',
      value:   info.networkAddress,
      explanation: `Perform a bitwise AND of the IP address and subnet mask. Result: ${info.networkAddress}`,
    },
    {
      step: 4,
      title:   'Calculate the Broadcast Address',
      value:   info.broadcastAddress,
      explanation: `Flip all host bits to 1 in the network address. The last address in the subnet is ${info.broadcastAddress}.`,
    },
    {
      step: 5,
      title:   'First Usable Host',
      value:   info.firstHost,
      explanation: `Network address + 1 = ${info.firstHost}. This is the first IP assignable to a device.`,
    },
    {
      step: 6,
      title:   'Last Usable Host',
      value:   info.lastHost,
      explanation: `Broadcast address - 1 = ${info.lastHost}. This is the last IP assignable to a device.`,
    },
    {
      step: 7,
      title:   'Usable Host Count',
      value:   info.usableHosts.toLocaleString(),
      explanation: `2^${32 - prefix} - 2 = ${info.usableHosts} usable addresses (subtracting network and broadcast).`,
    },
  ];
}
