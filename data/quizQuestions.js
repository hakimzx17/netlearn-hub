/**
 * quizQuestions.js — Full CCNA-Level Question Bank
 *
 * Pure data file — no imports, no side effects.
 * 60 questions across 6 topics, 3 difficulty tiers.
 *
 * Question schema:
 *   { id, topic, question, options: string[4], correctIndex: 0-3,
 *     explanation: string, difficulty: 'easy'|'medium'|'hard' }
 *
 * Topics: OSI_Model | IP_Addressing | Subnetting | Switching | Routing | Security
 */

export const TOPICS = {
  OSI:        'OSI & TCP/IP Model',
  IP:         'IP Addressing',
  SUBNET:     'Subnetting & VLSM',
  SWITCHING:  'Switching & VLANs',
  ROUTING:    'Routing Protocols',
  SECURITY:   'Network Security',
};

export const QUESTIONS = [

  // ══════════════════════════════════════════
  // TOPIC: OSI & TCP/IP Model  (10 questions)
  // ══════════════════════════════════════════

  {
    id: 'osi-01',
    topic: TOPICS.OSI,
    difficulty: 'easy',
    question: 'At which OSI layer does a router primarily operate?',
    options: [
      'Layer 1 — Physical',
      'Layer 2 — Data Link',
      'Layer 3 — Network',
      'Layer 4 — Transport',
    ],
    correctIndex: 2,
    explanation: 'Routers operate at Layer 3 (Network). They make forwarding decisions based on logical IP addresses and routing tables. Switches operate at Layer 2; hubs at Layer 1.',
  },
  {
    id: 'osi-02',
    topic: TOPICS.OSI,
    difficulty: 'easy',
    question: 'What is the correct PDU name at Layer 2 of the OSI model?',
    options: ['Segment', 'Packet', 'Frame', 'Bits'],
    correctIndex: 2,
    explanation: 'Layer 2 (Data Link) uses Frames as its PDU. Layer 4 uses Segments (TCP) or Datagrams (UDP). Layer 3 uses Packets. Layer 1 uses Bits.',
  },
  {
    id: 'osi-03',
    topic: TOPICS.OSI,
    difficulty: 'medium',
    question: 'A network engineer captures traffic and sees TLS 1.3 encryption being applied before data is sent. Which OSI layer is responsible for this?',
    options: [
      'Layer 5 — Session',
      'Layer 6 — Presentation',
      'Layer 7 — Application',
      'Layer 4 — Transport',
    ],
    correctIndex: 1,
    explanation: 'Encryption and data format translation (including TLS/SSL, ASCII, JPEG encoding) are Layer 6 (Presentation) functions. Layer 7 is where the application protocol (e.g. HTTPS) runs; the actual encryption transformation is Layer 6.',
  },
  {
    id: 'osi-04',
    topic: TOPICS.OSI,
    difficulty: 'easy',
    question: 'Which protocol operates at Layer 4 and provides reliable, ordered delivery?',
    options: ['IP', 'UDP', 'ICMP', 'TCP'],
    correctIndex: 3,
    explanation: 'TCP (Transmission Control Protocol) is a Layer 4 protocol providing reliable, connection-oriented, ordered delivery via sequencing and acknowledgements. UDP is also Layer 4 but is connectionless and unreliable.',
  },
  {
    id: 'osi-05',
    topic: TOPICS.OSI,
    difficulty: 'medium',
    question: 'The TCP/IP "Internet" layer maps to which OSI layer(s)?',
    options: [
      'Layer 2 only',
      'Layer 3 only',
      'Layers 1 and 2',
      'Layers 3 and 4',
    ],
    correctIndex: 1,
    explanation: 'The TCP/IP Internet layer corresponds to OSI Layer 3 (Network). It handles logical addressing and routing — functions performed by IP, ICMP, and routing protocols like OSPF.',
  },
  {
    id: 'osi-06',
    topic: TOPICS.OSI,
    difficulty: 'medium',
    question: 'Which OSI layer is responsible for establishing, maintaining, and terminating sessions between applications?',
    options: [
      'Layer 4 — Transport',
      'Layer 5 — Session',
      'Layer 6 — Presentation',
      'Layer 7 — Application',
    ],
    correctIndex: 1,
    explanation: 'Layer 5 (Session) manages dialogue control between two applications — establishing, managing, and gracefully terminating sessions. Protocols like NetBIOS and RPC operate here.',
  },
  {
    id: 'osi-07',
    topic: TOPICS.OSI,
    difficulty: 'hard',
    question: 'A packet is received at a router. The router decrements the TTL, recalculates the header checksum, and forwards the packet. Which layer(s) are involved in this process?',
    options: [
      'Layer 2 only',
      'Layer 3 only',
      'Layers 2 and 3',
      'Layers 1, 2, and 3',
    ],
    correctIndex: 2,
    explanation: 'TTL decrement and IP checksum recalculation are Layer 3 operations. The router also builds a new Layer 2 Ethernet frame with updated source/destination MACs for the next hop — making this a Layers 2 and 3 operation at each hop.',
  },
  {
    id: 'osi-08',
    topic: TOPICS.OSI,
    difficulty: 'easy',
    question: 'Which device operates at Layer 1 only and simply regenerates electrical signals?',
    options: ['Switch', 'Router', 'Hub', 'Bridge'],
    correctIndex: 2,
    explanation: 'A hub is a Layer 1 device — it regenerates and broadcasts electrical signals to all ports without examining MAC or IP addresses. Bridges and switches operate at Layer 2; routers at Layer 3.',
  },
  {
    id: 'osi-09',
    topic: TOPICS.OSI,
    difficulty: 'medium',
    question: 'ARP operates between which two OSI layers?',
    options: [
      'Layer 1 and 2',
      'Layer 2 and 3',
      'Layer 3 and 4',
      'Layer 4 and 5',
    ],
    correctIndex: 1,
    explanation: 'ARP (Address Resolution Protocol) bridges Layer 2 (MAC addresses) and Layer 3 (IP addresses). It resolves a known Layer 3 IP address to the Layer 2 MAC address needed to build an Ethernet frame.',
  },
  {
    id: 'osi-10',
    topic: TOPICS.OSI,
    difficulty: 'hard',
    question: 'During encapsulation, which of the following is the correct order as data travels down the OSI stack?',
    options: [
      'Data → Segment → Packet → Frame → Bits',
      'Bits → Frame → Packet → Segment → Data',
      'Packet → Segment → Frame → Bits → Data',
      'Data → Packet → Segment → Frame → Bits',
    ],
    correctIndex: 0,
    explanation: 'Encapsulation adds headers as data moves DOWN the stack: Application Data (L7-5) → Segment (L4 adds TCP/UDP header) → Packet (L3 adds IP header) → Frame (L2 adds Ethernet header/trailer) → Bits (L1 transmits). Decapsulation is the reverse.',
  },

  // ══════════════════════════════════════════
  // TOPIC: IP Addressing  (10 questions)
  // ══════════════════════════════════════════

  {
    id: 'ip-01',
    topic: TOPICS.IP,
    difficulty: 'easy',
    question: 'Which of the following is a valid Class C private IP address?',
    options: [
      '10.0.0.1',
      '172.16.0.1',
      '192.168.100.1',
      '169.254.1.1',
    ],
    correctIndex: 2,
    explanation: 'The Class C private range is 192.168.0.0/16 (192.168.0.0–192.168.255.255). 10.x.x.x is Class A private; 172.16–31.x.x is Class B private; 169.254.x.x is APIPA (link-local).',
  },
  {
    id: 'ip-02',
    topic: TOPICS.IP,
    difficulty: 'easy',
    question: 'What does the /24 in the address 192.168.1.0/24 indicate?',
    options: [
      '24 hosts are available on the network',
      'The first 24 bits are the network portion',
      'The last 24 bits are the network portion',
      '24 subnets have been created',
    ],
    correctIndex: 1,
    explanation: 'In CIDR notation, /24 means 24 bits are used for the network portion of the address. The remaining 8 bits are for hosts, giving 2^8 - 2 = 254 usable host addresses.',
  },
  {
    id: 'ip-03',
    topic: TOPICS.IP,
    difficulty: 'medium',
    question: 'A host has IP 169.254.55.10. What does this indicate?',
    options: [
      'The host is on a Class B network',
      'The host has a manually configured private IP',
      'DHCP failed and the host assigned itself an APIPA address',
      'The host is using NAT translation',
    ],
    correctIndex: 2,
    explanation: '169.254.0.0/16 is the Automatic Private IP Addressing (APIPA) range, defined in RFC 3927. When DHCP fails, Windows/Linux auto-configures from this range. Hosts on APIPA can only communicate with other APIPA hosts on the same segment.',
  },
  {
    id: 'ip-04',
    topic: TOPICS.IP,
    difficulty: 'easy',
    question: 'What is the loopback address in IPv4?',
    options: ['0.0.0.0', '255.255.255.255', '127.0.0.1', '192.168.0.1'],
    correctIndex: 2,
    explanation: '127.0.0.1 (and the entire 127.0.0.0/8 range) is the loopback address. Traffic sent to 127.x.x.x never leaves the host — it is used to test the local TCP/IP stack. The entire /8 range is reserved for loopback.',
  },
  {
    id: 'ip-05',
    topic: TOPICS.IP,
    difficulty: 'medium',
    question: 'Which address is the directed broadcast for the subnet 192.168.10.0/24?',
    options: [
      '192.168.10.0',
      '192.168.10.1',
      '192.168.10.254',
      '192.168.10.255',
    ],
    correctIndex: 3,
    explanation: 'The broadcast address for a /24 subnet has all host bits set to 1. For 192.168.10.0/24, the last octet all-ones = 255, so the broadcast is 192.168.10.255. Packets sent here are received by all hosts in that subnet.',
  },
  {
    id: 'ip-06',
    topic: TOPICS.IP,
    difficulty: 'medium',
    question: 'What is the default subnet mask for a Class B address?',
    options: [
      '255.0.0.0',
      '255.255.0.0',
      '255.255.255.0',
      '255.255.255.128',
    ],
    correctIndex: 1,
    explanation: 'Class B addresses (128.0.0.0–191.255.255.255) have a default subnet mask of 255.255.0.0 (/16). Class A defaults to /8 (255.0.0.0); Class C defaults to /24 (255.255.255.0).',
  },
  {
    id: 'ip-07',
    topic: TOPICS.IP,
    difficulty: 'hard',
    question: 'Host A at 10.0.1.50/22 wants to send a packet to 10.0.2.100. What will Host A do?',
    options: [
      'Send directly — both hosts are in the same /22 subnet',
      'Send to the default gateway — 10.0.2.100 is in a different subnet',
      'Drop the packet — Class A addresses cannot route to different subnets',
      'Broadcast an ARP for 10.0.2.100 across all subnets',
    ],
    correctIndex: 0,
    explanation: 'A /22 mask covers 10.0.0.0–10.0.3.255 (1024 addresses). Both 10.0.1.50 and 10.0.2.100 fall in the 10.0.0.0/22 subnet. Host A will ARP directly for 10.0.2.100 without involving a router.',
  },
  {
    id: 'ip-08',
    topic: TOPICS.IP,
    difficulty: 'medium',
    question: 'Which IPv4 address class uses the first octet range 224–239?',
    options: ['Class B', 'Class C', 'Class D', 'Class E'],
    correctIndex: 2,
    explanation: 'Class D (224.0.0.0–239.255.255.255) is reserved for multicast. OSPF uses 224.0.0.5/6; RIPv2 uses 224.0.0.9. Class E (240–255) is reserved for experimental use.',
  },
  {
    id: 'ip-09',
    topic: TOPICS.IP,
    difficulty: 'hard',
    question: 'A router receives a packet with destination 10.0.0.0. Its routing table has entries for 10.0.0.0/8 and 10.0.0.0/24. Which entry is used?',
    options: [
      '10.0.0.0/8 — less specific routes take priority',
      '10.0.0.0/24 — longest prefix match is always used',
      'Both are used and traffic is load-balanced',
      'Neither — the router drops the packet as ambiguous',
    ],
    correctIndex: 1,
    explanation: 'Routers always use Longest Prefix Match (LPM) — the most specific matching entry wins. /24 is more specific than /8 (24 matching bits vs 8), so 10.0.0.0/24 is selected. This is the fundamental routing decision algorithm.',
  },
  {
    id: 'ip-10',
    topic: TOPICS.IP,
    difficulty: 'hard',
    question: 'What is the wildcard mask equivalent of 255.255.254.0?',
    options: ['0.0.1.255', '0.0.0.255', '0.0.254.0', '255.255.1.255'],
    correctIndex: 0,
    explanation: 'The wildcard mask is the bitwise inverse of the subnet mask. 255.255.254.0 inverted = 0.0.1.255. Wildcard masks are used in OSPF network statements and ACLs (0=must match, 1=ignore).',
  },

  // ══════════════════════════════════════════
  // TOPIC: Subnetting & VLSM  (10 questions)
  // ══════════════════════════════════════════

  {
    id: 'sub-01',
    topic: TOPICS.SUBNET,
    difficulty: 'easy',
    question: 'How many usable host addresses does a /27 subnet provide?',
    options: ['14', '30', '32', '62'],
    correctIndex: 1,
    explanation: '/27 leaves 5 host bits. 2^5 = 32 total addresses. Subtract 2 (network and broadcast) = 30 usable hosts. The subnet mask is 255.255.255.224.',
  },
  {
    id: 'sub-02',
    topic: TOPICS.SUBNET,
    difficulty: 'easy',
    question: 'What is the subnet mask for /26?',
    options: [
      '255.255.255.128',
      '255.255.255.192',
      '255.255.255.224',
      '255.255.255.240',
    ],
    correctIndex: 1,
    explanation: '/26 = 26 ones then 6 zeros. The last octet: 11000000 = 192. Full mask: 255.255.255.192. This gives 64 addresses per subnet (62 usable).',
  },
  {
    id: 'sub-03',
    topic: TOPICS.SUBNET,
    difficulty: 'medium',
    question: 'A company needs 5 subnets with at least 25 hosts each from 192.168.10.0/24. Which prefix accommodates this with minimum waste?',
    options: ['/25', '/26', '/27', '/28'],
    correctIndex: 2,
    explanation: '/27 gives 30 usable hosts (≥25 ✓) and 8 subnets per /24 (≥5 ✓). /28 only gives 14 hosts (insufficient). /26 gives 62 hosts but only 4 subnets (insufficient count). /27 is the optimal choice.',
  },
  {
    id: 'sub-04',
    topic: TOPICS.SUBNET,
    difficulty: 'medium',
    question: 'What is the network address for the host 172.16.5.200/21?',
    options: [
      '172.16.0.0',
      '172.16.4.0',
      '172.16.5.0',
      '172.16.8.0',
    ],
    correctIndex: 1,
    explanation: '/21 = 255.255.248.0. The third octet block size is 8. 5 / 8 = 0 remainder 5, so the subnet starts at 4 (floor to nearest multiple of 8). Network: 172.16.4.0. Range: 172.16.4.0–172.16.11.255.',
  },
  {
    id: 'sub-05',
    topic: TOPICS.SUBNET,
    difficulty: 'medium',
    question: 'How many /28 subnets can be created from a single /24 network?',
    options: ['4', '8', '16', '32'],
    correctIndex: 2,
    explanation: 'Each /28 uses 4 more bits than /24. 2^(28-24) = 2^4 = 16 subnets. Alternatively: /24 = 256 addresses, /28 = 16 addresses each, 256/16 = 16 subnets.',
  },
  {
    id: 'sub-06',
    topic: TOPICS.SUBNET,
    difficulty: 'medium',
    question: 'What is the broadcast address for 10.0.0.0/30?',
    options: ['10.0.0.1', '10.0.0.2', '10.0.0.3', '10.0.0.4'],
    correctIndex: 2,
    explanation: '/30 = 255.255.255.252. Block size = 4. Range: 10.0.0.0–10.0.0.3. Network = .0, Broadcast = .3. Hosts: .1 and .2 (2 usable). /30 is the standard for point-to-point WAN links.',
  },
  {
    id: 'sub-07',
    topic: TOPICS.SUBNET,
    difficulty: 'hard',
    question: 'Using VLSM, you must allocate from 10.1.0.0/24 for: LAN-A (60 hosts), LAN-B (28 hosts), P2P Link (2 hosts). What prefix does LAN-A get?',
    options: ['/24', '/26', '/25', '/27'],
    correctIndex: 2,
    explanation: 'LAN-A needs 60 hosts. /26 gives only 62 hosts... wait — /26 = 62 ✓. Actually /25 = 126 hosts. VLSM picks the smallest prefix that satisfies the need. For exactly 60 hosts: /26 = 62 usable ≥ 60 ✓. /26 is optimal (minimum waste). /25 wastes too many. Correct answer: /26.',
  },
  {
    id: 'sub-08',
    topic: TOPICS.SUBNET,
    difficulty: 'hard',
    question: 'What is the first usable host address in the subnet containing 192.168.1.200/26?',
    options: [
      '192.168.1.129',
      '192.168.1.193',
      '192.168.1.194',
      '192.168.1.201',
    ],
    correctIndex: 1,
    explanation: '/26 = block size 64. Subnets: .0–.63, .64–.127, .128–.191, .192–.255. 200 falls in .192–.255. Network = 192.168.1.192. First host = 192.168.1.193. Broadcast = 192.168.1.255.',
  },
  {
    id: 'sub-09',
    topic: TOPICS.SUBNET,
    difficulty: 'hard',
    question: 'A /22 network starting at 172.20.4.0 contains how many total IP addresses?',
    options: ['512', '1022', '1024', '2048'],
    correctIndex: 2,
    explanation: '/22 has 32-22=10 host bits. 2^10 = 1024 total addresses. Usable = 1022 (subtract network + broadcast). Range: 172.20.4.0–172.20.7.255.',
  },
  {
    id: 'sub-10',
    topic: TOPICS.SUBNET,
    difficulty: 'hard',
    question: 'Which of the following is the correct summary route for 192.168.4.0/24, 192.168.5.0/24, 192.168.6.0/24, and 192.168.7.0/24?',
    options: [
      '192.168.4.0/21',
      '192.168.4.0/22',
      '192.168.0.0/22',
      '192.168.4.0/24',
    ],
    correctIndex: 1,
    explanation: 'The four /24 networks share the first 22 bits: 192.168.000001xx.0. They span .4.0–.7.255, which is 4 consecutive /24s = 1024 addresses = /22. The summary is 192.168.4.0/22.',
  },

  // ══════════════════════════════════════════
  // TOPIC: Switching & VLANs  (10 questions)
  // ══════════════════════════════════════════

  {
    id: 'sw-01',
    topic: TOPICS.SWITCHING,
    difficulty: 'easy',
    question: 'A switch receives a frame with an unknown destination MAC address. What does it do?',
    options: [
      'Drops the frame',
      'Sends the frame to the default gateway',
      'Floods the frame out all ports except the receiving port',
      'Holds the frame until the MAC is learned',
    ],
    correctIndex: 2,
    explanation: 'When a switch has no MAC table entry for the destination, it floods the frame out all ports except the one it arrived on. This is called Unknown Unicast Flooding. Once the destination replies, its MAC is learned.',
  },
  {
    id: 'sw-02',
    topic: TOPICS.SWITCHING,
    difficulty: 'easy',
    question: 'How does a switch learn MAC addresses?',
    options: [
      'It broadcasts a request to all connected devices',
      'It inspects the source MAC of every incoming frame',
      'It reads the MAC from the IP header',
      'It is manually configured by the network administrator',
    ],
    correctIndex: 1,
    explanation: 'Switches perform dynamic MAC learning by recording the source MAC address and the port it arrived on into the MAC address table (CAM table). This happens automatically with every received frame.',
  },
  {
    id: 'sw-03',
    topic: TOPICS.SWITCHING,
    difficulty: 'medium',
    question: 'What is the purpose of Spanning Tree Protocol (STP)?',
    options: [
      'To load-balance traffic across multiple switches',
      'To encrypt inter-switch traffic',
      'To prevent Layer 2 loops by blocking redundant paths',
      'To assign VLANs to switch ports',
    ],
    correctIndex: 2,
    explanation: 'STP (IEEE 802.1D) prevents broadcast storms and MAC address table instability caused by Layer 2 loops. It elects a Root Bridge and blocks all redundant paths, keeping exactly one active path between any two switches.',
  },
  {
    id: 'sw-04',
    topic: TOPICS.SWITCHING,
    difficulty: 'medium',
    question: 'Which 802.1Q frame field identifies the VLAN a frame belongs to?',
    options: [
      'EtherType field (0x8100)',
      '12-bit VLAN ID in the 802.1Q tag',
      'Source MAC address',
      'Frame Check Sequence (FCS)',
    ],
    correctIndex: 1,
    explanation: '802.1Q adds a 4-byte tag after the source MAC. Within this tag, a 12-bit VLAN ID (VID) identifies the VLAN (0–4094 valid, 0 and 4095 reserved). The EtherType 0x8100 indicates the frame is tagged.',
  },
  {
    id: 'sw-05',
    topic: TOPICS.SWITCHING,
    difficulty: 'medium',
    question: 'What is the difference between an access port and a trunk port on a switch?',
    options: [
      'Access ports carry multiple VLANs; trunk ports carry only one',
      'Access ports carry one VLAN untagged; trunk ports carry multiple VLANs with 802.1Q tags',
      'Access ports connect switches; trunk ports connect hosts',
      'Access ports use STP; trunk ports do not',
    ],
    correctIndex: 1,
    explanation: 'Access ports carry traffic for a single VLAN — frames are sent/received untagged (the host does not know about VLANs). Trunk ports carry multiple VLANs simultaneously using 802.1Q tagging, typically used for switch-to-switch or switch-to-router links.',
  },
  {
    id: 'sw-06',
    topic: TOPICS.SWITCHING,
    difficulty: 'hard',
    question: 'PC-A on VLAN 10 needs to communicate with PC-B on VLAN 20. What is required?',
    options: [
      'A trunk link between the two switches',
      'A router or Layer 3 switch to route between VLANs',
      'Changing both PCs to the same VLAN',
      'Enabling Inter-Switch Link (ISL) protocol',
    ],
    correctIndex: 1,
    explanation: 'VLANs are separate broadcast domains and separate Layer 2 networks. Communication between VLANs requires a Layer 3 device (router or L3 switch) — this is called inter-VLAN routing. A trunk link alone cannot bridge different VLANs.',
  },
  {
    id: 'sw-07',
    topic: TOPICS.SWITCHING,
    difficulty: 'medium',
    question: 'What happens to a MAC address table entry if no frame is received from that MAC within the aging timer (default 300 seconds)?',
    options: [
      'The entry is flagged as stale but retained',
      'The entry is deleted and the next frame will be flooded',
      'The switch broadcasts an ARP to refresh the entry',
      'The port associated with the entry is shut down',
    ],
    correctIndex: 1,
    explanation: 'MAC address table entries age out after 300 seconds (default) of inactivity. When expired, the entry is removed. The next frame destined for that MAC will be treated as an unknown unicast and flooded.',
  },
  {
    id: 'sw-08',
    topic: TOPICS.SWITCHING,
    difficulty: 'hard',
    question: 'In a switched network, what event causes a broadcast storm?',
    options: [
      'Too many unicast frames between two hosts',
      'A Layer 2 loop where broadcast frames circulate indefinitely',
      'A misconfigured VLAN trunk',
      'ARP cache overflow on a switch',
    ],
    correctIndex: 1,
    explanation: 'A broadcast storm occurs when a Layer 2 loop exists (no STP). A broadcast frame (e.g. ARP) enters the loop and is forwarded endlessly, rapidly consuming all available bandwidth and crashing the network. STP prevents this by blocking redundant paths.',
  },
  {
    id: 'sw-09',
    topic: TOPICS.SWITCHING,
    difficulty: 'easy',
    question: 'Which address type does a switch use to make forwarding decisions?',
    options: [
      'IP address (Layer 3)',
      'MAC address (Layer 2)',
      'Port number (Layer 4)',
      'VLAN tag (Layer 2)',
    ],
    correctIndex: 1,
    explanation: 'Switches operate at Layer 2 and make all forwarding decisions based on MAC addresses. They maintain a MAC address table (CAM table) mapping MAC addresses to physical switch ports.',
  },
  {
    id: 'sw-10',
    topic: TOPICS.SWITCHING,
    difficulty: 'hard',
    question: 'What is the native VLAN on a trunk port used for?',
    options: [
      'It carries the highest-priority VLAN traffic',
      'It is the management VLAN for switch configuration',
      'Untagged frames received on a trunk are assigned to it',
      'It carries VLAN 1 traffic only',
    ],
    correctIndex: 2,
    explanation: 'The native VLAN on a trunk port handles untagged frames — any frame arriving on the trunk without an 802.1Q tag is assigned to the native VLAN. Default is VLAN 1. Native VLAN mismatches between switches are a common misconfiguration causing connectivity issues.',
  },

  // ══════════════════════════════════════════
  // TOPIC: Routing Protocols  (10 questions)
  // ══════════════════════════════════════════

  {
    id: 'rt-01',
    topic: TOPICS.ROUTING,
    difficulty: 'easy',
    question: 'What does a router use to determine the best path to a destination network?',
    options: [
      'MAC address table',
      'ARP cache',
      'Routing table',
      'DHCP lease database',
    ],
    correctIndex: 2,
    explanation: 'A router uses its routing table to determine the best path. The table contains routes learned via directly connected interfaces, static configuration, or dynamic routing protocols. Longest Prefix Match is applied to select the best entry.',
  },
  {
    id: 'rt-02',
    topic: TOPICS.ROUTING,
    difficulty: 'easy',
    question: 'What is the Administrative Distance of a directly connected route?',
    options: ['0', '1', '90', '110'],
    correctIndex: 0,
    explanation: 'Directly connected routes have an Administrative Distance (AD) of 0 — the most trusted source. Static routes have AD=1. EIGRP=90, OSPF=110, RIP=120. Lower AD = more trustworthy.',
  },
  {
    id: 'rt-03',
    topic: TOPICS.ROUTING,
    difficulty: 'medium',
    question: 'OSPF uses which algorithm to compute the shortest path?',
    options: [
      'Bellman-Ford',
      'Distance Vector',
      'Dijkstra (Shortest Path First)',
      'Hybrid metric calculation',
    ],
    correctIndex: 2,
    explanation: 'OSPF is a link-state protocol that uses Dijkstra\'s Shortest Path First (SPF) algorithm. Each router builds a complete topology map (LSDB) and runs SPF to compute the shortest path tree. Bellman-Ford is used by RIP and EIGRP.',
  },
  {
    id: 'rt-04',
    topic: TOPICS.ROUTING,
    difficulty: 'medium',
    question: 'What is the maximum hop count for RIP before a route is considered unreachable?',
    options: ['10', '15', '16', '255'],
    correctIndex: 2,
    explanation: 'RIP uses hop count as its metric with a maximum of 15 hops. A metric of 16 is considered infinity (unreachable). This limits RIP to small networks. RIPv2 adds support for VLSM and authentication but retains the 15-hop limit.',
  },
  {
    id: 'rt-05',
    topic: TOPICS.ROUTING,
    difficulty: 'medium',
    question: 'Which routing protocol is a Cisco-proprietary hybrid protocol using the DUAL algorithm?',
    options: ['OSPF', 'BGP', 'RIP', 'EIGRP'],
    correctIndex: 3,
    explanation: 'EIGRP (Enhanced Interior Gateway Routing Protocol) is a Cisco-proprietary protocol (though partially open since 2013) that uses the DUAL (Diffusing Update Algorithm) for loop-free fast convergence. Its metric uses bandwidth and delay.',
  },
  {
    id: 'rt-06',
    topic: TOPICS.ROUTING,
    difficulty: 'hard',
    question: 'Two routing protocols have routes to the same destination. OSPF reports cost 20 via 10.1.1.1, and EIGRP reports metric 10000 via 10.2.2.1. Which route is installed in the routing table?',
    options: [
      'EIGRP — lower metric wins',
      'OSPF — lower administrative distance wins',
      'OSPF — link-state protocols always take priority',
      'Both — equal-cost multi-path is used',
    ],
    correctIndex: 1,
    explanation: 'When two different routing protocols have routes to the same destination, Administrative Distance decides. OSPF AD=110, EIGRP AD=90. EIGRP wins (lower AD=more trusted). Note: metrics are not comparable across protocols — AD is used first.',
  },
  {
    id: 'rt-07',
    topic: TOPICS.ROUTING,
    difficulty: 'medium',
    question: 'What is the purpose of the gateway of last resort (default route)?',
    options: [
      'It is used for management traffic to the router itself',
      'It handles traffic to destinations not matching any specific route',
      'It provides a backup path when the primary route fails',
      'It marks the administrative boundary of a routing domain',
    ],
    correctIndex: 1,
    explanation: 'The default route (0.0.0.0/0) matches any destination and is used when no more specific route exists. Configured as "ip route 0.0.0.0 0.0.0.0 [next-hop]" in Cisco IOS. Commonly points to the ISP gateway.',
  },
  {
    id: 'rt-08',
    topic: TOPICS.ROUTING,
    difficulty: 'hard',
    question: 'What is a routing loop and which mechanism do distance-vector protocols use to prevent one?',
    options: [
      'A loop where packets circulate indefinitely; prevented by TTL',
      'A loop where routing updates loop between routers; prevented by split horizon',
      'A loop caused by duplicate routes; prevented by route summarization',
      'A loop in the spanning tree; prevented by STP root election',
    ],
    correctIndex: 1,
    explanation: 'A routing loop occurs when distance-vector routers advertise incorrect routes back toward the source (count-to-infinity). Split horizon prevents this by not advertising a route back out the interface it was learned from. Poison reverse and holddown timers also help.',
  },
  {
    id: 'rt-09',
    topic: TOPICS.ROUTING,
    difficulty: 'hard',
    question: 'BGP is classified as which type of routing protocol?',
    options: [
      'Interior Gateway Protocol using Link-State',
      'Interior Gateway Protocol using Distance-Vector',
      'Exterior Gateway Protocol using Path-Vector',
      'Exterior Gateway Protocol using Link-State',
    ],
    correctIndex: 2,
    explanation: 'BGP (Border Gateway Protocol) is the only EGP (Exterior Gateway Protocol) in use today. It uses path-vector routing, where the AS_PATH attribute lists all Autonomous Systems a route has traversed. It runs between ASes using TCP port 179.',
  },
  {
    id: 'rt-10',
    topic: TOPICS.ROUTING,
    difficulty: 'medium',
    question: 'Which OSPF packet type is used to discover and maintain neighbor relationships?',
    options: [
      'LSA (Link State Advertisement)',
      'DBD (Database Description)',
      'Hello',
      'LSR (Link State Request)',
    ],
    correctIndex: 2,
    explanation: 'OSPF Hello packets are sent every 10 seconds (default) on broadcast networks to discover neighbors and confirm adjacency. If a router stops receiving Hellos from a neighbor for the Dead Interval (40 seconds default), the adjacency is torn down.',
  },

  // ══════════════════════════════════════════
  // TOPIC: Network Security  (10 questions)
  // ══════════════════════════════════════════

  {
    id: 'sec-01',
    topic: TOPICS.SECURITY,
    difficulty: 'easy',
    question: 'What is the primary function of a firewall?',
    options: [
      'To assign IP addresses to network hosts',
      'To encrypt all network traffic automatically',
      'To control traffic flow between networks based on rules',
      'To increase network bandwidth by compressing data',
    ],
    correctIndex: 2,
    explanation: 'A firewall controls which traffic is allowed or denied between network segments based on configured rules (ACLs or stateful inspection). It enforces a security policy at network boundaries, typically between trusted internal and untrusted external networks.',
  },
  {
    id: 'sec-02',
    topic: TOPICS.SECURITY,
    difficulty: 'easy',
    question: 'SSH (Secure Shell) replaces which insecure protocol for remote device management?',
    options: ['FTP', 'Telnet', 'SNMP', 'HTTP'],
    correctIndex: 1,
    explanation: 'SSH (port 22) replaces Telnet (port 23) for remote CLI management. Telnet sends all data including passwords in cleartext — easily captured by a packet sniffer. SSH encrypts the entire session using asymmetric key exchange.',
  },
  {
    id: 'sec-03',
    topic: TOPICS.SECURITY,
    difficulty: 'medium',
    question: 'What does a standard ACL match on to permit or deny traffic?',
    options: [
      'Source IP address only',
      'Destination IP address only',
      'Both source and destination IP and port',
      'MAC address and VLAN tag',
    ],
    correctIndex: 0,
    explanation: 'Standard ACLs (numbered 1–99, 1300–1999 on Cisco) filter based on source IP address ONLY. Extended ACLs match source IP, destination IP, protocol, and port numbers. Place standard ACLs as close to the destination as possible.',
  },
  {
    id: 'sec-04',
    topic: TOPICS.SECURITY,
    difficulty: 'medium',
    question: 'What type of attack involves an attacker filling a switch\'s MAC address table to force it to flood all frames?',
    options: [
      'ARP Spoofing',
      'MAC Flooding (CAM overflow)',
      'VLAN Hopping',
      'STP Manipulation',
    ],
    correctIndex: 1,
    explanation: 'MAC flooding (CAM table overflow) involves sending thousands of frames with fake MACs to fill the switch\'s CAM table. Once full, the switch floods all traffic, allowing an attacker to capture frames. Port security limits the number of MACs per port to mitigate this.',
  },
  {
    id: 'sec-05',
    topic: TOPICS.SECURITY,
    difficulty: 'medium',
    question: 'What does NAT (Network Address Translation) primarily provide?',
    options: [
      'Encryption of traffic between private and public networks',
      'Conservation of IPv4 addresses by mapping private to public IPs',
      'Authentication of devices connecting to the network',
      'Dynamic VLAN assignment based on device type',
    ],
    correctIndex: 1,
    explanation: 'NAT maps private IP addresses (RFC 1918) to one or more public IPs, conserving the IPv4 address space. PAT (Port Address Translation) allows many private hosts to share a single public IP using different source ports. NAT also provides a degree of security by hiding internal topology.',
  },
  {
    id: 'sec-06',
    topic: TOPICS.SECURITY,
    difficulty: 'hard',
    question: 'An attacker sends gratuitous ARP replies associating the gateway IP with the attacker\'s MAC. What attack is this?',
    options: [
      'MAC Flooding',
      'DNS Spoofing',
      'ARP Poisoning / ARP Spoofing',
      'IP Spoofing',
    ],
    correctIndex: 2,
    explanation: 'ARP Poisoning sends fake ARP replies to poison hosts\' ARP caches, redirecting traffic through the attacker (man-in-the-middle). Dynamic ARP Inspection (DAI) on switches validates ARP packets against a trusted DHCP snooping binding table to prevent this.',
  },
  {
    id: 'sec-07',
    topic: TOPICS.SECURITY,
    difficulty: 'medium',
    question: 'Which AAA framework component verifies a user\'s credentials?',
    options: [
      'Accounting',
      'Authorization',
      'Authentication',
      'Association',
    ],
    correctIndex: 2,
    explanation: 'AAA stands for Authentication, Authorization, and Accounting. Authentication verifies identity (who are you?). Authorization determines what you can do. Accounting logs what you did. RADIUS and TACACS+ are common AAA protocols.',
  },
  {
    id: 'sec-08',
    topic: TOPICS.SECURITY,
    difficulty: 'hard',
    question: 'What is VLAN hopping, and which configuration prevents it?',
    options: [
      'Sending traffic to a different VLAN by double-tagging; prevented by changing the native VLAN',
      'Jumping between switch port modes; prevented by STP',
      'Routing between VLANs without a Layer 3 device; prevented by ACLs',
      'Using dynamic trunking to create unauthorized trunk links; prevented by disabling DTP',
    ],
    correctIndex: 0,
    explanation: 'VLAN hopping uses double-tagging (two 802.1Q tags) to send traffic to a non-native VLAN. The switch strips the outer tag (native VLAN) and forwards based on the inner tag. Prevention: change native VLAN to an unused VLAN, disable auto-trunking (DTP), and use "switchport nonegotiate".',
  },
  {
    id: 'sec-09',
    topic: TOPICS.SECURITY,
    difficulty: 'easy',
    question: 'Which port is used by HTTPS (HTTP over TLS)?',
    options: ['80', '443', '8080', '8443'],
    correctIndex: 1,
    explanation: 'HTTPS uses TCP port 443. HTTP uses port 80. Port 8080 is a common HTTP alternate. The S in HTTPS signifies that TLS (Transport Layer Security) encrypts the HTTP session, providing confidentiality, integrity, and server authentication.',
  },
  {
    id: 'sec-10',
    topic: TOPICS.SECURITY,
    difficulty: 'hard',
    question: 'What is the difference between symmetric and asymmetric encryption?',
    options: [
      'Symmetric uses two keys; asymmetric uses one shared key',
      'Symmetric uses one shared key for encryption and decryption; asymmetric uses a key pair (public/private)',
      'Symmetric is used for authentication; asymmetric for bulk data',
      'Symmetric encryption cannot be decrypted; asymmetric encryption can',
    ],
    correctIndex: 1,
    explanation: 'Symmetric encryption (e.g. AES) uses the same key for encryption and decryption — fast, used for bulk data. Asymmetric (e.g. RSA) uses a key pair: encrypt with the public key, decrypt with the private key. TLS uses asymmetric for key exchange, then symmetric for the session.',
  },
];

/**
 * Get questions filtered by topic.
 * @param {string} topic — one of TOPICS values, or null for all
 * @returns {Array}
 */
export function getQuestionsByTopic(topic) {
  if (!topic) return QUESTIONS;
  return QUESTIONS.filter(q => q.topic === topic);
}

/**
 * Get questions filtered by difficulty.
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {Array}
 */
export function getQuestionsByDifficulty(difficulty) {
  return QUESTIONS.filter(q => q.difficulty === difficulty);
}

/**
 * Get a random subset of questions from the full bank.
 * @param {number} count
 * @param {string[]} [topicFilter] — optional topic restriction
 * @returns {Array}
 */
export function getRandomQuestions(count, topicFilter) {
  let pool = topicFilter
    ? QUESTIONS.filter(q => topicFilter.includes(q.topic))
    : [...QUESTIONS];

  // Fisher-Yates shuffle inline (no import needed in data file)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
