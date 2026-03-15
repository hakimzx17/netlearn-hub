/**
 * resourceLibrary.js — CCNA Focus Resource Library
 * 
 * Features:
 * - CCNA-focused content (only exam-relevant ports, protocols, commands)
 * - Flashcard/Anki mode for active recall
 * - Enhanced search functionality
 * - CLI Commands section with terminal UI
 * 
 * Depends on: eventBus
 */

import { eventBus } from '../js/eventBus.js';
import { escapeHtml } from '../utils/helperFunctions.js';

const SECTIONS = [
  {
    id: 'home', icon: '🏠', title: 'Quick Review',
    desc: 'CCNA exam highlights',
    content: () => _renderQuickReview(),
  },
  {
    id: 'ports', icon: '🔌', title: 'Ports',
    desc: 'Must-know port numbers',
    content: () => _renderPortsTable(),
  },
  {
    id: 'protocols', icon: '📡', title: 'Protocols',
    desc: 'Key protocols & layers',
    content: () => _renderProtocols(),
  },
  {
    id: 'cli', icon: '💻', title: 'CLI Commands',
    desc: 'Essential Cisco commands',
    content: () => _renderCLICommands(),
  },
  {
    id: 'osi', icon: '📚', title: 'OSI Model',
    desc: '7 layers + mnemonics',
    content: () => _renderOSIRef(),
  },
  {
    id: 'subnet', icon: '🧮', title: 'Subnetting',
    desc: 'CIDR & VLSM quick ref',
    content: () => _renderSubnetRef(),
  },
  {
    id: 'glossary', icon: '📖', title: 'Glossary',
    desc: 'Searchable terms',
    content: () => _renderGlossary(),
  },
];

const PORT_CATEGORIES = {
  critical: { name: '🎯 CCNA Exam Must-Know', color: 'var(--color-error)', ports: ['22','23','53','80','443','67','68','161','179'] },
  important: { name: '⚡ Important Services', color: 'var(--color-amber)', ports: ['20','21','25','110','143','389','445','3389'] },
  networking: { name: '🌐 Networking', color: 'var(--color-cyan)', ports: ['123','520','514','123'] },
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
    question:'How does ARP work?', answer:'Broadcasts "Who has 192.168.1.1?" within subnet. Target replies with MAC. Entry cached for 4 hours.' },
  { name:'ICMP', full:'Internet Control Message Protocol', layer:'L3', category:'diagnostics', 
    question:'What is ICMP used for?', answer:'Network diagnostics: ping (echo request/reply), traceroute, error reporting (destination unreachable).' },
  { name:'DHCP', full:'Dynamic Host Configuration', layer:'L7', category:'management', 
    question:'Describe DHCP DORA process.', answer:'Discover (client broadcast), Offer (server), Request (client), Acknowledge (server). Uses UDP 67/68.' },
  { name:'DNS', full:'Domain Name System', layer:'L7', category:'application', 
    question:'What port does DNS use?', answer:'UDP 53 for queries, TCP 53 for zone transfers. Resolves hostnames to IP addresses.' },
  { name:'TCP', full:'Transmission Control Protocol', layer:'L4', category:'transport', 
    question:'Describe TCP 3-way handshake.', answer:'SYN → SYN-ACK → ACK. Establishes reliable connection before data transfer.' },
  { name:'UDP', full:'User Datagram Protocol', layer:'L4', category:'transport', 
    question:'When is UDP preferred over TCP?', answer:'When speed matters more than reliability: VoIP, video streaming, DNS, DHCP, online gaming.' },
  { name:'OSPF', full:'Open Shortest Path First', layer:'L3', category:'routing', 
    question:'What is OSPF administrative distance?', answer:'110. Link-state protocol. Uses Dijkstra SPF algorithm. Fast convergence. Area 0 is backbone.' },
  { name:'BGP', full:'Border Gateway Protocol', layer:'L4', category:'routing', 
    question:'What is BGP port and type?', answer:'TCP 179. Path-vector protocol. Used between autonomous systems (EGP). The internet routing protocol.' },
  { name:'EIGRP', full:'Enhanced IGRP', layer:'L3', category:'routing', 
    question:'EIGRP AD values?', answer:'90 for internal, 170 for external. Cisco proprietary. Uses DUAL algorithm for loop-free paths.' },
  { name:'RIP', full:'Routing Information Protocol', layer:'L3', category:'routing', 
    question:'RIP max hop count?', answer:'15 hops. 16 = unreachable. Uses UDP 520. Distance vector. Sends full table every 30s.' },
  { name:'STP', full:'Spanning Tree Protocol', layer:'L2', category:'switching', 
    question:'What does STP prevent?', answer:'Layer 2 loops. Blocks redundant ports. Elects root bridge. Uses BPDU. 50s convergence (listening/learning).' },
  { name:'VLAN', full:'Virtual LAN', layer:'L2', category:'switching', 
    question:'What is VLAN tagging?', answer:'802.1Q adds 4-byte tag to frame. Identifies VLAN ID (12 bits = 4096 VLANs). Native VLAN is untagged.' },
  { name:'NAT', full:'Network Address Translation', layer:'L3', category:'addressing', 
    question:'NAT types?', answer:'Static NAT (1:1), Dynamic NAT (pool), PAT/Overload (many:1 using ports). Conserves IPv4.' },
  { name:'ACL', full:'Access Control Lists', layer:'L3', category:'security', 
    question:'Standard vs Extended ACL?', answer:'Standard (1-99, 1300-1999): source only. Extended (100-199, 2000-2699): source, dest, port, protocol.' },
  { name:'HSRP', full:'Hot Standby Router Protocol', layer:'L3', category:'redundancy', 
    question:'HSRP active/standby election?', answer:'Highest priority (default 100) wins. Higher IP if tie. Hello 3s, Hold 10s. Virtual IP = gateway.' },
];

  const CLI_COMMANDS = [
  { category: '🔐 Basic Security', commands: [
    { cmd:'enable', desc:'Enter privileged EXEC mode' },
    { cmd:'configure terminal', desc:'Enter global configuration mode' },
    { cmd:'enable secret <password>', desc:'Set encrypted enable password' },
    { cmd:'service password-encryption', desc:'Encrypt all passwords in config' },
    { cmd:'line console 0', desc:'Enter console line configuration' },
    { cmd:'login', desc:'Require password for console access' },
    { cmd:'transport input ssh', desc:'Allow only SSH on VTY lines' },
  ]},
  { category: '🌐 Interface Configuration', commands: [
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
  { category: '🔄 Routing', commands: [
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
  { category: '🏷️ VLAN Configuration', commands: [
    { cmd:'vlan <id>', desc:'Create VLAN' },
    { cmd:'name <vlan-name>', desc:'Name the VLAN' },
    { cmd:'no vlan <id>', desc:'Delete VLAN' },
    { cmd:'switchport mode access', desc:'Set port as access port' },
    { cmd:'switchport access vlan <id>', desc:'Assign port to VLAN' },
    { cmd:'show vlan brief', desc:'Display VLAN information' },
    { cmd:'show vlan', desc:'Show VLAN database' },
  ]},
  { category: '🔗 Trunking', commands: [
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
  { category: '🔒 STP & EtherChannel', commands: [
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
  { category: '📊 Management & Troubleshooting', commands: [
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
  { category: '📜 NAT & ACL', commands: [
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

const GLOSSARY_TERMS = [
  ['Broadcast Domain', 'All devices receiving Layer 2 broadcasts. Routers separate broadcast domains.'],
  ['Collision Domain', 'Area where frame collisions can occur. Switches segment collision domains.'],
  ['Default Gateway', 'Router IP address for destinations outside local subnet.'],
  ['Administrative Distance', 'Trust level of route (0-255). Lower = more trustworthy.'],
  ['ARP', 'Maps IP to MAC. Broadcast request, unicast reply. Cache = 4 hours.'],
  ['MAC Address', '48-bit hardware address. OUI + NIC.'],
  ['MTU', 'Maximum Transmission Unit. Default 1500 bytes for Ethernet.'],
  ['VLSM', 'Variable Length Subnet Masking. Different prefix lengths per subnet.'],
  ['Wildcard Mask', 'Inverse of subnet mask. 0=match, 1=ignore.'],
  ['TTL', 'Time To Live. Prevents routing loops. Decremented each hop.'],
  ['CAM Table', 'Switch table storing MAC addresses and ports.'],
  ['VTP', 'VLAN Trunking Protocol. Cisco. Modes: Server, Client, Transparent.'],
  ['BPDU', 'Bridge Protocol Data Unit. STP messages.'],
  ['DORA', 'DHCP: Discover, Offer, Request, Acknowledge.'],
  ['LSA', 'Link State Advertisement. OSPF routing information.'],
];

class ResourceLibrary {
  constructor() {
    this.container = null;
    this._activeSection = 'home';
    this._flashcardMode = false;
    this._flashcardIndex = 0;
    this._flashcardType = 'protocols';
    this._flashcardFlipped = false;
    this._searchTerm = '';
    this._learnedCards = new Set();
    this._cliIndex = 0;
    this._cliInitTimer = null;
    this._searchDebounce = null;
  }

  init(containerEl) {
    this.container = containerEl;
    this._render();
  }

  _render() {
    const active = SECTIONS.find(s => s.id === this._activeSection);

    this.container.innerHTML = `
      <div class="module-header" style="margin-bottom: 2rem;">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <span>CCNA Resources</span>
        </div>
        <h1 class="module-header__title" style="font-size: var(--text-3xl);">
          📖 CCNA Study Resources
        </h1>
        <p class="module-header__description" style="font-size: var(--text-base); max-width: 700px;">
          Essential references for the CCNA 200-301 exam. Use <strong>Flashcard Mode</strong> for active recall practice.
        </p>
      </div>

      <div style="margin-bottom: 2rem;">
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
          <label class="sr-only" for="global-search">Search resources</label>
          <input 
            type="text" 
            id="global-search" 
            placeholder="🔍 Search ports, protocols, commands..." 
            style="
              padding: 0.75rem 1rem;
              background: var(--color-bg-dark);
              border: 2px solid var(--color-border);
              border-radius: var(--radius-md);
              color: var(--color-text-primary);
              font-size: var(--text-sm);
              width: 320px;
              transition: border-color 0.2s;
            "
            onfocus="this.style.borderColor='var(--color-cyan)';"
            onblur="this.style.borderColor='var(--color-border)';"
          >
          <button id="flashcard-toggle" style="
            padding: 0.75rem 1.25rem;
            background: var(--color-amber);
            border: none;
            border-radius: var(--radius-md);
            color: var(--color-bg-deepest);
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          ">
            🎴 Flashcard Mode
          </button>
        </div>
        <div id="search-results" role="status" aria-live="polite" aria-atomic="true" style="display:none; margin-top: 1rem;"></div>
      </div>

      <div style="margin-bottom: 2.5rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem;">
          ${SECTIONS.map(s => `
            <button
              class="lib-section-btn card-hover ${s.id === this._activeSection ? 'is-active' : ''}"
              data-section="${s.id}"
              style="
                padding: 1rem;
                text-align: center;
                border: 2px solid ${s.id === this._activeSection ? 'var(--color-cyan)' : 'var(--color-border)'};
                background: ${s.id === this._activeSection ? 'var(--color-cyan-glow)' : 'var(--color-bg-panel)'};
                border-radius: var(--radius-md);
                cursor: pointer;
                transition: all 0.2s;
              "
            >
              <div style="font-size: 1.5rem; margin-bottom: 0.35rem;">${s.icon}</div>
              <div style="font-weight: 700; color: var(--color-text-primary); font-size: var(--text-sm);">
                ${s.title}
              </div>
            </button>
          `).join('')}
        </div>
      </div>

      <div id="flashcard-panel" style="display: none; margin-bottom: 2rem;"></div>

      <div id="lib-content" class="anim-fade-in" style="min-height: 300px;">
        ${active ? active.content() : ''}
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    this.container.querySelectorAll('.lib-section-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._activeSection = btn.getAttribute('data-section');
        this._unbindKeyboardNav();
        this.container.querySelectorAll('.lib-section-btn').forEach(b => {
          const isActive = b.getAttribute('data-section') === this._activeSection;
          b.style.borderColor = isActive ? 'var(--color-cyan)' : 'var(--color-border)';
          b.style.background = isActive ? 'var(--color-cyan-glow)' : 'var(--color-bg-panel)';
        });
        const section = SECTIONS.find(s => s.id === this._activeSection);
        const content = this.container.querySelector('#lib-content');
        const flashcardPanel = this.container.querySelector('#flashcard-panel');
        if (content && section) {
          content.innerHTML = section.content();
          content.className = 'anim-fade-in';
          flashcardPanel.style.display = 'none';
          
          if (this._activeSection === 'cli') {
            this._scheduleCliInit();
          }
        }
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
    this._renderCLIIndex(0);
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
      } else if (mode === 'flashcards') {
        const flashcardData = this._getFlashcardData(this._flashcardType);
        const cards = flashcardData.cards;
        const flashcardInner = this.container.querySelector('#flashcard-inner');
        
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          this._flashcardFlipped = !this._flashcardFlipped;
          if (flashcardInner) {
            flashcardInner.querySelector('.front').style.display = this._flashcardFlipped ? 'none' : 'block';
            flashcardInner.querySelector('.back').style.display = this._flashcardFlipped ? 'block' : 'none';
          }
        } else if (e.key === 'ArrowLeft') {
          this._flashcardIndex = Math.max(0, this._flashcardIndex - 1);
          this._flashcardFlipped = false;
          this._showFlashcard(this._flashcardType);
        } else if (e.key === 'ArrowRight') {
          this._flashcardIndex = Math.min(cards.length - 1, this._flashcardIndex + 1);
          this._flashcardFlipped = false;
          this._showFlashcard(this._flashcardType);
        } else if (e.key === '1') {
          this._flashcardIndex = 0;
          this._showFlashcard('protocols');
        } else if (e.key === '2') {
          this._flashcardIndex = 0;
          this._showFlashcard('ports');
        } else if (e.key === '3') {
          this._flashcardIndex = 0;
          this._showFlashcard('osi');
        } else if (e.key === '4') {
          this._flashcardIndex = 0;
          this._showFlashcard('cli');
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
    const dots = this.container.querySelectorAll('.cli-dot');

    if (!container || !nameEl) return;

    const cat = CLI_COMMANDS[index];
    nameEl.textContent = cat.category;

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 30px 280px 1fr; gap: 0.5rem; padding: 0.5rem 1rem; border-bottom: 1px solid #444; font-size: var(--text-xs); color: #666; text-transform: uppercase;">
        <span></span>
        <span>Command</span>
        <span>Description</span>
      </div>
    ` + cat.commands.map(cmd => `
      <div style="display: grid; grid-template-columns: 30px 280px 1fr; gap: 0.5rem; padding: 0.6rem 1rem; border-bottom: 1px solid #333; align-items: center;">
        <span style="color: #00ff88; text-align: center;">●</span>
        <span style="color: #8be9fd; font-family: var(--font-mono); font-size: var(--text-sm); font-weight: 600;">${cmd.cmd}</span>
        <span style="color: #aaa; font-size: var(--text-xs);">${cmd.desc}</span>
      </div>
    `).join('');

    dots.forEach((dot, i) => {
      dot.style.background = i === index ? '#00ff88' : '#444';
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

    GLOSSARY_TERMS.forEach(([term2, def]) => {
      if (term2.toLowerCase().includes(term)) {
        results.push({ type:'Term', text:`${term2}: ${def}` });
      }
    });

    if (results.length === 0) {
      resultsDiv.innerHTML = `<div style="padding: 1rem; color: var(--color-text-muted);">No results found for "${escapeHtml(rawTerm.trim())}"</div>`;
    } else {
      resultsDiv.innerHTML = `
        <div style="background: var(--color-bg-panel); border-radius: var(--radius-md); padding: 1rem;">
          <div style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: 0.75rem;">${results.length} results:</div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 300px; overflow-y: auto;">
            ${results.slice(0,20).map(r => `
              <div style="padding: 0.5rem 0.75rem; background: var(--color-bg-dark); border-radius: var(--radius-sm); font-size: var(--text-sm);">
                <span style="color: var(--color-cyan); font-weight: 700; font-size: var(--text-xs);">${r.type}</span>
                <span style="color: var(--color-text-primary); margin-left: 0.5rem;">${escapeHtml(r.text)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    resultsDiv.style.display = 'block';
  }

  _toggleFlashcardPanel() {
    const panel = this.container.querySelector('#flashcard-panel');
    const content = this.container.querySelector('#lib-content');
    
    if (panel.style.display === 'none') {
      panel.style.display = 'block';
      content.style.display = 'none';
      this._showFlashcard('protocols');
      this._bindKeyboardNav('flashcards');
    } else {
      panel.style.display = 'none';
      content.style.display = 'block';
      this._unbindKeyboardNav();
    }
  }

  _getFlashcardData(type) {
    const data = {
      protocols: {
        title: '🎴 Protocol Flashcards',
        cards: PROTOCOLS.map(p => ({
          front: p.name,
          frontSub: p.full,
          layer: p.layer,
          back: `${p.question}\n\n${p.answer}`
        }))
      },
      ports: {
        title: '🎴 Port Flashcards',
        cards: PORTS.map(([port, proto, service]) => ({
          front: `Port ${port}`,
          frontSub: proto,
          layer: service,
          back: `Service: ${service}\n\nProtocol: ${proto}\n\nMemorize this port for the CCNA exam!`
        }))
      },
      osi: {
        title: '🎴 OSI Layer Flashcards',
        cards: OSI_LAYERS.map(l => ({
          front: `Layer ${l.n}`,
          frontSub: l.name,
          layer: l.pdu,
          back: `PDU: ${l.pdu}\n\nProtocols: ${l.protocols}\n\nMnemonic (Top→Bottom): All People Seem To Need Data Processing\nMnemonic (Bottom→Top): Please Do Not Throw Sausage Pizza Away`
        }))
      },
      cli: {
        title: '🎴 CLI Command Flashcards',
        cards: CLI_COMMANDS.flatMap(cat => 
          cat.commands.map(cmd => ({
            front: cmd.cmd,
            frontSub: cat.category.replace('🔐 ', '').replace('🌐 ', '').replace('🔄 ', '').replace('🏷️ ', '').replace('🔒 ', '').replace('📊 ', '').replace('📜 ', ''),
            layer: 'IOS',
            back: `Description: ${cmd.desc}\n\nCategory: ${cat.category}`
          }))
        )
      }
    };
    return data[type] || data.protocols;
  }

  _showFlashcard(type) {
    this._flashcardType = type;
    this._flashcardFlipped = false;
    const panel = this.container.querySelector('#flashcard-panel');
    const flashcardData = this._getFlashcardData(type);
    const cards = flashcardData.cards;
    
    const current = cards[this._flashcardIndex];
    const isFlipped = this._learnedCards.has(`${type}-${this._flashcardIndex}`);

    panel.innerHTML = `
      <div style="background: var(--color-bg-panel); border-radius: var(--radius-lg); padding: 2rem; text-align: center;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <div style="font-size: var(--text-lg); font-weight: 700; color: var(--color-cyan);">${flashcardData.title}</div>
          <div style="font-size: var(--text-sm); color: var(--color-text-muted);">Card ${this._flashcardIndex + 1} of ${cards.length}</div>
        </div>

        <div style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
          <button class="fc-type-btn ${type === 'protocols' ? 'is-active' : ''}" data-type="protocols" style="
            padding: 0.4rem 0.8rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border);
            background: ${type === 'protocols' ? 'var(--color-cyan-glow)' : 'var(--color-bg-dark)'};
            color: ${type === 'protocols' ? 'var(--color-cyan)' : 'var(--color-text-secondary)'};
            cursor: pointer; font-size: var(--text-xs);
          ">📡 Protocols</button>
          <button class="fc-type-btn ${type === 'ports' ? 'is-active' : ''}" data-type="ports" style="
            padding: 0.4rem 0.8rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border);
            background: ${type === 'ports' ? 'var(--color-cyan-glow)' : 'var(--color-bg-dark)'};
            color: ${type === 'ports' ? 'var(--color-cyan)' : 'var(--color-text-secondary)'};
            cursor: pointer; font-size: var(--text-xs);
          ">🔌 Ports</button>
          <button class="fc-type-btn ${type === 'osi' ? 'is-active' : ''}" data-type="osi" style="
            padding: 0.4rem 0.8rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border);
            background: ${type === 'osi' ? 'var(--color-cyan-glow)' : 'var(--color-bg-dark)'};
            color: ${type === 'osi' ? 'var(--color-cyan)' : 'var(--color-text-secondary)'};
            cursor: pointer; font-size: var(--text-xs);
          ">📚 OSI</button>
          <button class="fc-type-btn ${type === 'cli' ? 'is-active' : ''}" data-type="cli" style="
            padding: 0.4rem 0.8rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border);
            background: ${type === 'cli' ? 'var(--color-cyan-glow)' : 'var(--color-bg-dark)'};
            color: ${type === 'cli' ? 'var(--color-cyan)' : 'var(--color-text-secondary)'};
            cursor: pointer; font-size: var(--text-xs);
          ">💻 CLI</button>
        </div>

        <div id="flashcard-inner" style="
          background: var(--color-bg-dark);
          border: 2px solid ${isFlipped ? 'var(--color-green)' : 'var(--color-cyan)'};
          border-radius: var(--radius-lg);
          padding: 2rem;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s;
        ">
          <div class="front">
            <div style="font-size: var(--text-3xl); font-weight: 700; color: var(--color-cyan); margin-bottom: 0.5rem;">${current.front}</div>
            <div style="font-size: var(--text-base); color: var(--color-text-muted);">${current.frontSub}</div>
            <div style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--color-bg-panel); border-radius: var(--radius-sm); display: inline-block;">
              <span style="color: var(--color-amber); font-weight: 700;">${current.layer}</span>
            </div>
            <div style="margin-top: 1.5rem; font-size: var(--text-sm); color: var(--color-text-muted);">Click or press Space to flip</div>
          </div>
          <div class="back" style="display: none; text-align: left; width: 100%;">
            <div style="font-size: var(--text-base); color: var(--color-text-secondary); white-space: pre-line; line-height: 1.8;">${current.back}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem;">
          <button id="fc-shuffle" style="padding: 0.5rem 1rem; background: var(--color-bg-dark); border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text-primary); cursor: pointer;">🔀 Shuffle</button>
          <button id="fc-prev" style="padding: 0.5rem 1rem; background: var(--color-bg-dark); border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text-primary); cursor: pointer;">← Previous</button>
          <button id="fc-mark" style="padding: 0.5rem 1rem; background: ${isFlipped ? 'var(--color-green)' : 'var(--color-bg-dark)'}; border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text-primary); cursor: pointer;">
            ${isFlipped ? '✓ Learned' : 'Mark as Learned'}
          </button>
          <button id="fc-next" style="padding: 0.5rem 1rem; background: var(--color-cyan); border: none; border-radius: var(--radius-sm); color: var(--color-bg-deepest); font-weight: 700; cursor: pointer;">Next →</button>
        </div>

        <div style="margin-top: 1rem; text-align: center;">
          <span style="font-size: var(--text-xs); color: var(--color-text-muted);">← → Arrow keys to navigate • Space to flip</span>
        </div>

        <div style="margin-top: 0.5rem;">
          <button id="fc-close" style="padding: 0.5rem; background: none; border: none; color: var(--color-text-muted); cursor: pointer; font-size: var(--text-sm);">Close Flashcards</button>
        </div>
      </div>
    `;

    panel.querySelectorAll('.fc-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._flashcardIndex = 0;
        this._showFlashcard(btn.getAttribute('data-type'));
      });
    });

    const flashcardInner = panel.querySelector('#flashcard-inner');
    flashcardInner.addEventListener('click', () => {
      this._flashcardFlipped = !this._flashcardFlipped;
      flashcardInner.querySelector('.front').style.display = this._flashcardFlipped ? 'none' : 'block';
      flashcardInner.querySelector('.back').style.display = this._flashcardFlipped ? 'block' : 'none';
    });

    panel.querySelector('#fc-shuffle').addEventListener('click', () => {
      const deck = flashcardData.cards;
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      this._flashcardIndex = 0;
      this._showFlashcard(type);
    });

    panel.querySelector('#fc-prev').addEventListener('click', () => {
      this._flashcardIndex = Math.max(0, this._flashcardIndex - 1);
      this._showFlashcard(type);
    });

    panel.querySelector('#fc-next').addEventListener('click', () => {
      this._flashcardIndex = Math.min(cards.length - 1, this._flashcardIndex + 1);
      this._showFlashcard(type);
    });

    panel.querySelector('#fc-mark').addEventListener('click', () => {
      const key = `${type}-${this._flashcardIndex}`;
      if (this._learnedCards.has(key)) {
        this._learnedCards.delete(key);
      } else {
        this._learnedCards.add(key);
      }
      this._showFlashcard(type);
    });

    panel.querySelector('#fc-close').addEventListener('click', () => {
      panel.style.display = 'none';
      this.container.querySelector('#lib-content').style.display = 'block';
      this._unbindKeyboardNav();
    });
  }

  start() {}
  reset() { 
    this._activeSection = 'home'; 
    this._flashcardMode = false; 
    this._unbindKeyboardNav();
    if (this._cliInitTimer) { clearTimeout(this._cliInitTimer); this._cliInitTimer = null; }
    if (this._searchDebounce) { clearTimeout(this._searchDebounce); this._searchDebounce = null; }
    this._render(); 
  }
  step() {}
  destroy() { 
    this._unbindKeyboardNav();
    if (this._cliInitTimer) { clearTimeout(this._cliInitTimer); this._cliInitTimer = null; }
    if (this._searchDebounce) { clearTimeout(this._searchDebounce); this._searchDebounce = null; }
    this.container = null; 
  }
}

function _renderQuickReview() {
  return `
    <div style="display: grid; gap: 1.5rem;">
      <div class="card" style="background: linear-gradient(135deg, var(--color-bg-panel) 0%, var(--color-bg-raised) 100%); border-left: 4px solid var(--color-error);">
        <h3 style="color: var(--color-error); font-size: var(--text-lg); margin-bottom: 1rem;">🎯 Top Exam Ports (Memorize These!)</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.75rem;">
          ${[
            {port:'22', name:'SSH', color:'var(--color-green)'},
            {port:'80', name:'HTTP', color:'var(--color-amber)'},
            {port:'443', name:'HTTPS', color:'var(--color-cyan)'},
            {port:'53', name:'DNS', color:'var(--color-info)'},
            {port:'67', name:'DHCP', color:'var(--color-error)'},
            {port:'179', name:'BGP', color:'var(--color-switch)'},
          ].map(p => `
            <div style="background: var(--color-bg-dark); padding: 0.75rem; border-radius: var(--radius-md); text-align: center; border: 1px solid ${p.color}44;">
              <div style="font-family: var(--font-mono); font-size: var(--text-xl); font-weight: 700; color: ${p.color};">${p.port}</div>
              <div style="font-size: var(--text-xs); color: var(--color-text-muted);">${p.name}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card" style="background: var(--color-bg-panel); border-left: 4px solid var(--color-amber);">
        <h3 style="color: var(--color-amber); font-size: var(--text-lg); margin-bottom: 1rem;">🧮 Common Subnets</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
          ${[
            {cidr:'/24', hosts:'254', use:'LAN'},
            {cidr:'/25', hosts:'126', use:'Small'},
            {cidr:'/26', hosts:'62', use:'VLAN'},
            {cidr:'/30', hosts:'2', use:'P2P'},
          ].map(s => `
            <div style="background: var(--color-bg-dark); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); display: flex; gap: 0.5rem; align-items: center;">
              <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-amber);">${s.cidr}</span>
              <span style="font-size: var(--text-xs); color: var(--color-text-muted);">${s.hosts}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card" style="background: var(--color-bg-panel); border-left: 4px solid var(--color-cyan);">
        <h3 style="color: var(--color-cyan); font-size: var(--text-lg); margin-bottom: 1rem;">📚 OSI Mnemonics</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div style="background: var(--color-bg-dark); padding: 0.75rem; border-radius: var(--radius-sm);">
            <div style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: 0.5rem;">Top → Bottom</div>
            <div style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-cyan);">APSTNDP</div>
          </div>
          <div style="background: var(--color-bg-dark); padding: 0.75rem; border-radius: var(--radius-sm);">
            <div style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: 0.5rem;">Bottom → Top</div>
            <div style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-amber);">PNDTSPA</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function _renderPortsTable() {
  const groupedPorts = {};
  PORTS.forEach(([port, proto, service, category]) => {
    if (!groupedPorts[category]) groupedPorts[category] = [];
    groupedPorts[category].push([port, proto, service]);
  });

  return `
    <div>
      <h2 style="color: var(--color-text-primary); font-size: var(--text-2xl); margin-bottom: 1.5rem;">🔌 CCNA Port Numbers</h2>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${Object.entries(groupedPorts).map(([category, ports]) => {
          const catInfo = PORT_CATEGORIES[category] || PORT_CATEGORIES.networking;
          return `
            <div style="background: var(--color-bg-panel); border-radius: var(--radius-lg); overflow: hidden;">
              <div style="padding: 0.6rem 1rem; background: ${catInfo.color}; color: var(--color-bg-deepest); font-weight: 700; font-size: var(--text-sm);">
                ${catInfo.name}
              </div>
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tbody>
                    ${ports.map(([port, proto, service]) => {
                      const isCritical = PORT_CATEGORIES.critical.ports.includes(port);
                      return `
                        <tr style="border-bottom: 1px solid var(--color-border); ${isCritical ? 'background: rgba(255,68,68,0.05);' : ''}">
                          <td style="padding: 12px 16px; font-family: var(--font-mono); font-weight: 700; font-size: var(--text-lg); color: ${isCritical ? 'var(--color-error)' : 'var(--color-cyan)'}; width: 80px;">${port}</td>
                          <td style="padding: 12px 16px; font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-amber); width: 80px;">${proto}</td>
                          <td style="padding: 12px 16px; color: var(--color-text-primary); font-size: var(--text-base);">${service}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function _renderProtocols() {
  return `
    <div>
      <h2 style="color: var(--color-text-primary); font-size: var(--text-2xl); margin-bottom: 1.5rem;">📡 Key Protocols</h2>
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${PROTOCOLS.map((p, i) => `
          <div style="
            background: var(--color-bg-panel);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            padding: 1rem;
            border-left: 4px solid var(--color-cyan);
          ">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <div>
                <span style="font-family: var(--font-mono); font-weight: 700; font-size: var(--text-lg); color: var(--color-cyan);">${p.name}</span>
                <span style="background: var(--color-bg-dark); padding: 2px 8px; border-radius: 4px; font-size: var(--text-xs); color: var(--color-amber); margin-left: 0.5rem;">${p.layer}</span>
              </div>
              <span style="font-size: var(--text-xs); color: var(--color-text-muted);">#${i+1}</span>
            </div>
            <div style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">${p.full}</div>
            <p style="font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.6; margin: 0;">${p.purpose}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function _renderCLICommands() {
  const categoryNames = CLI_COMMANDS.map(c => c.category);
  
  return `
    <div>
      <h2 style="color: var(--color-text-primary); font-size: var(--text-2xl); margin-bottom: 1rem;">💻 Essential CLI Commands</h2>
      <p style="color: var(--color-text-muted); margin-bottom: 1rem;">Click ◀ ▶ or use arrow keys to browse categories</p>

      <div style="background: #1a1a2e; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid #333;">
        <div style="background: #0f0f1a; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333;">
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f56;"></div>
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e;"></div>
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #27c93f;"></div>
          </div>
          <div style="color: #888; font-size: var(--text-xs); font-family: var(--font-mono);">Cisco IOS Terminal</div>
          <div style="width: 70px;"></div>
        </div>
        
        <div style="padding: 1rem; border-bottom: 1px solid #333; display: flex; justify-content: center; align-items: center; gap: 1rem;">
          <button id="cli-prev" style="background: #00ff8822; border: 1px solid #00ff88; color: #00ff88; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: var(--text-lg);">◀</button>
          <span id="cli-category-name" style="color: #00ff88; font-family: var(--font-mono); font-weight: 700; min-width: 200px; text-align: center;">${categoryNames[0]}</span>
          <button id="cli-next" style="background: #00ff8822; border: 1px solid #00ff88; color: #00ff88; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: var(--text-lg);">▶</button>
        </div>

        <div id="cli-commands" style="padding: 1rem; font-family: var(--font-mono); font-size: var(--text-sm); color: #00ff88; line-height: 2; overflow-x: auto; min-height: 200px;">
        </div>
      </div>

      <div style="margin-top: 1rem; display: flex; justify-content: center; gap: 0.5rem; flex-wrap: wrap;" id="cli-dots">
        ${CLI_COMMANDS.map((_, i) => 
          `<span class="cli-dot" data-index="${i}" style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${i === 0 ? '#00ff88' : '#444'}; margin: 0 4px; cursor: pointer;"></span>`
        ).join('')}
      </div>

      <div style="margin-top: 1rem; text-align: center; color: var(--color-text-muted); font-size: var(--text-xs);">
        ← → Arrow keys to navigate • Click dots to jump to category
      </div>

      <div style="margin-top: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        ${[
          {mode:'User EXEC', prompt:'>', color:'var(--color-amber)'},
          {mode:'Privileged EXEC', prompt:'#', color:'var(--color-cyan)'},
          {mode:'Global Config', prompt:'(config)#', color:'var(--color-green)'},
          {mode:'Interface', prompt:'(config-if)#', color:'var(--color-error)'},
          {mode:'Router', prompt:'(config-router)#', color:'var(--color-info)'},
        ].map(m => `
          <div style="background: var(--color-bg-panel); padding: 0.75rem; border-radius: var(--radius-sm); border-left: 3px solid ${m.color};">
            <div style="font-size: var(--text-xs); color: var(--color-text-muted);">${m.mode}</div>
            <div style="font-family: var(--font-mono); color: ${m.color};">Router${m.prompt}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function _renderOSIRef() {
  return `
    <div>
      <h2 style="color: var(--color-text-primary); font-size: var(--text-2xl); margin-bottom: 1.5rem;">📚 OSI Model</h2>
      
      <div style="background: var(--color-bg-panel); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 1.5rem;">
        <div style="display: flex; flex-direction: column; gap: 0;">
          ${OSI_LAYERS.map((l, i) => `
            <div style="
              display: grid; grid-template-columns: 50px 1fr 90px 1fr;
              gap: 1rem; align-items: center;
              padding: 0.75rem 1rem;
              background: ${l.color}15;
              border-left: 4px solid ${l.color};
            ">
              <span style="font-family: var(--font-mono); font-weight: 700; color: ${l.color}; font-size: var(--text-lg); text-align: center;">L${l.n}</span>
              <span style="font-weight: 700; color: var(--color-text-primary);">${l.name}</span>
              <span style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-amber);">${l.pdu}</span>
              <span style="font-size: var(--text-xs); color: var(--color-text-muted);">${l.protocols}</span>
            </div>
            ${i < 6 ? '<div style="text-align: center; color: var(--color-text-muted); font-size: 10px; padding: 2px;">↓</div>' : ''}
          `).join('')}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="card" style="background: var(--color-cyan-glow); border: 2px solid var(--color-cyan);">
          <div style="font-size: var(--text-xs); color: var(--color-cyan); text-transform: uppercase; margin-bottom: 0.5rem;">Mnemonic (Top → Bottom)</div>
          <div style="font-family: var(--font-mono); font-size: var(--text-base); color: var(--color-text-primary);">
            <strong style="color: var(--color-cyan);">A</strong>ll <strong style="color: var(--color-cyan);">P</strong>eople <strong style="color: var(--color-cyan);">S</strong>eem <strong style="color: var(--color-cyan);">T</strong>o <strong style="color: var(--color-cyan);">N</strong>eed <strong style="color: var(--color-cyan);">D</strong>ata <strong style="color: var(--color-cyan);">P</strong>rocessing
          </div>
        </div>
        <div class="card" style="background: rgba(255,184,0,0.1); border: 2px solid var(--color-amber);">
          <div style="font-size: var(--text-xs); color: var(--color-amber); text-transform: uppercase; margin-bottom: 0.5rem;">Mnemonic (Bottom → Top)</div>
          <div style="font-family: var(--font-mono); font-size: var(--text-base); color: var(--color-text-primary);">
            <strong style="color: var(--color-amber);">P</strong>lease <strong style="color: var(--color-amber);">D</strong>o <strong style="color: var(--color-amber);">N</strong>ot <strong style="color: var(--color-amber);">T</strong>hrow <strong style="color: var(--color-amber);">S</strong>ausage <strong style="color: var(--color-amber);">P</strong>izza <strong style="color: var(--color-amber);">A</strong>way
          </div>
        </div>
      </div>
    </div>
  `;
}

function _renderSubnetRef() {
  return `
    <div>
      <h2 style="color: var(--color-text-primary); font-size: var(--text-2xl); margin-bottom: 1.5rem;">🧮 Subnetting Quick Reference</h2>
      
      <div style="background: var(--color-bg-panel); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 1.5rem;">
        <div style="padding: 1rem; background: var(--color-bg-raised); border-bottom: 1px solid var(--color-border);">
          <h3 style="color: var(--color-cyan); font-size: var(--text-base);">Binary Breakdown</h3>
        </div>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: var(--color-bg-dark);">
                <th style="padding: 10px; text-align: left; color: var(--color-text-muted); font-size: var(--text-xs);">CIDR</th>
                <th style="padding: 10px; text-align: left; color: var(--color-text-muted); font-size: var(--text-xs);">Mask</th>
                <th style="padding: 10px; text-align: left; color: var(--color-text-muted); font-size: var(--text-xs);">Hosts</th>
                <th style="padding: 10px; text-align: left; color: var(--color-text-muted); font-size: var(--text-xs);">Binary</th>
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
                <tr style="border-bottom: 1px solid var(--color-border);">
                  <td style="padding: 10px; font-family: var(--font-mono); font-weight: 700; color: var(--color-amber);">${cidr}</td>
                  <td style="padding: 10px; font-family: var(--font-mono); color: var(--color-text-secondary);">${mask}</td>
                  <td style="padding: 10px; font-family: var(--font-mono); color: var(--color-text-primary);">${hosts}</td>
                  <td style="padding: 10px; font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-muted);">${binary}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card" style="background: var(--color-bg-panel);">
        <h3 style="color: var(--color-text-primary); font-size: var(--text-base); margin-bottom: 1rem;">Quick Formulas</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem;">
          <div style="background: var(--color-bg-dark); padding: 0.75rem; border-radius: var(--radius-sm);">
            <div style="color: var(--color-cyan); font-weight: 700;">2^n - 2</div>
            <div style="font-size: var(--text-xs); color: var(--color-text-muted);">Usable hosts</div>
          </div>
          <div style="background: var(--color-bg-dark); padding: 0.75rem; border-radius: var(--radius-sm);">
            <div style="color: var(--color-cyan); font-weight: 700;">256 - block</div>
            <div style="font-size: var(--text-xs); color: var(--color-text-muted);">Subnet mask</div>
          </div>
          <div style="background: var(--color-bg-dark); padding: 0.75rem; border-radius: var(--radius-sm);">
            <div style="color: var(--color-cyan); font-weight: 700;">Block size</div>
            <div style="font-size: var(--text-xs); color: var(--color-text-muted);">256 - mask</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function _renderGlossary() {
  return `
    <div>
      <h2 style="color: var(--color-text-primary); font-size: var(--text-2xl); margin-bottom: 1.5rem;">📖 CCNA Glossary</h2>
      <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">${GLOSSARY_TERMS.length} essential terms.</p>
      
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${GLOSSARY_TERMS.map(([term, def], i) => `
          <div style="
            padding: 1rem;
            background: var(--color-bg-panel);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            border-left: 3px solid var(--color-cyan);
          ">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span style="font-family: var(--font-display); font-weight: 700; color: var(--color-cyan); font-size: var(--text-base);">${term}</span>
              <span style="font-size: var(--text-xs); color: var(--color-text-muted);">#${i+1}</span>
            </div>
            <p style="font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.6; margin: 0;">${def}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export default new ResourceLibrary();
