/**
 * subnetProblems.js — Graduated Subnetting Problem Bank
 *
 * Pure data file — no imports, no side effects.
 * Used by subnetPracticeEngine.js as additional problem sets
 * and by resourceLibrary.js for worked example tables.
 *
 * Problem schema:
 *   { id, difficulty, type, prompt, given, solution, hint, explanation }
 *
 * Types: 'identify' | 'calculate' | 'design' | 'vlsm'
 */

export const DIFFICULTY = {
  BEGINNER:     'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED:     'advanced',
};

export const SUBNET_PROBLEMS = [

  // ══════════════════════════════════════════════════
  // BEGINNER — Identify basic subnet properties
  // ══════════════════════════════════════════════════

  {
    id: 'cidr-001',
    difficulty: DIFFICULTY.BEGINNER,
    type: 'identify',
    prompt: 'Calculate all subnet properties for 192.168.1.0/24.',
    given: { network: '192.168.1.0', prefix: 24 },
    solution: {
      subnetMask:       '255.255.255.0',
      networkAddress:   '192.168.1.0',
      broadcastAddress: '192.168.1.255',
      firstHost:        '192.168.1.1',
      lastHost:         '192.168.1.254',
      usableHosts:      254,
      totalAddresses:   256,
    },
    hint: '/24 = 8 host bits. 2^8 = 256 total. 256 - 2 = 254 usable.',
    explanation: 'The /24 prefix reserves 24 bits for the network. The remaining 8 bits are for hosts. Network address has all host bits = 0; broadcast has all host bits = 1.',
  },

  {
    id: 'cidr-002',
    difficulty: DIFFICULTY.BEGINNER,
    type: 'identify',
    prompt: 'What is the subnet mask and broadcast address for 10.0.0.0/8?',
    given: { network: '10.0.0.0', prefix: 8 },
    solution: {
      subnetMask:       '255.0.0.0',
      networkAddress:   '10.0.0.0',
      broadcastAddress: '10.255.255.255',
      firstHost:        '10.0.0.1',
      lastHost:         '10.255.255.254',
      usableHosts:      16777214,
      totalAddresses:   16777216,
    },
    hint: '/8 = 24 host bits. 2^24 = 16,777,216 total addresses. This is the Class A private range.',
    explanation: '10.0.0.0/8 is the Class A private range (RFC 1918). The /8 mask is 255.0.0.0. All 24 host bits set to 1 gives the broadcast 10.255.255.255.',
  },

  {
    id: 'cidr-003',
    difficulty: DIFFICULTY.BEGINNER,
    type: 'identify',
    prompt: 'Find the network address and usable host count for 172.16.0.0/16.',
    given: { network: '172.16.0.0', prefix: 16 },
    solution: {
      subnetMask:       '255.255.0.0',
      networkAddress:   '172.16.0.0',
      broadcastAddress: '172.16.255.255',
      firstHost:        '172.16.0.1',
      lastHost:         '172.16.255.254',
      usableHosts:      65534,
      totalAddresses:   65536,
    },
    hint: '/16 = 16 host bits. 2^16 = 65,536. Minus 2 = 65,534 usable.',
    explanation: '172.16.0.0/16 is the Class B private range start. The /16 mask gives 65,534 usable addresses — large enough for most enterprise LANs.',
  },

  {
    id: 'cidr-004',
    difficulty: DIFFICULTY.BEGINNER,
    type: 'identify',
    prompt: 'How many usable hosts does a /30 subnet provide? Give the subnet mask.',
    given: { network: '10.0.0.0', prefix: 30 },
    solution: {
      subnetMask:       '255.255.255.252',
      networkAddress:   '10.0.0.0',
      broadcastAddress: '10.0.0.3',
      firstHost:        '10.0.0.1',
      lastHost:         '10.0.0.2',
      usableHosts:      2,
      totalAddresses:   4,
    },
    hint: '/30 = 2 host bits. 2^2 = 4 total. 4 - 2 = 2 usable. Perfect for point-to-point WAN links.',
    explanation: '/30 is the standard prefix for point-to-point links. It wastes only 2 addresses (network + broadcast) while connecting exactly two devices.',
  },

  // ══════════════════════════════════════════════════
  // INTERMEDIATE — Calculate from a host IP
  // ══════════════════════════════════════════════════

  {
    id: 'cidr-005',
    difficulty: DIFFICULTY.INTERMEDIATE,
    type: 'calculate',
    prompt: 'Host 172.16.45.100 has mask /20. Find its network address and broadcast.',
    given: { network: '172.16.45.100', prefix: 20 },
    solution: {
      subnetMask:       '255.255.240.0',
      networkAddress:   '172.16.32.0',
      broadcastAddress: '172.16.47.255',
      firstHost:        '172.16.32.1',
      lastHost:         '172.16.47.254',
      usableHosts:      4094,
      totalAddresses:   4096,
    },
    hint: '/20 mask in octet 3: 20 - 16 = 4 network bits → 11110000 = 240. Block size = 16. 45/16 = 2 remainder 13, so subnet starts at 32.',
    explanation: 'The /20 boundary falls in the third octet. With 4 borrowed bits, the block size is 16. Third octet 45: floor(45/16)*16 = 32. Subnet: 172.16.32.0–172.16.47.255.',
  },

  {
    id: 'cidr-006',
    difficulty: DIFFICULTY.INTERMEDIATE,
    type: 'calculate',
    prompt: 'Host 192.168.200.130 is on a /27 network. What are its network address and broadcast?',
    given: { network: '192.168.200.130', prefix: 27 },
    solution: {
      subnetMask:       '255.255.255.224',
      networkAddress:   '192.168.200.128',
      broadcastAddress: '192.168.200.159',
      firstHost:        '192.168.200.129',
      lastHost:         '192.168.200.158',
      usableHosts:      30,
      totalAddresses:   32,
    },
    hint: '/27 = 32 addresses per subnet. Blocks: .0, .32, .64, .96, .128, .160... 130 is in the .128 block.',
    explanation: 'Block size for /27 is 32. Starting from 0: 0, 32, 64, 96, 128, 160... 130 falls in the 128 block. Network = .128, Broadcast = .159.',
  },

  {
    id: 'cidr-007',
    difficulty: DIFFICULTY.INTERMEDIATE,
    type: 'calculate',
    prompt: 'Find the network containing 10.4.8.200/21 and its broadcast address.',
    given: { network: '10.4.8.200', prefix: 21 },
    solution: {
      subnetMask:       '255.255.248.0',
      networkAddress:   '10.4.8.0',
      broadcastAddress: '10.4.15.255',
      firstHost:        '10.4.8.1',
      lastHost:         '10.4.15.254',
      usableHosts:      2046,
      totalAddresses:   2048,
    },
    hint: '/21 = 11 host bits. Block size in octet 3 = 8. floor(8/8)*8 = 8. Network = 10.4.8.0.',
    explanation: 'The /21 mask borrows 5 bits in the third octet (21 - 16 = 5), giving a block size of 8. Third octet 8: floor(8/8)*8 = 8. The subnet covers 10.4.8.0–10.4.15.255.',
  },

  {
    id: 'cidr-008',
    difficulty: DIFFICULTY.INTERMEDIATE,
    type: 'calculate',
    prompt: 'How many /26 subnets can be created from 192.168.5.0/24? What is the third subnet\'s range?',
    given: { network: '192.168.5.0', prefix: 24 },
    solution: {
      subnetMask:       '255.255.255.0',
      networkAddress:   '192.168.5.0',
      broadcastAddress: '192.168.5.255',
      firstHost:        '192.168.5.1',
      lastHost:         '192.168.5.254',
      usableHosts:      254,
      totalAddresses:   256,
    },
    hint: '2^(26-24) = 4 subnets. Each /26 = 64 addresses. Third subnet starts at .128.',
    explanation: 'Subdividing a /24 into /26s gives 4 subnets of 64 addresses each. Subnet 1: .0–.63, Subnet 2: .64–.127, Subnet 3: .128–.191, Subnet 4: .192–.255.',
  },

  // ══════════════════════════════════════════════════
  // ADVANCED — Complex CIDR + route summarisation
  // ══════════════════════════════════════════════════

  {
    id: 'cidr-009',
    difficulty: DIFFICULTY.ADVANCED,
    type: 'calculate',
    prompt: 'What summary route covers 10.1.0.0/24, 10.1.1.0/24, 10.1.2.0/24, and 10.1.3.0/24?',
    given: { network: '10.1.0.0', prefix: 24 },
    solution: {
      subnetMask:       '255.255.255.0',
      networkAddress:   '10.1.0.0',
      broadcastAddress: '10.1.0.255',
      firstHost:        '10.1.0.1',
      lastHost:         '10.1.0.254',
      usableHosts:      254,
      totalAddresses:   256,
    },
    hint: 'The four /24 networks span 10.1.0.0–10.1.3.255. Convert to binary — they share the first 22 bits. Summary = 10.1.0.0/22.',
    explanation: 'Route summarisation: 10.1.0–3.x shares 10.00000001.000000xx.xxxxxxxx in binary. The first 22 bits match. Summary route: 10.1.0.0/22 covers all four /24s.',
  },

  {
    id: 'cidr-010',
    difficulty: DIFFICULTY.ADVANCED,
    type: 'calculate',
    prompt: 'Host 10.255.128.50 is on /18. Find its broadcast address.',
    given: { network: '10.255.128.50', prefix: 18 },
    solution: {
      subnetMask:       '255.255.192.0',
      networkAddress:   '10.255.128.0',
      broadcastAddress: '10.255.191.255',
      firstHost:        '10.255.128.1',
      lastHost:         '10.255.191.254',
      usableHosts:      16382,
      totalAddresses:   16384,
    },
    hint: '/18 borrows 2 bits in octet 3. Block size = 64. 128 / 64 = 2 (exactly). Network = 10.255.128.0, Broadcast = .191.255.',
    explanation: '/18 mask in octet 3: 18-16=2 bits → 11000000 = 192. Block size = 64. 128 is exactly on a boundary. Subnet: 10.255.128.0–10.255.191.255.',
  },

  // ══════════════════════════════════════════════════
  // VLSM — Design allocations
  // ══════════════════════════════════════════════════

  {
    id: 'vlsm-001',
    difficulty: DIFFICULTY.INTERMEDIATE,
    type: 'vlsm',
    prompt: 'Using VLSM, allocate from 192.168.1.0/24 for: LAN-A (100 hosts), LAN-B (50 hosts), LAN-C (25 hosts).',
    given: {
      networkCIDR: '192.168.1.0/24',
      requirements: [
        { name: 'LAN-A', hosts: 100 },
        { name: 'LAN-B', hosts: 50  },
        { name: 'LAN-C', hosts: 25  },
      ],
    },
    solution: {
      allocations: [
        { name: 'LAN-A', hosts: 100, prefix: 25, network: '192.168.1.0',   broadcast: '192.168.1.127',  usable: 126 },
        { name: 'LAN-B', hosts: 50,  prefix: 26, network: '192.168.1.128', broadcast: '192.168.1.191',  usable: 62  },
        { name: 'LAN-C', hosts: 25,  prefix: 27, network: '192.168.1.192', broadcast: '192.168.1.223',  usable: 30  },
      ],
      addressesUsed: 192,
      addressesTotal: 256,
      efficiency: '75%',
    },
    hint: 'Sort largest-first. LAN-A (100 hosts) needs /25 (126 usable). LAN-B (50) needs /26 (62). LAN-C (25) needs /27 (30).',
    explanation: 'VLSM allocates blocks largest-first to ensure alignment. /25 starts at .0, /26 at .128, /27 at .192. No gaps because each block is naturally aligned.',
  },

  {
    id: 'vlsm-002',
    difficulty: DIFFICULTY.ADVANCED,
    type: 'vlsm',
    prompt: 'Allocate from 10.0.0.0/24 for: Dept-A (60 hosts), Dept-B (28 hosts), P2P-1 (2 hosts), P2P-2 (2 hosts).',
    given: {
      networkCIDR: '10.0.0.0/24',
      requirements: [
        { name: 'Dept-A', hosts: 60 },
        { name: 'Dept-B', hosts: 28 },
        { name: 'P2P-1',  hosts: 2  },
        { name: 'P2P-2',  hosts: 2  },
      ],
    },
    solution: {
      allocations: [
        { name: 'Dept-A', hosts: 60, prefix: 26, network: '10.0.0.0',   broadcast: '10.0.0.63',   usable: 62 },
        { name: 'Dept-B', hosts: 28, prefix: 27, network: '10.0.0.64',  broadcast: '10.0.0.95',   usable: 30 },
        { name: 'P2P-1',  hosts: 2,  prefix: 30, network: '10.0.0.96',  broadcast: '10.0.0.99',   usable: 2  },
        { name: 'P2P-2',  hosts: 2,  prefix: 30, network: '10.0.0.100', broadcast: '10.0.0.103',  usable: 2  },
      ],
      addressesUsed: 104,
      addressesTotal: 256,
      efficiency: '40.6%',
    },
    hint: 'Sorted: 60 → /26, 28 → /27, 2 → /30, 2 → /30. Allocate in order from base address.',
    explanation: 'Four subnets of different sizes packed tightly. /26 at .0, /27 at .64, first /30 at .96, second /30 at .100. 152 addresses remain unused for future growth.',
  },

  {
    id: 'vlsm-003',
    difficulty: DIFFICULTY.ADVANCED,
    type: 'vlsm',
    prompt: 'Allocate from 172.16.0.0/20 for: Building-A (500 hosts), Building-B (200 hosts), Server-Farm (50 hosts).',
    given: {
      networkCIDR: '172.16.0.0/20',
      requirements: [
        { name: 'Building-A',  hosts: 500 },
        { name: 'Building-B',  hosts: 200 },
        { name: 'Server-Farm', hosts: 50  },
      ],
    },
    solution: {
      allocations: [
        { name: 'Building-A',  hosts: 500, prefix: 23, network: '172.16.0.0', broadcast: '172.16.1.255', usable: 510 },
        { name: 'Building-B',  hosts: 200, prefix: 24, network: '172.16.2.0', broadcast: '172.16.2.255', usable: 254 },
        { name: 'Server-Farm', hosts: 50,  prefix: 26, network: '172.16.3.0', broadcast: '172.16.3.63',  usable: 62  },
      ],
      addressesUsed: 832,
      addressesTotal: 4096,
      efficiency: '20.3%',
    },
    hint: '500 hosts → /23 (510 usable). 200 hosts → /24 (254 usable). 50 hosts → /26 (62 usable). Start from 172.16.0.0.',
    explanation: '/20 = 4096 addresses (172.16.0.0–172.16.15.255). Building-A takes first /23, Building-B the next /24, Server-Farm a /26. 3264 addresses remain for future growth.',
  },
];

/**
 * Get problems by difficulty level.
 * @param {string} difficulty — DIFFICULTY constant
 * @returns {Array}
 */
export function getProblemsByDifficulty(difficulty) {
  return SUBNET_PROBLEMS.filter(p => p.difficulty === difficulty);
}

/**
 * Get problems by type.
 * @param {string} type — 'identify' | 'calculate' | 'design' | 'vlsm'
 * @returns {Array}
 */
export function getProblemsByType(type) {
  return SUBNET_PROBLEMS.filter(p => p.type === type);
}

/**
 * Worked example table: prefix → key facts.
 * Used by Resource Library cheat sheet section.
 */
export const CIDR_REFERENCE_TABLE = [
  { prefix: 8,  mask: '255.0.0.0',         hosts: 16777214, block: 16777216, octets: '8.0.0.0 – 8.255.255.255'    },
  { prefix: 16, mask: '255.255.0.0',        hosts: 65534,    block: 65536,    octets: '10.0.0.0 – 10.0.255.255'   },
  { prefix: 20, mask: '255.255.240.0',      hosts: 4094,     block: 4096,     octets: '10.0.0.0 – 10.0.15.255'    },
  { prefix: 21, mask: '255.255.248.0',      hosts: 2046,     block: 2048,     octets: '10.0.0.0 – 10.0.7.255'     },
  { prefix: 22, mask: '255.255.252.0',      hosts: 1022,     block: 1024,     octets: '10.0.0.0 – 10.0.3.255'     },
  { prefix: 23, mask: '255.255.254.0',      hosts: 510,      block: 512,      octets: '10.0.0.0 – 10.0.1.255'     },
  { prefix: 24, mask: '255.255.255.0',      hosts: 254,      block: 256,      octets: '10.0.0.0 – 10.0.0.255'     },
  { prefix: 25, mask: '255.255.255.128',    hosts: 126,      block: 128,      octets: '10.0.0.0 – 10.0.0.127'     },
  { prefix: 26, mask: '255.255.255.192',    hosts: 62,       block: 64,       octets: '10.0.0.0 – 10.0.0.63'      },
  { prefix: 27, mask: '255.255.255.224',    hosts: 30,       block: 32,       octets: '10.0.0.0 – 10.0.0.31'      },
  { prefix: 28, mask: '255.255.255.240',    hosts: 14,       block: 16,       octets: '10.0.0.0 – 10.0.0.15'      },
  { prefix: 29, mask: '255.255.255.248',    hosts: 6,        block: 8,        octets: '10.0.0.0 – 10.0.0.7'       },
  { prefix: 30, mask: '255.255.255.252',    hosts: 2,        block: 4,        octets: '10.0.0.0 – 10.0.0.3'       },
  { prefix: 31, mask: '255.255.255.254',    hosts: 2,        block: 2,        octets: 'Point-to-Point (RFC 3021)'  },
  { prefix: 32, mask: '255.255.255.255',    hosts: 1,        block: 1,        octets: 'Host Route'                 },
];
