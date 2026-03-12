/**
 * ipUtils.js — IP Address Utilities
 *
 * Responsibility:
 *   Pure functions for IP address operations.
 *   No DOM access. No side effects. No imports needed.
 *   Used by subnet modules, simulations, and the calculator.
 */

/**
 * Parse an IPv4 address string into an array of 4 octets.
 * @param {string} ipString — e.g. '192.168.1.1'
 * @returns {number[]} [192, 168, 1, 1] or null if invalid
 */
export function parseIP(ipString) {
  const parts = String(ipString).trim().split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map(Number);
  if (nums.some(n => isNaN(n) || n < 0 || n > 255 || !Number.isInteger(n))) return null;
  return nums;
}

/**
 * Convert an IPv4 dotted-decimal string to a 32-bit unsigned integer.
 * @param {string} ipString
 * @returns {number} unsigned 32-bit integer
 */
export function ipToInt(ipString) {
  const octets = parseIP(ipString);
  if (!octets) return 0;
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

/**
 * Convert a 32-bit unsigned integer to a dotted-decimal IP string.
 * @param {number} int
 * @returns {string} e.g. '192.168.1.1'
 */
export function intToIP(int) {
  const n = int >>> 0; // ensure unsigned
  return [
    (n >>> 24) & 0xFF,
    (n >>> 16) & 0xFF,
    (n >>>  8) & 0xFF,
     n         & 0xFF,
  ].join('.');
}

/**
 * Validate an IPv4 address string.
 * @param {string} ipString
 * @returns {boolean}
 */
export function isValidIP(ipString) {
  return parseIP(ipString) !== null;
}

/**
 * Determine the classful class of an IPv4 address.
 * @param {string} ipString
 * @returns {'A'|'B'|'C'|'D'|'E'|null}
 */
export function getClass(ipString) {
  const octets = parseIP(ipString);
  if (!octets) return null;
  const first = octets[0];
  if (first >= 1   && first <= 126) return 'A';
  if (first === 127)                 return 'Loopback';
  if (first >= 128 && first <= 191) return 'B';
  if (first >= 192 && first <= 223) return 'C';
  if (first >= 224 && first <= 239) return 'D';
  if (first >= 240 && first <= 255) return 'E';
  return null;
}

/**
 * Determine if an IP is in a private range (RFC 1918).
 * @param {string} ipString
 * @returns {boolean}
 */
export function isPrivate(ipString) {
  const octets = parseIP(ipString);
  if (!octets) return false;
  const [a, b] = octets;
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

/**
 * Determine if an IP is in the loopback range (127.0.0.0/8).
 * @param {string} ipString
 * @returns {boolean}
 */
export function isLoopback(ipString) {
  const octets = parseIP(ipString);
  return octets !== null && octets[0] === 127;
}

/**
 * Determine if an IP is APIPA (169.254.0.0/16).
 * @param {string} ipString
 * @returns {boolean}
 */
export function isAPIPA(ipString) {
  const octets = parseIP(ipString);
  return octets !== null && octets[0] === 169 && octets[1] === 254;
}

/**
 * Convert a CIDR prefix length to a dotted-decimal subnet mask.
 * @param {number} prefix — 0 to 32
 * @returns {string} e.g. '255.255.255.0'
 */
export function cidrToMask(prefix) {
  const p = Math.min(32, Math.max(0, parseInt(prefix, 10)));
  const mask = p === 0 ? 0 : (~0 << (32 - p)) >>> 0;
  return intToIP(mask);
}

/**
 * Convert a dotted-decimal subnet mask to a CIDR prefix length.
 * Returns -1 if the mask is not a valid contiguous mask.
 * @param {string} maskString — e.g. '255.255.255.0'
 * @returns {number} prefix length 0–32, or -1 on invalid input
 */
export function maskToCIDR(maskString) {
  const octets = parseIP(maskString);
  if (!octets) return -1;
  const maskInt = ipToInt(maskString);

  // Validate: a valid mask is all 1s followed by all 0s
  const binary = maskInt.toString(2).padStart(32, '0');
  const firstZero = binary.indexOf('0');
  if (firstZero === -1) return 32;
  if (binary.slice(firstZero).includes('1')) return -1; // non-contiguous

  return firstZero;
}

/**
 * Calculate the network address given an IP and subnet mask.
 * @param {string} ipString
 * @param {string} maskString — dotted-decimal or CIDR number
 * @returns {string} network address
 */
export function getNetworkAddress(ipString, maskOrPrefix) {
  const mask = typeof maskOrPrefix === 'number'
    ? cidrToMask(maskOrPrefix)
    : maskOrPrefix;
  const ipInt   = ipToInt(ipString);
  const maskInt = ipToInt(mask);
  return intToIP((ipInt & maskInt) >>> 0);
}

/**
 * Calculate the broadcast address given an IP and subnet mask.
 * @param {string} ipString
 * @param {string|number} maskOrPrefix
 * @returns {string} broadcast address
 */
export function getBroadcastAddress(ipString, maskOrPrefix) {
  const mask = typeof maskOrPrefix === 'number'
    ? cidrToMask(maskOrPrefix)
    : maskOrPrefix;
  const ipInt      = ipToInt(ipString);
  const maskInt    = ipToInt(mask);
  const wildcardInt = (~maskInt) >>> 0;
  return intToIP(((ipInt & maskInt) | wildcardInt) >>> 0);
}

/**
 * Return the first usable host address (network + 1).
 * @param {string} networkAddress
 * @returns {string}
 */
export function getFirstHost(networkAddress) {
  return intToIP((ipToInt(networkAddress) + 1) >>> 0);
}

/**
 * Return the last usable host address (broadcast - 1).
 * @param {string} broadcastAddress
 * @returns {string}
 */
export function getLastHost(broadcastAddress) {
  return intToIP((ipToInt(broadcastAddress) - 1) >>> 0);
}

/**
 * Calculate the number of usable host addresses for a given prefix.
 * /31 = 2 usable (point-to-point), /32 = 1 (host route).
 * @param {number} prefix — CIDR prefix length
 * @returns {number}
 */
export function getHostCount(prefix) {
  if (prefix >= 32) return 1;
  if (prefix === 31) return 2;
  return Math.pow(2, 32 - prefix) - 2;
}

/**
 * Get the total number of addresses (including network and broadcast).
 * @param {number} prefix
 * @returns {number}
 */
export function getTotalAddresses(prefix) {
  return Math.pow(2, 32 - prefix);
}

/**
 * Parse a CIDR notation string 'x.x.x.x/n' into components.
 * @param {string} cidrString — e.g. '192.168.1.0/24'
 * @returns {{ ip: string, prefix: number } | null}
 */
export function parseCIDR(cidrString) {
  const parts = String(cidrString).trim().split('/');
  if (parts.length !== 2) return null;
  const ip     = parts[0].trim();
  const prefix = parseInt(parts[1], 10);
  if (!isValidIP(ip)) return null;
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return null;
  return { ip, prefix };
}

/**
 * Check if two IP addresses are in the same subnet.
 * @param {string} ip1
 * @param {string} ip2
 * @param {string|number} maskOrPrefix
 * @returns {boolean}
 */
export function isSameSubnet(ip1, ip2, maskOrPrefix) {
  return getNetworkAddress(ip1, maskOrPrefix) === getNetworkAddress(ip2, maskOrPrefix);
}

/**
 * Return a human-readable description of an IP's type.
 * @param {string} ipString
 * @returns {string}
 */
export function describeIP(ipString) {
  if (isLoopback(ipString)) return 'Loopback (127.x.x.x)';
  if (isAPIPA(ipString))    return 'APIPA / Link-Local (169.254.x.x)';
  if (isPrivate(ipString)) {
    const cls = getClass(ipString);
    return `Private Class ${cls} (RFC 1918)`;
  }
  const cls = getClass(ipString);
  if (cls === 'D') return 'Multicast (Class D)';
  if (cls === 'E') return 'Experimental (Class E)';
  return `Public Class ${cls}`;
}
