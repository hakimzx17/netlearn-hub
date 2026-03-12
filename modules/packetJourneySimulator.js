/**
 * packetJourneySimulator.js — Full End-to-End Packet Journey
 *
 * Teaches: The complete path a packet takes from browser to web server —
 *          DNS resolution, ARP at each hop, encapsulation changes at each
 *          router, TTL decrement, NAT at the gateway, and TCP handshake.
 *
 * This is the capstone simulation: all Phase 6 concepts combined.
 *
 * Depends on: networkDiagram, eventBus, stateManager, helperFunctions
 */

import { createNetworkDiagram } from '../components/networkDiagram.js';
import { stateManager }         from '../js/stateManager.js';
import { sleep, showToast }     from '../utils/helperFunctions.js';

// ── Full topology: client → switch → firewall → router → ISP → web ───────────
const TOPOLOGY = {
  nodes: [
    { id: 'client',  type: 'pc',     label: 'Your PC',     x: 50,  y: 200, ip: '192.168.1.10', mac: 'AA:BB:CC:11:22:33' },
    { id: 'switch1', type: 'switch', label: 'Layer-2 Switch', x: 170, y: 200, ip: null },
    { id: 'fw',      type: 'router', label: 'Firewall',   x: 290, y: 200, ip: '192.168.1.1',  mac: 'AA:BB:CC:44:55:66' },
    { id: 'gw',      type: 'router', label: 'Home Router\n(NAT)', x: 410, y: 200, ip: '192.168.1.254', mac: 'AA:BB:CC:77:88:99' },
    { id: 'isp1',    type: 'router', label: 'ISP Edge\nRouter',  x: 560, y: 150, ip: '203.0.113.1',   mac: '00:11:22:AA:BB:CC' },
    { id: 'isp2',    type: 'router', label: 'ISP Core\nRouter',  x: 700, y: 200, ip: '203.0.113.2',   mac: '00:11:22:DD:EE:FF' },
    { id: 'isp3',    type: 'router', label: 'ISP Border', x: 840, y: 150, ip: '203.0.113.3',   mac: '00:11:22:11:22:33' },
    { id: 'web',     type: 'server', label: 'Web Server', x: 980, y: 200, ip: '93.184.216.34', mac: 'BB:CC:DD:EE:FF:00' },
    { id: 'dns',     type: 'server', label: 'DNS Server', x: 560, y: 300, ip: '8.8.8.8',       mac: 'CC:DD:EE:11:22:33' },
  ],
  links: [
    { from: 'client',  to: 'switch1', label: 'Ethernet' },
    { from: 'switch1', to: 'fw',      label: 'Trunk' },
    { from: 'fw',      to: 'gw',      label: 'WAN' },
    { from: 'gw',      to: 'isp1',    label: 'ISP Link' },
    { from: 'gw',      to: 'dns',     label: 'DNS Query' },
    { from: 'isp1',    to: 'isp2',   label: 'Backbone' },
    { from: 'isp2',    to: 'isp3',   label: 'Transit' },
    { from: 'isp3',    to: 'web',    label: 'Peering' },
  ],
};

// Scenario definitions with unique characteristics
const SCENARIOS = {
  http: {
    name: 'HTTP Request',
    desc: 'Browse to a website - DNS → TCP → HTTP',
    color: '#00ff88',
    destination: 'example.com',
    protocol: 'TCP',
    port: 80,
    type: 'web'
  },
  ping: {
    name: 'ICMP Ping',
    desc: 'Ping a remote server - Echo Request/Reply (No TCP!)',
    color: '#ff6600',
    destination: '93.184.216.34',
    protocol: 'ICMP',
    port: null,
    type: 'diagnostic'
  },
  ftp: {
    name: 'FTP Transfer',
    desc: 'Download a file via FTP - Control (21) + Data (20)',
    color: '#00aaff',
    destination: 'ftp.example.com',
    protocol: 'TCP',
    port: 21,
    type: 'file-transfer'
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HTTP JOURNEY STEPS (Web browsing - TCP-based)
// ─────────────────────────────────────────────────────────────────────────────
const HTTP_JOURNEY_STEPS = [
  {
    phase: 'Application',
    title: '1 — DNS Resolution',
    log: 'Your PC needs to resolve "example.com" to an IP. Checks local DNS cache - miss! Sends query to DNS server 8.8.8.8.',
    detail: 'DNS Query: example.com → Type: A (IPv4) | UDP:53',
    action: 'dns_query',
    layer: 7,
  },
  {
    phase: 'DNS',
    title: '2 — DNS Query Travel',
    log: 'DNS query travels through switch → firewall → NAT router → ISP. Each device forwards based on routing table.',
    detail: 'Src: 192.168.1.10:50001 → Dst: 8.8.8.8:53 (UDP)',
    action: 'dns_query_travel',
    layer: 7,
  },
  {
    phase: 'DNS',
    title: '3 — DNS Response',
    log: 'DNS server (8.8.8.8) responds with A record: example.com = 93.184.216.34. Response cached locally.',
    detail: 'Answer: example.com = 93.184.216.34 (TTL: 300s)',
    action: 'dns_reply',
    layer: 7,
  },
  {
    phase: 'Transport',
    title: '4 — TCP SYN (Handshake Start)',
    log: 'Browser initiates TCP 3-way handshake. SYN segment sent to port 80 (HTTP). Client port 54321 selected randomly.',
    detail: 'TCP: SYN | Seq=0 | SrcPort=54321 → DstPort=80',
    action: 'tcp_syn',
    layer: 4,
  },
  {
    phase: 'Network',
    title: '5 — ARP for Gateway',
    log: 'PC needs MAC of default gateway (192.168.1.254). Broadcasts ARP request "Who has 192.168.1.254?"',
    detail: 'ARP Request: Who has 192.168.1.254? Tell 192.168.1.10',
    action: 'arp_client',
    layer: 3,
  },
  {
    phase: 'Network',
    title: '6 — Switch MAC Learning',
    log: 'Switch receives frame. Unknown destination MAC - floods to all ports. Records source MAC in table.',
    detail: 'MAC Table: Fa0/1 → AA:BB:CC:11:22:33',
    action: 'switch_learn',
    layer: 2,
  },
  {
    phase: 'Network',
    title: '7 — Routing Decision',
    log: 'NAT router receives packet. Checks routing table: dest 93.184.216.34 not local → forwards to ISP. TTL=64.',
    detail: 'Route: 93.184.216.0/24 → via 203.0.113.1 | TTL=64',
    action: 'routing_gw',
    layer: 3,
  },
  {
    phase: 'NAT',
    title: '8 — NAT Translation (Outbound)',
    log: 'NAT router translates private IP (192.168.1.10) → public IP (203.0.113.100). Creates NAT entry in translation table.',
    detail: 'NAT: 192.168.1.10:54321 → 203.0.113.100:40001',
    action: 'nat_outbound',
    layer: 3,
  },
  {
    phase: 'Firewall',
    title: '9 — Firewall Inspection',
    log: 'Firewall checks outbound policy. New TCP connection? ACL allows TCP/80 (HTTP) outbound. Creates state entry.',
    detail: 'ACL: PERMIT TCP 192.168.1.0/24 → ANY:80 | State: NEW',
    action: 'firewall_check',
    layer: 3,
  },
  {
    phase: 'Routing',
    title: '10 — ISP Edge Routing',
    log: 'ISP Edge router performs Longest Prefix Match. Route to 93.184.216.0/24 via 203.0.113.3. TTL decrements to 63.',
    detail: 'Routing: 93.184.216.0/24 → 203.0.113.3 | TTL: 63',
    action: 'isp_routing',
    layer: 3,
  },
  {
    phase: 'Routing',
    title: '11 — ISP Core Traversal',
    log: 'Packet traverses ISP backbone: ISP-R1 → ISP-R2 → ISP-R3. Each router: decrements TTL, routing lookup, forwards.',
    detail: 'Hops: ISP-R1(63) → ISP-R2(62) → ISP-R3(61)',
    action: 'isp_traverse',
    layer: 3,
  },
  {
    phase: 'Network',
    title: '12 — ARP at Destination',
    log: 'Final router (ISP-R3) needs MAC of web server. ARP request on local segment. Server responds with MAC.',
    detail: 'ARP Reply: 93.184.216.34 = BB:CC:DD:EE:FF:00',
    action: 'arp_webserver',
    layer: 3,
  },
  {
    phase: 'Transport',
    title: '13 — SYN-ACK Response',
    log: 'Web server receives SYN. Creates TCB. Sends SYN-ACK: acknowledges client seq(0), includes server seq(1000).',
    detail: 'TCP: SYN-ACK | Seq=1000, Ack=1 | Ports: 80→54321',
    action: 'tcp_synack',
    layer: 4,
  },
  {
    phase: 'NAT',
    title: '14 — NAT Translation (Inbound)',
    log: 'Return packet arrives at NAT router. Looks up NAT table: dest 203.0.113.100:40001 → 192.168.1.10:54321.',
    detail: 'NAT: 203.0.113.100:40001 → 192.168.1.10:54321',
    action: 'nat_inbound',
    layer: 3,
  },
  {
    phase: 'Transport',
    title: '15 — TCP Handshake Complete',
    log: 'Client receives SYN-ACK. Sends final ACK. Connection ESTABLISHED! Both sides have matching sequence numbers.',
    detail: 'TCP: ACK | Seq=1, Ack=1001 | State: ESTABLISHED',
    action: 'tcp_established',
    layer: 4,
  },
  {
    phase: 'Application',
    title: '16 — HTTP GET Request',
    log: 'Browser sends HTTP GET request. Application layer adds HTTP header. Data broken into TCP segments.',
    detail: 'HTTP: GET / HTTP/1.1 | Host: example.com',
    action: 'http_request',
    layer: 7,
  },
  {
    phase: 'Application',
    title: '17 — HTTP 200 Response',
    log: 'Web server processes request. Generates HTML response. Sends TCP segment with HTTP 200 OK + content.',
    detail: 'HTTP: 200 OK | Content-Length: 1450 bytes',
    action: 'http_response',
    layer: 7,
  },
  {
    phase: 'Transport',
    title: '18 — Connection Close (FIN)',
    log: 'After transfer, either side initiates FIN handshake to close connection gracefully.',
    detail: 'TCP: FIN-WAIT → CLOSE-WAIT → LAST-ACK → CLOSED',
    action: 'tcp_close',
    layer: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ICMP PING JOURNEY STEPS (Diagnostic - No TCP/UDP ports!)
// ─────────────────────────────────────────────────────────────────────────────
const ICMP_JOURNEY_STEPS = [
  {
    phase: 'Network',
    title: '1 — ICMP Echo Request',
    log: 'User runs "ping 93.184.216.34". PC creates ICMP Echo Request packet. Type=8, Code=0. ID and Sequence fields set.',
    detail: 'ICMP: Type=8 (Echo Request) | ID=0x001 | Seq=1',
    action: 'icmp_echo_req',
    layer: 3,
  },
  {
    phase: 'Network',
    title: '2 — ARP for Gateway',
    log: 'PC needs MAC of default gateway (192.168.1.254). Broadcasts ARP request. Gateway replies with its MAC.',
    detail: 'ARP: Who has 192.168.1.254? Tell 192.168.1.10',
    action: 'arp_client',
    layer: 3,
  },
  {
    phase: 'Network',
    title: '3 — Switch MAC Learning',
    log: 'Switch learns PC MAC on port Fa0/1. Unknown dest - floods to all ports except source.',
    detail: 'MAC Table: Fa0/1 → AA:BB:CC:11:22:33',
    action: 'switch_learn',
    layer: 2,
  },
  {
    phase: 'Network',
    title: '4 — Routing at Gateway',
    log: 'NAT router receives ICMP packet. No port numbers! Just checks routing table. Forwards to ISP. TTL=64.',
    detail: 'IP: Src=192.168.1.10, Dst=93.184.216.34, Proto=ICMP(1), TTL=64',
    action: 'routing_gw',
    layer: 3,
  },
  {
    phase: 'NAT',
    title: '5 — NAT for ICMP',
    log: 'NAT translates private IP to public IP. Unlike TCP/UDP, NAT uses ICMP ID field for tracking!',
    detail: 'NAT: 192.168.1.10:ICMP_ID → 203.0.113.100:ICMP_ID',
    action: 'nat_outbound',
    layer: 3,
  },
  {
    phase: 'Firewall',
    title: '6 — Firewall ICMP Check',
    log: 'Firewall checks ICMP policy. Usually ALLOW for ping! Creates state entry using ICMP ID for return matching.',
    detail: 'ACL: PERMIT ICMP ANY → ANY | State: ECHO-REQUEST',
    action: 'firewall_check',
    layer: 3,
  },
  {
    phase: 'Routing',
    title: '7 — ISP Routing',
    log: 'ISP edge router looks up destination. Route found via 203.0.113.3. TTL decrements to 63.',
    detail: 'Route: 93.184.216.0/24 → 203.0.113.3 | TTL: 63',
    action: 'isp_routing',
    layer: 3,
  },
  {
    phase: 'Routing',
    title: '8 — ISP Core Traversal',
    log: 'Packet traverses ISP backbone. Each router decrements TTL, performs routing lookup.',
    detail: 'Hops: ISP-R1(63) → ISP-R2(62) → ISP-R3(61)',
    action: 'isp_traverse',
    layer: 3,
  },
  {
    phase: 'Network',
    title: '9 — ARP at Destination Network',
    log: 'Final router needs MAC of web server. ARP request on local segment. Server responds.',
    detail: 'ARP Reply: 93.184.216.34 = BB:CC:DD:EE:FF:00',
    action: 'arp_webserver',
    layer: 3,
  },
  {
    phase: 'Network',
    title: '10 — ICMP Echo Reply',
    log: 'Web server receives Echo Request. Creates Echo Reply (Type=0). Swaps src/dst IPs, keeps ID and Seq for matching.',
    detail: 'ICMP: Type=0 (Echo Reply) | ID=0x001 | Seq=1',
    action: 'icmp_echo_reply',
    layer: 3,
  },
  {
    phase: 'NAT',
    title: '11 — NAT Reverse Translation',
    log: 'Reply packet arrives. NAT router uses ICMP ID (not port!) to find original internal IP. Translates back.',
    detail: 'NAT: 203.0.113.100:ICMP_ID → 192.168.1.10:ICMP_ID',
    action: 'nat_inbound',
    layer: 3,
  },
  {
    phase: 'Network',
    title: '12 — Return Path Routing',
    log: 'Reply travels back through ISP core → ISP edge → NAT router → firewall → switch → PC.',
    detail: 'Return path: ISP-R3 → ISP-R2 → ISP-R1 → GW → FW → Switch → PC',
    action: 'icmp_return',
    layer: 3,
  },
  {
    phase: 'Network',
    title: '13 — PC Receives Echo Reply',
    log: 'PC receives Echo Reply. Matches ID and Seq with original request. Calculates RTT (Round Trip Time). Displays!',
    detail: 'Ping Reply: bytes=32 time=15ms TTL=61',
    action: 'icmp_complete',
    layer: 3,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FTP JOURNEY STEPS (File Transfer - Two channels: Control + Data)
// ─────────────────────────────────────────────────────────────────────────────
const FTP_JOURNEY_STEPS = [
  {
    phase: 'Application',
    title: '1 — DNS Resolution',
    log: 'User connects to FTP server: "ftp ftp.example.com". PC resolves hostname to IP address.',
    detail: 'DNS Query: ftp.example.com → A → 93.184.216.34',
    action: 'dns_query',
    layer: 7,
  },
  {
    phase: 'DNS',
    title: '2 — DNS Response',
    log: 'DNS server responds with IP: ftp.example.com = 93.184.216.34',
    detail: 'Answer: ftp.example.com = 93.184.216.34',
    action: 'dns_reply',
    layer: 7,
  },
  {
    phase: 'Transport',
    title: '3 — TCP SYN (Control Port 21)',
    log: 'FTP client initiates connection to port 21 (FTP Control). This is the COMMAND channel for sending FTP commands.',
    detail: 'TCP: SYN | SrcPort=54321 → DstPort=21 (FTP-Control)',
    action: 'tcp_syn',
    layer: 4,
  },
  {
    phase: 'Network',
    title: '4 — ARP for Gateway',
    log: 'PC needs MAC of default gateway. Broadcasts ARP request.',
    detail: 'ARP: Who has 192.168.1.254? Tell 192.168.1.10',
    action: 'arp_client',
    layer: 3,
  },
  {
    phase: 'Network',
    title: '5 — Switch MAC Learning',
    log: 'Switch learns PC MAC. Unknown destination - floods frame.',
    detail: 'MAC Table: Fa0/1 → AA:BB:CC:11:22:33',
    action: 'switch_learn',
    layer: 2,
  },
  {
    phase: 'Network',
    title: '6 — Routing Decision',
    log: 'NAT router checks routing table. Destination not local - forwards to ISP. TTL=64.',
    detail: 'Route: 93.184.216.0/24 → 203.0.113.1 | TTL=64',
    action: 'routing_gw',
    layer: 3,
  },
  {
    phase: 'NAT',
    title: '7 — NAT Translation (Control)',
    log: 'NAT translates private IP to public. Creates entry for control channel (port 21).',
    detail: 'NAT: 192.168.1.10:54321 → 203.0.113.100:40021',
    action: 'nat_outbound',
    layer: 3,
  },
  {
    phase: 'Firewall',
    title: '8 — Firewall FTP Inspection',
    log: 'Firewall checks ACL: PERMIT TCP/21 (FTP-Control). Creates state entry. FTP uses port 21 for commands!',
    detail: 'ACL: PERMIT TCP ANY → ANY:21 | State: NEW (FTP-CONTROL)',
    action: 'firewall_check',
    layer: 3,
  },
  {
    phase: 'Routing',
    title: '9 — ISP Routing',
    log: 'Packet forwarded through ISP network to destination.',
    detail: 'Route: 93.184.216.0/24 → 203.0.113.3 | TTL: 63',
    action: 'isp_routing',
    layer: 3,
  },
  {
    phase: 'Routing',
    title: '10 — ISP Core Traversal',
    log: 'Packet traverses ISP backbone to FTP server.',
    detail: 'Hops: ISP-R1 → ISP-R2 → ISP-R3',
    action: 'isp_traverse',
    layer: 3,
  },
  {
    phase: 'Network',
    title: '11 — ARP at FTP Server',
    log: 'Final router performs ARP to get server MAC.',
    detail: 'ARP: Who has 93.184.216.34?',
    action: 'arp_webserver',
    layer: 3,
  },
  {
    phase: 'Transport',
    title: '12 — SYN-ACK (Port 21)',
    log: 'FTP server accepts TCP connection on port 21. 3-way handshake complete for CONTROL channel.',
    detail: 'TCP: SYN-ACK | Seq=0, Ack=1 | Ports: 21→54321',
    action: 'tcp_synack',
    layer: 4,
  },
  {
    phase: 'NAT',
    title: '13 — NAT Inbound (Control)',
    log: 'Return packet NAT translation for control channel.',
    detail: 'NAT: 203.0.113.100:40021 → 192.168.1.10:54321',
    action: 'nat_inbound',
    layer: 3,
  },
  {
    phase: 'Transport',
    title: '14 — TCP ACK (Control Established)',
    log: 'Client sends ACK. Control channel ESTABLISHED. Now can send FTP commands!',
    detail: 'TCP: ACK | State: ESTABLISHED | FTP Control Ready',
    action: 'tcp_established',
    layer: 4,
  },
  {
    phase: 'Application',
    title: '15 — FTP USER Command',
    log: 'Client sends FTP command: USER anonymous. Travels over control channel (port 21).',
    detail: 'FTP: USER anonymous | → Server processes username',
    action: 'ftp_user',
    layer: 7,
  },
  {
    phase: 'Application',
    title: '16 — FTP PASS Command',
    log: 'Client sends: PASS user@domain. Server validates credentials.',
    detail: 'FTP: PASS ******** | → Authentication',
    action: 'ftp_pass',
    layer: 7,
  },
  {
    phase: 'Application',
    title: '17 — FTP PASV Command',
    log: 'Client issues PASV (Passive Mode). Tells server: "Open a data port for me to connect to!" Server responds with IP:port.',
    detail: 'FTP: PASV | ← 203.0.113.34:50001 (Server opens port)',
    action: 'ftp_pasv',
    layer: 7,
  },
  {
    phase: 'Transport',
    title: '18 — TCP SYN (Data Port - Random!)',
    log: 'Client initiates NEW TCP connection to server\'s DATA port (50001). This is the DATA channel! Separate from port 21!',
    detail: 'TCP: SYN | SrcPort=54322 → DstPort=50001 (FTP-DATA)',
    action: 'ftp_data_syn',
    layer: 4,
  },
  {
    phase: 'NAT',
    title: '19 — NAT for Data Channel',
    log: 'NAT creates separate entry for data channel! Uses source port to track multiple FTP connections.',
    detail: 'NAT: 192.168.1.10:54322 → 203.0.113.100:40022',
    action: 'nat_outbound',
    layer: 3,
  },
  {
    phase: 'Firewall',
    title: '20 — Firewall Data Channel',
    log: 'Firewall sees new FTP data connection! Checks state table - relates to existing FTP control session. ALLOWS!',
    detail: 'State: RELATED to FTP-CONTROL | Data channel permitted',
    action: 'firewall_check',
    layer: 3,
  },
  {
    phase: 'Transport',
    title: '21 — Data Channel Established',
    log: 'Data channel TCP handshake complete. Now file transfer can begin over this separate connection!',
    detail: 'TCP: ESTABLISHED | Data Channel Ready | Port 50001',
    action: 'tcp_established',
    layer: 4,
  },
  {
    phase: 'Application',
    title: '22 — FTP RETR Command',
    log: 'Client sends: RETR filename.txt. Command travels over CONTROL channel (port 21).',
    detail: 'FTP: RETR important.txt | → File transfer starts',
    action: 'ftp_retr',
    layer: 7,
  },
  {
    phase: 'Application',
    title: '23 — File Data Transfer',
    log: 'File content transfers over DATA channel (port 50001). Different port than commands!',
    detail: 'FTP-DATA: [Binary file content...] | 1450 bytes per segment',
    action: 'ftp_transfer',
    layer: 7,
  },
  {
    phase: 'Application',
    title: '24 — Transfer Complete (226)',
    log: 'Server sends: 226 Transfer complete. Confirms file successfully transferred over data channel.',
    detail: 'FTP: 226 OK | File transfer complete',
    action: 'ftp_complete',
    layer: 7,
  },
  {
    phase: 'Transport',
    title: '25 — Data Channel Close',
    log: 'Data channel TCP connection closes after transfer. Control channel (port 21) remains open for more commands.',
    detail: 'TCP: FIN | Data channel closed | Control still open',
    action: 'tcp_close',
    layer: 4,
  },
  {
    phase: 'Application',
    title: '26 — FTP QUIT',
    log: 'Client sends QUIT command. Control channel closes. All FTP sessions end.',
    detail: 'FTP: QUIT | → 221 Goodbye',
    action: 'ftp_quit',
    layer: 7,
  },
  {
    phase: 'Transport',
    title: '27 — Control Channel Close',
    log: 'TCP FIN handshake closes port 21 (control channel). NAT entries cleaned up.',
    detail: 'TCP: FIN | Port 21 closed | NAT entries cleared',
    action: 'tcp_close',
    layer: 4,
  },
];

// Get journey steps based on current scenario
function getJourneySteps(scenario) {
  switch(scenario) {
    case 'ping': return ICMP_JOURNEY_STEPS;
    case 'ftp': return FTP_JOURNEY_STEPS;
    default: return HTTP_JOURNEY_STEPS;
  }
}

// Layer colour mapping
const LAYER_COLORS = {
  7: '#8b5cf6', // L7 - Application - Purple
  4: '#06b6d4', // L4 - Transport - Cyan
  3: '#f59e0b', // L3 - Network - Amber
  2: '#10b981', // L2 - Data Link - Emerald
};

const PHASE_BADGES = {
  Application: 'badge-purple',
  DNS:         'badge-cyan',
  Transport:   'badge-cyan',
  Network:     'badge-amber',
  NAT:         'badge-amber',
  Routing:     'badge-amber',
  Firewall:    'badge-red',
};

class PacketJourneySimulator {
  constructor() {
    this.container = null;
    this._diagram  = null;
    this._step     = 0;
    this._running  = false;
    this._natTable = {};
    this._macTable = {};
    this._arpCache = {};
    this._currentScenario = 'http';
    this._packetHistory = [];
  }

  init(containerEl) {
    this.container = containerEl;
    this._diagram  = createNetworkDiagram();
    this._step     = 0;
    this._running  = false;
    this._natTable = {};
    this._macTable = {};
    this._arpCache = {};
    this._packetHistory = [];
    this._render();
  }

  _render() {
    const scenario = SCENARIOS[this._currentScenario];
    const journeySteps = getJourneySteps(this._currentScenario);
    
    // Scenario description based on type
    const scenarioDescriptions = {
      http: 'Follow an HTTP request through DNS → TCP → HTTP. See how web pages load packet by packet.',
      ping: 'Watch ICMP Echo Request/Reply - NO ports, NO TCP! Just direct network-layer communication.',
      ftp: 'See the dual-channel magic: Port 21 for commands (USER, PASS) + separate port for file data!'
    };
    
    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <span>Simulations</span>
        </div>
        <h1 class="module-header__title">🔬 Packet Journey Simulator</h1>
        <p class="module-header__description">
          ${scenarioDescriptions[this._currentScenario]}
        </p>
        
        <!-- Key Differences Bar -->
        <div class="concept-bar" style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:0.5rem; padding:0.5rem; background:rgba(${this._currentScenario === 'ping' ? '255,102,0' : this._currentScenario === 'ftp' ? '0,170,255' : '0,255,136'},0.08); border-radius:var(--radius-sm); border:1px solid rgba(${this._currentScenario === 'ping' ? '255,102,0' : this._currentScenario === 'ftp' ? '0,170,255' : '0,255,136'},0.2);">
          ${this._currentScenario === 'ping' ? `
            <div style="font-size:var(--text-xs);"><span style="color:#ff6600;">⚡ ICMP:</span> No ports! Uses ID field instead</div>
            <div style="font-size:var(--text-xs);"><span style="color:#ff6600;">🔄 Type:</span> 8=Request, 0=Reply</div>
            <div style="font-size:var(--text-xs);"><span style="color:#ff6600;">🚫 No TCP:</span> Connectionless!</div>
          ` : this._currentScenario === 'ftp' ? `
            <div style="font-size:var(--text-xs);"><span style="color:#00aaff;">📞 Port 21:</span> Control channel (commands)</div>
            <div style="font-size:var(--text-xs);"><span style="color:#00aaff;">📂 Port 20:</span> Data channel (file)</div>
            <div style="font-size:var(--text-xs);"><span style="color:#00aaff;">🔀 2 TCP:</span> Separate connections!</div>
          ` : `
            <div style="font-size:var(--text-xs);"><span style="color:#00ff88;">🔗 Port 80:</span> HTTP traffic</div>
            <div style="font-size:var(--text-xs);"><span style="color:#00ff88;">✓ TCP:</span> Reliable delivery</div>
            <div style="font-size:var(--text-xs);"><span style="color:#00ff88;">🔄 3-Way:</span> SYN → SYN-ACK → ACK</div>
          `}
        </div>
      </div>

      <!-- Scenario Selector -->
      <div style="display:flex; gap:0.5rem; margin-bottom:1rem; flex-wrap:wrap;">
        ${Object.entries(SCENARIOS).map(([key, s]) => `
          <button class="btn ${this._currentScenario === key ? 'btn-primary' : 'btn-ghost'}" 
                  data-scenario="${key}"
                  style="font-size:0.75rem; padding:0.4rem 0.75rem; ${this._currentScenario === key ? `border-color:${s.color} !important;` : ''}">
            <span style="color:${s.color}">●</span> ${s.name}
          </button>
        `).join('')}
      </div>

      <div class="layout-main-sidebar" style="grid-template-columns:1fr 320px;">
        <div>
          <div class="sim-canvas" id="pj-canvas" style="min-height:320px;"></div>

          <!-- Packet Visualization Bar -->
          <div id="pj-packet-bar" style="
            background:linear-gradient(90deg, #1a1a2e 0%, #16213e 100%);
            border:1px solid #333;
            border-radius:6px;
            padding:0.75rem;
            margin-top:0.75rem;
            display:flex;
            align-items:center;
            gap:0.5rem;
            overflow-x:auto;
          ">
            <span class="text-mono text-xs" style="color:#666;">Packet:</span>
            <div id="pj-packet-visual" style="
              flex:1;
              height:32px;
              background:linear-gradient(90deg, ${scenario.color}22, ${scenario.color}44);
              border:1px solid ${scenario.color}66;
              border-radius:4px;
              display:flex;
              align-items:center;
              padding:0 0.5rem;
              gap:0.25rem;
            ">
              <span class="text-mono text-xs" style="color:${scenario.color};" id="pj-packet-label">No packet in transit</span>
            </div>
          </div>

          <!-- Progress pipeline -->
          <div style="display:flex; gap:2px; margin-top:0.75rem; overflow-x:auto; padding:0 2px;">
            ${journeySteps.map((s, i) => `
              <div class="pj-phase-pip" id="pj-pip-${i}" title="${s.title}"
                style="
                  flex:1; min-width:12px; height:8px;
                  background:var(--color-bg-raised);
                  border-radius:4px;
                  border:1px solid var(--color-border);
                  transition:all 0.3s ease;
                  cursor:pointer;
                ">
              </div>
            `).join('')}
          </div>

          <div class="control-bar" style="margin-top:0.75rem;">
            <button class="btn btn-primary" id="pj-step-btn">▶ Step</button>
            <button class="btn btn-secondary" id="pj-auto-btn">⚡ Auto Play</button>
            <button class="btn btn-ghost" id="pj-reset-btn">↺ Reset</button>
            <span class="text-mono text-xs text-muted" style="margin-left:auto;" id="pj-step-counter">
              Step 0 / ${journeySteps.length}
            </span>
          </div>

          <!-- Step Info Panel -->
          <div class="info-panel" style="margin-top:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem; flex-wrap:wrap;">
              <div class="info-panel__title" style="margin:0;" id="pj-step-title">📦 Ready to Start</div>
              <span id="pj-phase-badge" class="badge badge-cyan" style="font-size:var(--text-xs);">Start</span>
              <span id="pj-layer-badge" class="badge" style="font-size:var(--text-xs); background:#333;">Layer: -</span>
            </div>
            <p class="text-secondary text-sm" style="line-height:1.8;" id="pj-step-log">
              Press <strong>Step</strong> or <strong>Auto Play</strong> to begin the packet journey.
              Watch how each network device processes the packet at different OSI layers.
            </p>
            <!-- Packet Detail -->
            <div id="pj-packet-detail" style="
              margin-top:0.75rem;
              padding:0.75rem;
              background:#0a0a0a;
              border-left:3px solid ${scenario.color};
              border-radius:0 4px 4px 0;
              display:none;
            ">
              <div class="text-mono text-xs" style="color:${scenario.color}; margin-bottom:0.25rem;" id="pj-detail-header">
                📋 Packet Header Details
              </div>
              <div class="text-mono text-xs" style="color:#888; line-height:1.6;" id="pj-detail-content">
                --
              </div>
            </div>
          </div>
        </div>

        <div>
          <!-- Packet Header Visualization -->
          <div class="card" style="margin-bottom:1rem;">
            <div class="text-mono text-xs text-muted" style="margin-bottom:0.5rem; text-transform:uppercase; display:flex; align-items:center; gap:0.5rem;">
              📦 Current Packet
              <span id="pj-packet-type" class="badge badge-purple" style="font-size:9px;">-</span>
            </div>
            <div id="pj-header-viz" style="
              background:#0d1117;
              border:1px solid #21262d;
              border-radius:6px;
              padding:0.5rem;
              font-family:monospace;
              font-size:10px;
              line-height:1.5;
            ">
              <div style="color:#8b949e; border-bottom:1px solid #21262d; padding-bottom:0.25rem; margin-bottom:0.25rem;">
                L2: Ethernet Frame
              </div>
              <div style="color:#58a6ff;">Dst: <span id="viz-dst-mac">------</span> | Src: <span id="viz-src-mac">------</span></div>
              <div style="color:#8b949e; border-bottom:1px solid #21262d; padding:0.25rem 0; margin:0.25rem 0;">
                L3: IP Packet
              </div>
              <div style="color:#58a6ff;">Src: <span id="viz-src-ip">192.168.1.10</span> | Dst: <span id="viz-dst-ip">------</span></div>
              <div style="color:#f0883e;">TTL: <span id="viz-ttl">64</span> | Proto: <span id="viz-proto">${scenario.protocol}</span></div>
              <div style="color:#8b949e; border-bottom:1px solid #21262d; padding:0.25rem 0; margin:0.25rem 0;">
                L4: ${scenario.protocol === 'ICMP' ? 'ICMP' : 'TCP/UDP Segment'}
              </div>
              ${scenario.protocol !== 'ICMP' ? `
              <div style="color:#58a6ff;">SrcPort: <span id="viz-src-port">------</span> | DstPort: <span id="viz-dst-port">${scenario.port || '---'}</span></div>
              <div style="color:#f0883e;">Seq: <span id="viz-seq">0</span> | Flags: <span id="viz-flags">------</span></div>
              ` : `
              <div style="color:#f0883e;">ICMP Type: <span id="viz-icmp-type">---</span> | Code: <span id="viz-icmp-code">---</span> | ID: <span id="viz-icmp-id">---</span></div>
              `}
            </div>
          </div>

          <!-- Protocol-Specific Info Panel -->
          <div class="info-panel" style="margin-bottom:1rem; border-left:3px solid ${scenario.color};">
            <div class="info-panel__title" style="display:flex; align-items:center; gap:0.5rem;">
              ${this._currentScenario === 'ping' ? '🎯 ICMP Protocol' : this._currentScenario === 'ftp' ? '📂 FTP Protocol' : '🌐 HTTP Protocol'}
            </div>
            <div style="font-size:var(--text-xs); color:var(--color-text-muted); line-height:1.6;">
              ${this._currentScenario === 'ping' ? `
                <div style="margin-bottom:0.4rem;"><strong style="color:#ff6600;">ICMP = Layer 3!</strong> No port numbers.</div>
                <div style="margin-bottom:0.4rem;">Type 8 = Echo Request (ping)</div>
                <div style="margin-bottom:0.4rem;">Type 0 = Echo Reply (pong)</div>
                <div>NAT uses <strong>ICMP ID</strong> instead of port!</div>
              ` : this._currentScenario === 'ftp' ? `
                <div style="margin-bottom:0.4rem;"><strong style="color:#00aaff;">Control (21):</strong> USER, PASS, RETR, LIST</div>
                <div style="margin-bottom:0.4rem;"><strong style="color:#00aaff;">Data (20/Random):</strong> File content</div>
                <div>Passive mode = client connects to server port</div>
              ` : `
                <div style="margin-bottom:0.4rem;"><strong style="color:#00ff88;">Port 80:</strong> HTTP traffic</div>
                <div style="margin-bottom:0.4rem;"><strong style="color:#00ff88;">3-Way Handshake:</strong> SYN → SYN-ACK → ACK</div>
                <div>GET / POST for requests, 200 for responses</div>
              `}
            </div>
          </div>

          <!-- NAT Table -->
          <div class="info-panel">
            <div class="info-panel__title">🔄 NAT Translation Table</div>
            <div style="font-family:var(--font-mono); font-size:var(--text-xs); margin-bottom:0.4rem; display:flex; justify-content:space-between; color:var(--color-text-muted); border-bottom:1px solid var(--color-border); padding-bottom:0.3rem;">
              <span>Inside Local</span><span>Outside Global</span>
            </div>
            <div id="pj-nat-table">
              <p class="text-muted text-xs" style="text-align:center; padding:0.4rem;">No NAT entries</p>
            </div>
          </div>

          <!-- ARP Cache -->
          <div class="info-panel" style="margin-top:1rem;">
            <div class="info-panel__title">📡 ARP Cache</div>
            <div style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-text-muted); margin-bottom:0.4rem; border-bottom:1px solid var(--color-border); padding-bottom:0.3rem;">
              IP Address → MAC Address
            </div>
            <div id="pj-arp-table">
              <p class="text-muted text-xs" style="text-align:center; padding:0.4rem;">No ARP entries</p>
            </div>
          </div>

          <!-- Switch MAC Table -->
          <div class="info-panel" style="margin-top:1rem;">
            <div class="info-panel__title">🔀 Switch MAC Table</div>
            <div style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-text-muted); margin-bottom:0.4rem; border-bottom:1px solid var(--color-border); padding-bottom:0.3rem;">
              Port → MAC Address
            </div>
            <div id="pj-mac-table">
              <p class="text-muted text-xs" style="text-align:center; padding:0.4rem;">Empty</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this._diagram.init(
      this.container.querySelector('#pj-canvas'),
      TOPOLOGY,
      { width: 1020, height: 350 }
    );

    this._bindControls();
  }

  _bindControls() {
    // Scenario buttons
    this.container.querySelectorAll('[data-scenario]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._currentScenario = btn.dataset.scenario;
        this.reset();
      });
    });

    this.container.querySelector('#pj-step-btn')?.addEventListener('click', () => {
      if (!this._running) this._runStep();
    });
    this.container.querySelector('#pj-auto-btn')?.addEventListener('click', () => {
      if (!this._running) this._autoPlay();
    });
    this.container.querySelector('#pj-reset-btn')?.addEventListener('click', () => {
      this._running = false;
      this.reset();
    });

    // Click on progress pips to jump to step
    this.container.querySelectorAll('.pj-phase-pip').forEach((pip, i) => {
      pip.addEventListener('click', () => {
        if (i < this._step) {
          // Can't go back for now, but could implement
          showToast('Cannot go backwards in simulation', 'info');
        }
      });
    });
  }

  async _runStep() {
    const journeySteps = getJourneySteps(this._currentScenario);
    if (this._step >= journeySteps.length || this._running) return;
    this._running = true;

    const step  = journeySteps[this._step];
    const color = LAYER_COLORS[step.layer] || '#00ff88';
    const scenario = SCENARIOS[this._currentScenario];

    // Update UI
    const title   = this.container.querySelector('#pj-step-title');
    const log     = this.container.querySelector('#pj-step-log');
    const badge   = this.container.querySelector('#pj-phase-badge');
    const layerBadge = this.container.querySelector('#pj-layer-badge');
    const counter = this.container.querySelector('#pj-step-counter');
    const detailPanel = this.container.querySelector('#pj-packet-detail');
    const detailContent = this.container.querySelector('#pj-detail-content');
    const packetLabel = this.container.querySelector('#pj-packet-label');
    const packetType = this.container.querySelector('#pj-packet-type');

    if (title)   title.textContent  = step.title;
    if (log)     log.textContent    = step.log;
    if (badge) {
      badge.textContent  = step.phase;
      badge.className    = `badge ${PHASE_BADGES[step.phase] || 'badge-cyan'}`;
    }
    if (layerBadge) {
      layerBadge.textContent = `Layer ${step.layer}`;
      layerBadge.style.background = color + '33';
      layerBadge.style.color = color;
    }
    if (counter) counter.textContent = `Step ${this._step + 1} / ${journeySteps.length}`;
    
    // Show packet detail
    if (detailPanel) {
      detailPanel.style.display = 'block';
      detailPanel.style.borderLeftColor = color;
    }
    if (detailContent) {
      detailContent.innerHTML = `<span style="color:${color}">${step.detail}</span>`;
    }
    if (packetLabel) {
      packetLabel.textContent = step.detail;
    }
    if (packetType) {
      packetType.textContent = step.phase;
      packetType.className = `badge`;
      packetType.style.background = color + '33';
      packetType.style.color = color;
    }

    // Update packet header visualization
    this._updatePacketViz(step);

    // Mark pipeline pip
    const pip = this.container.querySelector(`#pj-pip-${this._step}`);
    if (pip) {
      pip.style.background = color;
      pip.style.boxShadow = `0 0 8px ${color}`;
    }

    await this._executeAction(step.action, step, scenario);
    this._step++;
    this._running = false;

    if (this._step >= journeySteps.length) {
      this._onComplete();
    }
  }

  _updatePacketViz(step) {
    const vizDstMac = this.container.querySelector('#viz-dst-mac');
    const vizSrcMac = this.container.querySelector('#viz-src-mac');
    const vizSrcIp = this.container.querySelector('#viz-src-ip');
    const vizDstIp = this.container.querySelector('#viz-dst-ip');
    const vizTtl = this.container.querySelector('#viz-ttl');
    const vizProto = this.container.querySelector('#viz-proto');
    const vizSrcPort = this.container.querySelector('#viz-src-port');
    const vizDstPort = this.container.querySelector('#viz-dst-port');
    const vizSeq = this.container.querySelector('#viz-seq');
    const vizFlags = this.container.querySelector('#viz-flags');

    const isPing = this._currentScenario === 'ping';
    const isFTP = this._currentScenario === 'ftp';

    // Set defaults based on step
    let srcMac = 'AA:BB:CC:11:22:33';
    let dstMac = '------';
    let srcIp = '192.168.1.10';
    let dstIp = '------';
    let ttl = 64;
    let proto = isPing ? 'ICMP' : 'TCP';
    let srcPort = '54321';
    let dstPort = isFTP ? '21' : '80';
    let seq = '0';
    let flags = 'SYN';

    const action = step.action;

    // ICMP-specific handling
    if (isPing) {
      if (action === 'icmp_echo_req') {
        proto = 'ICMP';
        dstIp = '93.184.216.34';
        ttl = 64;
        srcPort = 'ID:0x001';
        dstPort = 'Seq:1';
        flags = 'Type:8 (Request)';
      } else if (action === 'icmp_echo_reply' || action === 'icmp_return' || action === 'icmp_complete') {
        proto = 'ICMP';
        srcIp = '93.184.216.34';
        dstIp = '192.168.1.10';
        ttl = 61;
        srcPort = 'ID:0x001';
        dstPort = 'Seq:1';
        flags = action === 'icmp_complete' ? 'Reply received!' : 'Type:0 (Reply)';
      } else if (action.includes('nat')) {
        srcIp = '203.0.113.100';
        dstIp = '192.168.1.10';
        ttl = isPing ? 61 : 64;
        srcPort = 'ID:0x001';
        dstPort = 'ID:0x001';
        flags = 'ICMP ID mapped';
      } else if (action === 'routing_gw') {
        dstIp = '93.184.216.34';
        ttl = 64;
        srcPort = 'ID:0x001';
        dstPort = 'Seq:1';
        flags = 'Type:8 (Request)';
      } else if (action === 'isp_routing' || action === 'isp_traverse') {
        dstIp = '93.184.216.34';
        ttl = action === 'isp_routing' ? 63 : 62;
        srcPort = 'ID:0x001';
        dstPort = 'Seq:1';
        flags = 'Type:8 (Request)';
      }
    } else if (action.includes('dns')) {
      proto = 'UDP';
      dstIp = '8.8.8.8';
      dstPort = '53';
      srcPort = Math.floor(Math.random() * 40000 + 10000);
      flags = 'DATA';
      if (action === 'dns_reply') {
        dstIp = '192.168.1.10';
        srcIp = '8.8.8.8';
      }
    } else if (action === 'arp_client' || action === 'arp_webserver') {
      proto = 'ARP';
      dstMac = 'FF:FF:FF:FF:FF:FF';
      srcMac = 'AA:BB:CC:11:22:33';
      dstIp = action === 'arp_client' ? '192.168.1.254' : '93.184.216.34';
      flags = 'Request';
    } else if (action.includes('nat')) {
      srcIp = '203.0.113.100';
      if (isFTP) {
        srcPort = action === 'ftp_data_syn' ? '40022' : '40021';
      } else {
        srcPort = '40001';
      }
      dstIp = action === 'nat_inbound' ? '192.168.1.10' : '93.184.216.34';
      dstPort = isFTP ? (action === 'nat_inbound' ? '54321' : '50001') : (action === 'nat_inbound' ? '54321' : '80');
      flags = isFTP ? 'FTP NAT' : 'NAT';
    } else if (isFTP) {
      // FTP specific
      if (action === 'tcp_syn') {
        dstPort = '21';
        flags = 'SYN(Control)';
      } else if (action === 'ftp_user' || action === 'ftp_pass' || action === 'ftp_pasv' || action === 'ftp_retr') {
        dstPort = '21';
        flags = 'FTP-CMD';
        srcIp = '192.168.1.10';
        dstIp = '93.184.216.34';
      } else if (action === 'ftp_data_syn') {
        dstPort = '50001';
        flags = 'SYN(Data)';
      } else if (action === 'ftp_transfer' || action === 'ftp_complete') {
        dstPort = '50001';
        srcIp = '93.184.216.34';
        dstIp = '192.168.1.10';
        flags = action === 'ftp_complete' ? '226 OK' : 'FILE-DATA';
      } else if (action === 'ftp_quit') {
        dstPort = '21';
        flags = 'QUIT';
      }
    } else if (action === 'http_request' || action === 'http_response') {
      dstIp = action === 'http_request' ? '93.184.216.34' : '192.168.1.10';
      srcIp = action === 'http_request' ? '192.168.1.10' : '93.184.216.34';
      seq = action === 'http_request' ? '1' : '1001';
      flags = 'PSH,ACK';
    } else if (action === 'tcp_synack') {
      srcPort = isFTP ? '21' : '80';
      seq = '1000';
      flags = 'SYN,ACK';
    } else if (action === 'tcp_established' || action === 'tcp_close') {
      flags = action === 'tcp_close' ? 'FIN' : 'ACK';
      seq = '1';
    }

    if (vizDstMac) vizDstMac.textContent = dstMac;
    if (vizSrcMac) vizSrcMac.textContent = srcMac;
    if (vizSrcIp) vizSrcIp.textContent = srcIp;
    if (vizDstIp) vizDstIp.textContent = dstIp;
    if (vizTtl) vizTtl.textContent = ttl;
    if (vizProto) vizProto.textContent = proto;
    if (vizSrcPort) vizSrcPort.textContent = srcPort;
    if (vizDstPort) vizDstPort.textContent = dstPort;
    if (vizSeq) vizSeq.textContent = seq;
    if (vizFlags) vizFlags.textContent = flags;
  }

  async _autoPlay() {
    const journeySteps = getJourneySteps(this._currentScenario);
    while (this._step < journeySteps.length && !this._isDestroyed) {
      await this._runStep();
      await sleep(1200); // SLOWER auto-play for better understanding
    }
  }

  async _executeAction(action, step, scenario) {
    const speed = 700; // SLOWER animation for better understanding
    const isPing = this._currentScenario === 'ping';
    const isFTP = this._currentScenario === 'ftp';
    
    switch (action) {
      // DNS Cases (HTTP & FTP)
      case 'dns_query':
        this._diagram.highlightNode('client', 'active', 1000);
        await sleep(800);
        break;

      case 'dns_query_travel':
        await this._diagram.animatePacket(['client', 'switch1', 'fw', 'gw', 'dns'], { type: 'data', label: 'DNS Query', speed });
        this._diagram.highlightNode('dns', 'hop', 1000);
        this._arpCache['8.8.8.8'] = 'CC:DD:EE:11:22:33';
        this._updateArpTable();
        await sleep(400);
        break;

      case 'dns_reply':
        await this._diagram.animatePacket(['dns', 'gw', 'fw', 'switch1', 'client'], { type: 'data', label: 'DNS Answer', speed });
        this._diagram.highlightNode('client', 'success', 1000);
        await sleep(600);
        break;

      // ICMP Specific Actions
      case 'icmp_echo_req':
        this._diagram.highlightNode('client', 'active', 600);
        await sleep(400);
        break;

      case 'icmp_echo_reply':
        await this._diagram.animatePacket(['web', 'isp3', 'isp2', 'isp1', 'gw', 'fw', 'switch1', 'client'], { type: 'icmp', label: 'Echo Reply', speed: 320 });
        await sleep(300);
        break;

      case 'icmp_return':
        await this._diagram.animatePacket(['web', 'isp3', 'isp2', 'isp1', 'gw', 'fw', 'switch1', 'client'], { type: 'icmp', label: 'ICMP Reply', speed: 300 });
        await sleep(300);
        break;

      case 'icmp_complete':
        this._diagram.highlightNode('client', 'success', 2000);
        await sleep(800);
        break;

      // FTP Specific Actions
      case 'ftp_user':
        await this._diagram.animatePacket(['client', 'switch1', 'fw', 'gw', 'isp1', 'isp2', 'isp3', 'web'], { type: 'data', label: 'USER anon', speed: 300 });
        await sleep(400);
        break;

      case 'ftp_pass':
        await this._diagram.animatePacket(['client', 'switch1', 'fw', 'gw', 'isp1', 'isp2', 'isp3', 'web'], { type: 'data', label: 'PASS ****', speed: 300 });
        await sleep(400);
        break;

      case 'ftp_pasv':
        await this._diagram.animatePacket(['web', 'isp3', 'isp2', 'isp1', 'gw', 'fw', 'switch1', 'client'], { type: 'data', label: '227 PASV', speed: 300 });
        await sleep(400);
        break;

      case 'ftp_data_syn':
        this._diagram.highlightNode('client', 'active', 600);
        await sleep(400);
        break;

      case 'ftp_retr':
        await this._diagram.animatePacket(['client', 'switch1', 'fw', 'gw', 'isp1', 'isp2', 'isp3', 'web'], { type: 'data', label: 'RETR file', speed: 280 });
        await sleep(300);
        break;

      case 'ftp_transfer':
        await this._diagram.animatePacket(['web', 'isp3', 'isp2', 'isp1', 'gw', 'fw', 'switch1', 'client'], { type: 'data', label: 'FILE DATA', speed: 260 });
        await sleep(300);
        break;

      case 'ftp_complete':
        await this._diagram.animatePacket(['web', 'isp3', 'isp2', 'isp1', 'gw', 'fw', 'switch1', 'client'], { type: 'data', label: '226 OK', speed: 280 });
        await sleep(400);
        break;

      case 'ftp_quit':
        await this._diagram.animatePacket(['client', 'switch1', 'fw', 'gw', 'isp1', 'isp2', 'isp3', 'web'], { type: 'data', label: 'QUIT', speed: 300 });
        await this._diagram.animatePacket(['web', 'isp3', 'isp2', 'isp1', 'gw', 'fw', 'switch1', 'client'], { type: 'data', label: '221 Bye', speed: 300 });
        this._natTable = {};
        this._updateNatTable();
        break;

      // TCP Cases (HTTP & FTP Control)
      case 'tcp_syn':
        this._diagram.highlightNode('client', 'active', 600);
        await this._diagram.animatePacket(['client', 'switch1'], { type: 'data', label: isFTP ? 'SYN(21)' : 'SYN', speed: 350 });
        break;

      case 'arp_client':
        // ARP Request
        await this._diagram.animatePacket(['client', 'switch1'], { type: 'broadcast', label: 'ARP WhoHas', speed: 350 });
        await this._diagram.animatePacket(['switch1', 'fw'], { type: 'broadcast', label: 'ARP WhoHas', speed: 350 });
        this._diagram.highlightNode('fw', 'hop', 600);
        await sleep(200);
        // ARP Reply
        await this._diagram.animatePacket(['fw', 'switch1'], { type: 'data', label: 'ARP Reply', speed: 350 });
        await this._diagram.animatePacket(['switch1', 'client'], { type: 'data', label: 'ARP Reply', speed: 350 });
        this._arpCache['192.168.1.1'] = 'AA:BB:CC:44:55:66';
        this._macTable['AA:BB:CC:11:22:33'] = 'Fa0/1';
        this._updateMacTable();
        this._updateArpTable();
        await sleep(400);
        break;

      case 'switch_learn':
        this._macTable['AA:BB:CC:11:22:33'] = 'Fa0/1';
        this._macTable['AA:BB:CC:44:55:66'] = 'Fa0/2';
        this._updateMacTable();
        await sleep(500);
        break;

      case 'routing_gw':
        this._diagram.highlightNode('gw', 'active', 1000);
        await sleep(500);
        break;

      case 'nat_outbound':
        this._diagram.highlightNode('gw', 'active', 1500);
        if (isPing) {
          this._natTable['192.168.1.10:ICMP'] = '203.0.113.100:ICMP';
        } else if (isFTP) {
          const existing = Object.keys(this._natTable).find(k => k.includes('54321'));
          if (!existing) {
            this._natTable['192.168.1.10:54321'] = '203.0.113.100:40021';
          } else {
            this._natTable['192.168.1.10:54322'] = '203.0.113.100:40022';
          }
        } else {
          this._natTable['192.168.1.10:54321'] = '203.0.113.100:40001';
        }
        this._updateNatTable();
        await sleep(800);
        break;

      case 'firewall_check':
        this._diagram.highlightNode('fw', 'active', 1200);
        await sleep(600);
        break;

      case 'isp_routing':
        this._diagram.highlightNode('isp1', 'active', 800);
        await sleep(400);
        break;

      case 'isp_traverse':
        await this._diagram.animatePacket(['gw', 'isp1', 'isp2', 'isp3', 'web'], { type: isPing ? 'icmp' : 'data', label: isPing ? 'ICMP Pkt' : 'IP Pkt', speed });
        this._diagram.highlightNode('web', 'hop', 800);
        this._arpCache['93.184.216.34'] = 'BB:CC:DD:EE:FF:00';
        this._updateArpTable();
        await sleep(400);
        break;

      case 'arp_webserver':
        await this._diagram.animatePacket(['isp3', 'web'], { type: 'broadcast', label: 'ARP WhoHas', speed: 350 });
        await this._diagram.animatePacket(['web', 'isp3'], { type: 'data', label: 'ARP Reply', speed: 350 });
        await sleep(400);
        break;

      case 'tcp_synack':
        await this._diagram.animatePacket(['web', 'isp3', 'isp2', 'isp1', 'gw', 'switch1', 'client'], { type: 'data', label: isFTP ? 'SYN-ACK(21)' : 'SYN-ACK', speed: 320 });
        this._diagram.highlightNode('client', 'hop', 800);
        await sleep(400);
        break;

      case 'nat_inbound':
        this._diagram.highlightNode('gw', 'active', 1000);
        if (isPing) {
          this._natTable['203.0.113.100:ICMP'] = '192.168.1.10:ICMP';
        } else if (isFTP) {
          this._natTable['203.0.113.100:40021'] = '192.168.1.10:54321';
        } else {
          this._natTable['203.0.113.100:40001'] = '192.168.1.10:54321';
        }
        this._updateNatTable();
        await sleep(500);
        break;

      case 'tcp_established':
        await this._diagram.animatePacket(['client', 'switch1', 'fw', 'gw', 'isp1', 'isp2', 'isp3', 'web'], { type: 'data', label: 'ACK', speed: 300 });
        this._diagram.highlightNode('web', 'success', 800);
        await sleep(500);
        break;

      case 'http_request':
        await this._diagram.animatePacket(['client', 'switch1', 'fw', 'gw', 'isp1', 'isp2', 'isp3', 'web'], { type: 'data', label: 'HTTP GET', speed: 280 });
        await sleep(300);
        break;

      case 'http_response':
        await this._diagram.animatePacket(['web', 'isp3', 'isp2', 'isp1', 'gw', 'fw', 'switch1', 'client'], { type: 'data', label: 'HTTP 200', speed: 280 });
        this._diagram.highlightNode('client', 'success', 2000);
        break;

      case 'tcp_close':
        await this._diagram.animatePacket(['client', 'web'], { type: 'data', label: 'FIN', speed: 400 });
        await this._diagram.animatePacket(['web', 'client'], { type: 'data', label: 'FIN+ACK', speed: 400 });
        await this._diagram.animatePacket(['client', 'web'], { type: 'data', label: 'ACK', speed: 400 });
        this._natTable = {};
        this._updateNatTable();
        break;
    }
  }

  _onComplete() {
    const stepBtn = this.container.querySelector('#pj-step-btn');
    if (stepBtn) { stepBtn.textContent = '✓ Complete'; stepBtn.disabled = true; }

    showToast('🎉 Full packet journey complete! You now understand how data travels across networks.', 'success', 6000);

    stateManager.mergeState('userProgress', {
      completedModules: [...new Set([
        ...(stateManager.getState('userProgress').completedModules || []),
        '/packet-journey'
      ])]
    });
  }

  _updateNatTable() {
    const display = this.container.querySelector('#pj-nat-table');
    if (!display) return;
    const entries = Object.entries(this._natTable);
    if (!entries.length) {
      display.innerHTML = '<p class="text-muted text-xs" style="text-align:center; padding:0.4rem;">No NAT entries</p>';
      return;
    }
    display.innerHTML = entries.map(([inside, outside]) => `
      <div style="display:flex; justify-content:space-between; padding:0.3rem 0; border-bottom:1px solid var(--color-border); font-family:var(--font-mono); font-size:var(--text-xs); animation:fadeIn 0.3s ease;">
        <span style="color:var(--color-amber);">${inside}</span>
        <span style="color:var(--color-cyan);">→ ${outside}</span>
      </div>
    `).join('');
  }

  _updateArpTable() {
    const display = this.container.querySelector('#pj-arp-table');
    if (!display) return;
    const entries = Object.entries(this._arpCache);
    if (!entries.length) {
      display.innerHTML = '<p class="text-muted text-xs" style="text-align:center; padding:0.4rem;">No ARP entries</p>';
      return;
    }
    display.innerHTML = entries.map(([ip, mac]) => `
      <div style="display:flex; justify-content:space-between; padding:0.25rem 0; border-bottom:1px solid var(--color-border); font-family:var(--font-mono); font-size:var(--text-xs); animation:fadeIn 0.3s ease;">
        <span style="color:var(--color-cyan);">${ip}</span>
        <span style="color:var(--color-text-muted);">${mac}</span>
      </div>
    `).join('');
  }

  _updateMacTable() {
    const display = this.container.querySelector('#pj-mac-table');
    if (!display) return;
    const entries = Object.entries(this._macTable);
    if (!entries.length) {
      display.innerHTML = '<p class="text-muted text-xs" style="text-align:center; padding:0.4rem;">Empty</p>';
      return;
    }
    display.innerHTML = entries.map(([mac, port]) => `
      <div style="display:flex; justify-content:space-between; padding:0.25rem 0; border-bottom:1px solid var(--color-border); font-family:var(--font-mono); font-size:var(--text-xs); animation:fadeIn 0.3s ease;">
        <span style="color:var(--color-text-muted);">${mac}</span>
        <span style="color:var(--color-amber);">${port}</span>
      </div>
    `).join('');
  }

  start()  { this._runStep(); }
  step()   { this._runStep(); }

  reset() {
    this._running    = false;
    this._step       = 0;
    this._natTable   = {};
    this._macTable   = {};
    this._arpCache   = {};
    this._isDestroyed = false;
    if (this._diagram) this._diagram.reset();
    if (this.container) this._render();
  }

  destroy() {
    this._running    = false;
    this._isDestroyed = true;
    if (this._diagram) this._diagram.destroy();
    this.container = null;
  }
}

export default new PacketJourneySimulator();
