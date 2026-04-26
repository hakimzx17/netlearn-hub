/**
 * examQuestions.js — CCNA Exam Question Bank
 *
 * 120 questions across all 6 official CCNA exam domains.
 * Pure data plus lightweight question-set helpers. Imported by examModeEngine.js only.
 *
 * Domain distribution (mirrors real CCNA weighting):
 *   Domain 1 — Network Fundamentals         20% → 24 questions
 *   Domain 2 — Network Access               20% → 24 questions
 *   Domain 3 — IP Connectivity              25% → 30 questions
 *   Domain 4 — IP Services                  10% → 12 questions
 *   Domain 5 — Security Fundamentals        15% → 18 questions
 *   Domain 6 — Automation & Programmability 10% → 12 questions
 *
 * Question types:
 *   'single' — one correct answer (radio buttons)
 *   'multi'  — multiple correct answers (checkboxes), correct is string[]
 *   'order'  — drag items into correct sequence
 *   'input'  — free-text answer (subnetting calculations)
 */

export const DOMAINS = {
  1: 'Network Fundamentals',
  2: 'Network Access',
  3: 'IP Connectivity',
  4: 'IP Services',
  5: 'Security Fundamentals',
  6: 'Automation & Programmability',
};

export const QUESTIONS = [

  // ══════════════════════════════════════════════
  //  DOMAIN 1 — NETWORK FUNDAMENTALS  (13 Qs)
  // ══════════════════════════════════════════════

  {
    id: 'q001', domain: 1, type: 'single', difficulty: 'easy',
    question: 'Which OSI layer is responsible for end-to-end error recovery and flow control?',
    options: [
      { id: 'a', text: 'Network (Layer 3)' },
      { id: 'b', text: 'Data Link (Layer 2)' },
      { id: 'c', text: 'Transport (Layer 4)' },
      { id: 'd', text: 'Session (Layer 5)' },
    ],
    correct: 'c',
    explanation: 'Layer 4 (Transport) provides end-to-end communication, error recovery via TCP acknowledgements, and flow control. Layer 2 handles hop-to-hop error detection only within one segment.',
  },

  {
    id: 'q002', domain: 1, type: 'single', difficulty: 'easy',
    question: 'What is the standard Ethernet MTU (Maximum Transmission Unit)?',
    options: [
      { id: 'a', text: '576 bytes' },
      { id: 'b', text: '1500 bytes' },
      { id: 'c', text: '9000 bytes' },
      { id: 'd', text: '65535 bytes' },
    ],
    correct: 'b',
    explanation: 'Standard Ethernet MTU = 1500 bytes payload. Jumbo frames (up to 9000 bytes) require explicit configuration. Packets exceeding the MTU are fragmented at the IP layer.',
  },

  {
    id: 'q003', domain: 1, type: 'single', difficulty: 'medium',
    question: 'A host sends a packet to a host on a DIFFERENT network. What destination MAC address is placed in the Ethernet frame?',
    options: [
      { id: 'a', text: 'The remote destination host MAC' },
      { id: 'b', text: 'FF:FF:FF:FF:FF:FF (broadcast)' },
      { id: 'c', text: 'The default gateway MAC address' },
      { id: 'd', text: 'The source host own MAC' },
    ],
    correct: 'c',
    explanation: 'For off-subnet traffic the dst IP = remote host, but dst MAC = the router (default gateway) interface. The router strips the frame, makes a routing decision, and re-encapsulates for the next hop.',
  },

  {
    id: 'q004', domain: 1, type: 'multi', difficulty: 'medium',
    question: 'Which TWO statements correctly describe TCP compared to UDP? (Select 2)',
    options: [
      { id: 'a', text: 'TCP uses a three-way handshake before sending data' },
      { id: 'b', text: 'TCP has lower overhead and is faster than UDP' },
      { id: 'c', text: 'TCP provides guaranteed delivery via acknowledgements' },
      { id: 'd', text: 'TCP is preferred for real-time voice and video' },
    ],
    correct: ['a', 'c'],
    explanation: 'TCP establishes connections via SYN/SYN-ACK/ACK and guarantees delivery through acknowledgements and retransmission. UDP has lower overhead and suits real-time applications where some loss is acceptable.',
  },

  {
    id: 'q005', domain: 1, type: 'single', difficulty: 'easy',
    question: 'Which PDU name is used at the Network layer (Layer 3)?',
    options: [
      { id: 'a', text: 'Frame' },
      { id: 'b', text: 'Segment' },
      { id: 'c', text: 'Packet' },
      { id: 'd', text: 'Bit' },
    ],
    correct: 'c',
    explanation: 'OSI PDU names: L1=Bits, L2=Frame, L3=Packet, L4=Segment (TCP) or Datagram (UDP). A key CCNA fact.',
  },

  {
    id: 'q006', domain: 1, type: 'order', difficulty: 'medium',
    question: 'Place the TCP three-way handshake steps in the correct order (first → last):',
    items: [
      { id: 'syn',    text: 'Client sends SYN' },
      { id: 'synack', text: 'Server sends SYN-ACK' },
      { id: 'ack',    text: 'Client sends ACK' },
    ],
    correct: ['syn', 'synack', 'ack'],
    explanation: '(1) Client SYN — initiates, sends ISN. (2) Server SYN-ACK — acknowledges client ISN, sends own ISN. (3) Client ACK — acknowledges server ISN. Connection established.',
  },

  {
    id: 'q007', domain: 1, type: 'single', difficulty: 'hard',
    question: 'A frame arrives at a switch. The source MAC is NOT in the CAM table. What does the switch do FIRST?',
    options: [
      { id: 'a', text: 'Drops the frame and sends an error to the source' },
      { id: 'b', text: 'Floods the frame and ignores the source MAC' },
      { id: 'c', text: 'Learns the source MAC, then floods out all ports except ingress' },
      { id: 'd', text: 'Forwards the frame to the default gateway' },
    ],
    correct: 'c',
    explanation: 'Switches ALWAYS learn the source MAC first (map to ingress port), then look up the destination. Unknown destination = flood all ports except ingress. Source learning is independent of what happens to the frame.',
  },

  {
    id: 'q008', domain: 1, type: 'single', difficulty: 'easy',
    question: 'Which is a valid RFC 1918 private IP range?',
    options: [
      { id: 'a', text: '172.15.0.0 – 172.31.255.255' },
      { id: 'b', text: '172.16.0.0 – 172.31.255.255' },
      { id: 'c', text: '192.168.0.0 – 192.168.0.255 only' },
      { id: 'd', text: '10.0.0.0 – 10.255.255.0' },
    ],
    correct: 'b',
    explanation: 'RFC 1918 ranges: 10.0.0.0/8, 172.16.0.0/12 (172.16–172.31), 192.168.0.0/16. Option A starts at 172.15 (wrong); C is only one /24; D truncates at .0 not .255.',
  },

  {
    id: 'q009', domain: 1, type: 'single', difficulty: 'medium',
    question: 'What is the primary purpose of ARP?',
    options: [
      { id: 'a', text: 'Translate domain names to IP addresses' },
      { id: 'b', text: 'Map IP addresses to MAC addresses on a local segment' },
      { id: 'c', text: 'Automatically assign IP addresses to hosts' },
      { id: 'd', text: 'Encrypt traffic between two hosts' },
    ],
    correct: 'b',
    explanation: 'ARP resolves Layer 3 (IP) to Layer 2 (MAC) on the local network. It broadcasts "Who has IP X?" and the owner replies with its MAC.',
  },

  {
    id: 'q010', domain: 1, type: 'input', difficulty: 'medium',
    question: 'How many usable host addresses are in a /27 subnet?',
    answer: '30',
    explanation: '/27 = 32 total addresses. Subtract network + broadcast = 30 usable. Formula: 2^(32-27) - 2 = 32 - 2 = 30.',
  },

  {
    id: 'q011', domain: 1, type: 'single', difficulty: 'hard',
    question: 'Which IPv4 header field prevents packets from circulating indefinitely?',
    options: [
      { id: 'a', text: 'Protocol' },
      { id: 'b', text: 'Flags' },
      { id: 'c', text: 'TTL (Time to Live)' },
      { id: 'd', text: 'Header Checksum' },
    ],
    correct: 'c',
    explanation: 'TTL is decremented by 1 at each router hop. When it reaches 0 the router discards the packet and sends ICMP Time Exceeded back to the source, preventing routing loops from causing infinite circulation.',
  },

  {
    id: 'q012', domain: 1, type: 'single', difficulty: 'medium',
    question: 'CSMA/CD is the media access method for which technology?',
    options: [
      { id: 'a', text: 'Wi-Fi (802.11)' },
      { id: 'b', text: 'Legacy half-duplex Ethernet' },
      { id: 'c', text: 'Token Ring' },
      { id: 'd', text: 'Full-duplex switched Ethernet' },
    ],
    correct: 'b',
    explanation: 'CSMA/CD is used by legacy half-duplex Ethernet. Modern full-duplex switched Ethernet eliminates collisions entirely and does not use CSMA/CD. Wi-Fi uses CSMA/CA (Collision Avoidance).',
  },

  {
    id: 'q013', domain: 1, type: 'multi', difficulty: 'hard',
    question: 'Which THREE are characteristics of UDP? (Select 3)',
    options: [
      { id: 'a', text: 'Connectionless — no handshake' },
      { id: 'b', text: 'Provides guaranteed ordered delivery' },
      { id: 'c', text: 'Lower overhead than TCP' },
      { id: 'd', text: 'Used by DNS and DHCP' },
      { id: 'e', text: 'Uses sequence numbers and ACKs' },
    ],
    correct: ['a', 'c', 'd'],
    explanation: 'UDP is connectionless, low overhead (8-byte header), and used by DNS (53) and DHCP (67/68). guaranteed ordered delivery and sequence numbers/ACKs are TCP features.',
  },

  // ══════════════════════════════════════════════
  //  DOMAIN 2 — NETWORK ACCESS  (13 Qs)
  // ══════════════════════════════════════════════

  {
    id: 'q014', domain: 2, type: 'single', difficulty: 'easy',
    question: 'What is the default administrative distance of OSPF?',
    options: [
      { id: 'a', text: '90' },
      { id: 'b', text: '100' },
      { id: 'c', text: '110' },
      { id: 'd', text: '120' },
    ],
    correct: 'c',
    explanation: 'AD values: Connected=0, Static=1, EIGRP=90, OSPF=110, RIP=120. Lower AD = more trusted. A static route always beats OSPF for the same destination.',
  },

  {
    id: 'q015', domain: 2, type: 'single', difficulty: 'medium',
    question: 'A PortFast-enabled switch port receives a BPDU. What happens?',
    options: [
      { id: 'a', text: 'The port ignores the BPDU' },
      { id: 'b', text: 'The port is placed in err-disabled state (BPDU Guard)' },
      { id: 'c', text: 'The port transitions to the STP blocking state' },
      { id: 'd', text: 'The switch elects a new root bridge' },
    ],
    correct: 'b',
    explanation: 'BPDU Guard err-disables a PortFast port when a BPDU is received — indicating a switch was connected where an end-host should be. Recovery requires manual "no shutdown" or errdisable recovery configuration.',
  },

  {
    id: 'q016', domain: 2, type: 'single', difficulty: 'medium',
    question: 'Which STP port role has the best cost path to the root bridge and forwards traffic?',
    options: [
      { id: 'a', text: 'Root Port' },
      { id: 'b', text: 'Designated Port' },
      { id: 'c', text: 'Alternate Port' },
      { id: 'd', text: 'Backup Port' },
    ],
    correct: 'a',
    explanation: 'The Root Port is on every non-root switch — the port with the best (lowest) cost path to the root bridge. Each non-root switch has exactly ONE root port. It forwards traffic.',
  },

  {
    id: 'q017', domain: 2, type: 'single', difficulty: 'easy',
    question: 'What is the purpose of an 802.1Q trunk link between two switches?',
    options: [
      { id: 'a', text: 'Provide redundancy if the primary link fails' },
      { id: 'b', text: 'Carry traffic from multiple VLANs over a single physical link' },
      { id: 'c', text: 'Aggregate bandwidth from multiple links' },
      { id: 'd', text: 'Connect a switch to a high-bandwidth host' },
    ],
    correct: 'b',
    explanation: 'A trunk uses 802.1Q tagging to carry multiple VLANs on one physical link. Each frame is tagged with a 4-byte VLAN ID (except the native VLAN). This allows VLANs to span multiple switches.',
  },

  {
    id: 'q018', domain: 2, type: 'single', difficulty: 'hard',
    question: 'SW1 Gi0/1 = "dynamic desirable", SW2 Gi0/1 = "dynamic auto". What is the resulting link mode?',
    options: [
      { id: 'a', text: 'Access' },
      { id: 'b', text: 'Trunk' },
      { id: 'c', text: 'The link will not form' },
      { id: 'd', text: 'Depends on which switch boots first' },
    ],
    correct: 'b',
    explanation: 'DTP: "dynamic desirable" actively tries to trunk. "dynamic auto" waits passively. Desirable + Auto = Trunk. Auto + Auto = Access. Desirable + Desirable = Trunk.',
  },

  {
    id: 'q019', domain: 2, type: 'single', difficulty: 'medium',
    question: 'In 802.1Q trunking, which VLAN\'s traffic is sent WITHOUT a tag?',
    options: [
      { id: 'a', text: 'Management VLAN' },
      { id: 'b', text: 'Native VLAN (default VLAN 1)' },
      { id: 'c', text: 'Highest-priority VLAN' },
      { id: 'd', text: 'Voice VLAN' },
    ],
    correct: 'b',
    explanation: 'The native VLAN traverses trunks untagged. All other VLANs are tagged. Both ends must agree on the native VLAN — a mismatch causes a CDP warning and is a security risk (VLAN hopping).',
  },

  {
    id: 'q020', domain: 2, type: 'single', difficulty: 'medium',
    question: 'Which RSTP port state replaces STP\'s "Blocking" and "Listening" states?',
    options: [
      { id: 'a', text: 'Alternate' },
      { id: 'b', text: 'Discarding' },
      { id: 'c', text: 'Backup' },
      { id: 'd', text: 'Learning' },
    ],
    correct: 'b',
    explanation: 'RSTP (802.1w) uses 3 states: Discarding (replaces Disabled/Blocking/Listening), Learning, Forwarding. Discarding receives BPDUs but does not forward frames or learn MACs.',
  },

  {
    id: 'q021', domain: 2, type: 'input', difficulty: 'medium',
    question: 'What is the size in bytes of an 802.1Q VLAN tag?',
    answer: '4',
    explanation: '802.1Q tag = 4 bytes: 2-byte TPID (0x8100) + 2-byte TCI (3-bit PCP + 1-bit DEI + 12-bit VLAN ID). The 12-bit VLAN ID supports VLANs 1–4094.',
  },

  {
    id: 'q022', domain: 2, type: 'single', difficulty: 'easy',
    question: 'What does PortFast do on a switch access port?',
    options: [
      { id: 'a', text: 'Increases the port to maximum speed' },
      { id: 'b', text: 'Skips STP listening and learning, going directly to forwarding' },
      { id: 'c', text: 'Permanently disables STP on the port' },
      { id: 'd', text: 'Allows the port to carry multiple VLANs' },
    ],
    correct: 'b',
    explanation: 'PortFast bypasses the 30-second STP delay (15s listening + 15s learning) on ports connected to end hosts. Never enable on ports connected to other switches.',
  },

  {
    id: 'q023', domain: 2, type: 'multi', difficulty: 'hard',
    question: 'Which TWO are valid EtherChannel negotiation protocols? (Select 2)',
    options: [
      { id: 'a', text: 'LACP (IEEE 802.3ad)' },
      { id: 'b', text: 'RSTP' },
      { id: 'c', text: 'PAgP (Cisco proprietary)' },
      { id: 'd', text: 'CDP' },
    ],
    correct: ['a', 'c'],
    explanation: 'EtherChannel protocols: LACP (open standard, interoperable) and PAgP (Cisco proprietary). Also configurable statically with "mode on". RSTP prevents loops; CDP discovers neighbors.',
  },

  {
    id: 'q024', domain: 2, type: 'single', difficulty: 'medium',
    question: 'Router-on-a-stick requires which configuration?',
    options: [
      { id: 'a', text: 'One physical interface per VLAN on the router' },
      { id: 'b', text: 'A trunk to the switch with router sub-interfaces per VLAN' },
      { id: 'c', text: 'A Layer 3 switch with SVIs' },
      { id: 'd', text: 'One router per VLAN' },
    ],
    correct: 'b',
    explanation: 'Router-on-a-stick uses ONE physical interface trunked to the switch, with sub-interfaces (e.g., Gi0/0.10) each configured with "encapsulation dot1q [vlan]" and a gateway IP for inter-VLAN routing.',
  },

  {
    id: 'q025', domain: 2, type: 'single', difficulty: 'hard',
    question: 'How is the STP root bridge elected?',
    options: [
      { id: 'a', text: 'Highest Bridge ID (priority + MAC)' },
      { id: 'b', text: 'Lowest Bridge ID (priority + MAC)' },
      { id: 'c', text: 'Switch with the most ports' },
      { id: 'd', text: 'Switch physically closest to the router' },
    ],
    correct: 'b',
    explanation: 'Bridge ID = 2-byte priority (default 32768) + 6-byte MAC. LOWEST total BID wins root election. To force root: "spanning-tree vlan X priority 0" or "spanning-tree vlan X root primary".',
  },

  {
    id: 'q026', domain: 2, type: 'single', difficulty: 'medium',
    question: 'What is the purpose of "ip default-gateway" on a Layer 2 switch?',
    options: [
      { id: 'a', text: 'Enables inter-VLAN routing on the switch' },
      { id: 'b', text: 'Tells the switch where to send its own management traffic for remote networks' },
      { id: 'c', text: 'Configures the switch as a DHCP server' },
      { id: 'd', text: 'Sets the default VLAN for all access ports' },
    ],
    correct: 'b',
    explanation: '"ip default-gateway" on a L2 switch specifies where to send switch management traffic (SSH/Telnet/SNMP) when the destination is on another subnet. It does NOT enable routing between VLANs.',
  },

  // ══════════════════════════════════════════════
  //  DOMAIN 3 — IP CONNECTIVITY  (16 Qs)
  // ══════════════════════════════════════════════

  {
    id: 'q027', domain: 3, type: 'single', difficulty: 'easy',
    question: 'A router has routes: 10.0.0.0/8, 10.5.0.0/16, 10.5.3.0/24, 0.0.0.0/0. Packet arrives for 10.5.3.17. Which route is used?',
    options: [
      { id: 'a', text: '10.0.0.0/8' },
      { id: 'b', text: '10.5.0.0/16' },
      { id: 'c', text: '10.5.3.0/24' },
      { id: 'd', text: '0.0.0.0/0 (default route)' },
    ],
    correct: 'c',
    explanation: 'Routers use Longest Prefix Match — the most specific route wins. /24 > /16 > /8 > /0. Default route is only used when no more-specific match exists.',
  },

  {
    id: 'q028', domain: 3, type: 'single', difficulty: 'medium',
    question: 'What must happen before OSPF routers can exchange routing information?',
    options: [
      { id: 'a', text: 'Exchange full routing tables' },
      { id: 'b', text: 'Form neighbor adjacencies by exchanging Hello packets' },
      { id: 'c', text: 'Elect a Backup Designated Router' },
      { id: 'd', text: 'Synchronize clocks via NTP' },
    ],
    correct: 'b',
    explanation: 'OSPF neighbor states: Down → Init → 2-Way → ExStart → Exchange → Loading → Full. Hello packets are exchanged first; neighbors must agree on Hello/Dead intervals, Area ID, and authentication before proceeding.',
  },

  {
    id: 'q029', domain: 3, type: 'input', difficulty: 'hard',
    question: 'What is the network address of the subnet containing 192.168.10.200/27?',
    answer: '192.168.10.192',
    explanation: '/27 mask = 255.255.255.224. Block size = 32. Subnets at .0, .32, .64, .96, .128, .160, .192, .224. Address .200 is in the .192 block (.192–.223). Network address = 192.168.10.192.',
  },

  {
    id: 'q030', domain: 3, type: 'single', difficulty: 'medium',
    question: 'OSPF Router ID selection order (highest priority FIRST)?',
    options: [
      { id: 'a', text: 'Loopback IP → Physical interface IP → Manual' },
      { id: 'b', text: 'Manual → Highest loopback IP → Highest active physical IP' },
      { id: 'c', text: 'Highest physical IP → Loopback IP → Manual' },
      { id: 'd', text: 'Manual → Lowest physical IP → Loopback IP' },
    ],
    correct: 'b',
    explanation: 'Priority: (1) "router-id x.x.x.x" command, (2) Highest loopback IP, (3) Highest active physical IP. Loopbacks preferred over physical because they never go down.',
  },

  {
    id: 'q031', domain: 3, type: 'single', difficulty: 'easy',
    question: 'Which command shows the routing table on a Cisco router?',
    options: [
      { id: 'a', text: 'show ip interface brief' },
      { id: 'b', text: 'show ip route' },
      { id: 'c', text: 'show running-config' },
      { id: 'd', text: 'show ip protocols' },
    ],
    correct: 'b',
    explanation: '"show ip route" displays all routes with source codes (C=Connected, S=Static, O=OSPF, etc.), AD, metric, and next-hop. Essential for troubleshooting routing.',
  },

  {
    id: 'q032', domain: 3, type: 'single', difficulty: 'medium',
    question: 'What does "S*" mean in a Cisco routing table?',
    options: [
      { id: 'a', text: 'A suspended static route' },
      { id: 'b', text: 'A static default route (gateway of last resort)' },
      { id: 'c', text: 'A summary static route' },
      { id: 'd', text: 'A static route redistributed from OSPF' },
    ],
    correct: 'b',
    explanation: 'S = static route. * = candidate default (gateway of last resort). Typically "ip route 0.0.0.0 0.0.0.0 [next-hop]". Used when no more-specific route exists.',
  },

  {
    id: 'q033', domain: 3, type: 'multi', difficulty: 'hard',
    question: 'Which THREE are required for OSPF neighbor adjacency? (Select 3)',
    options: [
      { id: 'a', text: 'Same Area ID' },
      { id: 'b', text: 'Same Router ID' },
      { id: 'c', text: 'Matching Hello and Dead timers' },
      { id: 'd', text: 'Connected to the same subnet' },
      { id: 'e', text: 'Same OSPF process ID' },
    ],
    correct: ['a', 'c', 'd'],
    explanation: 'OSPF neighbors need: same Area ID, matching Hello/Dead timers, same subnet, matching MTU, same authentication. Router IDs must be UNIQUE (not same). Process IDs are locally significant — they do NOT need to match.',
  },

  {
    id: 'q034', domain: 3, type: 'single', difficulty: 'medium',
    question: 'What is a floating static route?',
    options: [
      { id: 'a', text: 'A static route with a dynamically changing next-hop' },
      { id: 'b', text: 'A backup static route with higher AD, active only when the primary fails' },
      { id: 'c', text: 'A static route that moves between routing tables' },
      { id: 'd', text: 'A default route that follows the nearest OSPF neighbor' },
    ],
    correct: 'b',
    explanation: 'A floating static has its AD set higher than the primary protocol (e.g., 254 vs OSPF 110). It stays dormant while the primary route exists. When OSPF loses the route the static "floats" into the table as a backup.',
  },

  {
    id: 'q035', domain: 3, type: 'input', difficulty: 'hard',
    question: 'What is the broadcast address of 172.16.50.0/20?',
    answer: '172.16.63.255',
    explanation: '/20 = 255.255.240.0. Block = 16. Subnets: 172.16.0.0, 172.16.16.0, 172.16.32.0, 172.16.48.0, 172.16.64.0... Address 172.16.50.0 is in 172.16.48.0/20. Broadcast = 172.16.64.0 - 1 = 172.16.63.255.',
  },

  {
    id: 'q036', domain: 3, type: 'single', difficulty: 'hard',
    question: 'Routes exist: 192.168.1.0/24 via OSPF (AD 110), 192.168.1.0/24 via RIP (AD 120), 192.168.1.0/28 via OSPF (AD 110). Packet arrives for 192.168.1.10. Which route is selected?',
    options: [
      { id: 'a', text: '192.168.1.0/24 via OSPF' },
      { id: 'b', text: '192.168.1.0/24 via RIP' },
      { id: 'c', text: '192.168.1.0/28 via OSPF' },
      { id: 'd', text: 'Packet dropped — conflicting routes' },
    ],
    correct: 'c',
    explanation: 'Longest Prefix Match takes priority over Administrative Distance. /28 is more specific than /24 regardless of protocol or AD. LPM is evaluated first; AD only breaks ties between equal-length prefixes from different protocols.',
  },

  {
    id: 'q037', domain: 3, type: 'single', difficulty: 'medium',
    question: 'What is the OSPF metric called, and how is it calculated?',
    options: [
      { id: 'a', text: 'Hop count — number of routers to destination' },
      { id: 'b', text: 'Composite — bandwidth + delay + reliability + load' },
      { id: 'c', text: 'Cost — reference bandwidth / interface bandwidth' },
      { id: 'd', text: 'Latency — round-trip time in milliseconds' },
    ],
    correct: 'c',
    explanation: 'OSPF Cost = Reference BW / Interface BW. Default reference = 100 Mbps. FastEthernet = cost 1. Serial 1.544 Mbps ≈ cost 64. GigabitEthernet also = 1 unless reference BW is increased.',
  },

  {
    id: 'q038', domain: 3, type: 'single', difficulty: 'easy',
    question: 'Which IPv6 address type is equivalent to IPv4 RFC 1918 private addresses?',
    options: [
      { id: 'a', text: 'Link-local (FE80::/10)' },
      { id: 'b', text: 'Unique local (FC00::/7)' },
      { id: 'c', text: 'Global unicast (2000::/3)' },
      { id: 'd', text: 'Multicast (FF00::/8)' },
    ],
    correct: 'b',
    explanation: 'Unique local (FC00::/7, typically FD00::/8) = IPv4 private space. Link-local (FE80::/10) is single-link only. Global unicast (2000::/3) = public IPv4 equivalent.',
  },

  {
    id: 'q039', domain: 3, type: 'single', difficulty: 'medium',
    question: 'What replaces ARP in IPv6?',
    options: [
      { id: 'a', text: 'ICMPv6 Neighbor Solicitation / Neighbor Advertisement' },
      { id: 'b', text: 'DHCPv6' },
      { id: 'c', text: 'IPv6 uses the same ARP as IPv4' },
      { id: 'd', text: 'NDP Router Solicitation only' },
    ],
    correct: 'a',
    explanation: 'IPv6 NDP uses Neighbor Solicitation (NS) and Neighbor Advertisement (NA) ICMPv6 messages — the equivalent of ARP. NDP uses multicast instead of broadcast, making it more efficient.',
  },

  {
    id: 'q040', domain: 3, type: 'single', difficulty: 'hard',
    question: 'How many addresses are available in an IPv6 /64 subnet?',
    options: [
      { id: 'a', text: '2^32 - 2' },
      { id: 'b', text: '2^64 - 2' },
      { id: 'c', text: '2^64' },
      { id: 'd', text: '2^128' },
    ],
    correct: 'c',
    explanation: 'IPv6 /64 has 2^64 addresses in the host portion. Unlike IPv4, IPv6 does NOT subtract 2 — there is no broadcast. 2^64 ≈ 18.4 quintillion addresses per subnet.',
  },

  {
    id: 'q041', domain: 3, type: 'order', difficulty: 'hard',
    question: 'Place router packet-forwarding steps in correct order (first → last):',
    items: [
      { id: 'receive',   text: 'Receive frame, strip Layer 2 header' },
      { id: 'lookup',    text: 'Longest Prefix Match lookup in routing table' },
      { id: 'decrement', text: 'Decrement TTL, recalculate header checksum' },
      { id: 'arp',       text: 'ARP for next-hop MAC if not cached' },
      { id: 'forward',   text: 'Re-encapsulate in new frame and transmit' },
    ],
    correct: ['receive', 'lookup', 'decrement', 'arp', 'forward'],
    explanation: '(1) Strip incoming L2. (2) LPM to find exit interface/next-hop. (3) Decrement TTL (drop if 0, send ICMP Time Exceeded). (4) Resolve next-hop MAC via ARP. (5) Re-encapsulate and transmit.',
  },

  {
    id: 'q042', domain: 3, type: 'single', difficulty: 'medium',
    question: 'What is the OSPF default Hello interval on an Ethernet (broadcast) network?',
    options: [
      { id: 'a', text: '5 seconds' },
      { id: 'b', text: '10 seconds' },
      { id: 'c', text: '30 seconds' },
      { id: 'd', text: '60 seconds' },
    ],
    correct: 'b',
    explanation: 'OSPF Hello: 10s on broadcast/point-to-point. 30s on NBMA. Dead interval = 4x Hello (40s broadcast). Mismatched timers prevent neighbor adjacency.',
  },

  // ══════════════════════════════════════════════
  //  DOMAIN 4 — IP SERVICES  (7 Qs)
  // ══════════════════════════════════════════════

  {
    id: 'q043', domain: 4, type: 'single', difficulty: 'easy',
    question: 'What is the first message a DHCP client sends to find a server?',
    options: [
      { id: 'a', text: 'DHCP Request' },
      { id: 'b', text: 'DHCP Offer' },
      { id: 'c', text: 'DHCP Discover' },
      { id: 'd', text: 'DHCP Acknowledge' },
    ],
    correct: 'c',
    explanation: 'DHCP DORA: (1) Discover — client broadcasts to find servers. (2) Offer — server proposes an IP. (3) Request — client requests the offered IP. (4) Acknowledge — server confirms. Discover and Request are broadcasts.',
  },

  {
    id: 'q044', domain: 4, type: 'single', difficulty: 'medium',
    question: 'What does NAT overload (PAT) do?',
    options: [
      { id: 'a', text: '1:1 mapping of private to public IP' },
      { id: 'b', text: 'Maps many private IPs to one public IP using unique source port numbers' },
      { id: 'c', text: 'Maps a pool of private IPs to a pool of public IPs' },
      { id: 'd', text: 'Static mapping for public access to a private server' },
    ],
    correct: 'b',
    explanation: 'PAT allows thousands of internal hosts to share one public IP by differentiating sessions via unique source ports. The router tracks [private IP:port] ↔ [public IP:unique port] in a translation table.',
  },

  {
    id: 'q045', domain: 4, type: 'single', difficulty: 'medium',
    question: 'Which NTP stratum level indicates a device directly connected to an atomic clock or GPS?',
    options: [
      { id: 'a', text: 'Stratum 0' },
      { id: 'b', text: 'Stratum 1' },
      { id: 'c', text: 'Stratum 2' },
      { id: 'd', text: 'Stratum 15' },
    ],
    correct: 'b',
    explanation: 'Stratum 0 = the reference clock (GPS/atomic — not on the network). Stratum 1 = server directly connected to stratum 0. Each subsequent level adds 1. Stratum 16 = unsynchronized.',
  },

  {
    id: 'q046', domain: 4, type: 'single', difficulty: 'hard',
    question: '"ip helper-address 10.1.1.100" on router interface Gi0/0 does what?',
    options: [
      { id: 'a', text: 'Sets 10.1.1.100 as the default gateway for Gi0/0 hosts' },
      { id: 'b', text: 'Forwards DHCP broadcasts from Gi0/0 as unicast to the DHCP server at 10.1.1.100' },
      { id: 'c', text: 'Creates a static ARP entry for 10.1.1.100' },
      { id: 'd', text: 'Configures Gi0/0 as a DHCP server using the 10.1.1.100 pool' },
    ],
    correct: 'b',
    explanation: '"ip helper-address" = DHCP relay. Converts client DHCP broadcasts into unicast forwarded to the DHCP server — necessary when server and clients are on different subnets (routers block broadcasts by default).',
  },

  {
    id: 'q047', domain: 4, type: 'single', difficulty: 'medium',
    question: 'Which First Hop Redundancy Protocol (FHRP) is Cisco proprietary?',
    options: [
      { id: 'a', text: 'VRRP' },
      { id: 'b', text: 'GLBP' },
      { id: 'c', text: 'HSRP' },
      { id: 'd', text: 'OSPF ECMP' },
    ],
    correct: 'c',
    explanation: 'HSRP (Hot Standby Router Protocol) is Cisco proprietary. VRRP (RFC 5798) is the open standard. GLBP is also Cisco but adds load balancing. FHRPs provide a virtual IP/MAC so hosts\' default gateway remains reachable if the active router fails.',
  },

  {
    id: 'q048', domain: 4, type: 'input', difficulty: 'easy',
    question: 'What UDP port do DHCP clients use to SEND DHCP messages?',
    answer: '68',
    explanation: 'DHCP uses UDP 67 (server) and 68 (client). Client sends from port 68 to destination port 67 on 255.255.255.255. The "ip helper-address" command relays these UDP 67/68 broadcasts.',
  },

  {
    id: 'q049', domain: 4, type: 'single', difficulty: 'medium',
    question: 'What SNMP message type proactively notifies the manager of an event WITHOUT polling?',
    options: [
      { id: 'a', text: 'SNMP Get' },
      { id: 'b', text: 'SNMP Set' },
      { id: 'c', text: 'SNMP Trap' },
      { id: 'd', text: 'SNMP Walk' },
    ],
    correct: 'c',
    explanation: 'SNMP Traps are unsolicited notifications from an agent to the NMS when significant events occur (link down, high CPU). Unlike polling (Get), traps fire immediately enabling faster response.',
  },

  // ══════════════════════════════════════════════
  //  DOMAIN 5 — SECURITY FUNDAMENTALS  (9 Qs)
  // ══════════════════════════════════════════════

  {
    id: 'q050', domain: 5, type: 'single', difficulty: 'easy',
    question: 'Which ACL type should be placed CLOSEST to the traffic source?',
    options: [
      { id: 'a', text: 'Standard ACL' },
      { id: 'b', text: 'Extended ACL' },
      { id: 'c', text: 'Named ACL' },
      { id: 'd', text: 'Dynamic ACL' },
    ],
    correct: 'b',
    explanation: 'Extended ACLs filter on src/dst IP, protocol, and port — they can be precise. Place near the SOURCE to drop unwanted traffic early. Standard ACLs (src IP only) should be near the DESTINATION to avoid blocking valid traffic.',
  },

  {
    id: 'q051', domain: 5, type: 'single', difficulty: 'medium',
    question: 'What is the implicit rule at the end of every Cisco ACL?',
    options: [
      { id: 'a', text: 'Permit any any' },
      { id: 'b', text: 'Deny any any' },
      { id: 'c', text: 'Log all remaining traffic' },
      { id: 'd', text: 'Forward remaining traffic to default gateway' },
    ],
    correct: 'b',
    explanation: 'Every ACL ends with an invisible "deny any any". Traffic not matched by an explicit permit is dropped. If you forget to permit return traffic, connections break silently.',
  },

  {
    id: 'q052', domain: 5, type: 'single', difficulty: 'medium',
    question: 'Which protocol should replace Telnet for secure encrypted device management?',
    options: [
      { id: 'a', text: 'SNMP v3' },
      { id: 'b', text: 'HTTPS' },
      { id: 'c', text: 'SSH' },
      { id: 'd', text: 'FTP' },
    ],
    correct: 'c',
    explanation: 'SSH encrypts all session data including credentials. Telnet sends everything in cleartext. To enable SSH: set hostname and domain, generate RSA keys, configure VTY lines with "transport input ssh".',
  },

  {
    id: 'q053', domain: 5, type: 'single', difficulty: 'hard',
    question: 'What attack floods a switch with random source MACs to fill the CAM table and cause it to broadcast all traffic?',
    options: [
      { id: 'a', text: 'VLAN hopping' },
      { id: 'b', text: 'MAC address spoofing' },
      { id: 'c', text: 'MAC flooding (CAM table overflow)' },
      { id: 'd', text: 'ARP poisoning' },
    ],
    correct: 'c',
    explanation: 'MAC flooding fills the CAM table with fake entries. The switch can no longer learn new MACs and reverts to flooding all frames out all ports — allowing the attacker to sniff traffic. Mitigation: Port Security (limit MACs per port).',
  },

  {
    id: 'q054', domain: 5, type: 'single', difficulty: 'medium',
    question: 'What does Port Security "sticky" MAC learning do?',
    options: [
      { id: 'a', text: 'Permanently err-disables the port on violation' },
      { id: 'b', text: 'Dynamically learns MACs and saves them as static secure entries in the running config' },
      { id: 'c', text: 'Permanently locks speed and duplex settings' },
      { id: 'd', text: 'Binds the VLAN assignment permanently to the port' },
    ],
    correct: 'b',
    explanation: 'Sticky learning converts dynamically learned MACs into static secure entries in the running configuration. Save the config and they persist across reboots — no manual entry needed.',
  },

  {
    id: 'q055', domain: 5, type: 'multi', difficulty: 'hard',
    question: 'Which TWO are valid Port Security violation modes? (Select 2)',
    options: [
      { id: 'a', text: 'Protect — drop frames silently, no notification' },
      { id: 'b', text: 'Quarantine — move port to a quarantine VLAN' },
      { id: 'c', text: 'Shutdown — err-disable the port (default)' },
      { id: 'd', text: 'Block — block the offending MAC only' },
    ],
    correct: ['a', 'c'],
    explanation: 'Three valid modes: Protect (drop, no log), Restrict (drop + SNMP trap + counter increment), Shutdown (err-disable — default). Quarantine and Block are not valid Cisco Port Security modes.',
  },

  {
    id: 'q056', domain: 5, type: 'single', difficulty: 'medium',
    question: 'What does DHCP snooping prevent?',
    options: [
      { id: 'a', text: 'Clients receiving IPs too quickly' },
      { id: 'b', text: 'Rogue DHCP servers from assigning incorrect configuration to clients' },
      { id: 'c', text: 'DHCP traffic crossing VLAN boundaries' },
      { id: 'd', text: 'DHCP exhaustion by rate-limiting requests' },
    ],
    correct: 'b',
    explanation: 'DHCP snooping marks uplink ports as trusted (can send Offer/Ack) and access ports as untrusted (can only send Discover/Request). Rogue DHCP servers on untrusted ports are silently dropped.',
  },

  {
    id: 'q057', domain: 5, type: 'single', difficulty: 'hard',
    question: 'Which WPA3 feature provides forward secrecy by using a unique key per session?',
    options: [
      { id: 'a', text: 'CCMP' },
      { id: 'b', text: 'SAE (Simultaneous Authentication of Equals)' },
      { id: 'c', text: 'TKIP' },
      { id: 'd', text: 'PSK' },
    ],
    correct: 'b',
    explanation: 'WPA3\'s SAE (Dragonfly handshake) replaces WPA2 PSK. Each session derives a unique key — compromising the password later cannot decrypt previously captured traffic. WPA2 PSK is vulnerable to offline dictionary attacks.',
  },

  {
    id: 'q058', domain: 5, type: 'single', difficulty: 'medium',
    question: 'What is the purpose of Dynamic ARP Inspection (DAI)?',
    options: [
      { id: 'a', text: 'Cache ARP entries longer to improve performance' },
      { id: 'b', text: 'Validate ARP packets against the DHCP snooping binding table to prevent ARP spoofing' },
      { id: 'c', text: 'Dynamically assign ARP entries using DHCP' },
      { id: 'd', text: 'Block all ARP on untrusted ports' },
    ],
    correct: 'b',
    explanation: 'DAI intercepts ARP packets on untrusted ports and validates MAC-to-IP mappings against the DHCP snooping binding table. Mismatches are dropped — preventing ARP poisoning where an attacker maps their MAC to another host\'s IP.',
  },

  // ══════════════════════════════════════════════
  //  DOMAIN 6 — AUTOMATION & PROGRAMMABILITY  (7 Qs)
  // ══════════════════════════════════════════════

  {
    id: 'q059', domain: 6, type: 'single', difficulty: 'easy',
    question: 'Which data format is most commonly returned by REST APIs in network automation?',
    options: [
      { id: 'a', text: 'XML' },
      { id: 'b', text: 'CSV' },
      { id: 'c', text: 'JSON' },
      { id: 'd', text: 'YAML' },
    ],
    correct: 'c',
    explanation: 'JSON is dominant for REST API responses — human-readable, lightweight, natively supported in most languages. YANG models can use JSON or XML for RESTCONF/NETCONF encoding.',
  },

  {
    id: 'q060', domain: 6, type: 'single', difficulty: 'medium',
    question: 'What is the key difference between SDN and traditional networking?',
    options: [
      { id: 'a', text: 'SDN uses only Layer 2 switching' },
      { id: 'b', text: 'Traditional networks have a centralized control plane; SDN distributes it' },
      { id: 'c', text: 'SDN separates the control plane from the data plane; control plane is centralized in a controller' },
      { id: 'd', text: 'SDN cannot use physical hardware' },
    ],
    correct: 'c',
    explanation: 'Traditional: each device has its own control + data plane. SDN: control plane centralized in a controller which programs forwarding rules into devices via southbound APIs (e.g., OpenFlow). Devices focus on fast data plane forwarding only.',
  },

  {
    id: 'q061', domain: 6, type: 'single', difficulty: 'medium',
    question: 'Which automation tool uses YAML playbooks and is agentless?',
    options: [
      { id: 'a', text: 'Puppet' },
      { id: 'b', text: 'Chef' },
      { id: 'c', text: 'Ansible' },
      { id: 'd', text: 'SaltStack' },
    ],
    correct: 'c',
    explanation: 'Ansible is agentless — connects via SSH or APIs, no software needed on managed devices. Playbooks written in YAML. Puppet and Chef require agents installed on managed nodes.',
  },

  {
    id: 'q062', domain: 6, type: 'single', difficulty: 'easy',
    question: 'What does REST stand for?',
    options: [
      { id: 'a', text: 'Remote Execution Standard Technology' },
      { id: 'b', text: 'Representational State Transfer' },
      { id: 'c', text: 'Routing and Encapsulation Standard Technology' },
      { id: 'd', text: 'Remote Endpoint State Transmission' },
    ],
    correct: 'b',
    explanation: 'REST = Representational State Transfer. An architectural style for APIs using HTTP methods: GET (read), POST (create), PUT (replace), PATCH (partial update), DELETE (remove). RESTful APIs are stateless.',
  },

  {
    id: 'q063', domain: 6, type: 'single', difficulty: 'hard',
    question: 'What is YANG used for in network automation?',
    options: [
      { id: 'a', text: 'A scripting language for automation scripts' },
      { id: 'b', text: 'A data modeling language defining structure and constraints of network configuration data' },
      { id: 'c', text: 'A protocol for transferring configuration between devices' },
      { id: 'd', text: 'A replacement for SNMP MIBs' },
    ],
    correct: 'b',
    explanation: 'YANG (RFC 6020) is a data modeling language — it defines what data a device exposes, its structure, types, and constraints. NETCONF and RESTCONF use YANG models to validate data. Think of it as the schema for network automation.',
  },

  {
    id: 'q064', domain: 6, type: 'multi', difficulty: 'hard',
    question: 'Which TWO are characteristics of Cisco DNA Center? (Select 2)',
    options: [
      { id: 'a', text: 'Provides intent-based networking with policy automation' },
      { id: 'b', text: 'Requires all devices to run open-source firmware' },
      { id: 'c', text: 'AI/ML-driven network assurance and analytics' },
      { id: 'd', text: 'Only manages Cisco Catalyst switches' },
    ],
    correct: ['a', 'c'],
    explanation: 'Cisco DNA Center: intent-based networking (define desired state, it figures out config), automated policy enforcement, and AI/ML-driven assurance to identify anomalies and predict issues. Works across multiple Cisco platforms.',
  },

  {
    id: 'q065', domain: 6, type: 'single', difficulty: 'medium',
    question: 'Which HTTP method retrieves data from a REST API without modifying anything?',
    options: [
      { id: 'a', text: 'POST' },
      { id: 'b', text: 'PUT' },
      { id: 'c', text: 'GET' },
      { id: 'd', text: 'DELETE' },
    ],
    correct: 'c',
    explanation: 'GET = read only (safe + idempotent). POST = create. PUT = replace. PATCH = partial update. DELETE = remove. In RESTCONF: GET retrieves config/operational state without any modification.',
  },

];

// ══════════════════════════════════════════════════════════════════════════
//  ADDITIONAL QUESTIONS FOR EXPANDED BANK
// ══════════════════════════════════════════════════════════════════════════

const ADDITIONAL_QUESTIONS = [
  // Domain 1 - Network Fundamentals (Additional)
  {
    id: 'q066', domain: 1, type: 'single', difficulty: 'easy',
    question: 'How many bits are in an IPv4 address?',
    options: [
      { id: 'a', text: '32 bits' },
      { id: 'b', text: '64 bits' },
      { id: 'c', text: '128 bits' },
      { id: 'd', text: '256 bits' },
    ],
    correct: 'a',
    explanation: 'IPv4 uses 32-bit addresses, represented as 4 octets (8 bits each) in dotted-decimal notation (e.g., 192.168.1.1).',
  },
  {
    id: 'q067', domain: 1, type: 'single', difficulty: 'easy',
    question: 'Which device operates at Layer 3 of the OSI model?',
    options: [
      { id: 'a', text: 'Switch' },
      { id: 'b', text: 'Router' },
      { id: 'c', text: 'Hub' },
      { id: 'd', text: 'Bridge' },
    ],
    correct: 'b',
    explanation: 'Routers operate at Layer 3 (Network layer) and make forwarding decisions based on IP addresses. Switches are typically Layer 2, while hubs and repeaters are Layer 1.',
  },
  {
    id: 'q068', domain: 1, type: 'single', difficulty: 'medium',
    question: 'What is the purpose of the subnet mask?',
    options: [
      { id: 'a', text: 'To encrypt network traffic' },
      { id: 'b', text: 'To identify the network and host portions of an IP address' },
      { id: 'c', text: 'To assign IP addresses automatically' },
      { id: 'd', text: 'To translate private IPs to public IPs' },
    ],
    correct: 'b',
    explanation: 'A subnet mask is a 32-bit number that divides an IP address into network and host portions. It determines which part of the IP address identifies the network and which identifies the host.',
  },
  {
    id: 'q069', domain: 1, type: 'multi', difficulty: 'medium',
    question: 'Which of the following are benefits of VLANs? (Select 3)',
    options: [
      { id: 'a', text: 'Improved security by isolating broadcast domains' },
      { id: 'b', text: 'Reduced network congestion' },
      { id: 'c', text: 'Increased number of available IP addresses' },
      { id: 'd', text: 'Simplified network management and troubleshooting' },
    ],
    correct: ['a', 'b', 'd'],
    explanation: 'VLANs improve security by isolating traffic, reduce broadcast traffic (congestion), and simplify management. They do not increase available IPs — that depends on the subnet size.',
  },
  {
    id: 'q070', domain: 1, type: 'single', difficulty: 'hard',
    question: 'What is the default administrative distance for a directly connected network in Cisco IOS?',
    options: [
      { id: 'a', text: '0' },
      { id: 'b', text: '1' },
      { id: 'c', text: '90' },
      { id: 'd', text: '110' },
    ],
    correct: 'a',
    explanation: 'Directly connected networks have an AD of 0. Static routes have AD of 1. Other protocols have higher ADs (EIGRP 90, OSPF 110, RIP 120).',
  },

  // Domain 2 - Network Access (Additional)
  {
    id: 'q071', domain: 2, type: 'single', difficulty: 'easy',
    question: 'What does the term "full-duplex" mean?',
    options: [
      { id: 'a', text: 'Data can flow in only one direction at a time' },
      { id: 'b', text: 'Data can flow in both directions simultaneously' },
      { id: 'c', text: 'Data flows at maximum speed of the slowest device' },
      { id: 'd', text: 'Only one device can transmit at a time' },
    ],
    correct: 'b',
    explanation: 'Full-duplex allows simultaneous bidirectional communication. Half-duplex allows communication in only one direction at a time. Full-duplex eliminates collisions.',
  },
  {
    id: 'q072', domain: 2, type: 'single', difficulty: 'medium',
    question: 'Which VLAN trunking protocol adds VLAN information to frames?',
    options: [
      { id: 'a', text: 'STP' },
      { id: 'b', text: 'VTP' },
      { id: 'c', text: 'ISL' },
      { id: 'd', text: 'DTP' },
    ],
    correct: 'c',
    explanation: 'ISL (Inter-Switch Link) is a Cisco proprietary trunking protocol that encapsulates frames with a VLAN header. IEEE 802.1Q is the modern standard that adds a 4-byte tag.',
  },
  {
    id: 'q073', domain: 2, type: 'single', difficulty: 'hard',
    question: 'What is the purpose of PortFast on a Cisco switch?',
    options: [
      { id: 'a', text: 'To enable rapid spanning tree convergence on access ports' },
      { id: 'b', text: 'To increase VLAN trunking speed' },
      { id: 'c', text: 'To prioritize traffic on specific ports' },
      { id: 'd', text: 'To enable port security faster' },
    ],
    correct: 'a',
    explanation: 'PortFast bypasses the normal STP listening/learning states on access ports, allowing them to transition to forwarding immediately. Used for connected devices like servers or workstations.',
  },
  {
    id: 'q074', domain: 2, type: 'single', difficulty: 'medium',
    question: 'Which command on a Cisco switch displays the MAC address table?',
    options: [
      { id: 'a', text: 'show mac-address-table' },
      { id: 'b', text: 'show mac address-table' },
      { id: 'c', text: 'show cam' },
      { id: 'd', text: 'display mac-table' },
    ],
    correct: 'b',
    explanation: 'The command "show mac address-table" displays the MAC address table (also called CAM table) on Cisco switches. Other options may work on different vendors.',
  },
  {
    id: 'q075', domain: 2, type: 'multi', difficulty: 'hard',
    question: 'Which statements about EtherChannel are true? (Select 2)',
    options: [
      { id: 'a', text: 'EtherChannel bundles multiple physical links into one logical link' },
      { id: 'b', text: 'EtherChannel only works with LACP protocol' },
      { id: 'c', text: 'EtherChannel provides increased bandwidth and redundancy' },
      { id: 'd', text: 'All ports in an EtherChannel must have the same speed and duplex' },
    ],
    correct: ['a', 'c'],
    explanation: 'EtherChannel bundles multiple physical links (up to 8) into one logical link for increased bandwidth. It provides redundancy — if one link fails, traffic uses remaining links. Ports must match in speed/duplex but PAgP and LACP are both supported.',
  },

  // Domain 3 - IP Connectivity (Additional)
  {
    id: 'q076', domain: 3, type: 'single', difficulty: 'easy',
    question: 'What is the default gateway?',
    options: [
      { id: 'a', text: 'The first IP address in a subnet' },
      { id: 'b', text: 'The router interface used to forward traffic to remote networks' },
      { id: 'c', text: 'The DNS server address' },
      { id: 'd', text: 'The last IP address in a subnet' },
    ],
    correct: 'b',
    explanation: 'The default gateway is the IP address of the router interface on the local network. When a host needs to communicate with a remote destination, it sends the packet to the default gateway.',
  },
  {
    id: 'q077', domain: 3, type: 'single', difficulty: 'medium',
    question: 'Which routing protocol uses cost as its metric?',
    options: [
      { id: 'a', text: 'RIP' },
      { id: 'b', text: 'EIGRP' },
      { id: 'c', text: 'OSPF' },
      { id: 'd', text: 'BGP' },
    ],
    correct: 'c',
    explanation: 'OSPF uses cost (based on bandwidth) as its metric. RIP uses hop count, EIGRP uses a composite metric, and BGP uses path attributes.',
  },
  {
    id: 'q078', domain: 3, type: 'single', difficulty: 'hard',
    question: 'What is split horizon in routing?',
    options: [
      { id: 'a', text: 'A method to prevent routing loops by not advertising routes back out the interface they were learned from' },
      { id: 'b', text: 'A technique to divide a large network into smaller subnets' },
      { id: 'c', text: 'A load balancing mechanism across equal-cost paths' },
      { id: 'd', text: 'A way to authenticate routing updates' },
    ],
    correct: 'a',
    explanation: 'Split horizon is a loop prevention mechanism that prevents a router from advertising a route back out the same interface it learned the route from. This prevents routing loops in distance vector protocols.',
  },
  {
    id: 'q079', domain: 3, type: 'input', difficulty: 'hard',
    question: 'How many usable host addresses are available in a /26 subnet?',
    options: [],
    correct: '',
    answer: '62',
    explanation: 'A /26 has 64 total addresses (2^(32-26) = 2^6 = 64). Usable hosts = 64 - 2 (network and broadcast) = 62. The usable range depends on the subnet assignment.',
  },
  {
    id: 'q080', domain: 3, type: 'single', difficulty: 'medium',
    question: 'What is the purpose of the TTL field in an IP packet?',
    options: [
      { id: 'a', text: 'To specify the packet priority' },
      { id: 'b', text: 'To prevent packets from circulating endlessly in the network' },
      { id: 'c', text: 'To indicate the packet length' },
      { id: 'd', text: 'To identify the transport layer protocol' },
    ],
    correct: 'b',
    explanation: 'TTL (Time To Live) is an 8-bit field that limits a packet\'s lifespan. Each router decrements the TTL by 1. When TTL reaches 0, the packet is discarded. This prevents routing loops from endlessly circulating packets.',
  },

  // Domain 4 - IP Services (Additional)
  {
    id: 'q081', domain: 4, type: 'single', difficulty: 'easy',
    question: 'What does DHCP stand for?',
    options: [
      { id: 'a', text: 'Dynamic Host Configuration Protocol' },
      { id: 'b', text: 'Direct Host Control Protocol' },
      { id: 'c', text: 'Data Host Communication Protocol' },
      { id: 'd', text: 'Dynamic Hypertext Control Protocol' },
    ],
    correct: 'a',
    explanation: 'DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses, subnet masks, default gateways, and other network configuration to hosts.',
  },
  {
    id: 'q082', domain: 4, type: 'single', difficulty: 'medium',
    question: 'Which port numbers does DHCP use?',
    options: [
      { id: 'a', text: '53 and 80' },
      { id: 'b', text: '67 and 68' },
      { id: 'c', text: '161 and 162' },
      { id: 'd', text: '20 and 21' },
    ],
    correct: 'b',
    explanation: 'DHCP uses UDP port 67 (server) and port 68 (client). The client broadcasts on port 68 to find a server, which responds on port 67.',
  },
  {
    id: 'q083', domain: 4, type: 'single', difficulty: 'medium',
    question: 'What is NAT used for?',
    options: [
      { id: 'a', text: 'To encrypt network traffic' },
      { id: 'b', text: 'To translate private IP addresses to public IP addresses' },
      { id: 'c', text: 'To assign MAC addresses to devices' },
      { id: 'd', text: 'To route packets between VLANs' },
    ],
    correct: 'b',
    explanation: 'NAT (Network Address Translation) translates private IP addresses (RFC 1918) to public IP addresses, allowing multiple devices to share a public IP address for internet access.',
  },
  {
    id: 'q084', domain: 4, type: 'single', difficulty: 'hard',
    question: 'What are the three types of NAT?',
    options: [
      { id: 'a', text: 'Static, Dynamic, and PAT' },
      { id: 'b', text: 'Basic, Advanced, and Complex' },
      { id: 'c', text: 'Inside, Outside, and Mixed' },
      { id: 'd', text: 'Public, Private, and Hybrid' },
    ],
    correct: 'a',
    explanation: 'NAT has three types: Static NAT (one-to-one mapping), Dynamic NAT (pool of public IPs), and PAT (Port Address Translation / NAT overload - many private to one public using port numbers).',
  },
  {
    id: 'q085', domain: 4, type: 'multi', difficulty: 'hard',
    question: 'Which are benefits of using HSRP or VRRP? (Select 2)',
    options: [
      { id: 'a', text: 'Provides default gateway redundancy' },
      { id: 'b', text: 'Increases bandwidth by bonding interfaces' },
      { id: 'c', text: 'Offers automatic failover if primary router fails' },
      { id: 'd', text: 'Encrypts traffic between routers' },
    ],
    correct: ['a', 'c'],
    explanation: 'HSRP (Hot Standby Router Protocol) and VRRP (Virtual Router Redundancy Protocol) provide default gateway redundancy. If the primary router fails, a standby router takes over automatically.',
  },

  // Domain 5 - Security Fundamentals (Additional)
  {
    id: 'q086', domain: 5, type: 'single', difficulty: 'easy',
    question: 'What is the purpose of a firewall?',
    options: [
      { id: 'a', text: 'To speed up network traffic' },
      { id: 'b', text: 'To filter and control network traffic based on security rules' },
      { id: 'c', text: 'To translate IP addresses' },
      { id: 'd', text: 'To assign IP addresses to hosts' },
    ],
    correct: 'b',
    explanation: 'A firewall monitors and filters incoming and outgoing network traffic based on predefined security rules. It establishes a barrier between trusted internal networks and untrusted external networks.',
  },
  {
    id: 'q087', domain: 5, type: 'single', difficulty: 'medium',
    question: 'What does AAA stand for in network security?',
    options: [
      { id: 'a', text: 'Authentication, Authorization, and Accounting' },
      { id: 'b', text: 'Access, Authorization, and Accounting' },
      { id: 'c', text: 'Authentication, Access, and Auditing' },
      { id: 'd', text: 'Advanced Authentication and Authorization' },
    ],
    correct: 'a',
    explanation: 'AAA is a framework for controlling who is permitted to use network resources (Authentication), what they can do (Authorization), and tracking their actions (Accounting/Auditing).',
  },
  {
    id: 'q088', domain: 5, type: 'single', difficulty: 'hard',
    question: 'What is the difference between IPsec tunnel mode and transport mode?',
    options: [
      { id: 'a', text: 'Tunnel mode encrypts the entire original IP packet; transport mode encrypts only the payload' },
      { id: 'b', text: 'Transport mode is faster than tunnel mode' },
      { id: 'c', text: 'Tunnel mode is used only within a LAN' },
      { id: 'd', text: 'There is no difference' },
    ],
    correct: 'a',
    explanation: 'IPsec Tunnel mode encapsulates the entire original IP packet (including header) and adds a new IP header. Transport mode only encrypts the payload (data), leaving the original IP header visible.',
  },
  {
    id: 'q089', domain: 5, type: 'single', difficulty: 'medium',
    question: 'What type of attack floods a network with fake traffic to make services unavailable?',
    options: [
      { id: 'a', text: 'Phishing' },
      { id: 'b', text: 'Man-in-the-middle' },
      { id: 'c', text: 'Denial of Service (DoS)' },
      { id: 'd', text: 'SQL Injection' },
    ],
    correct: 'c',
    explanation: 'A Denial of Service (DoS) attack floods a network or service with traffic or requests, making it unavailable to legitimate users. DDoS uses multiple sources.',
  },
  {
    id: 'q090', domain: 5, type: 'multi', difficulty: 'hard',
    question: 'Which are methods to secure VTY lines on a Cisco router? (Select 2)',
    options: [
      { id: 'a', text: 'Use ACLs to restrict which IPs can connect' },
      { id: 'b', text: 'Enable SSH instead of Telnet' },
      { id: 'c', text: 'Use the same password for all VTY lines' },
      { id: 'd', text: 'Set a login and login local command' },
    ],
    correct: ['a', 'b'],
    explanation: 'VTY lines should be secured with ACLs to limit access, use SSH (encrypted) instead of Telnet (clear text), and configure proper login. Using the same password or weak security is not recommended.',
  },

  // Domain 6 - Automation (Additional)
  {
    id: 'q091', domain: 6, type: 'single', difficulty: 'easy',
    question: 'What does the "programmability" feature of modern switches allow?',
    options: [
      { id: 'a', text: 'Manual configuration only' },
      { id: 'b', text: 'Configuration and management through software APIs' },
      { id: 'c', text: 'Hardware programming' },
      { id: 'd', text: 'Wireless programming' },
    ],
    correct: 'b',
    explanation: 'Programmability allows network devices to be configured, managed, and controlled through software APIs (like RESTCONF, NETCONF) rather than just CLI commands.',
  },
  {
    id: 'q092', domain: 6, type: 'single', difficulty: 'medium',
    question: 'Which protocol is used for network automation to manage network devices?',
    options: [
      { id: 'a', text: 'HTTP only' },
      { id: 'b', text: 'NETCONF' },
      { id: 'c', text: 'FTP' },
      { id: 'd', text: 'SMTP' },
    ],
    correct: 'b',
    explanation: 'NETCONF (Network Configuration Protocol) is an RFC 6241 protocol for installing, manipulating, and deleting the configuration of network devices over RESTful APIs.',
  },
  {
    id: 'q093', domain: 6, type: 'single', difficulty: 'hard',
    question: 'What is the primary benefit of Cisco DNA Center compared to traditional network management?',
    options: [
      { id: 'a', text: 'Manual device-by-device configuration' },
      { id: 'b', text: 'Intent-based networking with automated policy deployment' },
      { id: 'c', text: 'Requires more CLI commands' },
      { id: 'd', text: 'Only works with one device at a time' },
    ],
    correct: 'b',
    explanation: 'DNA Center provides Intent-Based Networking: you define business intent (what you want), and the system automatically translates it into device configurations across the network.',
  },
  {
    id: 'q094', domain: 6, type: 'single', difficulty: 'medium',
    question: 'What format do Ansible playbooks use?',
    options: [
      { id: 'a', text: 'JSON' },
      { id: 'b', text: 'XML' },
      { id: 'c', text: 'YAML' },
      { id: 'd', text: 'Python' },
    ],
    correct: 'c',
    explanation: 'Ansible playbooks are written in YAML (YAML Ain\'t Markup Language), which is human-readable. This makes automation scripts easier to write and understand.',
  },
  {
    id: 'q095', domain: 6, type: 'input', difficulty: 'hard',
    question: 'What is the Cisco proprietary protocol that is an alternative to RESTCONF for network automation?',
    options: [],
    correct: '',
    answer: 'NETCONF',
    explanation: 'While RESTCONF is a RESTful protocol built on HTTP, NETCONF (RFC 6241) is a Cisco-promoted protocol that uses XML and operates over SSH. Both are used for network automation but NETCONF was developed earlier.',
  },

  // Domain 1 - Network Fundamentals (Full practice expansion)
  {
    id: 'q096', domain: 1, type: 'single', difficulty: 'easy',
    question: 'Which OSI layer uses frames as its protocol data unit?',
    options: [
      { id: 'a', text: 'Physical' },
      { id: 'b', text: 'Data Link' },
      { id: 'c', text: 'Network' },
      { id: 'd', text: 'Transport' },
    ],
    correct: 'b',
    explanation: 'The Data Link layer encapsulates packets into frames for local delivery on a single link. The Network layer uses packets, Transport uses segments/datagrams, and Physical transmits bits.',
  },
  {
    id: 'q097', domain: 1, type: 'single', difficulty: 'medium',
    question: 'Which Ethernet media is typically preferred for long-distance building-to-building links?',
    options: [
      { id: 'a', text: 'Single-mode fiber' },
      { id: 'b', text: 'Category 5e UTP only' },
      { id: 'c', text: 'Coaxial cable' },
      { id: 'd', text: 'Console rollover cable' },
    ],
    correct: 'a',
    explanation: 'Single-mode fiber supports much longer distances than copper UTP and is commonly used for campus and service-provider style links between buildings.',
  },
  {
    id: 'q098', domain: 1, type: 'single', difficulty: 'easy',
    question: 'How many bits are in a standard Ethernet MAC address?',
    options: [
      { id: 'a', text: '32 bits' },
      { id: 'b', text: '48 bits' },
      { id: 'c', text: '64 bits' },
      { id: 'd', text: '128 bits' },
    ],
    correct: 'b',
    explanation: 'Ethernet MAC addresses are 48 bits, normally written as 12 hexadecimal digits such as 00:11:22:33:44:55.',
  },
  {
    id: 'q099', domain: 1, type: 'single', difficulty: 'medium',
    question: 'Which device primarily separates broadcast domains by default?',
    options: [
      { id: 'a', text: 'Hub' },
      { id: 'b', text: 'Layer 2 switch' },
      { id: 'c', text: 'Router' },
      { id: 'd', text: 'Repeater' },
    ],
    correct: 'c',
    explanation: 'Routers separate broadcast domains. A Layer 2 switch forwards broadcasts within the same VLAN unless routing or VLAN boundaries are introduced.',
  },
  {
    id: 'q100', domain: 1, type: 'single', difficulty: 'easy',
    question: 'How many bits are in an IPv6 address?',
    options: [
      { id: 'a', text: '32 bits' },
      { id: 'b', text: '48 bits' },
      { id: 'c', text: '64 bits' },
      { id: 'd', text: '128 bits' },
    ],
    correct: 'd',
    explanation: 'IPv6 addresses are 128 bits long, represented as eight groups of hexadecimal values separated by colons.',
  },
  {
    id: 'q101', domain: 1, type: 'single', difficulty: 'medium',
    question: 'Which cloud service model gives the customer virtual machines, storage, and networks while the provider manages the physical infrastructure?',
    options: [
      { id: 'a', text: 'SaaS' },
      { id: 'b', text: 'PaaS' },
      { id: 'c', text: 'IaaS' },
      { id: 'd', text: 'FaaS only' },
    ],
    correct: 'c',
    explanation: 'Infrastructure as a Service (IaaS) exposes compute, storage, and networking resources. The provider owns the physical platform; the customer manages operating systems and applications.',
  },

  // Domain 2 - Network Access (Full practice expansion)
  {
    id: 'q102', domain: 2, type: 'single', difficulty: 'easy',
    question: 'A switchport configured as an access port carries traffic for how many VLANs under normal operation?',
    options: [
      { id: 'a', text: 'One VLAN' },
      { id: 'b', text: 'Two VLANs only' },
      { id: 'c', text: 'All VLANs' },
      { id: 'd', text: 'Only the native VLAN and no data VLAN' },
    ],
    correct: 'a',
    explanation: 'An access port belongs to a single data VLAN. Voice VLAN support is a special case where the attached phone tags voice traffic while the PC data VLAN remains untagged.',
  },
  {
    id: 'q103', domain: 2, type: 'single', difficulty: 'medium',
    question: 'On an IEEE 802.1Q trunk, how is native VLAN traffic handled by default?',
    options: [
      { id: 'a', text: 'It is double-tagged' },
      { id: 'b', text: 'It is sent untagged' },
      { id: 'c', text: 'It is dropped' },
      { id: 'd', text: 'It is always VLAN 4095' },
    ],
    correct: 'b',
    explanation: '802.1Q trunks tag VLAN traffic except for the native VLAN, which is transmitted untagged by default. Both trunk ends should agree on the native VLAN.',
  },
  {
    id: 'q104', domain: 2, type: 'single', difficulty: 'medium',
    question: 'How is the STP root bridge elected?',
    options: [
      { id: 'a', text: 'Highest interface bandwidth' },
      { id: 'b', text: 'Lowest bridge ID' },
      { id: 'c', text: 'Highest MAC address only' },
      { id: 'd', text: 'Lowest port number on each switch' },
    ],
    correct: 'b',
    explanation: 'STP elects the root bridge using the lowest bridge ID, which is made from bridge priority plus the switch MAC address.',
  },
  {
    id: 'q105', domain: 2, type: 'single', difficulty: 'medium',
    question: 'Which EtherChannel negotiation protocol is the open standard?',
    options: [
      { id: 'a', text: 'PAgP' },
      { id: 'b', text: 'LACP' },
      { id: 'c', text: 'DTP' },
      { id: 'd', text: 'VTP' },
    ],
    correct: 'b',
    explanation: 'LACP is IEEE 802.3ad/802.1AX and is vendor-neutral. PAgP is Cisco proprietary; DTP negotiates trunks; VTP distributes VLAN database information.',
  },
  {
    id: 'q106', domain: 2, type: 'single', difficulty: 'medium',
    question: 'In a controller-based wireless deployment, what is a primary role of the WLC?',
    options: [
      { id: 'a', text: 'Provide centralized control and policy for lightweight APs' },
      { id: 'b', text: 'Replace all switches in the wired LAN' },
      { id: 'c', text: 'Perform NAT for every wireless client' },
      { id: 'd', text: 'Disable roaming between APs' },
    ],
    correct: 'a',
    explanation: 'A wireless LAN controller centralizes AP management, security policy, RF settings, and roaming functions for lightweight access points.',
  },
  {
    id: 'q107', domain: 2, type: 'single', difficulty: 'hard',
    question: 'Which encryption method is associated with WPA2-Personal using AES?',
    options: [
      { id: 'a', text: 'WEP' },
      { id: 'b', text: 'TKIP' },
      { id: 'c', text: 'CCMP' },
      { id: 'd', text: 'LEAP' },
    ],
    correct: 'c',
    explanation: 'WPA2 with AES uses CCMP. TKIP is associated with older WPA compatibility and WEP is obsolete and insecure.',
  },

  // Domain 3 - IP Connectivity (Full practice expansion)
  {
    id: 'q108', domain: 3, type: 'single', difficulty: 'medium',
    question: 'When multiple routing table entries match a destination, which route is selected first?',
    options: [
      { id: 'a', text: 'The route with the longest prefix match' },
      { id: 'b', text: 'The route with the highest administrative distance' },
      { id: 'c', text: 'The route learned most recently' },
      { id: 'd', text: 'The route with the lowest interface number' },
    ],
    correct: 'a',
    explanation: 'Routers choose the most specific matching route first. Administrative distance and metric only decide between routes to the same prefix length.',
  },
  {
    id: 'q109', domain: 3, type: 'single', difficulty: 'easy',
    question: 'Which destination prefix represents an IPv4 default route?',
    options: [
      { id: 'a', text: '255.255.255.255/32' },
      { id: 'b', text: '127.0.0.0/8' },
      { id: 'c', text: '0.0.0.0/0' },
      { id: 'd', text: '224.0.0.0/4' },
    ],
    correct: 'c',
    explanation: 'The IPv4 default route is 0.0.0.0/0 and matches any destination not covered by a more specific route.',
  },
  {
    id: 'q110', domain: 3, type: 'single', difficulty: 'medium',
    question: 'Which OSPF router ID source has the highest priority?',
    options: [
      { id: 'a', text: 'Lowest active interface IP address' },
      { id: 'b', text: 'Manually configured router-id command' },
      { id: 'c', text: 'Highest active physical interface only' },
      { id: 'd', text: 'OSPF process ID' },
    ],
    correct: 'b',
    explanation: 'OSPF prefers a manually configured router ID. If absent, it uses the highest loopback IP, then the highest active non-loopback interface IP.',
  },
  {
    id: 'q111', domain: 3, type: 'single', difficulty: 'medium',
    question: 'In multi-area OSPF, which area is the backbone area?',
    options: [
      { id: 'a', text: 'Area 0' },
      { id: 'b', text: 'Area 1' },
      { id: 'c', text: 'Area 10' },
      { id: 'd', text: 'The area with the most routers' },
    ],
    correct: 'a',
    explanation: 'Area 0 is the OSPF backbone. Other areas should connect to Area 0 directly or through a virtual link in special cases.',
  },
  {
    id: 'q112', domain: 3, type: 'single', difficulty: 'easy',
    question: 'In Cisco IOS routing table output, what route code indicates OSPF?',
    options: [
      { id: 'a', text: 'C' },
      { id: 'b', text: 'S' },
      { id: 'c', text: 'O' },
      { id: 'd', text: 'R' },
    ],
    correct: 'c',
    explanation: 'Cisco IOS marks OSPF-learned routes with O. Connected routes are C, static routes are S, and RIP routes are R.',
  },
  {
    id: 'q113', domain: 3, type: 'single', difficulty: 'medium',
    question: 'Which IPv6 prefix is used for link-local addresses?',
    options: [
      { id: 'a', text: '2000::/3' },
      { id: 'b', text: 'FE80::/10' },
      { id: 'c', text: 'FF00::/8' },
      { id: 'd', text: 'FC00::/7' },
    ],
    correct: 'b',
    explanation: 'IPv6 link-local addresses use FE80::/10. They are automatically present on IPv6-enabled interfaces and are used by neighbor discovery and routing protocols.',
  },
  {
    id: 'q114', domain: 3, type: 'single', difficulty: 'medium',
    question: 'Which IPv6 protocol family replaces ARP functions?',
    options: [
      { id: 'a', text: 'NDP using ICMPv6' },
      { id: 'b', text: 'RIPng only' },
      { id: 'c', text: 'DHCPv6 only' },
      { id: 'd', text: 'GRE' },
    ],
    correct: 'a',
    explanation: 'Neighbor Discovery Protocol (NDP) uses ICMPv6 messages for address resolution, router discovery, and neighbor reachability in IPv6 networks.',
  },
  {
    id: 'q115', domain: 3, type: 'single', difficulty: 'medium',
    question: 'What is the purpose of HSRP?',
    options: [
      { id: 'a', text: 'Encrypt routing updates' },
      { id: 'b', text: 'Provide first-hop default gateway redundancy' },
      { id: 'c', text: 'Negotiate trunk links' },
      { id: 'd', text: 'Assign IPv6 addresses automatically' },
    ],
    correct: 'b',
    explanation: 'HSRP provides first-hop redundancy by presenting a virtual default gateway IP and MAC address that can move between routers after a failure.',
  },
  {
    id: 'q116', domain: 3, type: 'input', difficulty: 'easy',
    question: 'How many usable host addresses are in an IPv4 /30 subnet?',
    options: [],
    correct: '',
    answer: '2',
    explanation: 'A /30 has four total addresses. Two are reserved for network and broadcast, leaving two usable host addresses.',
  },

  // Domain 5 - Security Fundamentals (Full practice expansion)
  {
    id: 'q117', domain: 5, type: 'single', difficulty: 'easy',
    question: 'Which security principle grants users only the permissions required to perform their job?',
    options: [
      { id: 'a', text: 'Least privilege' },
      { id: 'b', text: 'Nonrepudiation' },
      { id: 'c', text: 'Availability' },
      { id: 'd', text: 'Obfuscation' },
    ],
    correct: 'a',
    explanation: 'Least privilege limits users and systems to the minimum access needed, reducing damage if an account or device is compromised.',
  },
  {
    id: 'q118', domain: 5, type: 'single', difficulty: 'medium',
    question: 'A standard IPv4 ACL filters traffic primarily by which field?',
    options: [
      { id: 'a', text: 'Source IP address' },
      { id: 'b', text: 'Destination TCP port' },
      { id: 'c', text: 'Destination IP address and protocol' },
      { id: 'd', text: 'Source MAC address only' },
    ],
    correct: 'a',
    explanation: 'Standard IPv4 ACLs match source IPv4 address only. Extended ACLs can match protocol, source, destination, and transport-layer ports.',
  },
  {
    id: 'q119', domain: 5, type: 'single', difficulty: 'medium',
    question: 'In DHCP snooping, which ports are typically configured as trusted?',
    options: [
      { id: 'a', text: 'User access ports' },
      { id: 'b', text: 'Ports leading to legitimate DHCP servers or upstream switches' },
      { id: 'c', text: 'All ports by default' },
      { id: 'd', text: 'Only administratively shutdown ports' },
    ],
    correct: 'b',
    explanation: 'Trusted ports face legitimate DHCP servers or upstream infrastructure. User-facing access ports remain untrusted to block rogue DHCP server responses.',
  },
  {
    id: 'q120', domain: 5, type: 'single', difficulty: 'hard',
    question: 'Dynamic ARP Inspection helps mitigate which attack?',
    options: [
      { id: 'a', text: 'ARP spoofing or poisoning' },
      { id: 'b', text: 'Brute-force password guessing' },
      { id: 'c', text: 'DNS cache exhaustion' },
      { id: 'd', text: 'Wireless deauthentication only' },
    ],
    correct: 'a',
    explanation: 'Dynamic ARP Inspection validates ARP packets against trusted bindings, commonly learned through DHCP snooping, to block spoofed ARP replies.',
  },
];

// Add additional questions to main pool
QUESTIONS.push(...ADDITIONAL_QUESTIONS);

export const EXAM_TOPIC_CATALOG = {
  1: {
    pathId: 'fundamentals',
    topicIds: [
      'fundamentals-1-1-osi-tcp-ip-models',
      'fundamentals-1-2-ethernet-lan-standards',
      'fundamentals-1-3-mac-addresses',
      'fundamentals-1-4-csma-cd-ethernet-frames',
      'fundamentals-1-5-network-components',
      'fundamentals-1-6-wan-fundamentals',
      'fundamentals-1-7-ipv4-addressing',
      'fundamentals-1-8-ipv4-subnetting',
      'fundamentals-1-9-ipv6-fundamentals',
      'fundamentals-1-10-ipv6-addressing-eui-64',
      'fundamentals-1-11-tcp-vs-udp',
      'fundamentals-1-12-ip-ports-applications',
      'fundamentals-1-13-virtualization-fundamentals',
      'fundamentals-1-14-cloud-computing',
    ],
  },
  2: {
    pathId: 'network-access',
    topicIds: [
      'network-access-2-1-switch-operation-mac-table',
      'network-access-2-2-cli-basics',
      'network-access-2-3-switch-interface-config',
      'network-access-2-4-vlans',
      'network-access-2-5-vlan-trunking-802-1q',
      'network-access-2-6-voice-vlans',
      'network-access-2-7-vtp',
      'network-access-2-8-stp-concepts',
      'network-access-2-9-rstp-per-vlan-stp',
      'network-access-2-10-etherchannel',
      'network-access-2-11-cdp-lldp',
      'network-access-2-12-wireless-lan-fundamentals',
      'network-access-2-13-wireless-lan-architectures',
      'network-access-2-14-wireless-lan-security',
      'network-access-2-15-wireless-lan-configuration',
    ],
  },
  3: {
    pathId: 'ip-connectivity',
    topicIds: [
      'ip-connectivity-3-1-router-operation',
      'ip-connectivity-3-2-routing-table-fundamentals',
      'ip-connectivity-3-3-administrative-distance',
      'ip-connectivity-3-4-ipv4-static-routing',
      'ip-connectivity-3-5-ipv4-troubleshooting',
      'ip-connectivity-3-6-ospf-concepts',
      'ip-connectivity-3-7-ospf-configuration',
      'ip-connectivity-3-8-ospf-network-types-neighbors',
      'ip-connectivity-3-9-multi-area-ospf',
      'ip-connectivity-3-10-ipv6-static-routing',
      'ip-connectivity-3-11-ipv6-routing-ndp',
      'ip-connectivity-3-12-first-hop-redundancy-hsrp',
    ],
  },
  4: {
    pathId: 'ip-services',
    topicIds: [
      'ip-services-4-1-nat-concepts-terminology',
      'ip-services-4-2-static-nat',
      'ip-services-4-3-dynamic-nat-pat',
      'ip-services-4-4-ntp',
      'ip-services-4-5-dns',
      'ip-services-4-6-dhcp',
      'ip-services-4-7-ssh-remote-access',
      'ip-services-4-8-snmp',
      'ip-services-4-9-syslog',
      'ip-services-4-10-qos-fundamentals',
      'ip-services-4-11-tftp-ftp',
    ],
  },
  5: {
    pathId: 'security-fundamentals',
    topicIds: [
      'security-fundamentals-5-1-security-concepts',
      'security-fundamentals-5-2-attack-types',
      'security-fundamentals-5-3-social-engineering',
      'security-fundamentals-5-4-password-security-aaa',
      'security-fundamentals-5-5-802-1x-pnac',
      'security-fundamentals-5-6-acl-fundamentals',
      'security-fundamentals-5-7-advanced-acls',
      'security-fundamentals-5-8-firewalls-ips',
      'security-fundamentals-5-9-port-security',
      'security-fundamentals-5-10-dhcp-snooping',
      'security-fundamentals-5-11-dynamic-arp-inspection',
      'security-fundamentals-5-12-vpns-site-to-site',
      'security-fundamentals-5-13-vpns-remote-access',
      'security-fundamentals-5-14-securing-wireless-networks',
    ],
  },
  6: {
    pathId: 'automation-programmability',
    topicIds: [
      'automation-programmability-6-1-why-network-automation',
      'automation-programmability-6-2-logical-planes',
      'automation-programmability-6-3-sdn-architecture',
      'automation-programmability-6-4-cisco-sdn-solutions',
      'automation-programmability-6-5-catalyst-center-dnac',
      'automation-programmability-6-6-rest-apis',
      'automation-programmability-6-7-rest-api-authentication',
      'automation-programmability-6-8-json-data-format',
      'automation-programmability-6-9-xml-yaml',
      'automation-programmability-6-10-ansible',
      'automation-programmability-6-11-terraform',
      'automation-programmability-6-12-puppet-chef',
    ],
  },
};

const TOPIC_INFERENCE_RULES = [
  { domain: 1, topicId: 'fundamentals-1-14-cloud-computing', pattern: /\b(cloud|iaas|paas|saas|provider)\b/i },
  { domain: 1, topicId: 'fundamentals-1-13-virtualization-fundamentals', pattern: /\b(virtual|hypervisor|vm|container)\b/i },
  { domain: 1, topicId: 'fundamentals-1-11-tcp-vs-udp', pattern: /\b(tcp|udp|transport|handshake|syn|ack|flow control|guaranteed delivery)\b/i },
  { domain: 1, topicId: 'fundamentals-1-12-ip-ports-applications', pattern: /\b(port|dns|dhcp|http|https|ssh|ftp|application)\b/i },
  { domain: 1, topicId: 'fundamentals-1-10-ipv6-addressing-eui-64', pattern: /\b(eui-64|modified eui|ipv6 address)\b/i },
  { domain: 1, topicId: 'fundamentals-1-9-ipv6-fundamentals', pattern: /\b(ipv6|128 bits|128-bit)\b/i },
  { domain: 1, topicId: 'fundamentals-1-8-ipv4-subnetting', pattern: /\b(subnet|subnet mask|cidr|\/\d{1,2}|usable host)\b/i },
  { domain: 1, topicId: 'fundamentals-1-7-ipv4-addressing', pattern: /\b(ipv4|rfc 1918|private ip|ttl|default gateway)\b/i },
  { domain: 1, topicId: 'fundamentals-1-4-csma-cd-ethernet-frames', pattern: /\b(csma|collision|frame)\b/i },
  { domain: 1, topicId: 'fundamentals-1-3-mac-addresses', pattern: /\b(mac|arp|cam)\b/i },
  { domain: 1, topicId: 'fundamentals-1-2-ethernet-lan-standards', pattern: /\b(ethernet|mtu|fiber|utp|duplex)\b/i },
  { domain: 1, topicId: 'fundamentals-1-5-network-components', pattern: /\b(router|switch|hub|repeater|firewall|device|broadcast domain)\b/i },
  { domain: 1, topicId: 'fundamentals-1-1-osi-tcp-ip-models', pattern: /\b(osi|layer|pdu|encapsulation|model)\b/i },

  { domain: 2, topicId: 'network-access-2-14-wireless-lan-security', pattern: /\b(wpa|wpa2|wpa3|ccmp|tkip|wep|wireless security)\b/i },
  { domain: 2, topicId: 'network-access-2-13-wireless-lan-architectures', pattern: /\b(wlc|controller|lightweight ap|capwap)\b/i },
  { domain: 2, topicId: 'network-access-2-12-wireless-lan-fundamentals', pattern: /\b(wireless|wlan|ssid|access point|ap\b|802\.11)\b/i },
  { domain: 2, topicId: 'network-access-2-10-etherchannel', pattern: /\b(etherchannel|lacp|pagp|port-channel)\b/i },
  { domain: 2, topicId: 'network-access-2-9-rstp-per-vlan-stp', pattern: /\b(rstp|rapid spanning|per-vlan)\b/i },
  { domain: 2, topicId: 'network-access-2-8-stp-concepts', pattern: /\b(stp|spanning tree|root bridge|bpdu|portfast)\b/i },
  { domain: 2, topicId: 'network-access-2-5-vlan-trunking-802-1q', pattern: /\b(trunk|802\.1q|native vlan|tagged|untagged)\b/i },
  { domain: 2, topicId: 'network-access-2-4-vlans', pattern: /\b(vlan|access port|broadcast domain)\b/i },
  { domain: 2, topicId: 'network-access-2-1-switch-operation-mac-table', pattern: /\b(mac address table|cam|switching|flood|learns source)\b/i },
  { domain: 2, topicId: 'network-access-2-3-switch-interface-config', pattern: /\b(interface|switchport|speed|duplex|shutdown)\b/i },
  { domain: 2, topicId: 'network-access-2-11-cdp-lldp', pattern: /\b(cdp|lldp|neighbor discovery)\b/i },
  { domain: 2, topicId: 'network-access-2-7-vtp', pattern: /\b(vtp|vlan database)\b/i },

  { domain: 3, topicId: 'ip-connectivity-3-12-first-hop-redundancy-hsrp', pattern: /\b(hsrp|vrrp|first-hop|default gateway redundancy)\b/i },
  { domain: 3, topicId: 'ip-connectivity-3-11-ipv6-routing-ndp', pattern: /\b(ndp|neighbor discovery|icmpv6)\b/i },
  { domain: 3, topicId: 'ip-connectivity-3-10-ipv6-static-routing', pattern: /\b(ipv6|fe80|link-local)\b/i },
  { domain: 3, topicId: 'ip-connectivity-3-9-multi-area-ospf', pattern: /\b(area 0|backbone|multi-area)\b/i },
  { domain: 3, topicId: 'ip-connectivity-3-8-ospf-network-types-neighbors', pattern: /\b(neighbor|adjacency|dr|bdr)\b/i },
  { domain: 3, topicId: 'ip-connectivity-3-7-ospf-configuration', pattern: /\b(router-id|network command|ospf configuration)\b/i },
  { domain: 3, topicId: 'ip-connectivity-3-6-ospf-concepts', pattern: /\b(ospf|cost|area)\b/i },
  { domain: 3, topicId: 'ip-connectivity-3-5-ipv4-troubleshooting', pattern: /\b(troubleshoot|ping|ttl|loop|unreachable)\b/i },
  { domain: 3, topicId: 'ip-connectivity-3-4-ipv4-static-routing', pattern: /\b(static route|default route|0\.0\.0\.0\/0)\b/i },
  { domain: 3, topicId: 'ip-connectivity-3-3-administrative-distance', pattern: /\b(administrative distance|\bad\b|trusted|eigrp|rip)\b/i },
  { domain: 3, topicId: 'ip-connectivity-3-2-routing-table-fundamentals', pattern: /\b(routing table|route code|longest prefix|prefix match|metric)\b/i },
  { domain: 3, topicId: 'ip-connectivity-3-1-router-operation', pattern: /\b(router|routing|forward|next hop|default gateway)\b/i },

  { domain: 4, topicId: 'ip-services-4-3-dynamic-nat-pat', pattern: /\b(pat|overload|dynamic nat)\b/i },
  { domain: 4, topicId: 'ip-services-4-2-static-nat', pattern: /\b(static nat|one-to-one)\b/i },
  { domain: 4, topicId: 'ip-services-4-1-nat-concepts-terminology', pattern: /\b(nat|inside local|outside global|translate)\b/i },
  { domain: 4, topicId: 'ip-services-4-6-dhcp', pattern: /\b(dhcp|67|68|lease)\b/i },
  { domain: 4, topicId: 'ip-services-4-5-dns', pattern: /\b(dns|domain name|resolver)\b/i },
  { domain: 4, topicId: 'ip-services-4-4-ntp', pattern: /\b(ntp|time sync|clock)\b/i },
  { domain: 4, topicId: 'ip-services-4-8-snmp', pattern: /\b(snmp|mib|trap|161|162)\b/i },
  { domain: 4, topicId: 'ip-services-4-9-syslog', pattern: /\b(syslog|logging)\b/i },
  { domain: 4, topicId: 'ip-services-4-7-ssh-remote-access', pattern: /\b(ssh|remote access|vty|telnet)\b/i },
  { domain: 4, topicId: 'ip-services-4-10-qos-fundamentals', pattern: /\b(qos|quality of service|classification|marking)\b/i },
  { domain: 4, topicId: 'ip-services-4-11-tftp-ftp', pattern: /\b(tftp|ftp|file transfer|20|21|69)\b/i },

  { domain: 5, topicId: 'security-fundamentals-5-11-dynamic-arp-inspection', pattern: /\b(dynamic arp inspection|dai|arp spoof|arp poisoning)\b/i },
  { domain: 5, topicId: 'security-fundamentals-5-10-dhcp-snooping', pattern: /\b(dhcp snooping|rogue dhcp|trusted port)\b/i },
  { domain: 5, topicId: 'security-fundamentals-5-9-port-security', pattern: /\b(port security|sticky mac|violation)\b/i },
  { domain: 5, topicId: 'security-fundamentals-5-8-firewalls-ips', pattern: /\b(firewall|ips|ids|inspection)\b/i },
  { domain: 5, topicId: 'security-fundamentals-5-7-advanced-acls', pattern: /\b(extended acl|destination port|protocol)\b/i },
  { domain: 5, topicId: 'security-fundamentals-5-6-acl-fundamentals', pattern: /\b(acl|access list|standard acl|source ip)\b/i },
  { domain: 5, topicId: 'security-fundamentals-5-5-802-1x-pnac', pattern: /\b(802\.1x|pnac|supplicant|authenticator)\b/i },
  { domain: 5, topicId: 'security-fundamentals-5-4-password-security-aaa', pattern: /\b(aaa|authentication|authorization|accounting|password|least privilege)\b/i },
  { domain: 5, topicId: 'security-fundamentals-5-3-social-engineering', pattern: /\b(phishing|social engineering|pretext|baiting)\b/i },
  { domain: 5, topicId: 'security-fundamentals-5-2-attack-types', pattern: /\b(attack|dos|ddos|man-in-the-middle|brute-force|spoof)\b/i },
  { domain: 5, topicId: 'security-fundamentals-5-12-vpns-site-to-site', pattern: /\b(ipsec|tunnel mode|site-to-site)\b/i },
  { domain: 5, topicId: 'security-fundamentals-5-13-vpns-remote-access', pattern: /\b(remote access vpn|client vpn)\b/i },
  { domain: 5, topicId: 'security-fundamentals-5-14-securing-wireless-networks', pattern: /\b(wireless security|wpa|psk)\b/i },
  { domain: 5, topicId: 'security-fundamentals-5-1-security-concepts', pattern: /\b(security|confidentiality|integrity|availability|risk)\b/i },

  { domain: 6, topicId: 'automation-programmability-6-5-catalyst-center-dnac', pattern: /\b(dna center|dnac|catalyst center)\b/i },
  { domain: 6, topicId: 'automation-programmability-6-7-rest-api-authentication', pattern: /\b(authentication|token|bearer|api key)\b/i },
  { domain: 6, topicId: 'automation-programmability-6-6-rest-apis', pattern: /\b(rest|restconf|http method|get|post|put|delete|api)\b/i },
  { domain: 6, topicId: 'automation-programmability-6-9-xml-yaml', pattern: /\b(xml|yaml|yang)\b/i },
  { domain: 6, topicId: 'automation-programmability-6-8-json-data-format', pattern: /\b(json|object|array)\b/i },
  { domain: 6, topicId: 'automation-programmability-6-10-ansible', pattern: /\b(ansible|playbook)\b/i },
  { domain: 6, topicId: 'automation-programmability-6-11-terraform', pattern: /\b(terraform|iac|state file)\b/i },
  { domain: 6, topicId: 'automation-programmability-6-12-puppet-chef', pattern: /\b(puppet|chef)\b/i },
  { domain: 6, topicId: 'automation-programmability-6-3-sdn-architecture', pattern: /\b(sdn|software-defined|controller)\b/i },
  { domain: 6, topicId: 'automation-programmability-6-2-logical-planes', pattern: /\b(control plane|data plane|management plane)\b/i },
  { domain: 6, topicId: 'automation-programmability-6-1-why-network-automation', pattern: /\b(automation|programmability|manual configuration)\b/i },
];

function fallbackTopicForQuestion(question) {
  const catalog = EXAM_TOPIC_CATALOG[question.domain];
  if (!catalog) return { pathId: null, topicId: null };
  const numericId = Number(String(question.id || '').replace(/\D/g, '')) || 1;
  const topicId = catalog.topicIds[(numericId - 1) % catalog.topicIds.length];
  return { pathId: catalog.pathId, topicId };
}

export function getQuestionTopic(question) {
  const catalog = EXAM_TOPIC_CATALOG[question?.domain];
  if (!catalog) return { pathId: question?.pathId || null, topicId: question?.topicId || null };
  if (question.pathId && question.topicId) return { pathId: question.pathId, topicId: question.topicId };

  const haystack = `${question.question || ''} ${question.explanation || ''}`;
  const rule = TOPIC_INFERENCE_RULES.find((entry) => entry.domain === question.domain && entry.pattern.test(haystack));
  return { pathId: catalog.pathId, topicId: rule?.topicId || fallbackTopicForQuestion(question).topicId };
}

QUESTIONS.forEach((question) => {
  const topic = getQuestionTopic(question);
  question.pathId = question.pathId || topic.pathId;
  question.topicId = question.topicId || topic.topicId;
});

/**
 * Build a shuffled question set for the given exam mode.
 * @param {'quick'|'topic'|'full'} mode
 * @param {number|null} domainFilter  - domain 1–6 for topic mode
 * @returns {Array}
 */
export function buildQuestionSet(mode, domainFilter = null) {
  let pool = [...QUESTIONS];
  if (mode === 'topic' && domainFilter) {
    pool = pool.filter(q => q.domain === domainFilter);
  }
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const counts = { quick: 20, topic: 20, full: 120 };
  return pool.slice(0, counts[mode] ?? 20);
}
