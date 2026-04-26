/**
 * resourceLibrary.js — CCNA Focus Resource Library
 * 
 * Features:
 * - CCNA-focused content (only exam-relevant ports, protocols, commands)
 * - Flashcard/Anki mode for active recall with spaced repetition
 * - Enhanced search functionality
 * - CLI Commands section with terminal UI
 * 
 * Depends on: eventBus
 */

import { eventBus } from '../js/eventBus.js';
import { escapeHtml } from '../utils/helperFunctions.js';
import { flashcardEngine } from '../js/flashcardEngine.js';
import { ensureCcnaFlashcardDecks } from '../data/ccnaFlashcards.js';
import { progressEngine } from '../js/progressEngine.js';
import { renderTokenIcon } from '../utils/tokenIcons.js';

const SECTIONS = [
  {
    id: 'home', icon: 'FOCUS', title: 'Quick Review',
    desc: 'CCNA exam highlights',
    content: () => _renderQuickReview(),
  },
  {
    id: 'ports', icon: 'PORT', title: 'Ports',
    desc: 'Must-know port numbers',
    content: () => _renderPortsTable(),
  },
  {
    id: 'protocols', icon: 'ARP', title: 'Protocols',
    desc: 'Key protocols & layers',
    content: () => _renderProtocols(),
  },
  {
    id: 'cli', icon: 'CLI', title: 'CLI Commands',
    desc: 'Essential Cisco commands',
    content: (ctx) => _renderCLICommands(ctx?._cliIndex ?? 0),
  },
  {
    id: 'osi', icon: 'LEARN', title: 'OSI Model',
    desc: '7 layers + mnemonics',
    content: () => _renderOSIRef(),
  },
  {
    id: 'subnet', icon: 'SUBNET', title: 'Subnetting',
    desc: 'CIDR & VLSM quick ref',
    content: () => _renderSubnetRef(),
  },
  {
    id: 'glossary', icon: 'DOCS', title: 'Glossary',
    desc: 'Searchable terms',
    content: () => _renderGlossary(),
  },
];

const FLASHCARD_LAUNCH_CONTEXT_KEY = 'netlearn:flashcardLaunchContext';

const PORT_CATEGORIES = {
  critical: {
    name: 'CCNA Core',
    desc: 'Exam-first ports you should recall instantly.',
    icon: 'FOCUS',
    color: 'var(--color-error)',
    ports: ['22','23','53','67','68','80','161','179','443'],
  },
  important: {
    name: 'Must Know',
    desc: 'Common services that show up across labs and enterprise basics.',
    icon: 'PORTS',
    color: 'var(--color-amber)',
    ports: ['20','21','25','110','143','389','445','587','993','995','3389'],
  },
  networking: {
    name: 'Network Operations',
    desc: 'Infrastructure control, logging, timing, and routing support ports.',
    icon: 'NET',
    color: 'var(--color-cyan)',
    ports: ['69','123','162','514','520'],
  },
};

const PORTS = [
  ['20','TCP','FTP Data (Data Transfer)', 'important'],
  ['21','TCP','FTP Control (Command)', 'important'],
  ['22','TCP','SSH - Secure Shell', 'critical'],
  ['23','TCP','Telnet (UNSECURE - Legacy)', 'critical'],
  ['25','TCP','SMTP - Simple Mail Transfer', 'important'],
  ['53','TCP/UDP','DNS - Domain Name System', 'critical'],
  ['67','UDP','DHCP Server', 'critical'],
  ['68','UDP','DHCP Client', 'critical'],
  ['69','UDP','TFTP - Trivial FTP', 'networking'],
  ['80','TCP','HTTP - Web', 'critical'],
  ['110','TCP','POP3 - Mail Retrieval', 'important'],
  ['123','UDP','NTP - Network Time', 'networking'],
  ['143','TCP','IMAP - Mail Access', 'important'],
  ['161','UDP','SNMP - Simple Network Management', 'critical'],
  ['162','UDP','SNMP Trap', 'networking'],
  ['179','TCP','BGP - Border Gateway Protocol', 'critical'],
  ['389','TCP','LDAP - Directory Services', 'important'],
  ['443','TCP','HTTPS - Secure Web', 'critical'],
  ['445','TCP','SMB - Server Message Block', 'important'],
  ['514','UDP','Syslog', 'networking'],
  ['520','UDP','RIP - Routing Information Protocol', 'networking'],
  ['587','TCP','SMTP Submission', 'important'],
  ['993','TCP','IMAPS', 'important'],
  ['995','TCP','POP3S', 'important'],
  ['3389','TCP','RDP - Remote Desktop', 'important'],
];

const PROTOCOLS = [
  { name:'ARP', full:'Address Resolution Protocol', layer:'L2/L3', category:'addressing',
    question:'How does ARP work?',
    answer:'When a host needs to send to an IP, it broadcasts an ARP request ("Who has 192.168.1.1? Tell 192.168.1.10") to ffff.ffff.ffff. The target replies with its MAC via unicast. Both devices cache the mapping in their ARP table. ARP operates at Layer 2/3 and entries expire after ~4 hours.' },
  { name:'ICMP', full:'Internet Control Message Protocol', layer:'L3', category:'diagnostics',
    question:'What does ICMP do and what are key message types?',
    answer:'ICMP is a Layer 3 (Network Layer) protocol for diagnostics and error reporting. Key types: Echo Request / Echo Reply (ping, connectivity test), Destination Unreachable (host/network unreachable), Time Exceeded (TTL expired, used by traceroute). No port numbers unlike TCP/UDP. Command: ping ip-address.' },
  { name:'DHCP', full:'Dynamic Host Configuration', layer:'L7', category:'management',
    question:'Describe the DHCP DORA process.',
    answer:'DISCOVER: Client broadcasts to find DHCP servers. OFFER: Server replies with available IP, subnet, gateway, DNS, lease time. REQUEST: Client broadcasts selected offer. ACK: Server confirms the lease. Uses UDP 67 (server) and UDP 68 (client). Lease renewal at 50% of lease time. Server pings address before offering to detect conflicts.' },
  { name:'DNS', full:'Domain Name System', layer:'L7', category:'application',
    question:'How does DNS work and what are key record types?',
    answer:'Translates hostnames to IP addresses. Uses both UDP and TCP port 53. Key record types: A (hostname→IPv4), AAAA (hostname→IPv6), CNAME (alias), MX (mail server), NS (nameserver), PTR (reverse lookup), SOA (zone admin). Client sends recursive query; DNS server performs iterative queries up the hierarchy (root → TLD → authoritative).' },
  { name:'TCP', full:'Transmission Control Protocol', layer:'L4', category:'transport',
    question:'Describe TCP features: handshake, reliability, flow control.',
    answer:'Connection-oriented. 3-way handshake: SYN (client) → SYN-ACK (server) → ACK (client). Reliability via sequence and acknowledgment numbers. Flow control via sliding window (Window Size field). Error detection via Checksum. 4-way termination: FIN → ACK → FIN → ACK. Header: 20-60 bytes. Used by HTTP, HTTPS, FTP, SMTP, SSH.' },
  { name:'UDP', full:'User Datagram Protocol', layer:'L4', category:'transport',
    question:'What is UDP and when is it preferred?',
    answer:'Connectionless, unreliable, no ordering. Header: 8 bytes fixed. Used when speed > reliability: VoIP, video streaming, DNS queries, DHCP, online gaming. No handshake, no flow control, no sequencing. Still uses checksum for error detection. Port numbers 0-65535.' },
  { name:'OSPF', full:'Open Shortest Path First', layer:'L3', category:'routing',
    question:'OSPF fundamentals: algorithm, areas, cost, election.',
    answer:'Link-state IGP. Algorithm: Dijkstra SPF. AD: 110. Metric: Cost (reference bandwidth / interface bandwidth). Hierarchical design with areas (Area 0 = backbone). DR/BDR election on multi-access networks (highest priority/RID wins). Hello/Dead: 10s/40s. LSA types for topology info. Classless, VLSM/CIDR support.' },
  { name:'BGP', full:'Border Gateway Protocol', layer:'L4', category:'routing',
    question:'BGP fundamentals: type, port, AD, key concepts.',
    answer:'Path-vector EGP. TCP port 179. AD: eBGP=20, iBGP=200. Used for internet routing between AS. Key attributes: AS-Path, Next-Hop, Local Preference, MED, Weight. iBGP full mesh required. BGP attributes guide path selection. No automatic discovery — neighbors configured manually.' },
  { name:'EIGRP', full:'Enhanced IGRP', layer:'L3', category:'routing',
    question:'EIGRP fundamentals: algorithm, AD, metrics, packet types.',
    answer:'Cisco-proprietary advanced distance-vector (hybrid). Algorithm: DUAL (Diffusing Update Algorithm). AD: internal=90, external=170. Metrics: bandwidth + delay (default), load + reliability optional. Five packet types: Hello, Update, Query, Reply, ACK. Fast convergence with partial updates. Supports unequal-cost load balancing. Multi-protocol (IPX, AppleTalk, IP).' },
  { name:'RIP', full:'Routing Information Protocol', layer:'L3', category:'routing',
    question:'RIP fundamentals: metric, timers, versions.',
    answer:'Distance-vector IGP. Metric: hop count (max 15 hops; 16 = unreachable). AD: 120. Timers: Update 30s, Invalid 180s, Holddown 180s, Flush 240s. RIPv1: classful, no VLSM, no auth. RIPv2: classless, VLSM, MD5 auth. Auto-summary enabled by default (disable with no auto-summary). Config: router rip, version 2, network.' },
  { name:'STP', full:'Spanning Tree Protocol', layer:'L2', category:'switching',
    question:'How does STP prevent loops and what are port states?',
    answer:'IEEE 802.1D. Prevents Layer 2 loops by blocking redundant ports. Root bridge election: lowest Bridge ID (priority + MAC). Root port: lowest cost to root. Designated port: lowest cost on each segment. Port costs: 10M=100, 100M=19, 1G=4, 10G=2. States: Disabled → Blocking (20s) → Listening (15s) → Learning (15s) → Forwarding. Convergence up to 50s. PortFast skips listening/learning for access ports.' },
  { name:'VLAN', full:'Virtual LAN', layer:'L2', category:'switching',
    question:'What are VLANs, trunking, and inter-VLAN routing?',
    answer:'VLANs create separate broadcast domains at Layer 2 (one subnet per VLAN). VLAN range: 1-4094 (0 and 4095 reserved). Default VLAN 1 cannot be deleted. 802.1Q trunk adds 4-byte tag with 12-bit VLAN ID (4096 values). Native VLAN = untagged (default VLAN 1). Inter-VLAN routing: Router-on-a-Stick (subinterfaces + dot1Q) or Layer 3 switch (SVIs). Config: switchport mode access/trunk, switchport access vlan id.' },
  { name:'NAT', full:'Network Address Translation', layer:'L3', category:'addressing',
    question:'NAT types and RFC 1918 private address ranges.',
    answer:'Translates private→public IPs. Static NAT: 1:1 permanent mapping. Dynamic NAT: 1:1 from pool (limited by pool size). PAT/Overload: many:1 using source ports (most common). RFC 1918 private: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. Inside local=internal real IP. Inside global=translated public IP. Config: ip nat inside/outside on interfaces.' },
  { name:'ACL', full:'Access Control Lists', layer:'L3', category:'security',
    question:'Standard vs Extended ACLs: ranges, matching, placement.',
    answer:'Standard (1-99, 1300-1999): match source IP only. Extended (100-199, 2000-2699): match source, destination IP, protocol, port. Sequential processing (first match wins). Ends with implicit deny all. Placement: Standard ACLs close to destination; Extended ACLs close to source. Wildcard mask = 255.255.255.255 - subnet mask. any = 0.0.0.0 255.255.255.255. host = single host.' },
  { name:'HSRP', full:'Hot Standby Router Protocol', layer:'L3', category:'redundancy',
    question:'HSRP operation: election, states, timers, virtual MAC.',
    answer:'Cisco-proprietary FHRP. Provides redundant default gateway. Virtual MAC: 0000.0c07.acXX (XX=group). Priority: 0-255 (default 100, higher wins). States: Initial → Learn → Listen → Standby → Active. Timers: Hello 3s, Hold 10s. Preempt allows higher-priority router to take over. Only active router responds to ARP for VIP. Standby router monitors active via hello messages.' },
  { name:'VRRP', full:'Virtual Router Redundancy Protocol', layer:'L3', category:'redundancy',
    question:'VRRP vs HSRP: differences in standard, MAC, multicast.',
    answer:'Standards-based FHRP (RFC 2338, IETF). Similar operation to HSRP but open standard. Virtual MAC: 0000.5e00.01XX (XX=group). Priority: 0-254 (default 100, higher wins). Master election: highest priority, then highest IP. Uses IP protocol 112 (HSRP uses UDP 2029). Supports preemption. Can load balance using multiple VIPs with different master routers.' },
];

  const CLI_COMMANDS = [
  { category: 'Basic Security', icon: 'LOCK', prompt: 'R1(config)#', mode: 'Security config', summary: 'Privilege, password, and remote-access hardening', commands: [
    { cmd:'enable', desc:'Enter privileged EXEC mode' },
    { cmd:'configure terminal', desc:'Enter global configuration mode' },
    { cmd:'enable secret <password>', desc:'Set encrypted enable password' },
    { cmd:'service password-encryption', desc:'Encrypt all passwords in config' },
    { cmd:'line console 0', desc:'Enter console line configuration' },
    { cmd:'login', desc:'Require password for console access' },
    { cmd:'transport input ssh', desc:'Allow only SSH on VTY lines' },
  ]},
  { category: 'Interface Configuration', icon: 'NET', prompt: 'R1(config-if)#', mode: 'Interface mode', summary: 'Addressing, state, and physical interface tuning', commands: [
    { cmd:'interface <type><number>', desc:'Enter interface config mode' },
    { cmd:'ip address <ip> <mask>', desc:'Assign IP and subnet mask' },
    { cmd:'no shutdown', desc:'Enable the interface' },
    { cmd:'shutdown', desc:'Disable the interface' },
    { cmd:'description <text>', desc:'Add interface description' },
    { cmd:'ip helper-address <ip>', desc:'Enable DHCP relay to specific server' },
    { cmd:'ip nat inside', desc:'Mark interface as NAT inside' },
    { cmd:'ip nat outside', desc:'Mark interface as NAT outside' },
    { cmd:'bandwidth <kbps>', desc:'Set interface bandwidth' },
    { cmd:'delay <tens-of-microseconds>', desc:'Set interface delay' },
    { cmd:'mtu <bytes>', desc:'Set Maximum Transmission Unit' },
    { cmd:'speed <10|100|1000|auto>', desc:'Set interface speed' },
    { cmd:'duplex <full|half|auto>', desc:'Set duplex mode' },
  ]},
  { category: 'Routing', icon: 'CYCLE', prompt: 'R1(config-router)#', mode: 'Routing mode', summary: 'Static and dynamic route control', commands: [
    { cmd:'ip routing', desc:'Enable IP routing on switch' },
    { cmd:'router ospf <process-id>', desc:'Enable OSPF routing' },
    { cmd:'network <wildcard> area <id>', desc:'Add network to OSPF' },
    { cmd:'router eigrp <as>', desc:'Enable EIGRP routing' },
    { cmd:'network <wildcard>', desc:'Add network to EIGRP' },
    { cmd:'router rip', desc:'Enable RIP routing' },
    { cmd:'network <network>', desc:'Add network to RIP' },
    { cmd:'ip route <dest> <mask> <next-hop>', desc:'Configure static route' },
    { cmd:'ip default-gateway <ip>', desc:'Set default gateway for L3 device' },
    { cmd:'default-information originate', desc:'Inject default route into OSPF' },
  ]},
  { category: 'VLAN Configuration', icon: 'SW', prompt: 'SW1(config-vlan)#', mode: 'VLAN mode', summary: 'VLAN creation and access-port membership', commands: [
    { cmd:'vlan <id>', desc:'Create VLAN' },
    { cmd:'name <vlan-name>', desc:'Name the VLAN' },
    { cmd:'no vlan <id>', desc:'Delete VLAN' },
    { cmd:'switchport mode access', desc:'Set port as access port' },
    { cmd:'switchport access vlan <id>', desc:'Assign port to VLAN' },
    { cmd:'show vlan brief', desc:'Display VLAN information' },
    { cmd:'show vlan', desc:'Show VLAN database' },
  ]},
  { category: 'L2 Trunking', icon: 'L2', prompt: 'SW1(config-if)#', mode: 'Trunk mode', summary: '802.1Q trunks, native VLAN, and allowed lists', commands: [
    { cmd:'switchport mode trunk', desc:'Set port as trunk port' },
    { cmd:'switchport mode dynamic auto', desc:'Set to negotiate trunk' },
    { cmd:'switchport mode dynamic desirable', desc:'Set to actively negotiate' },
    { cmd:'switchport trunk allowed vlan <nums>', desc:'Allow specific VLANs on trunk' },
    { cmd:'switchport trunk native vlan <id>', desc:'Set native VLAN' },
    { cmd:'switchport trunk pruning vlan <nums>', desc:'Enable VLAN pruning' },
    { cmd:'encapsulation dot1q <vlan>', desc:'Set VLAN encapsulation on subinterface' },
    { cmd:'show interface trunk', desc:'Display trunk port status' },
    { cmd:'show interface <if> switchport', desc:'Show switchport info' },
  ]},
  { category: 'STP & EtherChannel', icon: 'FOCUS', prompt: 'SW1(config)#', mode: 'L2 control mode', summary: 'Loop prevention and bundle formation', commands: [
    { cmd:'spanning-tree mode pvst', desc:'Enable Per-VLAN STP' },
    { cmd:'spanning-tree mode rapid-pvst', desc:'Enable rapid PVST' },
    { cmd:'spanning-tree vlan <id> root primary', desc:'Make switch root bridge for VLAN' },
    { cmd:'spanning-tree vlan <id> root secondary', desc:'Set as backup root bridge' },
    { cmd:'spanning-tree portfast', desc:'Enable portfast on access port' },
    { cmd:'spanning-tree bpduguard', desc:'Enable BPDU guard on port' },
    { cmd:'spanning-tree bpdufilter', desc:'Disable BPDU transmission' },
    { cmd:'spanning-tree uplinkfast', desc:'Enable UplinkFast' },
    { cmd:'channel-group <num> mode active', desc:'Create EtherChannel LACP' },
    { cmd:'channel-group <num> mode passive', desc:'Create passive LACP' },
    { cmd:'channel-group <num> mode on', desc:'Create static EtherChannel' },
    { cmd:'port-channel load-balance', desc:'Set load balancing method' },
  ]},
  { category: 'Management & Troubleshooting', icon: 'LOG', prompt: 'R1#', mode: 'Exec mode', summary: 'Verification, visibility, and live diagnostics', commands: [
    { cmd:'show ip interface brief', desc:'Show IP interface status summary' },
    { cmd:'show running-config', desc:'Display current configuration' },
    { cmd:'show startup-config', desc:'Show saved configuration' },
    { cmd:'show interfaces', desc:'Show detailed interface info' },
    { cmd:'show ip route', desc:'Display routing table' },
    { cmd:'show protocols', desc:'Show routing protocols running' },
    { cmd:'show spanning-tree', desc:'Show STP information' },
    { cmd:'show etherchannel summary', desc:'Show EtherChannel info' },
    { cmd:'ping <ip>', desc:'Test connectivity' },
    { cmd:'traceroute <ip>', desc:'Trace path to destination' },
    { cmd:'copy running-config startup-config', desc:'Save configuration to NVRAM' },
    { cmd:'write memory', desc:'Save configuration' },
  ]},
  { category: 'NAT & ACL', icon: 'CONFIG', prompt: 'R1(config)#', mode: 'Policy mode', summary: 'Translation rules and traffic filtering', commands: [
    { cmd:'ip nat pool <name> <start> <end> netmask', desc:'Define NAT address pool' },
    { cmd:'ip nat inside source list <acl> pool <name>', desc:'Configure dynamic NAT' },
    { cmd:'ip nat inside source list <acl> overload', desc:'Configure PAT (NAT overload)' },
    { cmd:'ip nat inside source static <local> <global>', desc:'Configure static NAT' },
    { cmd:'show ip nat translations', desc:'Show NAT translations' },
    { cmd:'show ip nat statistics', desc:'Show NAT statistics' },
    { cmd:'clear ip nat translation', desc:'Clear NAT translations' },
    { cmd:'access-list <num> permit <protocol> <src> <dst>', desc:'Create ACL entry' },
    { cmd:'access-list <num> deny <protocol> <src> <dst>', desc:'Create ACL deny entry' },
    { cmd:'ip access-list standard <name>', desc:'Create named standard ACL' },
    { cmd:'ip access-list extended <name>', desc:'Create named extended ACL' },
    { cmd:'ip access-group <acl> in/out', desc:'Apply ACL to interface' },
  ]},
];

const OSI_LAYERS = [
  {n:7,name:'Application', color:'#ff6b6b', pdu:'Data', protocols:'HTTP, DNS, DHCP, FTP, SSH', mnemonicA:'All', mnemonicP:'Away'},
  {n:6,name:'Presentation',color:'#feca57', pdu:'Data', protocols:'SSL, JPEG, GIF, MIME', mnemonicA:'People', mnemonicP:'Pizza'},
  {n:5,name:'Session',     color:'#48dbfb', pdu:'Data', protocols:'NetBIOS, RPC, PPTP', mnemonicA:'Seem', mnemonicP:'Sausage'},
  {n:4,name:'Transport',   color:'#1dd1a1', pdu:'Segment', protocols:'TCP, UDP', mnemonicA:'To', mnemonicP:'Throw'},
  {n:3,name:'Network',     color:'#5f27cd', pdu:'Packet', protocols:'IP, ICMP, ARP, IGMP', mnemonicA:'Need', mnemonicP:'Not'},
  {n:2,name:'Data Link',   color:'#ff9ff3', pdu:'Frame', protocols:'Ethernet, Wi-Fi, PPP', mnemonicA:'Data', mnemonicP:'Do'},
  {n:1,name:'Physical',    color:'#54a0ff', pdu:'Bits', protocols:'Cables, Hubs', mnemonicA:'Processing', mnemonicP:'Please'},
];

const CIDR_TABLE = [
  ['/8','255.0.0.0','16M','Class A','11111111.00000000.00000000.00000000'],
  ['/16','65K','Class B','11111111.11111111.00000000.00000000'],
  ['/24','254','Class C','11111111.11111111.11111111.00000000'],
  ['/25','126','Half /24','11111111.11111111.11111111.10000000'],
  ['/26','62','Quarter /24','11111111.11111111.11111111.11000000'],
  ['/27','30','Eighth /24','11111111.11111111.11111111.11100000'],
  ['/28','14','16 hosts','11111111.11111111.11111111.11110000'],
  ['/29','6','Point-to-Point','11111111.11111111.11111111.11111000'],
  ['/30','2','Router links','11111111.11111111.11111111.11111100'],
  ['/32','1','Single host','11111111.11111111.11111111.11111111'],
];

const GLOSSARY_GROUPS = {
  core: {
    name: 'Core Networking',
    desc: 'Fundamental language for scope, forwarding, and basic device behavior.',
    icon: 'FOCUS',
    color: 'var(--color-cyan)',
  },
  routing: {
    name: 'Addressing & Routing',
    desc: 'Subnetting, routing trust, and packet-lifetime concepts used across CCNA paths.',
    icon: 'CYCLE',
    color: 'var(--color-amber)',
  },
  operations: {
    name: 'Switching & Services',
    desc: 'Switch tables, control messages, and support workflows that appear in labs.',
    icon: 'SW',
    color: 'var(--color-green)',
  },
};

const GLOSSARY_TERMS = [
  { term: 'Broadcast Domain', group: 'core', def: 'All devices receiving Layer 2 broadcasts. Routers separate broadcast domains.' },
  { term: 'Collision Domain', group: 'core', def: 'Area where frame collisions can occur. Switches segment collision domains.' },
  { term: 'Default Gateway', group: 'core', def: 'Router IP address for destinations outside local subnet.' },
  { term: 'MAC Address', group: 'core', def: '48-bit hardware address. OUI + NIC.' },
  { term: 'MTU', group: 'core', def: 'Maximum Transmission Unit. Default 1500 bytes for Ethernet.' },
  { term: 'Administrative Distance', group: 'routing', def: 'Trust level of route (0-255). Lower = more trustworthy.' },
  { term: 'ARP', group: 'routing', def: 'Maps IP to MAC. Broadcast request, unicast reply. Cache = 4 hours.' },
  { term: 'VLSM', group: 'routing', def: 'Variable Length Subnet Masking. Different prefix lengths per subnet.' },
  { term: 'Wildcard Mask', group: 'routing', def: 'Inverse of subnet mask. 0 = match, 1 = ignore.' },
  { term: 'TTL', group: 'routing', def: 'Time To Live. Prevents routing loops. Decremented each hop.' },
  { term: 'LSA', group: 'routing', def: 'Link State Advertisement. OSPF routing information.' },
  { term: 'CAM Table', group: 'operations', def: 'Switch table storing MAC addresses and ports.' },
  { term: 'VTP', group: 'operations', def: 'VLAN Trunking Protocol. Cisco. Modes: Server, Client, Transparent.' },
  { term: 'BPDU', group: 'operations', def: 'Bridge Protocol Data Unit. STP messages.' },
  { term: 'DORA', group: 'operations', def: 'DHCP: Discover, Offer, Request, Acknowledge.' },
];

class ResourceLibrary {
  constructor() {
    this.container = null;
    this._activeSection = 'home';
    this._flashcardMode = false;
    this._flashcardView = 'decks'; // 'decks' | 'study' | 'stats' | 'edit'
    this._currentDeckId = null;
    this._currentSession = null;
    this._isFlipped = false;
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._searchTerm = '';
    this._learnedCards = new Set();
    this._cliIndex = 0;
    this._cliInitTimer = null;
    this._searchDebounce = null;
    this._flashcardOpenTimer = null;
    this._flashcardNotice = null;
    this._flashcardLaunchContext = null;
    
    // CCNA decks are synchronized during route init so module import stays side-effect light.
  }
  
  /**
   * Initialize CCNA flashcard decks if they don't exist
   */
  _initializeCCNADecks() {
    ensureCcnaFlashcardDecks(flashcardEngine);
  }

  init(containerEl) {
    this.container = containerEl;
    this._initializeCCNADecks();
    this._flashcardLaunchContext = this._consumeFlashcardLaunchContext();
    this._render();
    
    // Auto-open flashcards when launched from dashboard CTA, lesson/domain context, or /flashcards route.
    const openFromDashboard = sessionStorage.getItem('openFlashcards') === 'true';
    const openFromRoute = window.location.hash === '#/flashcards';
    const hasActiveSession = flashcardEngine.hasActiveSession();
    if (openFromDashboard || openFromRoute || this._flashcardLaunchContext || hasActiveSession) {
      if (openFromDashboard) sessionStorage.removeItem('openFlashcards');
      // Small delay to ensure DOM is ready
      this._flashcardOpenTimer = setTimeout(() => {
        this._flashcardOpenTimer = null;
        if (this._flashcardLaunchContext) {
          this._openFlashcardsFromContext(this._flashcardLaunchContext);
        } else if (!this._flashcardMode) {
          this._toggleFlashcardPanel();
        }
      }, 100);
    }
  }

  _render() {
    const active = SECTIONS.find(s => s.id === this._activeSection);

    this.container.innerHTML = `
      <div class="reslib-shell">
        <div class="module-header reslib-shell__header">
          <div class="module-header__breadcrumb">
            <a href="#/">Home</a> › <span>CCNA Resources</span>
          </div>
          <h1 class="module-header__title">
            ${renderTokenIcon('DOCS', 'module-header__title-icon')}CCNA Study Resources
          </h1>
          <p class="module-header__description">
            Essential references for the CCNA 200-301 exam. Use <strong>Flashcard Mode</strong> for active recall practice.
          </p>
        </div>

        <div class="reslib-toolbar">
          <label class="sr-only" for="global-search">Search resources</label>
          <div class="reslib-search-wrap">
            <span class="reslib-search-icon">${renderTokenIcon('FOCUS', 'learning-token-icon')}</span>
            <input
              type="text"
              id="global-search"
              class="reslib-search-input"
              placeholder="Search ports, protocols, commands..."
              autocomplete="off"
            >
          </div>
          <button id="flashcard-toggle" class="reslib-flashcard-btn">
            ${renderTokenIcon('LEARN', 'learning-token-icon')}Flashcard Mode
          </button>
        </div>

        <div id="search-results" class="reslib-search-results" role="status" aria-live="polite" aria-atomic="true" style="display:none;"></div>

        <div class="reslib-section-grid">
          ${SECTIONS.map(s => `
            <button
              type="button"
              class="lib-section-btn reslib-section-btn ${s.id === this._activeSection ? 'is-active' : ''}"
              data-section="${s.id}"
            >
              <span class="reslib-section-btn__icon">${renderTokenIcon(s.icon, 'learning-token-icon')}</span>
              <span class="reslib-section-btn__title">${s.title}</span>
              <span class="reslib-section-btn__desc">${s.desc}</span>
            </button>
          `).join('')}
        </div>

        <div id="flashcard-panel" class="ops-flash__panel-host hidden" aria-hidden="true"></div>

        <div id="lib-content" class="reslib-content anim-fade-in">
          ${active ? active.content(this) : ''}
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    this.container.querySelectorAll('.lib-section-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._activateSection(btn.getAttribute('data-section'), { scrollIntoView: true });
      });
    });

    const searchInput = this.container.querySelector('#global-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        if (this._searchDebounce) clearTimeout(this._searchDebounce);
        const value = e.target.value;
        this._searchDebounce = setTimeout(() => this._handleSearch(value), 200);
      });
    }

    const flashcardBtn = this.container.querySelector('#flashcard-toggle');
    flashcardBtn?.addEventListener('click', () => this._toggleFlashcardPanel());

    if (this._activeSection === 'cli') this._scheduleCliInit();
    if (this._activeSection === 'protocols') this._bindProtocolInspectCards();
  }

  _activateSection(sectionId, { scrollIntoView = false } = {}) {
    this._activeSection = sectionId;
    this._unbindKeyboardNav();

    this.container.querySelectorAll('.lib-section-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-section') === this._activeSection;
      btn.classList.toggle('is-active', isActive);
    });

    const section = SECTIONS.find(s => s.id === this._activeSection);
    const content = this.container.querySelector('#lib-content');
    const flashcardPanel = this.container.querySelector('#flashcard-panel');
    if (!content || !section) return;

    content.innerHTML = section.content(this);
    content.className = 'anim-fade-in';
    if (flashcardPanel) {
      flashcardPanel.classList.add('hidden');
      flashcardPanel.setAttribute('aria-hidden', 'true');
    }

    if (this._activeSection === 'cli') {
      this._scheduleCliInit();
    }
    if (this._activeSection === 'protocols') {
      this._bindProtocolInspectCards();
    }

    if (scrollIntoView) {
      requestAnimationFrame(() => {
        content.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  _bindProtocolInspectCards() {
    const cards = this.container?.querySelectorAll('.reslib-protocol-entry');
    if (!cards || cards.length === 0) return;

    cards.forEach((card) => {
      card.addEventListener('click', () => this._toggleProtocolInspectCard(card));
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this._toggleProtocolInspectCard(card);
        }
      });
    });
  }

  _toggleProtocolInspectCard(card) {
    const shouldExpand = !card.classList.contains('is-inspected');
    this.container?.querySelectorAll('.reslib-protocol-entry.is-inspected').forEach((entry) => {
      entry.classList.remove('is-inspected');
      entry.setAttribute('aria-expanded', 'false');
      const hint = entry.querySelector('.reslib-protocol-entry__inspect');
      if (hint) hint.textContent = 'Click to inspect details';
    });

    if (shouldExpand) {
      card.classList.add('is-inspected');
      card.setAttribute('aria-expanded', 'true');
    } else {
      card.classList.remove('is-inspected');
      card.setAttribute('aria-expanded', 'false');
    }

    const inspectHint = card.querySelector('.reslib-protocol-entry__inspect');
    if (inspectHint) {
      inspectHint.textContent = shouldExpand ? 'Click to hide details' : 'Click to inspect details';
    }
  }

  _scheduleCliInit() {
    if (this._cliInitTimer) {
      clearTimeout(this._cliInitTimer);
      this._cliInitTimer = null;
    }
    this._cliInitTimer = setTimeout(() => {
      this._cliInitTimer = null;
      if (!this.container) return;
      this._initCLI();
    }, 100);
  }

  _initCLI() {
    const cliContainer = this.container.querySelector('#cli-commands');
    if (!cliContainer) return;
    const currentIndex = Number.isInteger(this._cliIndex) ? this._cliIndex : 0;
    this._renderCLIIndex(currentIndex);
    this._bindCLIControls();
  }

  _bindCLIControls() {
    const prevBtn = this.container.querySelector('#cli-prev');
    const nextBtn = this.container.querySelector('#cli-next');
    const dots = this.container.querySelectorAll('.cli-dot');

    prevBtn?.addEventListener('click', () => {
      this._cliIndex = (this._cliIndex - 1 + CLI_COMMANDS.length) % CLI_COMMANDS.length;
      this._renderCLIIndex(this._cliIndex);
    });

    nextBtn?.addEventListener('click', () => {
      this._cliIndex = (this._cliIndex + 1) % CLI_COMMANDS.length;
      this._renderCLIIndex(this._cliIndex);
    });

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        this._cliIndex = parseInt(dot.getAttribute('data-index'));
        this._renderCLIIndex(this._cliIndex);
      });
    });

    this._bindKeyboardNav('cli');
  }

  _bindKeyboardNav(mode) {
    this._unbindKeyboardNav();
    
    const handler = (e) => {
      if (mode === 'cli') {
        if (e.key === 'ArrowLeft') {
          this._cliIndex = (this._cliIndex - 1 + CLI_COMMANDS.length) % CLI_COMMANDS.length;
          this._renderCLIIndex(this._cliIndex);
        } else if (e.key === 'ArrowRight') {
          this._cliIndex = (this._cliIndex + 1) % CLI_COMMANDS.length;
          this._renderCLIIndex(this._cliIndex);
        }
      } else if (mode === 'flashcards' && this._flashcardMode) {
        const modal = document.getElementById('fc-global-modal');
        if (!modal) return;
        
        // Check if we're in study mode (has a current session)
        if (this._currentSession) {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._flipCardInModal(modal);
          } else if (e.key === 'ArrowLeft') {
            this._previousCardInModal(modal);
          } else if (e.key === 'ArrowRight') {
            if (this._isFlipped) {
              this._rateCardInModal(2, modal);
            } else {
              this._flipCardInModal(modal);
            }
          } else if (e.key === '1') {
            if (this._isFlipped) this._rateCardInModal(0, modal);
          } else if (e.key === '2') {
            if (this._isFlipped) this._rateCardInModal(1, modal);
          } else if (e.key === '3') {
            if (this._isFlipped) this._rateCardInModal(2, modal);
          } else if (e.key === '4') {
            if (this._isFlipped) this._rateCardInModal(3, modal);
          } else if (e.key === 'Escape') {
            this._closeFlashcardMode();
          }
        } else {
          // In deck selection mode
          if (e.key === 'Escape') {
            this._closeFlashcardMode();
          }
        }
      }
    };
    
    this._keyboardHandler = handler;
    document.addEventListener('keydown', handler);
  }

  _unbindKeyboardNav() {
    if (this._keyboardHandler) {
      document.removeEventListener('keydown', this._keyboardHandler);
      this._keyboardHandler = null;
    }
  }

  _renderCLIIndex(index) {
    const container = this.container.querySelector('#cli-commands');
    const nameEl = this.container.querySelector('#cli-category-name');
    const summaryEl = this.container.querySelector('#cli-category-summary');
    const contextEl = this.container.querySelector('#cli-shell-context');
    const dots = this.container.querySelectorAll('.cli-dot');

    if (!container || !nameEl) return;

    const cat = CLI_COMMANDS[index];
    nameEl.innerHTML = `${renderTokenIcon(cat.icon || 'CLI', 'reslib-cli-category-icon')}${escapeHtml(cat.category)}`;
    if (summaryEl) summaryEl.textContent = cat.summary || 'Cisco IOS command references';
    if (contextEl) contextEl.textContent = `${cat.mode || 'CLI mode'} • ${cat.prompt || 'R1#'}`;

    container.innerHTML = `
      <div class="reslib-cli-table-head">
        <span>Prompt</span>
        <span>Command</span>
        <span>Purpose</span>
      </div>
    ` + cat.commands.map((cmd, commandIndex) => `
      <div class="reslib-cli-row">
        <span class="reslib-cli-row__prompt">${escapeHtml(cat.prompt || 'R1#')}</span>
        <span class="reslib-cli-row__command">
          <span class="reslib-cli-row__index">${String(commandIndex + 1).padStart(2, '0')}</span>
          <span class="reslib-cli-row__cmd">${escapeHtml(cmd.cmd)}</span>
        </span>
        <span class="reslib-cli-row__desc">${escapeHtml(cmd.desc)}</span>
      </div>
    `).join('');

    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
    });
  }

  _handleSearch(term) {
    if (!this.container) return;
    const rawTerm = String(term || '');
    term = rawTerm.toLowerCase().trim();
    const resultsDiv = this.container.querySelector('#search-results');
    
    if (term.length < 2) {
      resultsDiv.style.display = 'none';
      return;
    }

    let results = [];

    PORTS.forEach(([port, proto, service]) => {
      if (port.includes(term) || service.toLowerCase().includes(term) || proto.toLowerCase().includes(term)) {
        results.push({ type:'Port', text:`${port}/${proto} - ${service}` });
      }
    });

    PROTOCOLS.forEach(p => {
      if (p.name.toLowerCase().includes(term) || p.full.toLowerCase().includes(term)) {
        results.push({ type:'Protocol', text:`${p.name} (${p.full}) - Layer ${p.layer}` });
      }
    });

    CLI_COMMANDS.forEach(cat => {
      cat.commands.forEach(cmd => {
        if (cmd.cmd.includes(term) || cmd.desc.toLowerCase().includes(term)) {
          results.push({ type:'CLI', text:`${cmd.cmd} - ${cmd.desc}` });
        }
      });
    });

    GLOSSARY_TERMS.forEach(({ term: term2, def, group }) => {
      if (term2.toLowerCase().includes(term) || def.toLowerCase().includes(term)) {
        results.push({ type:'Glossary', text:`${term2}: ${def}`, meta: GLOSSARY_GROUPS[group]?.name || '' });
      }
    });

    if (results.length === 0) {
      resultsDiv.innerHTML = `<div class="reslib-search-card reslib-search-empty">No results found for "${escapeHtml(rawTerm.trim())}"</div>`;
    } else {
      resultsDiv.innerHTML = `
        <div class="reslib-search-card">
          <div class="reslib-search-meta">${results.length} result${results.length > 1 ? 's' : ''}</div>
          <div class="reslib-search-list">
            ${results.slice(0,20).map(r => `
              <div class="reslib-search-item">
                <span class="reslib-search-tag">${r.type}</span>
                <span class="reslib-search-text">${escapeHtml(r.text)}${r.meta ? ` [${escapeHtml(r.meta)}]` : ''}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    resultsDiv.style.display = 'block';
  }

  // ═══════════════════════════════════════════
  // NEW FLASHCARD MODE METHODS
  // ═══════════════════════════════════════════

  _consumeFlashcardLaunchContext() {
    try {
      const raw = sessionStorage.getItem(FLASHCARD_LAUNCH_CONTEXT_KEY);
      if (!raw) return null;
      sessionStorage.removeItem(FLASHCARD_LAUNCH_CONTEXT_KEY);
      return JSON.parse(raw);
    } catch (err) {
      console.warn('[ResourceLibrary] Could not parse flashcard launch context:', err);
      sessionStorage.removeItem(FLASHCARD_LAUNCH_CONTEXT_KEY);
      return null;
    }
  }

  _openFlashcardsFromContext(context) {
    this._flashcardMode = true;
    this._flashcardView = 'study';
    this._showFlashcardModal({ skipResume: true });
    this._startScopedStudyFromContext(context);
  }

  _buildFlashcardScope(context = {}) {
    return {
      source: context.source || 'contextual-launch',
      domainId: context.domainId || null,
      domainTitle: context.domainTitle || context.pathTitle || null,
      topicId: context.topicId || null,
      topicTitle: context.topicTitle || null,
      returnRoute: context.returnRoute || '#/resources',
      tags: [
        context.domainId ? `domain:${context.domainId}` : null,
        context.topicId ? `topic:${context.topicId}` : null,
      ].filter(Boolean),
    };
  }

  _startScopedStudyFromContext(context = {}) {
    const scope = this._buildFlashcardScope(context);
    const sessionOptions = {
      includeNew: true,
      includeDue: true,
      fallbackToAll: true,
      limit: context.limit || 20,
    };
    let session = flashcardEngine.startScopedSession(scope, sessionOptions);
    let effectiveScope = scope;

    if (session.totalCards === 0 && scope.topicId && scope.domainId) {
      effectiveScope = { ...scope, topicId: null, topicTitle: null, tags: [`domain:${scope.domainId}`] };
      session = flashcardEngine.startScopedSession(effectiveScope, sessionOptions);
    }

    const modal = document.getElementById('fc-global-modal');
    const contentContainer = modal?.querySelector('#fc-deck-selection-content');

    if (session.totalCards === 0) {
      this._currentSession = null;
      this._currentDeckId = null;
      this._flashcardView = 'decks';
      this._setFlashcardNotice('warning', 'No flashcards are tagged for this lesson yet. Choose a full deck to keep reviewing.');
      return;
    }

    this._currentSession = session;
    this._currentDeckId = session.deck.id;
    this._flashcardLaunchContext = effectiveScope;
    this._isFlipped = false;
    this._clearFlashcardNotice();

    if (contentContainer) {
      contentContainer.innerHTML = this._getStudySessionHTML();
      this._bindStudySessionModalEvents(modal);
    }
  }

  _toggleFlashcardPanel() {
    if (this._flashcardMode) {
      this._closeFlashcardMode();
    } else {
      this._flashcardMode = true;
      this._flashcardView = 'decks';
      this._showFlashcardModal();
    }
  }

  _closeFlashcardMode() {
    // End session if active
    if (this._currentSession) {
      flashcardEngine.endSession();
      this._currentSession = null;
    }
    
    // Remove modal overlay
    const existingModal = document.getElementById('fc-global-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    this._flashcardMode = false;
    this._currentDeckId = null;
    this._flashcardLaunchContext = null;
    this._flashcardNotice = null;
    this._unbindKeyboardNav();
  }

  _showFlashcardModal({ skipResume = false } = {}) {
    const existingModal = document.getElementById('fc-global-modal');
    if (existingModal) existingModal.remove();

    const resumableSession = !skipResume ? flashcardEngine.resumeSession() : null;
    if (resumableSession) {
      this._currentSession = resumableSession;
      this._currentDeckId = resumableSession.deck.id;
      this._flashcardView = 'study';
    }

    const modal = document.createElement('div');
    modal.id = 'fc-global-modal';
    modal.className = 'fc-modal-overlay fc-modal-overlay--command';
    modal.innerHTML = `
      <div class="fc-modal-container fc-modal-container--command">
        <div id="fc-deck-selection-content">
          ${resumableSession ? this._getStudySessionHTML() : this._getDeckSelectionHTML()}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    if (resumableSession) {
      this._bindStudySessionModalEvents(modal);
    } else {
      this._bindDeckSelectionModalEvents(modal);
    }
    this._bindKeyboardNav('flashcards');
  }

  _getFlashcardDeckMeta(deckId) {
    const meta = {
      'network-fundamentals': { icon: 'NET', tone: 'signal', label: 'Foundation' },
      'network-access': { icon: 'PORT', tone: 'amber', label: 'Access' },
      'ip-connectivity': { icon: 'CYCLE', tone: 'mint', label: 'Routing' },
      'ip-services': { icon: 'CONFIG', tone: 'violet', label: 'Services' },
      'security-fundamentals': { icon: 'LOCK', tone: 'danger', label: 'Security' },
      'automation-programmability': { icon: 'AUTO', tone: 'violet', label: 'Automation' },
      'protocols-reference': { icon: 'ARP', tone: 'signal', label: 'Protocols' },
      'ports-reference': { icon: 'PORTS', tone: 'amber', label: 'Ports' },
    };

    return meta[deckId] || { icon: 'LEARN', tone: 'signal', label: 'General' };
  }

  _getFlashcardDeckStatus(progress) {
    if (progress.dueToday > 0) return 'Due Queue';
    if (progress.completion >= 75) return 'Maintained';
    if (progress.completion >= 35) return 'In Progress';
    return 'Ready';
  }

  _getFlashcardNoticeHTML() {
    if (!this._flashcardNotice) return '';

    return `
      <div class="ops-flash__notice ops-flash__notice--${this._flashcardNotice.type}" role="status" aria-live="polite">
        ${escapeHtml(this._flashcardNotice.message)}
      </div>
    `;
  }

  _setFlashcardNotice(type, message) {
    this._flashcardNotice = { type, message };
    this._refreshFlashcardDeckSelection();
  }

  _clearFlashcardNotice() {
    this._flashcardNotice = null;
  }

  _refreshFlashcardDeckSelection() {
    const modal = document.getElementById('fc-global-modal');
    if (!modal || this._currentSession) return;

    const contentContainer = modal.querySelector('#fc-deck-selection-content');
    if (!contentContainer) return;

    contentContainer.innerHTML = this._getDeckSelectionHTML();
    this._bindDeckSelectionModalEvents(modal);
  }

  _applyFlashcardProgress(root) {
    root.querySelectorAll('[data-progress]').forEach(el => {
      const raw = Number(el.getAttribute('data-progress'));
      const value = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
      el.style.width = `${value}%`;
    });
  }

  _getDeckSelectionHTML() {
    const decks = flashcardEngine.getAllDecks();
    const overallProgress = flashcardEngine.getOverallProgress();
    const dueLoadLabel = overallProgress.dueToday > 0 ? 'Pending Recall' : 'Stable Queue';

    return `
      <div class="ops-flash">
        <header class="ops-flash__hero">
          <div class="ops-flash__hero-copy">
            <div class="ops-flash__kicker">Flashcard Command Deck</div>
            <h2 class="ops-flash__title">CCNA <span class="ops-flash__title-accent">Flashcards</span></h2>
            <p class="ops-flash__body">
              Launch active-recall sessions inside the dashboard command layer. Review due cards, inspect deck load,
              and keep recall decisions visible instead of hiding them inside a generic popup flow.
            </p>
            ${this._getFlashcardNoticeHTML()}
          </div>
          <div class="ops-flash__hero-stats">
            <div class="ops-flash__stat">
              <span class="ops-flash__stat-label">Decks Online</span>
              <span class="ops-flash__stat-value ops-flash__stat-value--signal">${overallProgress.totalDecks}</span>
            </div>
            <div class="ops-flash__stat">
              <span class="ops-flash__stat-label">Cards Loaded</span>
              <span class="ops-flash__stat-value">${overallProgress.totalCards}</span>
            </div>
            <div class="ops-flash__stat">
              <span class="ops-flash__stat-label">${dueLoadLabel}</span>
              <span class="ops-flash__stat-value ops-flash__stat-value--amber">${overallProgress.dueToday}</span>
            </div>
            <div class="ops-flash__stat">
              <span class="ops-flash__stat-label">Mastery</span>
              <span class="ops-flash__stat-value ops-flash__stat-value--mint">${overallProgress.overallCompletion}%</span>
            </div>
          </div>
        </header>

        <div class="ops-flash__shell">
          <div class="ops-flash__main">
            <section class="ops-flash__rail">
              <div>
                <div class="ops-flash__rail-title">Deck Selection Rail</div>
                <div class="ops-flash__rail-copy">Choose a deck by workload and mastery, not just by title.</div>
              </div>
              <div class="ops-flash__rail-actions">
                <button class="ops-flash__action ops-flash__action--primary fc-modal-action-btn" data-action="import" type="button">Import Deck</button>
                <button class="ops-flash__action fc-modal-action-btn" data-action="export" type="button">Export Queue</button>
                <button class="ops-flash__action fc-modal-action-btn" data-action="add-deck" type="button">Create Deck</button>
                <button class="ops-flash__action" id="fc-global-close" type="button">Close</button>
              </div>
            </section>

            <section class="ops-flash__deck-grid">
              ${decks.map(deck => {
                const progress = flashcardEngine.getDeckProgress(deck.id);
                const meta = this._getFlashcardDeckMeta(deck.id);
                const status = this._getFlashcardDeckStatus(progress);
                return `
                  <article class="ops-flash__deck ops-flash__deck--${meta.tone} fc-deck-selectable" data-deck-id="${deck.id}" tabindex="0" role="button" aria-label="Start ${escapeHtml(deck.name)} deck">
                    <div class="ops-flash__deck-top">
                      <span class="ops-flash__badge">${meta.label}</span>
                      <span class="ops-flash__status">${status}</span>
                    </div>
                    <div class="ops-flash__deck-icon">${renderTokenIcon(meta.icon, 'learning-token-icon')}</div>
                    <div class="ops-flash__deck-name">${escapeHtml(deck.name)}</div>
                    <p class="ops-flash__deck-copy">${escapeHtml(deck.description || 'Focused recall deck for CCNA review.')}</p>
                    <div class="ops-flash__metrics">
                      <div class="ops-flash__metric">
                        <span class="ops-flash__metric-label">Cards</span>
                        <span class="ops-flash__metric-value">${progress.totalCards}</span>
                      </div>
                      <div class="ops-flash__metric">
                        <span class="ops-flash__metric-label">Due</span>
                        <span class="ops-flash__metric-value">${progress.dueToday}</span>
                      </div>
                      <div class="ops-flash__metric">
                        <span class="ops-flash__metric-label">Mastered</span>
                        <span class="ops-flash__metric-value">${progress.completion}%</span>
                      </div>
                    </div>
                    <div class="ops-flash__progress">
                      <div class="ops-flash__progress-fill" data-progress="${progress.completion}"></div>
                    </div>
                    <button class="ops-flash__action ops-flash__action--primary ops-flash__deck-cta fc-start-study-btn" data-deck-id="${deck.id}" type="button">Launch Session</button>
                  </article>
                `;
              }).join('')}
            </section>
          </div>

          <aside class="ops-flash__side">
            <section class="ops-flash__summary">
              <div class="ops-flash__summary-title">Review Workflow</div>
              <div class="ops-flash__summary-list">
                <div class="ops-flash__summary-item">
                  <span class="ops-flash__summary-key">1</span>
                  <div>
                    <div class="ops-flash__summary-value">Inspect the due queue</div>
                    <div class="ops-flash__summary-copy">Start with decks carrying the highest recall debt.</div>
                  </div>
                </div>
                <div class="ops-flash__summary-item">
                  <span class="ops-flash__summary-key">2</span>
                  <div>
                    <div class="ops-flash__summary-value">Reveal only when ready</div>
                    <div class="ops-flash__summary-copy">The question surface stays dominant until you intentionally flip.</div>
                  </div>
                </div>
                <div class="ops-flash__summary-item">
                  <span class="ops-flash__summary-key">3</span>
                  <div>
                    <div class="ops-flash__summary-value">Rate the recall honestly</div>
                    <div class="ops-flash__summary-copy">Each button previews how far the next interval will move.</div>
                  </div>
                </div>
              </div>
            </section>

            <section class="ops-flash__summary">
              <div class="ops-flash__summary-title">Anchored Vocabulary</div>
              <div class="ops-flash__term-list">
                <article class="ops-flash__term">
                  <div class="ops-flash__term-title">Due</div>
                  <div class="ops-flash__term-copy">Cards whose next review time has arrived.</div>
                </article>
                <article class="ops-flash__term">
                  <div class="ops-flash__term-title">Mastered</div>
                  <div class="ops-flash__term-copy">Cards that have reached mature intervals through repeated successful recall.</div>
                </article>
                <article class="ops-flash__term">
                  <div class="ops-flash__term-title">Again / Hard / Good / Easy</div>
                  <div class="ops-flash__term-copy">Recall ratings that directly control the next review interval.</div>
                </article>
              </div>
            </section>
          </aside>
        </div>
      </div>
    `;
  }

  _bindDeckSelectionModalEvents(modal) {
    modal.querySelector('#fc-global-close')?.addEventListener('click', () => {
      this._closeFlashcardMode();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this._closeFlashcardMode();
      }
    });

    modal.querySelectorAll('.fc-start-study-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const deckId = btn.getAttribute('data-deck-id');
        this._startStudyFromModal(deckId);
      });
    });

    modal.querySelectorAll('.fc-deck-selectable').forEach(card => {
      card.addEventListener('click', () => {
        const deckId = card.getAttribute('data-deck-id');
        this._startStudyFromModal(deckId);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const deckId = card.getAttribute('data-deck-id');
          this._startStudyFromModal(deckId);
        }
      });
    });

    modal.querySelectorAll('.fc-modal-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (action === 'import') this._showImportModal(modal);
        else if (action === 'export') this._exportAllDecks();
        else if (action === 'add-deck') this._showAddDeckModal(modal);
      });
    });

    this._applyFlashcardProgress(modal);
  }

  _startStudyFromModal(deckId) {
    const deck = flashcardEngine.getDeck(deckId);
    if (!deck || deck.cards.length === 0) {
      this._setFlashcardNotice('warning', 'This deck has no cards yet. Import cards or create a deck with content before starting a session.');
      return;
    }

    this._currentDeckId = deckId;
    this._currentSession = flashcardEngine.startSession(deckId, { includeNew: true, includeDue: true, fallbackToAll: true });
    this._isFlipped = false;
    this._clearFlashcardNotice();
    
    // Update modal content to show study session
    const modal = document.getElementById('fc-global-modal');
    if (modal) {
      const contentContainer = modal.querySelector('#fc-deck-selection-content');
      if (contentContainer) {
        contentContainer.innerHTML = this._getStudySessionHTML();
        this._bindStudySessionModalEvents(modal);
      }
    }
  }

  _getStudySessionHTML() {
    const session = this._currentSession;
    if (!session) return '<p>No session active</p>';

    const deck = session.deck;
    const cards = session.cards;
    const currentIndex = flashcardEngine.getCurrentCardIndex();
    const currentCard = cards[currentIndex];
    
    if (!currentCard) {
      return this._getSessionStatsHTML();
    }

    const progress = ((currentIndex + 1) / cards.length) * 100;
    const stats = flashcardEngine.getSessionStats();
    const deckMeta = this._getFlashcardDeckMeta(deck.id);
    const revealClass = this._isFlipped ? 'is-flipped' : '';
    const ratingVisibilityClass = this._isFlipped ? '' : 'is-hidden';
    const difficulty = currentCard.difficulty || 'new';

    return `
      <div class="ops-flash">
        <header class="ops-flash__hero">
          <div class="ops-flash__hero-copy">
            <div class="ops-flash__kicker">Live Study Session</div>
            <h2 class="ops-flash__title">${escapeHtml(deck.name)} <span class="ops-flash__title-accent">Review Loop</span></h2>
            <p class="ops-flash__body">
              Read the prompt, decide if you truly know it, reveal the answer only when ready, then rate the recall honestly.
            </p>
            <div class="ops-flash__progress ops-flash__progress--hero">
              <div class="ops-flash__progress-fill" data-progress="${progress}"></div>
            </div>
          </div>
          <div class="ops-flash__hero-stats">
            <div class="ops-flash__stat">
              <span class="ops-flash__stat-label">Card</span>
              <span class="ops-flash__stat-value ops-flash__stat-value--signal">${currentIndex + 1}/${cards.length}</span>
            </div>
            <div class="ops-flash__stat">
              <span class="ops-flash__stat-label">Reviewed</span>
              <span class="ops-flash__stat-value">${stats.cardsReviewed}</span>
            </div>
            <div class="ops-flash__stat">
              <span class="ops-flash__stat-label">Accuracy</span>
              <span class="ops-flash__stat-value ops-flash__stat-value--mint">${stats.accuracy}%</span>
            </div>
            <div class="ops-flash__stat">
              <span class="ops-flash__stat-label">State</span>
              <span class="ops-flash__stat-value ops-flash__stat-value--amber">${difficulty}</span>
            </div>
          </div>
        </header>

        <div class="ops-flash__shell">
          <div class="ops-flash__main">
            <section class="ops-flash__study">
              <div class="ops-flash__stage">
                <div>
                  <div class="ops-flash__stage-title">Question → Reveal → Rate</div>
                  <div class="ops-flash__stage-copy">The next interval only appears after the answer is revealed.</div>
                </div>
                <div class="ops-flash__stage-meta">
                  <span class="ops-flash__chip ops-flash__chip--signal">${deckMeta.label}</span>
                  <span class="ops-flash__chip">${difficulty}</span>
                  <span class="ops-flash__chip ops-flash__chip--mint">${this._isFlipped ? 'Answer Revealed' : 'Question Locked'}</span>
                </div>
              </div>

              <div class="ops-flash__card-wrap" id="fc-card-container">
                <div class="ops-flash__card ${revealClass}" id="fc-card-3d" tabindex="0" role="button" aria-label="Flip flashcard">
                  <article class="ops-flash__card-face ops-flash__card-face--question">
                    <div class="ops-flash__card-head">
                      <span class="ops-flash__card-state">${escapeHtml(deck.name)}</span>
                      <span class="ops-flash__card-index">Card ${currentIndex + 1} of ${cards.length}</span>
                    </div>
                    <div class="ops-flash__card-body">
                      <div class="ops-flash__prompt-label">Prompt</div>
                      <h3 class="ops-flash__prompt">${escapeHtml(currentCard.front)}</h3>
                    </div>
                    <div class="ops-flash__card-foot">
                      <span class="ops-flash__hint">Press Space or click to reveal the answer.</span>
                      <span class="ops-flash__card-index">Question Surface</span>
                    </div>
                  </article>

                  <article class="ops-flash__card-face ops-flash__card-face--answer">
                    <div class="ops-flash__card-head">
                      <span class="ops-flash__card-state">Answer Surface</span>
                      <span class="ops-flash__card-index">${this._getIntervalText(currentCard, 2)} typical next review</span>
                    </div>
                    <div class="ops-flash__card-body">
                      <div class="ops-flash__prompt-label">Answer</div>
                      <div class="ops-flash__answer">${escapeHtml(currentCard.back)}</div>
                    </div>
                    <div class="ops-flash__card-foot">
                      <span class="ops-flash__hint">Use the rating bar below to set the next interval.</span>
                      <span class="ops-flash__card-index">Answer Revealed</span>
                    </div>
                  </article>
                </div>
              </div>

              <div class="ops-flash__rating-bar ${ratingVisibilityClass}" id="fc-rating-buttons">
                <button class="ops-flash__rate ops-flash__rate--again fc-rating-btn" data-rating="0" type="button">
                  <span class="ops-flash__rate-label">Again</span>
                  <span class="ops-flash__rate-time">Reset queue</span>
                </button>
                <button class="ops-flash__rate ops-flash__rate--hard fc-rating-btn" data-rating="1" type="button">
                  <span class="ops-flash__rate-label">Hard</span>
                  <span class="ops-flash__rate-time">~6 min / short retry</span>
                </button>
                <button class="ops-flash__rate ops-flash__rate--good fc-rating-btn" data-rating="2" type="button">
                  <span class="ops-flash__rate-label">Good</span>
                  <span class="ops-flash__rate-time">${this._getIntervalText(currentCard, 2)}</span>
                </button>
                <button class="ops-flash__rate ops-flash__rate--easy fc-rating-btn" data-rating="3" type="button">
                  <span class="ops-flash__rate-label">Easy</span>
                  <span class="ops-flash__rate-time">${this._getIntervalText(currentCard, 3)}</span>
                </button>
              </div>

              <div class="ops-flash__controls">
                <div class="ops-flash__rail-actions">
                  <button id="fc-back-to-decks" class="ops-flash__action" type="button">All Decks</button>
                  <button id="fc-prev-card" class="ops-flash__action" type="button">Previous</button>
                  <button id="fc-next-card" class="ops-flash__action ops-flash__action--primary" type="button">${this._isFlipped ? 'Rate Good + Next' : 'Reveal Answer'}</button>
                </div>
                <div class="ops-flash__shortcut-row">
                  <span class="ops-flash__shortcut">Space: Flip</span>
                  <span class="ops-flash__shortcut">1-4: Rate</span>
                  <span class="ops-flash__shortcut">Left/Right: Navigate</span>
                  <span class="ops-flash__shortcut">Esc: Close</span>
                </div>
                <button id="fc-end-session" class="ops-flash__action ops-flash__action--danger" type="button">End Session</button>
              </div>
            </section>
          </div>

          <aside class="ops-flash__side">
            <section class="ops-flash__summary">
              <div class="ops-flash__summary-title">Telemetry</div>
              <div class="ops-flash__summary-grid">
                <div class="ops-flash__summary-card">
                  <span class="ops-flash__summary-card-value">${stats.cardsReviewed}</span>
                  <span class="ops-flash__summary-card-label">Reviewed</span>
                </div>
                <div class="ops-flash__summary-card">
                  <span class="ops-flash__summary-card-value">${stats.accuracy}%</span>
                  <span class="ops-flash__summary-card-label">Accuracy</span>
                </div>
                <div class="ops-flash__summary-card">
                  <span class="ops-flash__summary-card-value">${this._formatTime(stats.elapsed)}</span>
                  <span class="ops-flash__summary-card-label">Elapsed</span>
                </div>
              </div>
            </section>

            <section class="ops-flash__summary">
              <div class="ops-flash__summary-title">What This Rating Means</div>
              <div class="ops-flash__term-list">
                <article class="ops-flash__term">
                  <div class="ops-flash__term-title">Again</div>
                  <div class="ops-flash__term-copy">Use when recall failed. The card returns quickly.</div>
                </article>
                <article class="ops-flash__term">
                  <div class="ops-flash__term-title">Good</div>
                  <div class="ops-flash__term-copy">Use when recall felt correct without heavy effort.</div>
                </article>
                <article class="ops-flash__term">
                  <div class="ops-flash__term-title">Easy</div>
                  <div class="ops-flash__term-copy">Use only when the answer felt immediate and obvious.</div>
                </article>
              </div>
            </section>
          </aside>
        </div>
      </div>
    `;
  }

  _getSessionStatsHTML() {
    const stats = flashcardEngine.getSessionStats();
    const deck = this._currentSession?.deck || flashcardEngine.resumeSession()?.deck || flashcardEngine.getDeck(this._currentDeckId);

    return `
      <div class="ops-flash">
        <header class="ops-flash__hero">
          <div class="ops-flash__hero-copy">
            <div class="ops-flash__kicker">Session Complete</div>
            <h2 class="ops-flash__title">${escapeHtml(deck?.name || 'Deck')} <span class="ops-flash__title-accent">Review Report</span></h2>
            <p class="ops-flash__body">
              You completed the current queue. Use this report to decide whether to run another cycle now or return to the deck rail.
            </p>
          </div>
          <div class="ops-flash__hero-stats">
            <div class="ops-flash__stat">
              <span class="ops-flash__stat-label">Reviewed</span>
              <span class="ops-flash__stat-value ops-flash__stat-value--signal">${stats.cardsReviewed}</span>
            </div>
            <div class="ops-flash__stat">
              <span class="ops-flash__stat-label">Accuracy</span>
              <span class="ops-flash__stat-value ops-flash__stat-value--mint">${stats.accuracy}%</span>
            </div>
            <div class="ops-flash__stat">
              <span class="ops-flash__stat-label">Elapsed</span>
              <span class="ops-flash__stat-value">${this._formatTime(stats.elapsed)}</span>
            </div>
            <div class="ops-flash__stat">
              <span class="ops-flash__stat-label">Next Move</span>
              <span class="ops-flash__stat-value ops-flash__stat-value--amber">${stats.cardsReviewed > 0 ? 'Review' : 'Idle'}</span>
            </div>
          </div>
        </header>

        <div class="ops-flash__shell">
          <div class="ops-flash__main">
            <section class="ops-flash__summary">
              <div class="ops-flash__summary-title">Recall Breakdown</div>
              <div class="ops-flash__summary-grid ops-flash__summary-grid--ratings">
                <div class="ops-flash__summary-card">
                  <span class="ops-flash__summary-card-value">${stats.ratings.again}</span>
                  <span class="ops-flash__summary-card-label">Again</span>
                </div>
                <div class="ops-flash__summary-card">
                  <span class="ops-flash__summary-card-value">${stats.ratings.hard}</span>
                  <span class="ops-flash__summary-card-label">Hard</span>
                </div>
                <div class="ops-flash__summary-card">
                  <span class="ops-flash__summary-card-value">${stats.ratings.good}</span>
                  <span class="ops-flash__summary-card-label">Good</span>
                </div>
                <div class="ops-flash__summary-card">
                  <span class="ops-flash__summary-card-value">${stats.ratings.easy}</span>
                  <span class="ops-flash__summary-card-label">Easy</span>
                </div>
              </div>
              <div class="ops-flash__controls">
                <div class="ops-flash__rail-actions">
                  <button class="ops-flash__action" id="fc-back-to-decks-final" type="button">Return to Decks</button>
                  <button class="ops-flash__action ops-flash__action--primary" id="fc-study-again" type="button">Study Again</button>
                </div>
              </div>
            </section>
          </div>

          <aside class="ops-flash__side">
            <section class="ops-flash__summary">
              <div class="ops-flash__summary-title">Interpretation</div>
              <div class="ops-flash__term-list">
                <article class="ops-flash__term">
                  <div class="ops-flash__term-title">High Again / Hard count</div>
                  <div class="ops-flash__term-copy">This indicates weak recall under pressure. Re-run the deck sooner.</div>
                </article>
                <article class="ops-flash__term">
                  <div class="ops-flash__term-title">High Good / Easy count</div>
                  <div class="ops-flash__term-copy">This indicates the interval can expand without sacrificing retention.</div>
                </article>
              </div>
            </section>
          </aside>
        </div>
      </div>
    `;
  }

  _bindStudySessionModalEvents(modal) {
    modal.querySelector('#fc-back-to-decks')?.addEventListener('click', () => {
      flashcardEngine.endSession();
      this._currentSession = null;
      const contentContainer = modal.querySelector('#fc-deck-selection-content');
      if (contentContainer) {
        contentContainer.innerHTML = this._getDeckSelectionHTML();
        this._bindDeckSelectionModalEvents(modal);
      }
    });

    modal.querySelector('#fc-end-session')?.addEventListener('click', () => {
      flashcardEngine.endSession();
      this._currentSession = null;
      const contentContainer = modal.querySelector('#fc-deck-selection-content');
      if (contentContainer) {
        contentContainer.innerHTML = this._getDeckSelectionHTML();
        this._bindDeckSelectionModalEvents(modal);
      }
    });

    modal.querySelector('#fc-prev-card')?.addEventListener('click', () => {
      this._previousCardInModal(modal);
    });

    modal.querySelector('#fc-next-card')?.addEventListener('click', () => {
      if (this._isFlipped) {
        this._rateCardInModal(2, modal);
      } else {
        this._flipCardInModal(modal);
      }
    });

    const card3d = modal.querySelector('#fc-card-3d');
    card3d?.addEventListener('click', () => {
      this._flipCardInModal(modal);
    });
    card3d?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._flipCardInModal(modal);
      }
    });

    modal.querySelectorAll('.fc-rating-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rating = parseInt(btn.getAttribute('data-rating'));
        this._rateCardInModal(rating, modal);
      });
    });

    modal.querySelector('#fc-back-to-decks-final')?.addEventListener('click', () => {
      flashcardEngine.endSession();
      this._currentSession = null;
      const contentContainer = modal.querySelector('#fc-deck-selection-content');
      if (contentContainer) {
        contentContainer.innerHTML = this._getDeckSelectionHTML();
        this._bindDeckSelectionModalEvents(modal);
      }
    });

    modal.querySelector('#fc-study-again')?.addEventListener('click', () => {
      if (this._currentDeckId) {
        this._startStudyFromModal(this._currentDeckId);
      }
    });

    this._setupSwipeGesturesModal(modal);
    this._applyFlashcardProgress(modal);
  }

  _flipCardInModal(modal) {
    this._isFlipped = !this._isFlipped;
    const card3d = modal.querySelector('#fc-card-3d');
    const ratingButtons = modal.querySelector('#fc-rating-buttons');
    
    if (card3d) {
      card3d.classList.toggle('is-flipped', this._isFlipped);
    }
    
    if (ratingButtons) {
      ratingButtons.classList.toggle('is-hidden', !this._isFlipped);
    }
  }

  _rateCardInModal(rating, modal) {
    const result = flashcardEngine.rateCurrentCard(rating);
    
    if (result) {
      if (result.rating === 0) {
        progressEngine.recordFlashcardReview({
          rating: result.rating,
          cardId: result.card.id,
          deckId: result.card.deckId || this._currentDeckId,
          domainId: result.card.domainId || this._flashcardLaunchContext?.domainId || null,
          topicIds: Array.isArray(result.card.topicIds) ? result.card.topicIds : [],
          front: result.card.front,
        });
      }

      if (result.sessionComplete) {
        this._currentSession = flashcardEngine.resumeSession() || this._currentSession;
        const contentContainer = modal.querySelector('#fc-deck-selection-content');
        if (contentContainer) {
          contentContainer.innerHTML = this._getSessionStatsHTML();
          this._bindStudySessionModalEvents(modal);
        }
      } else {
        this._isFlipped = false;
        this._currentSession = flashcardEngine.resumeSession() || this._currentSession;
        const contentContainer = modal.querySelector('#fc-deck-selection-content');
        if (contentContainer) {
          contentContainer.innerHTML = this._getStudySessionHTML();
          this._bindStudySessionModalEvents(modal);
        }
      }
    }
  }

  _previousCardInModal(modal) {
    const card = flashcardEngine.previousCard();
    if (card) {
      this._isFlipped = false;
      const contentContainer = modal.querySelector('#fc-deck-selection-content');
      if (contentContainer) {
        contentContainer.innerHTML = this._getStudySessionHTML();
        this._bindStudySessionModalEvents(modal);
      }
      
      const card3d = modal.querySelector('#fc-card-3d');
      if (card3d) {
        card3d.classList.add('is-rewinding');
        setTimeout(() => card3d.classList.remove('is-rewinding'), 240);
      }
    }
  }

  _setupSwipeGesturesModal(modal) {
    const container = modal.querySelector('#fc-card-container');
    if (!container) return;

    container.addEventListener('touchstart', (e) => {
      this._touchStartX = e.touches[0].clientX;
      this._touchStartY = e.touches[0].clientY;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      const touchX = e.touches[0].clientX;
      const diffX = touchX - this._touchStartX;
      
      if (Math.abs(diffX) > 10) {
        container.classList.toggle('swiping-left', diffX < 0);
        container.classList.toggle('swiping-right', diffX > 0);
      }
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      const touchX = e.changedTouches[0].clientX;
      const diffX = touchX - this._touchStartX;
      const threshold = 80;

      container.classList.remove('swiping-left', 'swiping-right');

      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          this._previousCardInModal(modal);
        } else {
          if (!this._isFlipped) {
            this._flipCardInModal(modal);
          }
        }
      }
    }, { passive: true });
  }

  _showImportModal(parentModal) {
    const importModal = document.createElement('div');
    importModal.className = 'fc-modal-overlay fc-modal-overlay--command';
    importModal.innerHTML = `
      <div class="fc-modal-container fc-modal-container--narrow">
        <div class="fc-modal-header">
          <div class="fc-modal-title">IMPORT Import Deck</div>
          <button class="fc-modal-close" id="fc-import-close">×</button>
        </div>
        <div class="fc-form-group">
          <label class="fc-form-label">Paste JSON data:</label>
          <textarea id="fc-import-data" class="fc-form-textarea fc-form-textarea--tall" placeholder='{"name": "My Deck", "cards": [{"front": "...", "back": "..."}]}'></textarea>
        </div>
        <div id="fc-import-message" class="ops-flash__dialog-message" aria-live="polite"></div>
        <div class="ops-flash__dialog-actions">
          <button class="fc-btn fc-btn-secondary" id="fc-import-cancel">Cancel</button>
          <button class="fc-btn fc-btn-primary" id="fc-import-confirm">Import</button>
        </div>
      </div>
    `;
    document.body.appendChild(importModal);

    importModal.querySelector('#fc-import-close')?.addEventListener('click', () => importModal.remove());
    importModal.querySelector('#fc-import-cancel')?.addEventListener('click', () => importModal.remove());
    importModal.addEventListener('click', (e) => { if (e.target === importModal) importModal.remove(); });
    
    importModal.querySelector('#fc-import-confirm')?.addEventListener('click', () => {
      const data = importModal.querySelector('#fc-import-data').value.trim();
      const messageEl = importModal.querySelector('#fc-import-message');

      if (!data) {
        messageEl.textContent = 'Paste deck JSON before importing.';
        return;
      }

      try {
        flashcardEngine.importDeck(data, 'rich');
        importModal.remove();
        this._setFlashcardNotice('success', 'Deck imported successfully. The queue has been refreshed.');
      } catch (e) {
        messageEl.textContent = `Invalid JSON: ${e.message}`;
      }
    });
  }

  _showAddDeckModal(parentModal) {
    const addModal = document.createElement('div');
    addModal.className = 'fc-modal-overlay fc-modal-overlay--command';
    addModal.innerHTML = `
      <div class="fc-modal-container fc-modal-container--narrow">
        <div class="fc-modal-header">
          <div class="fc-modal-title">ADD New Deck</div>
          <button class="fc-modal-close" id="fc-add-close">×</button>
        </div>
        <div class="fc-form-group">
          <label class="fc-form-label">Deck Name</label>
          <input type="text" id="fc-new-deck-name" class="fc-form-input" placeholder="e.g., Routing Protocols">
        </div>
        <div class="fc-form-group">
          <label class="fc-form-label">Description</label>
          <textarea id="fc-new-deck-desc" class="fc-form-textarea" placeholder="What topics does this deck cover?"></textarea>
        </div>
        <div class="fc-form-group">
          <label class="fc-form-label">Category</label>
          <select id="fc-new-deck-category" class="fc-form-input">
            <option value="network-fundamentals">Network Fundamentals</option>
            <option value="network-access">Network Access</option>
            <option value="ip-connectivity">IP Connectivity</option>
            <option value="ip-services">IP Services</option>
            <option value="security-fundamentals">Security Fundamentals</option>
            <option value="automation">Automation & Programmability</option>
            <option value="general">General</option>
          </select>
        </div>
        <div id="fc-add-message" class="ops-flash__dialog-message" aria-live="polite"></div>
        <div class="ops-flash__dialog-actions">
          <button class="fc-btn fc-btn-secondary" id="fc-add-cancel">Cancel</button>
          <button class="fc-btn fc-btn-primary" id="fc-add-confirm">Create Deck</button>
        </div>
      </div>
    `;
    document.body.appendChild(addModal);

    addModal.querySelector('#fc-add-close')?.addEventListener('click', () => addModal.remove());
    addModal.querySelector('#fc-add-cancel')?.addEventListener('click', () => addModal.remove());
    addModal.addEventListener('click', (e) => { if (e.target === addModal) addModal.remove(); });
    
    addModal.querySelector('#fc-add-confirm')?.addEventListener('click', () => {
      const name = addModal.querySelector('#fc-new-deck-name').value.trim();
      const desc = addModal.querySelector('#fc-new-deck-desc').value.trim();
      const category = addModal.querySelector('#fc-new-deck-category').value;
      const messageEl = addModal.querySelector('#fc-add-message');
      
      if (!name) {
        messageEl.textContent = 'Deck name is required.';
        return;
      }

      flashcardEngine.createDeck({ name, description: desc, category });
      addModal.remove();
      this._setFlashcardNotice('success', `Deck "${name}" created and ready for review.`);
    });
  }

  _renderFlashcardView() {
    this._showFlashcardModal();
  }

  _exportDeck(deckId) {
    const exportData = flashcardEngine.exportDeck(deckId, 'rich');
    const json = JSON.stringify(exportData, null, 2);
    
    // Create download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportData.deck?.name || 'deck'}_flashcards.json`;
    a.click();
    URL.revokeObjectURL(url);
    this._setFlashcardNotice('success', `Exported ${exportData.deck?.name || 'deck'} deck.`);
  }

  _exportAllDecks() {
    const exportData = flashcardEngine.exportAllDecks('rich');
    const json = JSON.stringify(exportData, null, 2);
    
    // Copy to clipboard
    navigator.clipboard.writeText(json).then(() => {
      this._setFlashcardNotice('success', 'All decks exported to the clipboard.');
    }).catch(() => {
      // Fallback - download file
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ccna_flashcards_all.json';
      a.click();
      URL.revokeObjectURL(url);
      this._setFlashcardNotice('info', 'Clipboard export was unavailable, so a file download was generated instead.');
    });
  }

  _formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  _getIntervalText(card, rating) {
    const result = flashcardEngine.calculateSM2(card, rating);
    const interval = result.interval;
    
    if (interval === 0) return '<1 min';
    if (interval === 1) return '1 day';
    if (interval < 30) return `${interval} days`;
    if (interval < 365) return `${Math.round(interval / 30)} mo`;
    return `${Math.round(interval / 365)} yr`;
  }

  _renderDeckEditor(panel) {
    // Placeholder editor shell until card authoring is redesigned.
    panel.innerHTML = `
      <section class="ops-flash ops-flash--editor-placeholder">
        <div class="ops-flash__shell ops-flash__shell--single">
          <header class="ops-flash__hero">
            <div>
              <p class="ops-flash__kicker">Deck Editor</p>
              <h3 class="ops-flash__title">Card Authoring Pipeline</h3>
            </div>
            <button id="fc-back-to-decks" class="ops-flash__action">Back to Decks</button>
          </header>
          <section class="ops-flash__summary">
            <div class="ops-flash__summary-grid">
              <article class="ops-flash__summary-item">
                <p class="ops-flash__summary-key">Status</p>
                <p class="ops-flash__summary-value">Planned</p>
                <p class="ops-flash__summary-copy">
                  Card authoring will be redesigned after the study workflow is stabilized.
                </p>
              </article>
              <article class="ops-flash__summary-item">
                <p class="ops-flash__summary-key">Current Path</p>
                <p class="ops-flash__summary-value">Import / Export</p>
                <p class="ops-flash__summary-copy">
                  Use deck import or export to manage content until the editor is rebuilt.
                </p>
              </article>
            </div>
          </section>
        </div>
      </section>
    `;

    panel.querySelector('#fc-back-to-decks')?.addEventListener('click', () => {
      this._flashcardView = 'decks';
      this._renderFlashcardView();
    });
  }

  _bindFlashcardEvents() {
    // Additional event bindings if needed
  }

  start() {}
  reset() { 
    this._activeSection = 'home'; 
    this._flashcardMode = false;
    this._flashcardView = 'decks';
    this._currentDeckId = null;
    this._currentSession = null;
    this._isFlipped = false;
    this._unbindKeyboardNav();
    if (this._cliInitTimer) { clearTimeout(this._cliInitTimer); this._cliInitTimer = null; }
    if (this._searchDebounce) { clearTimeout(this._searchDebounce); this._searchDebounce = null; }
    if (this._flashcardOpenTimer) { clearTimeout(this._flashcardOpenTimer); this._flashcardOpenTimer = null; }
    this._render(); 
  }
  step() {}
  destroy() { 
    this._unbindKeyboardNav();
    if (this._cliInitTimer) { clearTimeout(this._cliInitTimer); this._cliInitTimer = null; }
    if (this._searchDebounce) { clearTimeout(this._searchDebounce); this._searchDebounce = null; }
    if (this._flashcardOpenTimer) { clearTimeout(this._flashcardOpenTimer); this._flashcardOpenTimer = null; }
    const existingModal = document.getElementById('fc-global-modal');
    if (existingModal) existingModal.remove();
    this._flashcardMode = false;
    this._currentSession = null;
    this.container = null; 
  }
}

function _renderQuickReview() {
  return `
    <div class="reslib-quick-stack">
      <section class="reslib-panel reslib-panel--critical">
        <h3 class="reslib-panel__title">
          ${renderTokenIcon('FOCUS', 'reslib-title-icon')}Top Exam Ports (Memorize These)
        </h3>
        <div class="reslib-port-grid">
          ${[
            {port:'22', name:'SSH', color:'var(--color-green)'},
            {port:'80', name:'HTTP', color:'var(--color-amber)'},
            {port:'443', name:'HTTPS', color:'var(--color-cyan)'},
            {port:'53', name:'DNS', color:'var(--color-info)'},
            {port:'67', name:'DHCP', color:'var(--color-error)'},
            {port:'179', name:'BGP', color:'var(--color-switch)'},
          ].map(p => `
            <div class="reslib-port-card" style="--port-color:${p.color}">
              <div class="reslib-port-card__num">${p.port}</div>
              <div class="reslib-port-card__name">${p.name}</div>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="reslib-panel reslib-panel--warning">
        <h3 class="reslib-panel__title">
          ${renderTokenIcon('SUBNET', 'reslib-title-icon')}Common Subnets
        </h3>
        <div class="reslib-chip-row">
          ${[
            {cidr:'/24', hosts:'254', use:'LAN'},
            {cidr:'/25', hosts:'126', use:'Small'},
            {cidr:'/26', hosts:'62', use:'VLAN'},
            {cidr:'/30', hosts:'2', use:'P2P'},
          ].map(s => `
            <div class="reslib-chip">
              <span class="reslib-chip__value">${s.cidr}</span>
              <span class="reslib-chip__meta">${s.hosts}</span>
              <span class="reslib-chip__label">${s.use}</span>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="reslib-panel reslib-panel--info">
        <h3 class="reslib-panel__title">
          ${renderTokenIcon('LEARN', 'reslib-title-icon')}OSI Mnemonics
        </h3>
        <div class="reslib-mnemonic-grid">
          <div class="reslib-mnemonic-card">
            <div class="reslib-mnemonic-card__label">Top → Bottom</div>
            <div class="reslib-mnemonic-card__value">APSTNDP</div>
          </div>
          <div class="reslib-mnemonic-card">
            <div class="reslib-mnemonic-card__label">Bottom → Top</div>
            <div class="reslib-mnemonic-card__value reslib-mnemonic-card__value--amber">PNDTSPA</div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function _renderPortsTable() {
  const groupedPorts = {};
  PORTS.forEach(([port, proto, service, category]) => {
    if (!groupedPorts[category]) groupedPorts[category] = [];
    groupedPorts[category].push([port, proto, service]);
  });

  const categoryOrder = ['critical', 'important', 'networking'];

  return `
    <div class="reslib-section">
      <div class="reslib-section__head">
        <h2 class="reslib-section__title">${renderTokenIcon('PORT', 'reslib-title-icon')}CCNA Port Matrix</h2>
        <p class="reslib-section__desc">Grouped by exam priority for faster recall during labs and quizzes.</p>
      </div>

      <div class="reslib-port-overview-grid">
        ${categoryOrder.map((category) => {
          const catInfo = PORT_CATEGORIES[category];
          const ports = groupedPorts[category] || [];
          return `
            <article class="reslib-port-overview" style="--group-color:${catInfo.color}">
              <div class="reslib-port-overview__head">
                <span class="reslib-port-overview__icon">${renderTokenIcon(catInfo.icon, 'learning-token-icon')}</span>
                <div>
                  <div class="reslib-port-overview__title">${catInfo.name}</div>
                  <div class="reslib-port-overview__desc">${catInfo.desc}</div>
                </div>
              </div>
              <div class="reslib-port-overview__footer">
                <span class="reslib-port-overview__count">${ports.length}</span>
                <span class="reslib-port-overview__label">ports</span>
                <div class="reslib-port-overview__chips">
                  ${ports.slice(0, 4).map(([port]) => `<span>${port}</span>`).join('')}
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>

      <div class="reslib-port-cluster-list">
        ${categoryOrder.map((category, index) => {
          const catInfo = PORT_CATEGORIES[category];
          const ports = groupedPorts[category] || [];
          return `
            <section class="reslib-port-cluster" style="--group-color:${catInfo.color}">
              <div class="reslib-port-cluster__head">
                <div class="reslib-port-cluster__identity">
                  <span class="reslib-port-cluster__eyebrow">Category 0${index + 1}</span>
                  <h3 class="reslib-port-cluster__title">
                    <span class="reslib-port-cluster__icon">${renderTokenIcon(catInfo.icon, 'learning-token-icon')}</span>
                    ${catInfo.name}
                  </h3>
                  <p class="reslib-port-cluster__desc">${catInfo.desc}</p>
                </div>
                <div class="reslib-port-cluster__count">
                  <strong>${ports.length}</strong>
                  <span>entries</span>
                </div>
              </div>

              <div class="reslib-port-entry-grid">
                ${ports.map(([port, proto, service]) => `
                  <article class="reslib-port-entry">
                    <div class="reslib-port-entry__top">
                      <span class="reslib-port-entry__num">${port}</span>
                      <span class="reslib-port-entry__proto">${proto}</span>
                    </div>
                    <div class="reslib-port-entry__service">${service}</div>
                    <div class="reslib-port-entry__tag">${catInfo.name}</div>
                  </article>
                `).join('')}
              </div>
            </section>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function _getProtocolExamTip(protocol) {
  const protocolTips = {
    ARP: 'ARP requests are broadcast only inside the local VLAN/subnet.',
    ICMP: 'ICMP is control-plane signaling; it does not carry user application data.',
    DHCP: 'For DORA, remember client uses UDP 68 and server uses UDP 67.',
    DNS: 'DNS is usually UDP 53; TCP 53 appears for zone transfers or large responses.',
    TCP: 'SYN, SYN-ACK, ACK is required before reliable data transfer starts.',
    UDP: 'Use UDP when latency matters and occasional loss is acceptable.',
    OSPF: 'OSPF has administrative distance 110 and backbone area is Area 0.',
    BGP: 'BGP runs over TCP 179 and is path-vector, not distance-vector.',
    EIGRP: 'EIGRP AD is 90 (internal) and 170 (external).',
    RIP: 'RIP metric is hop count: 15 reachable, 16 unreachable.',
    STP: 'STP prevents Layer 2 loops by blocking redundant paths.',
    VLAN: '802.1Q adds a 4-byte tag; native VLAN frames are untagged.',
    NAT: 'PAT is many-to-one NAT using source ports.',
    ACL: 'Standard ACL filters by source only; extended ACL can match ports/protocols.',
    HSRP: 'HSRP picks highest priority as active; hello/hold timers are key exam facts.',
  };

  return protocolTips[protocol.name] || 'Focus on layer, purpose, and default port/timers for quick exam recall.';
}

function _renderProtocols() {
  const categoryColorMap = {
    addressing: 'var(--color-cyan)',
    diagnostics: 'var(--color-info)',
    management: 'var(--color-amber)',
    application: 'var(--color-cyan-dim)',
    transport: 'var(--color-green)',
    routing: 'var(--color-info)',
    switching: 'var(--color-green)',
    security: 'var(--color-error)',
    redundancy: 'var(--color-amber)',
  };

  return `
    <div class="reslib-section">
      <div class="reslib-section__head">
        <h2 class="reslib-section__title">${renderTokenIcon('ARP', 'reslib-title-icon')}Protocol Cheatsheet</h2>
        <p class="reslib-section__desc">Quick scan first. Click any card to inspect detailed exam answer + tip.</p>
      </div>

      <div class="reslib-protocol-cheatsheet-meta">
        <span class="reslib-protocol-cheatsheet-meta__count">${PROTOCOLS.length} protocol cards</span>
        <span class="reslib-protocol-cheatsheet-meta__hint">Click card to inspect details</span>
      </div>

      <div class="reslib-protocol-cheatsheet-grid">
        ${PROTOCOLS.map((protocol, index) => `
          <article
            class="reslib-port-entry reslib-protocol-entry reslib-protocol-mini"
            tabindex="0"
            role="button"
            aria-expanded="false"
            aria-label="Inspect ${escapeHtml(protocol.name)} details"
            style="--group-color: ${categoryColorMap[protocol.category] || 'var(--color-cyan)'}"
            data-protocol-id="${index + 1}"
          >
            <div class="reslib-port-entry__top">
              <span class="reslib-port-entry__num">${escapeHtml(protocol.name)}</span>
              <span class="reslib-port-entry__proto">${escapeHtml(protocol.layer)}</span>
            </div>
            <div class="reslib-protocol-entry__full">${escapeHtml(protocol.full)}</div>
            <div class="reslib-port-entry__service reslib-protocol-mini__prompt">${escapeHtml(protocol.question)}</div>
            <div class="reslib-protocol-entry__inspect">Click to inspect details</div>

            <div class="reslib-protocol-mini__detail">
              <div class="reslib-protocol-mini__block">
                <div class="reslib-protocol-mini__label">Exam Answer</div>
                <div class="reslib-protocol-entry__answer">${escapeHtml(protocol.answer)}</div>
              </div>
              <div class="reslib-protocol-mini__block reslib-protocol-mini__block--tip">
                <div class="reslib-protocol-mini__label">Quick Tip</div>
                <div class="reslib-protocol-mini__tip">${escapeHtml(_getProtocolExamTip(protocol))}</div>
              </div>
            </div>

            <div class="reslib-port-entry__tag">#${index + 1}</div>
          </article>
        `).join('')}
      </div>
    </div>
  `;
}

function _renderCLICommands(cliIndex = 0) {
  const safeIndex = Number.isInteger(cliIndex) && cliIndex >= 0 && cliIndex < CLI_COMMANDS.length ? cliIndex : 0;
  const currentCategory = CLI_COMMANDS[safeIndex] || CLI_COMMANDS[0];
  
  return `
    <div class="reslib-section">
      <div class="reslib-section__head">
        <h2 class="reslib-section__title">${renderTokenIcon('CLI', 'reslib-title-icon')}Essential CLI Commands</h2>
        <p class="reslib-section__desc">Use arrows or dots to cycle command categories. Keyboard left/right also works.</p>
      </div>

      <div class="reslib-cli-shell">
        <div class="reslib-cli-shell__top">
          <div class="reslib-cli-shell__lights" aria-hidden="true">
            <span class="reslib-cli-shell__light is-red"></span>
            <span class="reslib-cli-shell__light is-amber"></span>
            <span class="reslib-cli-shell__light is-green"></span>
          </div>
          <div class="reslib-cli-shell__terminal-title">
            <span class="reslib-cli-shell__terminal-icon">${renderTokenIcon(currentCategory.icon || 'CLI', 'learning-token-icon')}</span>
            <span class="reslib-cli-shell__terminal-meta">
              <span class="reslib-cli-shell__terminal-label">ccna-reference.session</span>
              <span id="cli-shell-context" class="reslib-cli-shell__terminal-context">${currentCategory.mode || 'CLI mode'} • ${currentCategory.prompt || 'R1#'}</span>
            </span>
          </div>
          <span class="reslib-cli-shell__status">
            <span class="reslib-cli-shell__status-dot"></span>
            Read only
          </span>
        </div>
        
        <div class="reslib-cli-nav">
          <button id="cli-prev" class="reslib-cli-nav__btn" aria-label="Previous category">${renderTokenIcon('UP', 'reslib-cli-nav__arrow is-left')}</button>
          <span class="reslib-cli-nav__center">
            <span id="cli-category-name" class="reslib-cli-nav__name">${renderTokenIcon(currentCategory.icon || 'CLI', 'reslib-cli-category-icon')}${escapeHtml(currentCategory.category)}</span>
            <span id="cli-category-summary" class="reslib-cli-nav__summary">${escapeHtml(currentCategory.summary || 'Cisco IOS command references')}</span>
          </span>
          <button id="cli-next" class="reslib-cli-nav__btn" aria-label="Next category">${renderTokenIcon('UP', 'reslib-cli-nav__arrow is-right')}</button>
        </div>

        <div id="cli-commands" class="reslib-cli-table"></div>
      </div>

      <div class="reslib-cli-dots" id="cli-dots">
        ${CLI_COMMANDS.map((_, i) => 
          `<span class="cli-dot ${i === safeIndex ? 'is-active' : ''}" data-index="${i}"></span>`
        ).join('')}
      </div>

      <div class="reslib-cli-hint">
        ← → Arrow keys to navigate • Click dots to jump to category
      </div>

      <div class="reslib-cli-mode-grid">
        ${[
          {mode:'User EXEC', prompt:'>', color:'var(--color-amber)'},
          {mode:'Privileged EXEC', prompt:'#', color:'var(--color-cyan)'},
          {mode:'Global Config', prompt:'(config)#', color:'var(--color-green)'},
          {mode:'Interface', prompt:'(config-if)#', color:'var(--color-error)'},
          {mode:'Router', prompt:'(config-router)#', color:'var(--color-info)'},
        ].map(m => `
          <div class="reslib-cli-mode-chip" style="--mode-color:${m.color}">
            <div class="reslib-cli-mode-chip__mode">${m.mode}</div>
            <div class="reslib-cli-mode-chip__prompt">Router${m.prompt}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function _renderOSIRef() {
  return `
    <div class="reslib-section">
      <div class="reslib-section__head">
        <h2 class="reslib-section__title">${renderTokenIcon('LEARN', 'reslib-title-icon')}OSI Model</h2>
        <p class="reslib-section__desc">Layer flow with PDU mapping and protocol examples.</p>
      </div>
      <div class="reslib-osi-layers">
        <div class="reslib-osi-layers__list">
          ${OSI_LAYERS.map((l, i) => `
            <div class="reslib-osi-row" style="--layer-color:${l.color}">
              <span class="reslib-osi-row__level">L${l.n}</span>
              <span class="reslib-osi-row__name">${l.name}</span>
              <span class="reslib-osi-row__pdu">${l.pdu}</span>
              <span class="reslib-osi-row__protocols">${l.protocols}</span>
            </div>
            ${i < 6 ? '<div class="reslib-osi-row__arrow">↓</div>' : ''}
          `).join('')}
        </div>
      </div>

      <div class="reslib-mnemonic-grid">
        <div class="reslib-mnemonic-card is-cyan">
          <div class="reslib-mnemonic-card__label">Mnemonic (Top → Bottom)</div>
          <div class="reslib-mnemonic-card__sentence">
            <strong style="color: var(--color-cyan);">A</strong>ll <strong style="color: var(--color-cyan);">P</strong>eople <strong style="color: var(--color-cyan);">S</strong>eem <strong style="color: var(--color-cyan);">T</strong>o <strong style="color: var(--color-cyan);">N</strong>eed <strong style="color: var(--color-cyan);">D</strong>ata <strong style="color: var(--color-cyan);">P</strong>rocessing
          </div>
        </div>
        <div class="reslib-mnemonic-card is-amber">
          <div class="reslib-mnemonic-card__label">Mnemonic (Bottom → Top)</div>
          <div class="reslib-mnemonic-card__sentence">
            <strong style="color: var(--color-amber);">P</strong>lease <strong style="color: var(--color-amber);">D</strong>o <strong style="color: var(--color-amber);">N</strong>ot <strong style="color: var(--color-amber);">T</strong>hrow <strong style="color: var(--color-amber);">S</strong>ausage <strong style="color: var(--color-amber);">P</strong>izza <strong style="color: var(--color-amber);">A</strong>way
          </div>
        </div>
      </div>
    </div>
  `;
}

function _renderSubnetRef() {
  return `
    <div class="reslib-section">
      <div class="reslib-section__head">
        <h2 class="reslib-section__title">${renderTokenIcon('SUBNET', 'reslib-title-icon')}Subnetting Quick Reference</h2>
        <p class="reslib-section__desc">Mask, host count, and binary view for common CIDR ranges.</p>
      </div>

      <div class="reslib-subnet-table-shell">
        <div class="reslib-subnet-table-shell__head">
          <h3>Binary Breakdown</h3>
        </div>
        <div class="reslib-table-wrap">
          <table class="reslib-subnet-table">
            <thead>
              <tr>
                <th>CIDR</th>
                <th>Mask</th>
                <th>Hosts</th>
                <th>Binary</th>
              </tr>
            </thead>
            <tbody>
              ${[
                ['/24','255.255.255.0','254','11111111.11111111.11111111.00000000'],
                ['/25','255.255.255.128','126','11111111.11111111.11111111.10000000'],
                ['/26','255.255.255.192','62','11111111.11111111.11111111.11000000'],
                ['/27','255.255.255.224','30','11111111.11111111.11111111.11100000'],
                ['/28','255.255.255.240','14','11111111.11111111.11111111.11110000'],
                ['/30','255.255.255.252','2','11111111.11111111.11111111.11111100'],
              ].map(([cidr, mask, hosts, binary]) => `
                <tr>
                  <td class="reslib-subnet-table__cidr">${cidr}</td>
                  <td>${mask}</td>
                  <td>${hosts}</td>
                  <td class="reslib-subnet-table__binary">${binary}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="reslib-formula-grid">
        <div class="reslib-formula-card">
          <div class="reslib-formula-card__value">2^n - 2</div>
          <div class="reslib-formula-card__label">Usable hosts</div>
        </div>
        <div class="reslib-formula-card">
          <div class="reslib-formula-card__value">256 - block</div>
          <div class="reslib-formula-card__label">Subnet mask step</div>
        </div>
        <div class="reslib-formula-card">
          <div class="reslib-formula-card__value">256 - mask</div>
          <div class="reslib-formula-card__label">Block size</div>
        </div>
      </div>
    </div>
  `;
}

function _renderGlossary() {
  const groupedTerms = {};
  GLOSSARY_TERMS.forEach((entry) => {
    if (!groupedTerms[entry.group]) groupedTerms[entry.group] = [];
    groupedTerms[entry.group].push(entry);
  });

  const groupOrder = ['core', 'routing', 'operations'];

  return `
    <div class="reslib-section">
      <div class="reslib-section__head">
        <h2 class="reslib-section__title">${renderTokenIcon('DOCS', 'reslib-title-icon')}CCNA Glossary</h2>
        <p class="reslib-section__desc">${GLOSSARY_TERMS.length} essential terms, optimized for quick lookup.</p>
      </div>

      <div class="reslib-glossary-overview-grid">
        ${groupOrder.map((groupKey) => {
          const groupInfo = GLOSSARY_GROUPS[groupKey];
          const terms = groupedTerms[groupKey] || [];
          return `
            <article class="reslib-glossary-overview" style="--group-color:${groupInfo.color}">
              <div class="reslib-glossary-overview__head">
                <span class="reslib-glossary-overview__icon">${renderTokenIcon(groupInfo.icon, 'learning-token-icon')}</span>
                <div>
                  <div class="reslib-glossary-overview__title">${groupInfo.name}</div>
                  <div class="reslib-glossary-overview__desc">${groupInfo.desc}</div>
                </div>
              </div>
              <div class="reslib-glossary-overview__footer">
                <span class="reslib-glossary-overview__count">${terms.length}</span>
                <span class="reslib-glossary-overview__label">terms</span>
                <div class="reslib-glossary-overview__chips">
                  ${terms.slice(0, 3).map(({ term }) => `<span>${term}</span>`).join('')}
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>

      <div class="reslib-glossary-cluster-list">
        ${groupOrder.map((groupKey, groupIndex) => {
          const groupInfo = GLOSSARY_GROUPS[groupKey];
          const terms = groupedTerms[groupKey] || [];
          return `
            <section class="reslib-glossary-cluster" style="--group-color:${groupInfo.color}">
              <div class="reslib-glossary-cluster__head">
                <div class="reslib-glossary-cluster__identity">
                  <span class="reslib-glossary-cluster__eyebrow">Cluster 0${groupIndex + 1}</span>
                  <h3 class="reslib-glossary-cluster__title">
                    <span class="reslib-glossary-cluster__icon">${renderTokenIcon(groupInfo.icon, 'learning-token-icon')}</span>
                    ${groupInfo.name}
                  </h3>
                  <p class="reslib-glossary-cluster__desc">${groupInfo.desc}</p>
                </div>
                <div class="reslib-glossary-cluster__count">
                  <strong>${terms.length}</strong>
                  <span>entries</span>
                </div>
              </div>

              <div class="reslib-glossary-card-grid">
                ${terms.map(({ term, def }, termIndex) => `
                  <article class="reslib-glossary-card">
                    <div class="reslib-glossary-card__head">
                      <h4 class="reslib-glossary-card__term">${term}</h4>
                      <span class="reslib-glossary-card__idx">#${termIndex + 1}</span>
                    </div>
                    <p class="reslib-glossary-card__def">${def}</p>
                    <span class="reslib-glossary-card__tag">${groupInfo.name}</span>
                  </article>
                `).join('')}
              </div>
            </section>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export default new ResourceLibrary();
