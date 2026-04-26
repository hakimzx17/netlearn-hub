/**
 * ccnaFlashcards.js — CCNA 200-301 Comprehensive Flashcard Content
 * 
 * Organized by official CCNA exam domains:
 * 1. Network Fundamentals (20%)
 * 2. Network Access (20%)
 * 3. IP Connectivity (25%)
 * 4. IP Services (10%)
 * 5. Security Fundamentals (15%)
 * 6. Automation and Programmability (10%)
 */

// ═══════════════════════════════════════════════════════════════
// DOMAIN 1: NETWORK FUNDAMENTALS (20%)
// ═══════════════════════════════════════════════════════════════

export const NETWORK_FUNDAMENTALS_DECK = {
  id: 'network-fundamentals',
  name: 'Network Fundamentals',
  description: 'OSI/TCP-IP models, IPv4/IPv6 addressing, subnetting, Ethernet standards, cabling, and troubleshooting tools.',
  category: 'network-fundamentals',
  weight: '20%',
  tags: ['osi', 'tcp-ip', 'subnetting', 'ethernet', 'cabling'],
  cards: [
    // OSI MODEL
    { front: 'What are the 7 layers of the OSI model (top to bottom)?', back: '7. Application\n6. Presentation\n5. Session\n4. Transport\n3. Network\n2. Data Link\n1. Physical\n\nMnemonic: All People Seem To Need Data Processing', tags: ['osi', 'model'] },
    { front: 'What is the PDU (Protocol Data Unit) at each OSI layer?', back: 'Layer 7-5: Data\nLayer 4: Segment\nLayer 3: Packet\nLayer 2: Frame\nLayer 1: Bits\n\nRemember: "Do Some People Throw Bits"', tags: ['osi', 'pdu'] },
    { front: 'Which OSI layer is responsible for end-to-end reliability?', back: 'Layer 4 - Transport Layer\n\nKey functions:\n• Segmentation and reassembly\n• Flow control\n• Error recovery\n• Connection-oriented (TCP) or connectionless (UDP)', tags: ['osi', 'transport'] },
    { front: 'What OSI layer handles MAC addressing and switching?', back: 'Layer 2 - Data Link Layer\n\nSublayers:\n• LLC (Logical Link Control) - upper\n• MAC (Media Access Control) - lower\n\nDevices: Switches, Bridges\nPDU: Frame', tags: ['osi', 'data-link'] },
    { front: 'Which OSI layer handles IP addressing and routing?', back: 'Layer 3 - Network Layer\n\nKey protocols: IP, ICMP, ARP, OSPF, EIGRP\nDevices: Routers, L3 Switches\nPDU: Packet', tags: ['osi', 'network'] },
    
    // TCP/IP MODEL
    { front: 'Compare TCP/IP model to OSI model', back: 'TCP/IP          | OSI\n----------------|-----------------\nApplication     | Application\n                | Presentation\n                | Session\nTransport       | Transport\nInternet        | Network\nNetwork Access  | Data Link\n                | Physical', tags: ['tcp-ip', 'comparison'] },
    { front: 'What are the characteristics of TCP?', back: 'TCP (Transmission Control Protocol):\n• Connection-oriented (3-way handshake)\n• Reliable delivery (ACKs, sequencing)\n• Flow control (windowing)\n• Error recovery (retransmission)\n• Slower than UDP\n• Ports: HTTP(80), HTTPS(443), FTP(20/21), SSH(22), SMTP(25)', tags: ['tcp-ip', 'tcp'] },
    { front: 'What are the characteristics of UDP?', back: 'UDP (User Datagram Protocol):\n• Connectionless\n• No reliability guarantees\n• No flow control\n• Fast, low overhead\n• Used for real-time apps\n• Ports: DNS(53), DHCP(67/68), SNMP(161), TFTP(69), NTP(123)', tags: ['tcp-ip', 'udp'] },
    { front: 'Describe the TCP 3-way handshake', back: '1. SYN - Client sends synchronize request\n2. SYN-ACK - Server acknowledges and synchronizes\n3. ACK - Client acknowledges\n\nConnection established after step 3.\nTeardown: FIN → ACK → FIN → ACK', tags: ['tcp-ip', 'handshake'] },
    
    // IPv4 ADDRESSING
    { front: 'What are the IPv4 address classes and ranges?', back: 'Class A: 1.0.0.0 - 126.255.255.255 (/8)\nClass B: 128.0.0.0 - 191.255.255.255 (/16)\nClass C: 192.0.0.0 - 223.255.255.255 (/24)\nClass D: 224.0.0.0 - 239.255.255.255 (Multicast)\nClass E: 240.0.0.0 - 255.255.255.255 (Experimental)\n\n127.0.0.0/8 = Loopback', tags: ['ipv4', 'addressing'] },
    { front: 'What are private IPv4 address ranges?', back: 'Class A: 10.0.0.0 - 10.255.255.255 (/8)\nClass B: 172.16.0.0 - 172.31.255.255 (/12)\nClass C: 192.168.0.0 - 192.168.255.255 (/16)\n\nThese addresses are NOT routable on the public Internet.', tags: ['ipv4', 'private'] },
    { front: 'What is the purpose of subnet mask?', back: 'A subnet mask divides an IP address into:\n• Network portion (1s in mask)\n• Host portion (0s in mask)\n\nExample: 192.168.1.100/24\nIP:    11000000.10101000.00000001.01100100\nMask:  11111111.11111111.11111111.00000000\nNetwork: 192.168.1.0\nHost: .100', tags: ['ipv4', 'subnetting'] },
    { front: 'How many usable hosts in a /24 network?', back: 'Formula: 2^n - 2\n\n/24 = 255.255.255.0 = 8 host bits\n2^8 - 2 = 254 usable hosts\n\n-2 because:\n• First address = Network address\n• Last address = Broadcast address', tags: ['ipv4', 'subnetting'] },
    { front: 'What is the difference between broadcast and multicast?', back: 'Broadcast:\n• Sent to ALL hosts in broadcast domain\n• IPv4: 255.255.255.255 (limited)\n• subnet broadcast: x.x.x.255\n\nMulticast:\n• Sent to GROUP of interested hosts\n• Range: 224.0.0.0 - 239.255.255.255\n• Example: 224.0.0.5 (OSPF All Routers)', tags: ['ipv4', 'addressing'] },
    
    // IPv6
    { front: 'What is the format of an IPv6 address?', back: '128 bits, written as 8 groups of 4 hex digits\n\nFormat: xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx\n\nExample: 2001:0db8:0000:0000:0000:0000:0000:0001\n\nShortened:\n• Leading zeros can be removed\n• Consecutive all-zero groups → :: (once only)\n\n2001:db8::1', tags: ['ipv6', 'format'] },
    { front: 'What are the IPv6 address types?', back: 'Unicast:\n• Global (GUA): 2000::/3 - Public, routable\n• Link-local: FE80::/10 - Single link only\n• Unique Local (ULA): FC00::/7 - Private\n\nMulticast: FF00::/8\n• FF02::1 = All nodes\n• FF02::2 = All routers\n\nAnycast: Same address, multiple locations', tags: ['ipv6', 'types'] },
    { front: 'What is the EUI-64 process for IPv6?', back: 'EUI-64 creates Interface ID from MAC address:\n\n1. Take 48-bit MAC: AA:BB:CC:DD:EE:FF\n2. Split in half: AABB:CC + DDEEFF\n3. Insert FFFE: AABB:CCFF:FFEE:EEFF\n4. Flip 7th bit (U/L bit)\n5. Result: A2BB:CCFF:FFEE:EEFF\n\nUsed for automatic link-local address generation.', tags: ['ipv6', 'eui-64'] },
    
    // SUBNETTING
    { front: 'How do you calculate the number of subnets?', back: 'Formula: 2^n (where n = borrowed bits)\n\nExample: /24 subnetted to /26\n• Borrowed bits = 26 - 24 = 2\n• Number of subnets = 2^2 = 4 subnets\n\nEach subnet has:\n• 2^(32-26) - 2 = 62 hosts per subnet', tags: ['subnetting', 'calculation'] },
    { front: 'What is VLSM (Variable Length Subnet Masking)?', back: 'VLSM allows different subnet sizes in same network.\n\nBenefits:\n• Efficient IP address usage\n• Reduces waste\n• Subnets can be subnetted again\n\nExample: 192.168.1.0/24\n• Subnet A: /26 (62 hosts) - Servers\n• Subnet B: /27 (30 hosts) - Users\n• Subnet C: /30 (2 hosts) - WAN links', tags: ['subnetting', 'vlsm'] },
    { front: 'What is CIDR (Classless Inter-Domain Routing)?', back: 'CIDR replaces classful addressing:\n\n• Uses variable-length prefixes\n• Enables route summarization\n• Example: 192.168.0.0/16 summarizes 192.168.x.x\n\nCIDR notation: IP/prefix-length\n• /8 = 255.0.0.0\n• /16 = 255.255.0.0\n• /24 = 255.255.255.0', tags: ['subnetting', 'cidr'] },
    
    // ETHERNET & CABLES
    { front: 'What are the Ethernet standards and speeds?', back: 'Standard    | Speed       | Cable\n------------|-------------|------------------\n10BASE-T    | 10 Mbps     | Cat3 UTP\n100BASE-TX  | 100 Mbps    | Cat5 UTP\n1000BASE-T  | 1 Gbps      | Cat5e UTP\n10GBASE-T   | 10 Gbps     | Cat6a UTP\n1000BASE-SX | 1 Gbps      | Multimode fiber\n1000BASE-LX | 1 Gbps      | Single-mode fiber', tags: ['ethernet', 'standards'] },
    { front: 'What is the difference between straight-through and crossover cables?', back: 'Straight-through:\n• Same wiring on both ends\n• PC to Switch, Switch to Router\n\nCrossover:\n• Pins 1/2 swapped with 3/6\n• Switch to Switch, PC to PC, Router to Router\n• PC to Router (direct)\n\nNote: Auto-MDIX makes this less relevant today.', tags: ['cabling', 'ethernet'] },
    { front: 'What is the difference between half-duplex and full-duplex?', back: 'Half-duplex:\n• One direction at a time\n• Uses CSMA/CD for collision detection\n• Example: Hub environment\n\nFull-duplex:\n• Both directions simultaneously\n• No collisions\n• Requires switch\n• Example: Modern switch ports', tags: ['ethernet', 'duplex'] },
    
    // TROUBLESHOOTING
    { front: 'What are the key IOS show commands?', back: 'show running-config    - Current config\nshow startup-config    - Saved config\nshow ip interface brief - Interface status\nshow ip route          - Routing table\nshow interfaces        - Detailed interface info\nshow version           - IOS version, uptime\nshow mac address-table - MAC addresses\nshow vlan brief        - VLAN information\nshow spanning-tree     - STP status\nshow arp               - ARP table', tags: ['cli', 'troubleshooting'] },
    { front: 'What are the ping and traceroute commands?', back: 'ping:\n• Tests connectivity\n• Uses ICMP echo request/reply\n• ! = success, . = timeout, U = unreachable\n\ntraceroute:\n• Shows path to destination\n• Uses TTL expiration\n• Shows each hop delay\n\nExtended ping:\nRouter#ping [ip] source [interface]', tags: ['cli', 'troubleshooting'] },
  ]
};

// ═══════════════════════════════════════════════════════════════
// DOMAIN 2: NETWORK ACCESS (20%)
// ═══════════════════════════════════════════════════════════════

export const NETWORK_ACCESS_DECK = {
  id: 'network-access',
  name: 'Network Access',
  description: 'VLANs, trunking, STP, EtherChannel, port security, wireless standards, and MAC address tables.',
  category: 'network-access',
  weight: '20%',
  tags: ['vlan', 'stp', 'trunking', 'wireless', 'etherchannel'],
  cards: [
    // VLANs
    { front: 'What is a VLAN and why use it?', back: 'VLAN (Virtual LAN):\n• Logical separation of broadcast domains\n• Devices in same VLAN = same broadcast domain\n• Different VLANs = separate networks\n\nBenefits:\n• Improved security\n• Reduced broadcast traffic\n• Easier management\n• Flexible grouping\n\nMax VLANs: 4096 (12-bit VLAN ID)\nVLAN 1 = Default VLAN\nVLAN 1002-1005 = Reserved for FDDI/Token Ring', tags: ['vlan', 'basics'] },
    { front: 'What are the VLAN types?', back: 'Data VLAN:\n• Carries user traffic\n• Also called user VLAN\n\nDefault VLAN:\n• VLAN 1 on Cisco switches\n• All ports belong to it initially\n\nNative VLAN:\n• Untagged traffic on trunk\n• Default is VLAN 1\n• Should be changed for security\n\nManagement VLAN:\n• For switch management (SVI)\n• Carries management traffic\n\nVoice VLAN:\n• Carries VoIP traffic\n• QoS prioritization', tags: ['vlan', 'types'] },
    { front: 'What is trunking and 802.1Q?', back: 'Trunk:\n• Carries multiple VLANs on single link\n• Used between switches, switch-router\n\n802.1Q:\n• VLAN tagging standard\n• Inserts 4-byte tag in Ethernet frame\n• 12-bit VLAN ID = 4096 VLANs\n• Native VLAN is untagged\n\nISL (Inter-Switch Link):\n• Cisco proprietary (legacy)\n• Encapsulates entire frame\n• Being replaced by 802.1Q', tags: ['trunking', '802.1q'] },
    { front: 'What is Inter-VLAN routing?', back: 'Required for communication between VLANs\n\nMethods:\n1. Router-on-a-stick\n   • Single router interface\n   • Subinterfaces per VLAN\n   • 802.1Q trunk\n\n2. L3 Switch\n   • SVI (Switched Virtual Interface)\n   • ip routing enabled\n   • SVI per VLAN\n\nCommand for L3 switch:\ninterface vlan 10\n ip address 192.168.10.1 255.255.255.0\nno shutdown\nip routing', tags: ['vlan', 'routing'] },
    
    // STP
    { front: 'What problem does Spanning Tree Protocol solve?', back: 'STP prevents Layer 2 loops in networks with redundant links.\n\nProblems caused by L2 loops:\n• Broadcast storms\n• MAC table instability\n• Duplicate frame transmission\n\nSTP solution:\n• Elects root bridge\n• Blocks redundant paths\n• Creates loop-free topology\n• Unblocks if primary path fails', tags: ['stp', 'loops'] },
    { front: 'Describe the STP root bridge election process', back: 'Root Bridge Election:\n1. Lowest Bridge ID wins\n2. Bridge ID = Priority + MAC address\n3. Default priority: 32768\n\nCommands:\nspanning-tree vlan 1 root primary\nspanning-tree vlan 1 root secondary\nspanning-tree vlan 1 priority 4096\n\nOnce root elected:\n• Each switch elects root port (best path to root)\n• Each segment elects designated port\n• All other ports = blocked', tags: ['stp', 'election'] },
    { front: 'What are the STP port states?', back: 'Blocking (20s): \n• Receives BPDUs, no forwarding\n\nListening (15s):\n• Processes BPDUs\n• No forwarding, no learning\n\nLearning (15s):\n• Learns MAC addresses\n• No forwarding yet\n\nForwarding:\n• Full operation\n• Sends/receives data\n\nDisabled:\n• Administratively down\n\nTotal convergence: ~50 seconds', tags: ['stp', 'states'] },
    { front: 'What are STP enhancements?', back: 'PortFast:\n• Skip listening/learning on access ports\n• Immediate forwarding\n• Only for end-user ports\nspanning-tree portfast\n\nBPDU Guard:\n• Shut down port if BPDU received\n• Protects against rogue switches\nspanning-tree bpduguard enable\n\nUplinkFast:\n• Fast failover on access switches\n\nBackboneFast:\n• Fast convergence in core\n\nRSTP (802.1w):\n• Rapid Spanning Tree\n• 1-2 second convergence', tags: ['stp', 'enhancements'] },
    
    // EtherChannel
    { front: 'What is EtherChannel and why use it?', back: 'EtherChannel:\n• Bundles multiple physical links into one logical link\n• Provides load balancing and redundancy\n\nBenefits:\n• Increased bandwidth (aggregate)\n• Redundancy (if one link fails)\n• Loop prevention (single logical link)\n\nMax ports: 8\n\nProtocols:\n• LACP (802.3ad) - Industry standard\n• PAgP - Cisco proprietary\n• Static - On (no negotiation)', tags: ['etherchannel', 'basics'] },
    { front: 'Configure EtherChannel using LACP', back: 'LACP Configuration:\n\nSwitch1:\ninterface range GigabitEthernet0/1-2\n channel-group 1 mode active\n\nSwitch2:\ninterface range GigabitEthernet0/1-2\n channel-group 1 mode passive\n\n(or active on both sides)\n\nVerify:\nshow etherchannel summary\nshow lacp neighbor\n\nLACP modes:\n• Active - Actively negotiates\n• Passive - Waits for negotiation', tags: ['etherchannel', 'lacp'] },
    
    // WIRELESS
    { front: 'Compare 802.11 wireless standards', back: 'Standard | Freq    | Max Speed | Range\n---------|---------|-----------|--------\n802.11a  | 5 GHz   | 54 Mbps   | ~30m\n802.11b  | 2.4 GHz | 11 Mbps   | ~100m\n802.11g  | 2.4 GHz | 54 Mbps   | ~100m\n802.11n  | 2.4/5   | 600 Mbps  | ~150m\n802.11ac | 5 GHz   | 6.9 Gbps  | ~100m\n802.11ax | 2.4/5/6 | 9.6 Gbps  | ~150m\n(WiFi 6)\n\nChannels:\n• 2.4 GHz: 14 channels (1-14)\n• 5 GHz: More channels, less interference', tags: ['wireless', 'standards'] },
    { front: 'What are wireless security protocols?', back: 'WEP (Wired Equivalent Privacy):\n• Legacy, easily cracked\n• 64/128-bit key\n\nWPA (WiFi Protected Access):\n• TKIP encryption\n• Improved over WEP\n\nWPA2 (802.11i):\n• AES-CCMP encryption\n• Enterprise (802.1X/EAP)\n• Personal (PSK)\n\nWPA3:\n• SAE (Simultaneous Authentication of Equals)\n• 192-bit encryption\n• Protected Management Frames\n• Forward secrecy', tags: ['wireless', 'security'] },
    
    // PORT SECURITY
    { front: 'What is Port Security on a switch?', back: 'Port Security limits MAC addresses per port.\n\nModes:\n• Shutdown (default) - Disables port\n• Restrict - Drops packets, increments counter\n• Protect - Drops packets silently\n\nMax MAC addresses: 1-132\n\nConfiguration:\ninterface fa0/1\n switchport mode access\n switchport port-security\n switchport port-security maximum 2\n switchport port-security violation restrict\n switchport port-security mac-address sticky\n\nVerify: show port-security interface fa0/1', tags: ['port-security', 'switching'] },
    { front: 'What is a MAC address table?', back: 'MAC Address Table (CAM Table):\n• Maps MAC addresses to ports\n• Learned from source MAC addresses\n• Aging time: 300 seconds (default)\n\nCommands:\nshow mac address-table\nshow mac address-table dynamic\nshow mac address-table static\n\nFlooding:\n• Unknown unicast flooded to all ports (except source)\n• Broadcast always flooded\n\nTable full:\n• Packets dropped if table full\n• Can be configured to drop or learn', tags: ['mac-table', 'switching'] },
  ]
};

// ═══════════════════════════════════════════════════════════════
// DOMAIN 3: IP CONNECTIVITY (25%)
// ═══════════════════════════════════════════════════════════════

export const IP_CONNECTIVITY_DECK = {
  id: 'ip-connectivity',
  name: 'IP Connectivity',
  description: 'Static routing, OSPF, routing tables, HSRP, and routing concepts.',
  category: 'ip-connectivity',
  weight: '25%',
  tags: ['routing', 'ospf', 'static', 'hsrp'],
  cards: [
    // ROUTING BASICS
    { front: 'What is the difference between static and dynamic routing?', back: 'Static Routing:\n• Manually configured\n• No overhead on router\n• Good for small/simple networks\n• Does not adapt to changes\n\nDynamic Routing:\n• Automatically learns routes\n• Adapts to topology changes\n• More overhead (CPU/memory)\n• Scalable for large networks\n\nProtocol types:\n• Distance Vector (RIP, EIGRP)\n• Link-State (OSPF, IS-IS)', tags: ['routing', 'basics'] },
    { front: 'What is a routing table and what does it contain?', back: 'Routing Table Components:\n\n1. Directly connected networks (C)\n2. Static routes (S)\n3. Dynamic routes (O, R, D, B)\n4. Default route (S*)\n\nEach route includes:\n• Destination network\n• Next hop IP address\n• Outgoing interface\n• Administrative Distance\n• Metric\n\nCommand: show ip route', tags: ['routing', 'table'] },
    { front: 'What is Administrative Distance (AD)?', back: 'AD = Trustworthiness of route source (0-255)\nLower = More trustworthy\n\nCommon ADs:\nConnected: 0\nStatic: 1\nEIGRP: 90\nOSPF: 110\nRIP: 120\nEIGRP External: 170\nBGP: 20 (internal), 200 (external)\nUnknown: 255\n\nRouter prefers route with lowest AD\nIf tie, uses metric', tags: ['routing', 'ad'] },
    { front: 'What is a metric and how is it used?', back: 'Metric = Cost to reach destination\nUsed to choose best path when multiple routes exist\n\nMetrics vary by protocol:\n• RIP: Hop count (max 15)\n• OSPF: Cost (bandwidth-based)\n• EIGRP: Composite (bandwidth, delay, load, reliability)\n• BGP: AS path length, attributes\n\nLower metric = Better path\n\nExample:\nRoute A: Metric 20\nRoute B: Metric 30\nRouter chooses Route A', tags: ['routing', 'metric'] },
    
    // STATIC ROUTING
    { front: 'How do you configure a static route?', back: 'Basic syntax:\nip route <destination> <mask> <next-hop-or-interface>\n\nExamples:\n# Using next-hop IP:\nip route 10.0.0.0 255.0.0.0 192.168.1.1\n\n# Using exit interface:\nip route 10.0.0.0 255.0.0.0 Serial0/0/0\n\n# Default route (gateway of last resort):\nip route 0.0.0.0 0.0.0.0 192.168.1.1\n\n# Floating static (backup):\nip route 10.0.0.0 255.0.0.0 192.168.2.1 200\n(AD = 200, higher than primary)', tags: ['static', 'routing'] },
    { front: 'What is a floating static route?', back: 'Floating static route:\n• Backup route with higher AD\n• Only used if primary route fails\n\nExample:\nPrimary (OSPF, AD 110):\nip route 10.0.0.0 255.0.0.0 192.168.1.1\n\nBackup (Static, AD 120):\nip route 10.0.0.0 255.0.0.0 192.168.2.1 120\n\nWhen OSPF route fails:\n• Static route installs in routing table\n• When OSPF recovers:\n• OSPF route replaces static\n• Static "floats" back out', tags: ['static', 'floating'] },
    
    // OSPF
    { front: 'What is OSPF and its key characteristics?', back: 'OSPF (Open Shortest Path First):\n• Link-State routing protocol\n• Open standard (works on all vendors)\n• Uses Dijkstra SPF algorithm\n• AD: 110\n• Metric: Cost (based on bandwidth)\n• Fast convergence\n• Uses multicast 224.0.0.5 and 224.0.0.6\n• Requires hierarchical design (areas)\n• Sends partial updates (LSAs)\n• Supports VLSM and CIDR\n• Hello packets every 10 seconds', tags: ['ospf', 'basics'] },
    { front: 'Describe the OSPF neighbor adjacency process', back: 'OSPF Neighbor States:\n\n1. Down\n2. Init - Hello received\n3. 2-Way - Bidirectional communication\n   (DR/BDR election on broadcast)\n4. ExStart - Master/Slave negotiation\n5. Exchange - Database descriptors\n6. Loading - LSR/LSU exchange\n7. Full - Adjacency complete\n\nRequirements to become neighbors:\n• Same area ID\n• Same hello/dead timers\n• Same authentication\n• Same subnet\n• Unique Router IDs\n• Same MTU (optional)', tags: ['ospf', 'adjacency'] },
    { front: 'What are OSPF areas and why use them?', back: 'OSPF Areas:\n• Hierarchical design for scalability\n• Reduces LSDB size\n• Minimizes SPF calculation time\n\nArea Types:\n• Area 0 - Backbone (required)\n• Regular areas - Non-backbone\n• Stub area - No external routes\n• Totally stubby - No external or inter-area\n• NSSA - Allows external routes\n\nRouter Types:\n• IR - Internal Router (single area)\n• ABR - Area Border Router (multiple areas)\n• ASBR - Autonomous System Boundary Router (redistributes)', tags: ['ospf', 'areas'] },
    { front: 'How does OSPF calculate the cost (metric)?', back: 'OSPF Cost = Reference Bandwidth / Interface Bandwidth\n\nDefault Reference Bandwidth = 100 Mbps\n\nCost Examples:\n10 Mbps   = 100/10   = 10\n100 Mbps  = 100/100  = 1\n1 Gbps    = 100/1000 = 1 (problem!)\n\nChange reference bandwidth:\nrouter ospf 1\n auto-cost reference-bandwidth 10000\n\n(This makes 1 Gbps = 10, 100 Mbps = 100)', tags: ['ospf', 'cost'] },
    { front: 'Configure single-area OSPF', back: 'Basic OSPF Configuration:\n\nrouter ospf 1\n network 192.168.1.0 0.0.0.255 area 0\n network 10.0.0.0 0.0.0.255 area 0\n router-id 1.1.1.1\n\nInterface method:\ninterface GigabitEthernet0/0\n ip ospf 1 area 0\n\nPassive interfaces:\nrouter ospf 1\n passive-interface GigabitEthernet0/1\n\nVerify:\nshow ip ospf neighbor\nshow ip ospf interface brief\nshow ip route ospf', tags: ['ospf', 'configuration'] },
    
    // HSRP
    { front: 'What is HSRP and why use it?', back: 'HSRP (Hot Standby Router Protocol):\n• Cisco proprietary\n• First-hop redundancy protocol\n• Provides default gateway redundancy\n• Virtual IP shared between routers\n\nHow it works:\n• Active router forwards traffic\n• Standby router monitors (ready to take over)\n• Virtual IP = gateway for hosts\n• Virtual MAC: 0000.0c07.acXX\n\nTimers:\n• Hello: 3 seconds\n• Hold: 10 seconds\n\nHSRP versions: 1 (UDP 1985) and 2 (UDP 1985)', tags: ['hsrp', 'redundancy'] },
    { front: 'Configure HSRP on two routers', back: 'Router A (Active):\ninterface GigabitEthernet0/0\n ip address 192.168.1.2 255.255.255.0\n standby version 2\n standby 1 ip 192.168.1.1\n standby 1 priority 110\n standby 1 preempt\n\nRouter B (Standby):\ninterface GigabitEthernet0/0\n ip address 192.168.1.3 255.255.255.0\n standby version 2\n standby 1 ip 192.168.1.1\n standby 1 priority 100\n\nVerify:\nshow standby brief\nshow standby\n\n192.168.1.1 = Virtual IP (gateway)', tags: ['hsrp', 'configuration'] },
    { front: 'Compare HSRP, VRRP, and GLBP', back: 'HSRP:\n• Cisco proprietary\n• Active/Standby\n• Virtual IP + Virtual MAC\n\nVRRP (Virtual Router Redundancy Protocol):\n• Industry standard (IEEE 802.1)\n• Master/Backup\n• Virtual IP\n\nGLBP (Gateway Load Balancing Protocol):\n• Cisco proprietary\n• Load balancing between routers\n• Multiple virtual MACs\n• Active/Active\n\nAll provide first-hop redundancy\nAll use virtual IP as gateway', tags: ['redundancy', 'comparison'] },
  ]
};

// ═══════════════════════════════════════════════════════════════
// DOMAIN 4: IP SERVICES (10%)
// ═══════════════════════════════════════════════════════════════

export const IP_SERVICES_DECK = {
  id: 'ip-services',
  name: 'IP Services',
  description: 'DHCP, DNS, NTP, SNMP, NAT/PAT, Syslog, and QoS concepts.',
  category: 'ip-services',
  weight: '10%',
  tags: ['dhcp', 'dns', 'ntp', 'snmp', 'nat', 'syslog'],
  cards: [
    // DHCP
    { front: 'Describe the DHCP DORA process', back: 'DORA - 4-step process:\n\n1. Discover - Client broadcasts "Is any DHCP server there?"\n   (UDP 67, broadcast 255.255.255.255)\n\n2. Offer - Server responds with available IP\n   (Includes: IP, subnet, gateway, DNS, lease time)\n\n3. Request - Client requests offered IP\n   (Broadcast, in case multiple servers offered)\n\n4. Acknowledge - Server confirms assignment\n   (Client configures network interface)\n\nLease renewal at 50%, rebinding at 87.5%', tags: ['dhcp', 'process'] },
    { front: 'How do you configure a DHCP server on a Cisco router?', back: 'Router DHCP Server Config:\n\nip dhcp excluded-address 192.168.1.1 192.168.1.10\n\nip dhcp pool OFFICE\n network 192.168.1.0 255.255.255.0\n default-router 192.168.1.1\n dns-server 8.8.8.8 8.8.4.4\n lease 7\n\nDHCP Relay (ip helper):\ninterface GigabitEthernet0/1\n ip helper-address 10.0.0.100\n\n(Forwards DHCP broadcasts to server on different subnet)', tags: ['dhcp', 'configuration'] },
    
    // DNS
    { front: 'What is DNS and how does it work?', back: 'DNS (Domain Name System):\n• Resolves hostnames to IP addresses\n• Hierarchical, distributed database\n• UDP 53 (queries), TCP 53 (zone transfers)\n\nResolution Process:\n1. Client queries local DNS server\n2. If not cached, queries root server (.)\n3. Root directs to TLD server (.com, .org)\n4. TLD directs to authoritative server\n5. Authoritative server returns IP\n\nRecord Types:\nA - Hostname to IPv4\nAAAA - Hostname to IPv6\nCNAME - Alias\nMX - Mail server\nNS - Name server\nPTR - Reverse lookup', tags: ['dns', 'basics'] },
    
    // NTP
    { front: 'What is NTP and why is it important?', back: 'NTP (Network Time Protocol):\n• Synchronizes clocks across network\n• UDP 123\n• Stratum 1 = atomic clock source\n• Higher stratum = less accurate\n\nImportance:\n• Log correlation\n• Certificate validation\n• Security event analysis\n• Scheduled tasks\n\nConfiguration:\nntp server 132.163.96.1\nntp master (makes router stratum 1)\n\nVerify:\nshow ntp status\nshow ntp associations', tags: ['ntp', 'time'] },
    
    // SNMP
    { front: 'What is SNMP and its components?', back: 'SNMP (Simple Network Management Protocol):\n• Monitors and manages network devices\n• UDP 161 (queries), UDP 162 (traps)\n\nComponents:\n• NMS (Network Management Station)\n• Agent (on managed device)\n• MIB (Management Information Base)\n• OID (Object Identifier)\n\nVersions:\n• v1 - Basic, community strings (plaintext)\n• v2c - Bulk transfers, still plaintext\n• v3 - Authentication, encryption\n\nCommunities:\n• Read-only (RO)\n• Read-write (RW)', tags: ['snmp', 'management'] },
    
    // NAT
    { front: 'What are the types of NAT?', back: 'Static NAT:\n• 1:1 mapping (one-to-one)\n• Internal IP ↔ External IP\n• Used for servers\n\nDynamic NAT:\n• Many-to-many from pool\n• Random assignment\n• PAT when pool exhausted\n\nPAT (Port Address Translation):\n• Many-to-one (overload)\n• Uses different source ports\n• Most common (home routers)\n\nCommands:\nip nat inside source static 192.168.1.10 203.0.113.10\nip nat inside source list 1 pool NATPOOL\nip nat inside source list 1 interface GigabitEthernet0/0 overload', tags: ['nat', 'translation'] },
    { front: 'How do you configure PAT (NAT Overload)?', back: 'PAT Configuration:\n\n1. Define interesting traffic:\naccess-list 1 permit 192.168.1.0 0.0.0.255\n\n2. Configure PAT:\nip nat inside source list 1 interface GigabitEthernet0/0 overload\n\n3. Apply to interfaces:\ninterface GigabitEthernet0/0\n ip nat outside\n\ninterface GigabitEthernet0/1\n ip nat inside\n\nVerify:\nshow ip nat translations\nshow ip nat statistics\nclear ip nat translation *', tags: ['nat', 'pat'] },
    
    // SYSLOG
    { front: 'What is Syslog and its severity levels?', back: 'Syslog:\n• Standard for message logging\n• UDP 514\n• Cisco devices log locally and to server\n\nSeverity Levels (0-7):\n0 - Emergency (system unusable)\n1 - Alert (immediate action)\n2 - Critical (critical conditions)\n3 - Error (error conditions)\n4 - Warning (warning conditions)\n5 - Notification (normal but significant)\n6 - Informational (informational messages)\n7 - Debug (debugging messages)\n\nMnemonic: "Every Alerting Crisis Errors Our Nerves In Days"', tags: ['syslog', 'logging'] },
    
    // QoS
    { front: 'What are QoS queuing methods?', back: 'FIFO (First In, First Out):\n• Default on most interfaces\n• No priority, just order\n\nPriority Queuing (PQ):\n• High, Medium, Normal, Low\n• High always serviced first\n• Risk: Low queue starvation\n\nCustom Queuing (CQ):\n• Round-robin between queues\n• Bandwidth allocation\n• Fair for all traffic\n\nWeighted Fair Queuing (WFQ):\n• Default on interfaces < 2 Mbps\n• Fair bandwidth allocation\n• Automatic classification\n\nClass-Based WFQ (CBWFQ):\n• Manual traffic classes\n• Bandwidth guarantees', tags: ['qos', 'queuing'] },
  ]
};

// ═══════════════════════════════════════════════════════════════
// DOMAIN 5: SECURITY FUNDAMENTALS (15%)
// ═══════════════════════════════════════════════════════════════

export const SECURITY_FUNDAMENTALS_DECK = {
  id: 'security-fundamentals',
  name: 'Security Fundamentals',
  description: 'Security concepts, VPNs, ACLs, password policies, device access control, and Layer 2 security.',
  category: 'security-fundamentals',
  weight: '15%',
  tags: ['security', 'acl', 'vpn', 'firewall'],
  cards: [
    // SECURITY CONCEPTS
    { front: 'What are the CIA triad principles?', back: 'CIA Triad - Core security principles:\n\nConfidentiality:\n• Only authorized access\n• Encryption, access controls\n• Prevents unauthorized disclosure\n\nIntegrity:\n• Data accuracy and trustworthiness\n• Hashing, digital signatures\n• Prevents unauthorized modification\n\nAvailability:\n• Systems accessible when needed\n• Redundancy, DDoS protection\n• Prevents denial of service', tags: ['security', 'cia'] },
    { front: 'What are common network attacks?', back: 'DoS/DDoS:\n• Denial of Service\n• Overwhelms resources\n\nMan-in-the-Middle (MITM):\n• Intercepts communication\n• ARP spoofing, DNS spoofing\n\nSpoofing:\n• Impersonating another device\n• IP spoofing, MAC spoofing\n\nPhishing:\n• Social engineering\n• Fake websites/emails\n\nBrute Force:\n• Password guessing\n• Try all combinations\n\nSQL Injection:\n• Malicious SQL commands\n• Input validation bypass', tags: ['security', 'attacks'] },
    
    // ACLS
    { front: 'What is the difference between Standard and Extended ACLs?', back: 'Standard ACL (1-99, 1300-1999):\n• Filters by SOURCE IP only\n• Place close to DESTINATION\n• No port/protocol filtering\n\nExtended ACL (100-199, 2000-2699):\n• Filters by SOURCE and DESTINATION\n• Filters by PROTOCOL and PORT\n• Place close to SOURCE\n• More precise control\n\nNamed ACLs:\n• Can be standard or extended\n• Easier to manage\nip access-list extended DENY_WEB\n deny tcp any host 10.0.0.1 eq 80\n permit ip any any', tags: ['acl', 'types'] },
    { front: 'How do you configure an Extended ACL?', back: 'Extended ACL Example:\n\naccess-list 100 deny tcp 192.168.1.0 0.0.0.255 host 10.0.0.1 eq 80\naccess-list 100 deny tcp 192.168.1.0 0.0.0.255 host 10.0.0.1 eq 443\naccess-list 100 permit ip any any\n\ninterface GigabitEthernet0/0\n ip access-group 100 in\n\nNamed ACL:\nip access-list extended BLOCK_HTTP\n deny tcp any host 10.0.0.1 eq 80\n permit ip any any\n\ninterface GigabitEthernet0/0\n ip access-group BLOCK_HTTP in\n\nRemember: Implicit deny at end!\nAlways include permit statement.', tags: ['acl', 'configuration'] },
    { front: 'How do ACLs process packets?', back: 'ACL Processing Rules:\n\n1. Top-down processing\n2. First match wins\n3. Implicit deny at end\n4. Best practice: specific to general\n\nExample ACL:\naccess-list 100 permit tcp 192.168.1.0 0.0.0.255 host 10.0.0.1 eq 80\naccess-list 100 permit tcp 192.168.1.0 0.0.0.255 host 10.0.0.1 eq 443\naccess-list 100 deny ip 192.168.1.0 0.0.0.255 any\naccess-list 100 permit ip any any\n\nWildcard Mask:\n0 = must match\n1 = don\'t care\nhost 10.0.0.1 = 0.0.0.0\nany = 255.255.255.255', tags: ['acl', 'processing'] },
    
    // VPN
    { front: 'What is a VPN and its types?', back: 'VPN (Virtual Private Network):\n• Secure tunnel over public network\n• Provides confidentiality and integrity\n\nSite-to-Site VPN:\n• Connects two networks\n• Always-on tunnel\n• IPsec typically used\n\nRemote Access VPN:\n• Individual user to network\n• Client software required\n• SSL/TLS or IPsec\n\nIPsec Components:\n• AH (Authentication Header) - Integrity\n• ESP (Encapsulating Security Payload) - Confidentiality\n• IKE (Internet Key Exchange) - Key management\n\nModes:\n• Transport mode - Payload encrypted\n• Tunnel mode - Entire packet encrypted', tags: ['vpn', 'ipsec'] },
    
    // DEVICE ACCESS
    { front: 'How do you secure device access on a Cisco router?', back: 'Router Security:\n\n1. Enable secret password:\nenable secret Cisco123!\n\n2. Console security:\nline console 0\n password Console123!\n login\n exec-timeout 5 0\n\n3. VTY security:\nline vty 0 4\n transport input ssh\n login local\n\n4. Create local user:\nusername admin privilege 15 secret Admin123!\n\n5. SSH configuration:\nhostname Router\nip domain-name lab.local\ncrypto key generate rsa\n\n6. Disable unused services:\nno ip http server\nno ip http secure-server', tags: ['security', 'device'] },
    { front: 'What is AAA and how does it work?', back: 'AAA - Authentication, Authorization, Accounting:\n\nAuthentication:\n• Who are you?\n• Username/password, certificates\n\nAuthorization:\n• What can you do?\n• Privilege levels, commands\n\nAccounting:\n• What did you do?\n• Logging, auditing\n\nAAA Methods:\n• Local (username/password on device)\n• RADIUS (UDP 1812/1813)\n• TACACS+ (TCP 49)\n\nConfiguration:\naaa new-model\naaa authentication login default local\naaa authorization exec default local\n\nTACACS+ encrypts entire packet\nRADIUS only encrypts password', tags: ['security', 'aaa'] },
    
    // LAYER 2 SECURITY
    { front: 'What are Layer 2 security threats and mitigations?', back: 'MAC Flooding:\n• Attack: Fill MAC table\n• Mitigation: Port Security\n\nVLAN Hopping:\n• Attack: Double tagging\n• Mitigation: Native VLAN change, don\'t use VLAN 1\n\nARP Spoofing:\n• Attack: False ARP replies\n• Mitigation: Dynamic ARP Inspection (DAI)\n\nDHCP Spoofing:\n• Attack: Rogue DHCP server\n• Mitigation: DHCP Snooping\n\nSTP Attack:\n• Attack: Become root bridge\n• Mitigation: BPDU Guard, Root Guard\n\nCommands:\nip dhcp snooping\nip dhcp snooping vlan 10\ninterface fa0/1\n ip arp inspection vlan 10', tags: ['security', 'layer2'] },
  ]
};

// ═══════════════════════════════════════════════════════════════
// DOMAIN 6: AUTOMATION AND PROGRAMMABILITY (10%)
// ═══════════════════════════════════════════════════════════════

export const AUTOMATION_DECK = {
  id: 'automation-programmability',
  name: 'Automation and Programmability',
  description: 'REST APIs, JSON, SDN, configuration management, and Cisco DNA Center.',
  category: 'automation',
  weight: '10%',
  tags: ['api', 'rest', 'json', 'sdn', 'automation'],
  cards: [
    // REST APIs
    { front: 'What is a REST API?', back: 'REST (Representational State Transfer):\n• Architectural style for web services\n• Uses HTTP methods\n• Stateless communication\n\nHTTP Methods:\nGET - Read/retrieve data\nPOST - Create new resource\nPUT - Update/replace resource\nPATCH - Partial update\nDELETE - Remove resource\n\nREST Characteristics:\n• Client-server model\n• Stateless\n• Cacheable\n• Uniform interface\n• Layered system\n\nResponse codes:\n200 OK, 201 Created, 400 Bad Request\n401 Unauthorized, 404 Not Found, 500 Server Error', tags: ['rest', 'api'] },
    { front: 'What is JSON and its structure?', back: 'JSON (JavaScript Object Notation):\n• Lightweight data format\n• Human readable\n• Key-value pairs\n\nData Types:\n• String: "value"\n• Number: 123, 45.67\n• Boolean: true, false\n• Array: [1, 2, 3]\n• Object: {"key": "value"}\n• Null: null\n\nExample:\n{\n  "hostname": "Router1",\n  "interfaces": [\n    {"name": "Gig0/0", "ip": "192.168.1.1"},\n    {"name": "Gig0/1", "ip": "10.0.0.1"}\n  ],\n  "uptime": 3600\n}', tags: ['json', 'format'] },
    
    // SDN
    { front: 'What is SDN (Software-Defined Networking)?', back: 'SDN:\n• Separates control plane from data plane\n• Centralized management\n• Programmable network\n\nTraditional vs SDN:\n\nTraditional:\n• Control + Data plane on each device\n• Device-by-device management\n• Distributed intelligence\n\nSDN:\n• Control plane centralized (controller)\n• Data plane on devices (forwarding)\n• Centralized intelligence\n• Network-wide view\n\nBenefits:\n• Rapid provisioning\n• Centralized management\n• Programmability\n• Agility', tags: ['sdn', 'architecture'] },
    { front: 'What are the SDN layers?', back: 'SDN Architecture Layers:\n\n1. Application Layer:\n   • Network apps (security, analytics)\n   • Northbound API (to controller)\n\n2. Control Layer:\n   • SDN Controller\n   • Network intelligence\n   • Southbound API (to devices)\n\n3. Infrastructure Layer:\n   • Physical/virtual switches\n   • Forwarding devices\n   • Data plane\n\nNorthbound API:\n• REST APIs\n• Between apps and controller\n\nSouthbound API:\n• OpenFlow, NETCONF, SNMP\n• Between controller and devices', tags: ['sdn', 'layers'] },
    
    // CONFIGURATION MANAGEMENT
    { front: 'What are configuration management tools?', back: 'Ansible:\n• Agentless\n• YAML playbooks\n• Push model\n• Uses SSH\n• Idempotent\n\nPuppet:\n• Agent-based\n• Manifests (Ruby DSL)\n• Pull model\n• Master-agent architecture\n\nChef:\n• Agent-based\n• Recipes (Ruby)\n• Pull model\n• Chef Server\n\nSaltStack:\n• Agent-based\n• YAML states\n• Push and pull\n• Fast execution\n\nCommon use cases:\n• Bulk configuration changes\n• Compliance checking\n• Automated deployment', tags: ['automation', 'tools'] },
    { front: 'What is network automation and its benefits?', back: 'Network Automation:\n• Automating network tasks\n• Reduces manual intervention\n• Uses scripts and tools\n\nBenefits:\n• Consistency (less human error)\n• Speed (faster deployments)\n• Scalability (manage thousands)\n• Documentation (code as docs)\n• Compliance (enforce standards)\n\nAutomation Examples:\n• VLAN provisioning\n• Configuration backup\n• Compliance audits\n• Firmware upgrades\n• Monitoring/alerting\n\nTools:\n• Python scripts\n• Ansible, Puppet, Chef\n• Cisco DNA Center\n• REST APIs', tags: ['automation', 'benefits'] },
    
    // CISCO DNA CENTER
    { front: 'What is Cisco DNA Center?', back: 'Cisco DNA Center:\n• Network management platform\n• Centralized automation\n• Intent-based networking\n\nKey Features:\n1. Design - Network topology planning\n2. Policy - Define network policies\n3. Provision - Deploy configurations\n4. Assurance - Monitoring and analytics\n\nBenefits:\n• Simplified management\n• Automated provisioning\n• Real-time analytics\n• AI-driven insights\n• REST API for integration\n\nCompared to traditional CLI:\n• GUI-based management\n• Network-wide automation\n• Machine learning insights\n• Intent-based policies', tags: ['dna-center', 'cisco'] },
    { front: 'What is Intent-Based Networking (IBN)?', back: 'Intent-Based Networking:\n• Define WHAT you want, not HOW\n• Automated network management\n• Cisco DNA Center example\n\nIBN Components:\n1. Translation:\n   • Business intent to network config\n   • "Allow Finance VLAN to access servers"\n\n2. Activation:\n   • Automatic configuration deployment\n   • Across entire network\n\n3. Assurance:\n   • Continuous validation\n   • Intent is being met\n   • AI/ML analytics\n\nBenefits:\n• Reduced complexity\n• Faster response to changes\n• Continuous compliance\n• Proactive issue detection\n\nTraditional: "Configure OSPF area 0 on interface"\nIntent: "Enable dynamic routing between sites"', tags: ['sdn', 'intent'] },
  ]
};

// ═══════════════════════════════════════════════════════════════
// EXISTING DECKS - Converted from resourceLibrary.js
// ═══════════════════════════════════════════════════════════════

export const PROTOCOLS_DECK = {
  id: 'protocols-reference',
  name: 'Protocols Reference',
  description: 'Essential networking protocols for CCNA exam.',
  category: 'network-fundamentals',
  weight: '20%',
  tags: ['protocols', 'reference'],
  cards: [
    { front: 'ARP (Address Resolution Protocol)', back: 'Full Name: Address Resolution Protocol\nLayer: L2/L3\nPurpose: Maps IP addresses to MAC addresses\n\nHow it works:\n1. Broadcasts "Who has 192.168.1.1?" within subnet\n2. Target replies with its MAC address\n3. Entry cached for 4 hours (default)\n\nARP Request: Broadcast (FF:FF:FF:FF:FF:FF)\nARP Reply: Unicast to requester', tags: ['protocols', 'arp'] },
    { front: 'ICMP (Internet Control Message Protocol)', back: 'Full Name: Internet Control Message Protocol\nLayer: L3\nPurpose: Network diagnostics and error reporting\n\nCommon Uses:\n• Ping (echo request/reply)\n• Traceroute (TTL exceeded)\n• Destination unreachable\n• Redirect messages\n\nTypes:\nType 8: Echo Request\nType 0: Echo Reply\nType 3: Destination Unreachable\nType 11: Time Exceeded', tags: ['protocols', 'icmp'] },
    { front: 'DHCP (Dynamic Host Configuration Protocol)', back: 'Full Name: Dynamic Host Configuration Protocol\nLayer: L7\nPorts: UDP 67 (server), UDP 68 (client)\nPurpose: Automatically assigns IP addresses\n\nDORA Process:\n1. Discover - Client broadcast\n2. Offer - Server responds\n3. Request - Client requests IP\n4. Acknowledge - Server confirms\n\nLease: Default 24 hours\nRenewal: At 50% of lease time\nRebinding: At 87.5% of lease time', tags: ['protocols', 'dhcp'] },
    { front: 'DNS (Domain Name System)', back: 'Full Name: Domain Name System\nLayer: L7\nPorts: UDP 53 (queries), TCP 53 (zone transfers)\nPurpose: Resolves hostnames to IP addresses\n\nRecord Types:\nA - Hostname to IPv4\nAAAA - Hostname to IPv6\nCNAME - Canonical name (alias)\nMX - Mail exchanger\nNS - Name server\nPTR - Reverse lookup\nTXT - Text records', tags: ['protocols', 'dns'] },
    { front: 'OSPF (Open Shortest Path First)', back: 'Full Name: Open Shortest Path First\nLayer: L3\nAD: 110\nType: Link-state protocol\n\nKey Features:\n• Uses Dijkstra SPF algorithm\n• Fast convergence\n• Area 0 is backbone\n• Sends partial updates (LSAs)\n• Multicast 224.0.0.5 and 224.0.0.6\n• Supports VLSM and CIDR\n\nMetric: Cost (bandwidth-based)\nDefault timers: Hello 10s, Dead 40s', tags: ['protocols', 'ospf'] },
    { front: 'EIGRP (Enhanced Interior Gateway Routing Protocol)', back: 'Full Name: Enhanced Interior Gateway Routing Protocol\nLayer: L3\nAD: 90 (internal), 170 (external)\nType: Advanced distance vector (hybrid)\n\nKey Features:\n• Cisco proprietary (now partially open)\n• Uses DUAL algorithm\n• Fast convergence\n• Incremental updates\n• Supports unequal cost load balancing\n\nMetric: Composite (bandwidth, delay, load, reliability)\nDefault: Bandwidth and delay only\n\nK-values: K1(bw), K2(load), K3(delay), K4(reliability), K5(mtun)', tags: ['protocols', 'eigrp'] },
    { front: 'BGP (Border Gateway Protocol)', back: 'Full Name: Border Gateway Protocol\nLayer: L4 (uses TCP 179)\nAD: 20 (internal), 200 (external)\nType: Path-vector protocol\n\nPurpose: The Internet routing protocol\n• Connects Autonomous Systems (AS)\n• External BGP (eBGP) between AS\n• Internal BGP (iBGP) within AS\n\nKey Features:\n• Scalable (handles full Internet table)\n• Policy-based routing\n• Slow convergence\n• Uses TCP for reliability\n\nAttributes: AS_PATH, NEXT_HOP, LOCAL_PREF, MED', tags: ['protocols', 'bgp'] },
    { front: 'STP (Spanning Tree Protocol)', back: 'Full Name: Spanning Tree Protocol (802.1D)\nLayer: L2\nPurpose: Prevents Layer 2 loops\n\nHow it works:\n1. Elects root bridge (lowest Bridge ID)\n2. Each switch elects root port\n3. Each segment elects designated port\n4. All other ports blocked\n\nPort States: Blocking → Listening → Learning → Forwarding\nConvergence: ~50 seconds\n\nEnhancements:\nRSTP (802.1w) - 1-2 second convergence\nMSTP (802.1s) - Multiple spanning trees', tags: ['protocols', 'stp'] },
    { front: 'VLAN (Virtual LAN)', back: 'Full Name: Virtual LAN\nLayer: L2\nPurpose: Logical segmentation\n\nKey Facts:\n• VLANs create separate broadcast domains\n• Max VLANs: 4096 (12-bit ID)\n• VLAN 1 = Default VLAN\n• 802.1Q = VLAN tagging standard\n• Native VLAN is untagged\n\nTypes:\nData VLAN - User traffic\nManagement VLAN - Switch management\nVoice VLAN - VoIP traffic\nNative VLAN - Untagged trunk traffic\n\nInter-VLAN routing requires L3 device (router or L3 switch)', tags: ['protocols', 'vlan'] },
    { front: 'NAT (Network Address Translation)', back: 'Full Name: Network Address Translation\nLayer: L3\nPurpose: Converts private IPs to public IPs\n\nTypes:\nStatic NAT: 1:1 mapping\nDynamic NAT: Many:many from pool\nPAT/Overload: Many:1 using ports\n\nBenefits:\n• Conserves IPv4 addresses\n• Hides internal network\n• Security through obscurity\n\nCommands:\nip nat inside source static 192.168.1.10 203.0.113.10\nip nat inside source list 1 pool NATPOOL\nip nat inside source list 1 interface Gig0/0 overload', tags: ['protocols', 'nat'] },
    { front: 'HSRP (Hot Standby Router Protocol)', back: 'Full Name: Hot Standby Router Protocol\nLayer: L3\nPurpose: First-hop redundancy (default gateway failover)\n\nKey Features:\n• Cisco proprietary\n• Active/Standby model\n• Virtual IP = gateway for hosts\n• Virtual MAC: 0000.0c07.acXX\n• UDP 1812\n\nTimers:\nHello: 3 seconds\nHold: 10 seconds\n\nElection:\nHighest priority wins (default 100)\nHighest IP if tie\nPreempt can be enabled\n\nAlternatives: VRRP (industry standard), GLBP (load balancing)', tags: ['protocols', 'hsrp'] },
  ]
};

// ═══════════════════════════════════════════════════════════════
// PORTS DECK
// ═══════════════════════════════════════════════════════════════

export const PORTS_DECK = {
  id: 'ports-reference',
  name: 'Ports Reference',
  description: 'Essential port numbers for the CCNA exam.',
  category: 'network-fundamentals',
  weight: '20%',
  tags: ['ports', 'protocols', 'reference'],
  cards: [
    { front: 'Port 20/21 - FTP', back: 'FTP (File Transfer Protocol)\n\nPort 20: FTP Data Transfer\nPort 21: FTP Control/Commands\nProtocol: TCP\n\nFeatures:\n• Client-server model\n• Active and Passive modes\n• Clear text authentication (insecure)\n• Alternatives: SFTP (22), FTPS (990)', tags: ['ports', 'ftp'] },
    { front: 'Port 22 - SSH', back: 'SSH (Secure Shell)\n\nPort: 22\nProtocol: TCP\nPurpose: Secure remote access\n\nFeatures:\n• Encrypted communications\n• Replaces Telnet (insecure)\n• Public key authentication\n• Port forwarding/tunneling\n\nCommands:\nssh admin@192.168.1.1\nssh -l username 192.168.1.1', tags: ['ports', 'ssh'] },
    { front: 'Port 23 - Telnet', back: 'Telnet\n\nPort: 23\nProtocol: TCP\nPurpose: Remote terminal access (legacy)\n\nCharacteristics:\n• UNSECURE - Clear text\n• No encryption\n• Being replaced by SSH\n• Still used for testing\n\nNote: Should be disabled on production devices\nUse: transport input ssh instead of telnet', tags: ['ports', 'telnet'] },
    { front: 'Port 25 - SMTP', back: 'SMTP (Simple Mail Transfer Protocol)\n\nPort: 25\nProtocol: TCP\nPurpose: Sending email\n\nRelated:\nPort 587: SMTP Submission (with auth)\nPort 465: SMTPS (SMTP over SSL)\n\nEmail Flow:\n1. Client → SMTP (25/587) → Mail Server\n2. Mail Server → SMTP (25) → Mail Server\n3. Recipient → POP3 (110) or IMAP (143) → Mail Server', tags: ['ports', 'smtp'] },
    { front: 'Port 53 - DNS', back: 'DNS (Domain Name System)\n\nPort: 53\nProtocol: UDP (queries), TCP (zone transfers)\nPurpose: Name resolution\n\nQuery Types:\n• UDP 53: Standard queries\n• TCP 53: Zone transfers, large responses\n\nCommon Records:\nA - IPv4 address\nAAAA - IPv6 address\nMX - Mail server\nNS - Name server\nPTR - Reverse lookup', tags: ['ports', 'dns'] },
    { front: 'Port 67/68 - DHCP', back: 'DHCP (Dynamic Host Configuration Protocol)\n\nPort 67: DHCP Server\nPort 68: DHCP Client\nProtocol: UDP\n\nDORA Process:\nDiscover → Offer → Request → Acknowledge\n\nLease Times:\n• Default: 24 hours\n• Renew: 50% of lease\n• Rebind: 87.5% of lease', tags: ['ports', 'dhcp'] },
    { front: 'Port 80 - HTTP', back: 'HTTP (HyperText Transfer Protocol)\n\nPort: 80\nProtocol: TCP\nPurpose: Web browsing (unencrypted)\n\nHTTP Methods:\nGET - Retrieve data\nPOST - Submit data\nPUT - Update resource\nDELETE - Remove resource\n\nSecure alternative: HTTPS (443)\n\nResponse Codes:\n200 OK\n301 Moved Permanently\n404 Not Found\n500 Server Error', tags: ['ports', 'http'] },
    { front: 'Port 110 - POP3', back: 'POP3 (Post Office Protocol version 3)\n\nPort: 110\nProtocol: TCP\nPurpose: Retrieving email\n\nCharacteristics:\n• Downloads emails to client\n• Typically deletes from server\n• Offline reading\n• Simple protocol\n\nSecure: POP3S (995)\n\nAlternative: IMAP (143) - syncs with server\nPOP3 = Single device\nIMAP = Multiple devices', tags: ['ports', 'pop3'] },
    { front: 'Port 143 - IMAP', back: 'IMAP (Internet Message Access Protocol)\n\nPort: 143\nProtocol: TCP\nPurpose: Accessing email on server\n\nCharacteristics:\n• Emails stay on server\n• Syncs across devices\n• Folders support\n• Better than POP3 for multi-device\n\nSecure: IMAPS (993)\n\nCommands:\nLOGIN - Authenticate\nSELECT - Open mailbox\nFETCH - Retrieve messages\nLOGOUT - Disconnect', tags: ['ports', 'imap'] },
    { front: 'Port 161/162 - SNMP', back: 'SNMP (Simple Network Management Protocol)\n\nPort 161: SNMP Agent (queries)\nPort 162: SNMP Manager (traps)\nProtocol: UDP\n\nVersions:\n• v1 - Basic, plaintext community strings\n• v2c - Bulk operations, still plaintext\n• v3 - Authentication and encryption\n\nCommunities:\nRead-Only (RO)\nRead-Write (RW)\n\nUsed for network monitoring and management', tags: ['ports', 'snmp'] },
    { front: 'Port 443 - HTTPS', back: 'HTTPS (HTTP Secure)\n\nPort: 443\nProtocol: TCP (with TLS/SSL)\nPurpose: Secure web browsing\n\nSecurity:\n• TLS/SSL encryption\n• Server authentication\n• Data integrity\n• Certificate-based\n\nHow it works:\n1. Client sends hello\n2. Server responds with certificate\n3. Key exchange\n4. Encrypted communication\n\nCertificate authorities verify identity', tags: ['ports', 'https'] },
    { front: 'Port 179 - BGP', back: 'BGP (Border Gateway Protocol)\n\nPort: 179\nProtocol: TCP\nPurpose: Inter-AS routing (Internet routing)\n\nTypes:\n• eBGP - Between autonomous systems\n• iBGP - Within autonomous system\n\nKey Concepts:\n• Path vector protocol\n• AS_PATH attribute\n• Slow but scalable\n• Policy-based routing\n\nUses TCP for reliable transport\nKeepalive: 60 seconds\nHold time: 180 seconds', tags: ['ports', 'bgp'] },
    { front: 'Port 3389 - RDP', back: 'RDP (Remote Desktop Protocol)\n\nPort: 3389\nProtocol: TCP\nPurpose: Remote desktop access (Windows)\n\nFeatures:\n• Graphical remote access\n• Clipboard sharing\n• Audio redirection\n• Printer redirection\n\nSecurity:\n• Should use VPN\n• Network Level Authentication\n• Consider changing default port\n\nAlternatives:\n• VNC (5900)\n• SSH (22) for CLI\n• TeamViewer, AnyDesk', tags: ['ports', 'rdp'] },
  ]
};

// ═══════════════════════════════════════════════════════════════
// ALL DECKS EXPORT
// ═══════════════════════════════════════════════════════════════

export const ALL_CCNA_DECKS = [
  NETWORK_FUNDAMENTALS_DECK,
  NETWORK_ACCESS_DECK,
  IP_CONNECTIVITY_DECK,
  IP_SERVICES_DECK,
  SECURITY_FUNDAMENTALS_DECK,
  AUTOMATION_DECK,
  PROTOCOLS_DECK,
  PORTS_DECK
];

export const FLASHCARD_DECK_DOMAIN_MAP = {
  'network-fundamentals': 'fundamentals',
  'network-access': 'network-access',
  'ip-connectivity': 'ip-connectivity',
  'ip-services': 'ip-services',
  'security-fundamentals': 'security-fundamentals',
  'automation-programmability': 'automation-programmability',
  'protocols-reference': 'fundamentals',
  'ports-reference': 'fundamentals',
};

export const FLASHCARD_DOMAIN_DECK_MAP = {
  fundamentals: ['network-fundamentals', 'protocols-reference', 'ports-reference'],
  'network-access': ['network-access'],
  'ip-connectivity': ['ip-connectivity'],
  'ip-services': ['ip-services'],
  'security-fundamentals': ['security-fundamentals'],
  'automation-programmability': ['automation-programmability'],
};

export const FLASHCARD_TAG_TOPIC_MAP = {
  // Domain 1 — Network Fundamentals
  osi: ['fundamentals-1-1-osi-tcp-ip-models'],
  model: ['fundamentals-1-1-osi-tcp-ip-models'],
  pdu: ['fundamentals-1-1-osi-tcp-ip-models'],
  comparison: ['fundamentals-1-1-osi-tcp-ip-models'],
  'tcp-ip': ['fundamentals-1-1-osi-tcp-ip-models', 'fundamentals-1-11-tcp-vs-udp'],
  ethernet: ['fundamentals-1-2-ethernet-lan-standards', 'fundamentals-1-4-csma-cd-ethernet-frames'],
  standards: ['fundamentals-1-2-ethernet-lan-standards'],
  cabling: ['fundamentals-1-2-ethernet-lan-standards'],
  duplex: ['fundamentals-1-4-csma-cd-ethernet-frames'],
  ipv4: ['fundamentals-1-7-ipv4-addressing'],
  private: ['fundamentals-1-7-ipv4-addressing'],
  addressing: ['fundamentals-1-7-ipv4-addressing', 'fundamentals-1-9-ipv6-fundamentals'],
  subnetting: ['fundamentals-1-8-ipv4-subnetting'],
  calculation: ['fundamentals-1-8-ipv4-subnetting'],
  vlsm: ['fundamentals-1-8-ipv4-subnetting'],
  cidr: ['fundamentals-1-8-ipv4-subnetting'],
  ipv6: ['fundamentals-1-9-ipv6-fundamentals', 'fundamentals-1-10-ipv6-addressing-eui-64'],
  format: ['fundamentals-1-9-ipv6-fundamentals'],
  types: ['fundamentals-1-9-ipv6-fundamentals'],
  'eui-64': ['fundamentals-1-10-ipv6-addressing-eui-64'],
  tcp: ['fundamentals-1-11-tcp-vs-udp'],
  udp: ['fundamentals-1-11-tcp-vs-udp'],
  transport: ['fundamentals-1-11-tcp-vs-udp'],
  handshake: ['fundamentals-1-11-tcp-vs-udp'],
  ports: ['fundamentals-1-12-ip-ports-applications'],

  // Domain 2 — Network Access
  'mac-table': ['network-access-2-1-switch-operation-mac-table'],
  switching: ['network-access-2-1-switch-operation-mac-table'],
  vlan: ['network-access-2-4-vlans', 'network-access-2-5-vlan-trunking-802-1q'],
  trunking: ['network-access-2-5-vlan-trunking-802-1q'],
  '802.1q': ['network-access-2-5-vlan-trunking-802-1q'],
  stp: ['network-access-2-8-stp-concepts', 'network-access-2-9-rstp-per-vlan-stp'],
  etherchannel: ['network-access-2-10-etherchannel'],
  lacp: ['network-access-2-10-etherchannel'],
  wireless: ['network-access-2-12-wireless-lan-fundamentals', 'network-access-2-14-wireless-lan-security'],

  // Domain 3 — IP Connectivity
  routing: ['ip-connectivity-3-1-router-operation', 'ip-connectivity-3-2-routing-table-fundamentals'],
  table: ['ip-connectivity-3-2-routing-table-fundamentals'],
  ad: ['ip-connectivity-3-3-administrative-distance'],
  metric: ['ip-connectivity-3-3-administrative-distance'],
  static: ['ip-connectivity-3-4-ipv4-static-routing'],
  floating: ['ip-connectivity-3-4-ipv4-static-routing'],
  ospf: ['ip-connectivity-3-6-ospf-concepts', 'ip-connectivity-3-7-ospf-configuration', 'ip-connectivity-3-8-ospf-network-types-neighbors'],
  adjacency: ['ip-connectivity-3-8-ospf-network-types-neighbors'],
  areas: ['ip-connectivity-3-9-multi-area-ospf'],
  hsrp: ['ip-connectivity-3-12-first-hop-redundancy-hsrp'],
  redundancy: ['ip-connectivity-3-12-first-hop-redundancy-hsrp'],

  // Domain 4 — IP Services
  dhcp: ['ip-services-4-6-dhcp'],
  dns: ['ip-services-4-5-dns'],
  ntp: ['ip-services-4-4-ntp'],
  snmp: ['ip-services-4-8-snmp'],
  nat: ['ip-services-4-1-nat-concepts-terminology', 'ip-services-4-2-static-nat', 'ip-services-4-3-dynamic-nat-pat'],
  pat: ['ip-services-4-3-dynamic-nat-pat'],
  syslog: ['ip-services-4-9-syslog'],
  qos: ['ip-services-4-10-qos-fundamentals'],
  ftp: ['ip-services-4-11-tftp-ftp'],
  ssh: ['ip-services-4-7-ssh-remote-access'],

  // Domain 5 — Security Fundamentals
  security: ['security-fundamentals-5-1-security-concepts'],
  cia: ['security-fundamentals-5-1-security-concepts'],
  attacks: ['security-fundamentals-5-2-attack-types'],
  acl: ['security-fundamentals-5-6-acl-fundamentals', 'security-fundamentals-5-7-advanced-acls'],
  vpn: ['security-fundamentals-5-12-vpns-site-to-site', 'security-fundamentals-5-13-vpns-remote-access'],
  ipsec: ['security-fundamentals-5-12-vpns-site-to-site'],
  device: ['security-fundamentals-5-4-password-security-aaa'],
  aaa: ['security-fundamentals-5-4-password-security-aaa'],
  layer2: ['security-fundamentals-5-9-port-security', 'security-fundamentals-5-10-dhcp-snooping', 'security-fundamentals-5-11-dynamic-arp-inspection'],
  'port-security': ['security-fundamentals-5-9-port-security'],

  // Domain 6 — Automation & Programmability
  automation: ['automation-programmability-6-1-why-network-automation'],
  benefits: ['automation-programmability-6-1-why-network-automation'],
  sdn: ['automation-programmability-6-3-sdn-architecture'],
  architecture: ['automation-programmability-6-3-sdn-architecture'],
  rest: ['automation-programmability-6-6-rest-apis'],
  api: ['automation-programmability-6-6-rest-apis'],
  json: ['automation-programmability-6-8-json-data-format'],
  tools: ['automation-programmability-6-10-ansible', 'automation-programmability-6-12-puppet-chef'],
  'dna-center': ['automation-programmability-6-5-catalyst-center-dnac'],
  cisco: ['automation-programmability-6-5-catalyst-center-dnac'],
  intent: ['automation-programmability-6-4-cisco-sdn-solutions'],
};

function _unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function _domainFromTopicId(topicId) {
  const normalized = String(topicId || '');
  return Object.keys(FLASHCARD_DOMAIN_DECK_MAP).find((domainId) => normalized.startsWith(`${domainId}-`)) || null;
}

export function inferFlashcardTopicIds(tags = [], domainId = null) {
  const normalizedDomain = domainId || null;
  const topicIds = [];

  tags
    .map((tag) => String(tag || '').toLowerCase())
    .forEach((tag) => {
      (FLASHCARD_TAG_TOPIC_MAP[tag] || []).forEach((topicId) => {
        const topicDomain = _domainFromTopicId(topicId);
        if (!normalizedDomain || topicDomain === normalizedDomain) topicIds.push(topicId);
      });
    });

  return _unique(topicIds);
}

export function normalizeCcnaFlashcardDeck(deck) {
  const domainId = deck.domainId || FLASHCARD_DECK_DOMAIN_MAP[deck.id] || deck.category || 'general';
  const deckTags = _unique([...(deck.tags || []), `domain:${domainId}`, `deck:${deck.id}`]);

  return {
    ...deck,
    domainId,
    tags: deckTags,
    cards: (deck.cards || []).map((card) => {
      const rawTags = _unique(card.tags || []);
      const topicIds = _unique([
        ...(card.topicIds || []),
        ...inferFlashcardTopicIds(rawTags, domainId),
      ]);

      return {
        ...card,
        domainId,
        topicIds,
        tags: _unique([
          ...rawTags,
          `domain:${domainId}`,
          ...topicIds.map((topicId) => `topic:${topicId}`),
        ]),
      };
    }),
  };
}

export function getNormalizedCcnaDecks() {
  return ALL_CCNA_DECKS.map((deck) => normalizeCcnaFlashcardDeck(deck));
}

function _sameStringArray(a = [], b = []) {
  const left = _unique(a).sort();
  const right = _unique(b).sort();
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function ensureCcnaFlashcardDecks(engine) {
  if (!engine || typeof engine.getDeck !== 'function') return { deckCount: 0, cardCount: 0 };

  const normalizedDecks = getNormalizedCcnaDecks();
  let cardCount = 0;

  normalizedDecks.forEach((sourceDeck) => {
    let deck = engine.getDeck(sourceDeck.id);
    if (!deck) {
      deck = engine.createDeck({
        id: sourceDeck.id,
        name: sourceDeck.name,
        description: sourceDeck.description,
        category: sourceDeck.category,
        tags: sourceDeck.tags,
        domainId: sourceDeck.domainId,
      });
    } else if (
      deck.domainId !== sourceDeck.domainId ||
      deck.name !== sourceDeck.name ||
      deck.description !== sourceDeck.description ||
      deck.category !== sourceDeck.category ||
      !_sameStringArray(deck.tags, sourceDeck.tags)
    ) {
      engine.updateDeck(sourceDeck.id, {
        name: sourceDeck.name,
        description: sourceDeck.description,
        category: sourceDeck.category,
        tags: sourceDeck.tags,
        domainId: sourceDeck.domainId,
      });
      deck = engine.getDeck(sourceDeck.id);
    }

    sourceDeck.cards.forEach((sourceCard) => {
      cardCount += 1;
      const existingCard = (deck.cards || []).find((candidate) => (
        (sourceCard.id && candidate.id === sourceCard.id) || candidate.front === sourceCard.front
      ));

      if (!existingCard) {
        engine.createCard(sourceDeck.id, sourceCard);
        return;
      }

      if (
        existingCard.domainId !== sourceCard.domainId ||
        !_sameStringArray(existingCard.topicIds, sourceCard.topicIds) ||
        !_sameStringArray(existingCard.tags, sourceCard.tags)
      ) {
        engine.updateCard(sourceDeck.id, existingCard.id, {
          tags: sourceCard.tags,
          domainId: sourceCard.domainId,
          topicIds: sourceCard.topicIds,
        });
      }
    });
  });

  return { deckCount: normalizedDecks.length, cardCount };
}

export default ALL_CCNA_DECKS;
