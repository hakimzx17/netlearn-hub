/**
 * binaryUtils.js — Binary / Decimal Conversion Utilities
 *
 * Responsibility:
 *   Pure functions for binary visualization and conversion.
 *   Used by subnet calculator, subnetting practice, and IP explorer.
 *   No DOM access. No side effects.
 */

/**
 * Convert a decimal number (0–255) to an 8-bit binary string.
 * @param {number} decimal
 * @returns {string} e.g. '11000000'
 */
export function decToBin(decimal) {
  return (decimal >>> 0).toString(2).padStart(8, '0').slice(-8);
}

/**
 * Convert a binary string to a decimal number.
 * @param {string} binaryString
 * @returns {number}
 */
export function binToDec(binaryString) {
  return parseInt(String(binaryString).replace(/[^01]/g, '') || '0', 2);
}

/**
 * Convert an IPv4 dotted-decimal string to a 32-character binary string.
 * No dots — just 32 bits.
 * @param {string} ipString — e.g. '192.168.1.1'
 * @returns {string} 32-bit binary string e.g. '11000000101010000000000100000001'
 */
export function ipToBinary(ipString) {
  return String(ipString)
    .split('.')
    .map(o => decToBin(parseInt(o, 10)))
    .join('');
}

/**
 * Convert a 32-bit binary string back to dotted-decimal IP.
 * @param {string} binaryString — 32 characters
 * @returns {string}
 */
export function binaryToIP(binaryString) {
  const padded = String(binaryString).padStart(32, '0');
  return [
    binToDec(padded.slice( 0,  8)),
    binToDec(padded.slice( 8, 16)),
    binToDec(padded.slice(16, 24)),
    binToDec(padded.slice(24, 32)),
  ].join('.');
}

/**
 * Convert a dotted-decimal subnet mask to its 32-bit binary string.
 * @param {string} maskString
 * @returns {string}
 */
export function maskToBinary(maskString) {
  return ipToBinary(maskString);
}

/**
 * Format a 32-bit binary string into octet-separated groups.
 * @param {string} binaryString — 32 chars
 * @returns {string} e.g. '11000000.10101000.00000001.00000001'
 */
export function formatBinaryIP(binaryString) {
  const b = String(binaryString).padStart(32, '0');
  return `${b.slice(0,8)}.${b.slice(8,16)}.${b.slice(16,24)}.${b.slice(24,32)}`;
}

/**
 * Split a 32-bit binary IP into network and host portions.
 * Returns an object with the split point highlighted.
 *
 * @param {string} ipBinary  — 32-bit binary IP string
 * @param {number} prefix    — CIDR prefix length
 * @returns {{ network: string, host: string, formatted: string }}
 *   formatted: '11000000.10101000 | 00000001.00000001'
 *   The | marks the network/host boundary.
 */
export function highlightNetworkBits(ipBinary, prefix) {
  const b       = String(ipBinary).padStart(32, '0');
  const network = b.slice(0, prefix);
  const host    = b.slice(prefix);
  const formatted = formatBinaryIP(b); // dots added for readability
  return { network, host, formatted };
}

/**
 * Bitwise AND of two 32-bit binary strings.
 * Used to compute network addresses.
 * @param {string} bin1 — 32 chars
 * @param {string} bin2 — 32 chars
 * @returns {string} 32-char binary result
 */
export function bitwiseAND(bin1, bin2) {
  const result = [];
  for (let i = 0; i < 32; i++) {
    result.push((parseInt(bin1[i] || '0', 10) & parseInt(bin2[i] || '0', 10)).toString());
  }
  return result.join('');
}

/**
 * Bitwise OR of two 32-bit binary strings.
 * @param {string} bin1
 * @param {string} bin2
 * @returns {string}
 */
export function bitwiseOR(bin1, bin2) {
  const result = [];
  for (let i = 0; i < 32; i++) {
    result.push((parseInt(bin1[i] || '0', 10) | parseInt(bin2[i] || '0', 10)).toString());
  }
  return result.join('');
}

/**
 * Count the number of 1 bits in a binary string.
 * @param {string} binaryString
 * @returns {number}
 */
export function countOnes(binaryString) {
  return (binaryString.match(/1/g) || []).length;
}

/**
 * Left-pad a binary string to a specified length with '0'.
 * @param {string} bin
 * @param {number} length
 * @returns {string}
 */
export function padBinary(bin, length) {
  return String(bin).padStart(length, '0');
}

/**
 * Generate the binary representation of a subnet mask
 * directly from a CIDR prefix length, without requiring ipUtils.
 * @param {number} prefix — 0 to 32
 * @returns {string} 32-char binary string of all 1s then 0s
 */
export function prefixToBinaryMask(prefix) {
  const p = Math.min(32, Math.max(0, prefix));
  return '1'.repeat(p) + '0'.repeat(32 - p);
}

/**
 * Build a per-bit annotation array for visualizing
 * which bits are network bits vs host bits.
 *
 * @param {number} prefix — CIDR prefix length
 * @returns {Array<{bit: string, role: 'network'|'host'}>}
 *   Array of 32 objects describing each bit of a mask.
 */
export function buildMaskAnnotation(prefix) {
  return Array.from({ length: 32 }, (_, i) => ({
    bit:  i < prefix ? '1' : '0',
    role: i < prefix ? 'network' : 'host',
  }));
}

/**
 * Build an HTML string for a color-coded binary IP display.
 * Network bits = cyan, Host bits = amber.
 * Used by the subnet calculator UI.
 *
 * @param {string} ipBinary  — 32-char binary string
 * @param {number} prefix    — CIDR prefix length
 * @returns {string} HTML string with individual bit spans
 */
export function buildBinaryHTML(ipBinary, prefix) {
  const b = String(ipBinary).padStart(32, '0');
  let html = '';

  for (let i = 0; i < 32; i++) {
    // Insert octet separators
    if (i > 0 && i % 8 === 0) {
      html += '<span class="binary-octet-sep">.</span>';
    }

    const bit  = b[i];
    const role = i < prefix ? 'network' : 'host';
    const cls  = `binary-bit is-${bit === '1' ? 'one' : 'zero'} is-${role}`;
    html += `<span class="${cls}">${bit}</span>`;
  }

  return html;
}
