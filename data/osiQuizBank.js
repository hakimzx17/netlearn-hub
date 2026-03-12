/**
 * osiQuizBank.js — OSI / TCP-IP Quiz Question Bank
 * Questions organized by difficulty tier (1-5).
 * Each correct answer pushes the user to the next tier.
 * Wrong answers are tracked for spaced repetition.
 */

const OSI_QUIZ_BANK = [
    // ═══ TIER 1 — Fundamentals ═══
    {
        id: 't1_1', tier: 1,
        question: 'How many layers does the OSI model have?',
        options: ['4', '5', '7', '10'],
        correct: 2,
        explanation: 'The OSI model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application.'
    },
    {
        id: 't1_2', tier: 1,
        question: 'Which layer of the OSI model is closest to the end user?',
        options: ['Layer 1 — Physical', 'Layer 4 — Transport', 'Layer 7 — Application', 'Layer 3 — Network'],
        correct: 2,
        explanation: 'Layer 7 (Application) is the closest to the end user — it provides network services directly to applications.'
    },
    {
        id: 't1_3', tier: 1,
        question: 'What does the TCP/IP model combine from the OSI model?',
        options: ['Layers 1-2 and Layers 5-7', 'Layers 3-4 only', 'Layers 1 and 7 only', 'Nothing — they are identical'],
        correct: 0,
        explanation: 'TCP/IP combines OSI Layers 1-2 into Network Access and Layers 5-7 into the Application layer.'
    },
    {
        id: 't1_4', tier: 1,
        question: 'Which layer converts data into electrical signals or light pulses?',
        options: ['Data Link', 'Physical', 'Network', 'Transport'],
        correct: 1,
        explanation: 'Layer 1 (Physical) handles the actual transmission of raw bits over a physical medium.'
    },
    {
        id: 't1_5', tier: 1,
        question: 'What is the PDU (Protocol Data Unit) at the Transport layer?',
        options: ['Bit', 'Frame', 'Packet', 'Segment'],
        correct: 3,
        explanation: 'The Transport layer (Layer 4) uses Segments (TCP) or Datagrams (UDP) as its PDU.'
    },
    {
        id: 't1_6', tier: 1,
        question: 'How many layers does the TCP/IP model have?',
        options: ['3', '4', '5', '7'],
        correct: 1,
        explanation: 'The TCP/IP model has 4 layers: Network Access, Internet, Transport, and Application.'
    },

    // ═══ TIER 2 — Layer Functions ═══
    {
        id: 't2_1', tier: 2,
        question: 'Which OSI layer is responsible for logical addressing (IP)?',
        options: ['Layer 2 — Data Link', 'Layer 3 — Network', 'Layer 4 — Transport', 'Layer 5 — Session'],
        correct: 1,
        explanation: 'Layer 3 (Network) handles logical addressing using IP addresses and routing between networks.'
    },
    {
        id: 't2_2', tier: 2,
        question: 'What type of address does Layer 2 (Data Link) use?',
        options: ['IP Address', 'Port Number', 'MAC Address', 'URL'],
        correct: 2,
        explanation: 'Layer 2 uses MAC (Media Access Control) addresses — 48-bit hardware addresses burned into NICs.'
    },
    {
        id: 't2_3', tier: 2,
        question: 'During encapsulation, which direction does data travel?',
        options: ['Up the stack (L1→L7)', 'Down the stack (L7→L1)', 'Horizontally across layers', 'It stays at one layer'],
        correct: 1,
        explanation: 'Encapsulation occurs as data travels DOWN from Layer 7 to Layer 1, with each layer adding its header.'
    },
    {
        id: 't2_4', tier: 2,
        question: 'Which layer provides error detection using Frame Check Sequence (FCS)?',
        options: ['Physical', 'Data Link', 'Network', 'Transport'],
        correct: 1,
        explanation: 'Layer 2 (Data Link) appends a Frame Check Sequence (FCS) trailer for error detection at the frame level.'
    },
    {
        id: 't2_5', tier: 2,
        question: 'What is the PDU at Layer 3 (Network)?',
        options: ['Segment', 'Frame', 'Packet', 'Data'],
        correct: 2,
        explanation: 'Layer 3 uses Packets as its PDU. Each packet contains an IP header with source and destination addresses.'
    },
    {
        id: 't2_6', tier: 2,
        question: 'Which protocol operates at the Transport layer?',
        options: ['HTTP', 'IP', 'TCP', 'Ethernet'],
        correct: 2,
        explanation: 'TCP (Transmission Control Protocol) operates at Layer 4 (Transport), providing reliable, ordered delivery.'
    },

    // ═══ TIER 3 — Protocol Knowledge ═══
    {
        id: 't3_1', tier: 3,
        question: 'What is the maximum size of an Ethernet frame (excluding preamble)?',
        options: ['512 bytes', '1024 bytes', '1518 bytes', '9000 bytes'],
        correct: 2,
        explanation: 'A standard Ethernet frame can be up to 1518 bytes (14-byte header + 1500-byte payload + 4-byte FCS).'
    },
    {
        id: 't3_2', tier: 3,
        question: 'Which OSI layer handles data encryption and compression?',
        options: ['Application (L7)', 'Presentation (L6)', 'Session (L5)', 'Transport (L4)'],
        correct: 1,
        explanation: 'Layer 6 (Presentation) is responsible for data translation, encryption, and compression (e.g., SSL/TLS, JPEG).'
    },
    {
        id: 't3_3', tier: 3,
        question: 'What port numbers are considered "well-known" ports?',
        options: ['0–255', '0–1023', '1024–49151', '49152–65535'],
        correct: 1,
        explanation: 'Well-known ports range from 0–1023. They are reserved for common services like HTTP (80), HTTPS (443), DNS (53).'
    },
    {
        id: 't3_4', tier: 3,
        question: 'Which protocol resolves IP addresses to MAC addresses?',
        options: ['DNS', 'DHCP', 'ARP', 'ICMP'],
        correct: 2,
        explanation: 'ARP (Address Resolution Protocol) maps a known IP address to a MAC address on the local network segment.'
    },
    {
        id: 't3_5', tier: 3,
        question: 'In the TCP three-way handshake, what is the correct sequence?',
        options: ['ACK → SYN → SYN-ACK', 'SYN → SYN-ACK → ACK', 'SYN → ACK → SYN-ACK', 'SYN-ACK → SYN → ACK'],
        correct: 1,
        explanation: 'The TCP three-way handshake is: SYN (client) → SYN-ACK (server) → ACK (client). This establishes a reliable connection.'
    },
    {
        id: 't3_6', tier: 3,
        question: 'What does the TTL field in an IP header prevent?',
        options: ['Data corruption', 'Routing loops', 'MAC spoofing', 'Port scanning'],
        correct: 1,
        explanation: 'TTL (Time To Live) is decremented at each router hop. When it reaches 0, the packet is discarded — preventing infinite routing loops.'
    },

    // ═══ TIER 4 — Advanced Concepts ═══
    {
        id: 't4_1', tier: 4,
        question: 'What is the size of the IPv4 header (without options)?',
        options: ['8 bytes', '14 bytes', '20 bytes', '32 bytes'],
        correct: 2,
        explanation: 'The minimum IPv4 header is 20 bytes (5 × 32-bit words). Options can extend it up to 60 bytes.'
    },
    {
        id: 't4_2', tier: 4,
        question: 'Which TCP flag is used to abruptly terminate a connection?',
        options: ['FIN', 'RST', 'PSH', 'URG'],
        correct: 1,
        explanation: 'RST (Reset) immediately terminates a connection without the graceful four-way FIN handshake.'
    },
    {
        id: 't4_3', tier: 4,
        question: 'What is the purpose of the Window Size field in TCP?',
        options: ['Error detection', 'Flow control', 'Routing', 'Encryption'],
        correct: 1,
        explanation: 'The Window Size field implements flow control by telling the sender how much data the receiver can buffer.'
    },
    {
        id: 't4_4', tier: 4,
        question: 'At which layer does a router primarily operate?',
        options: ['Layer 1', 'Layer 2', 'Layer 3', 'Layer 4'],
        correct: 2,
        explanation: 'Routers operate at Layer 3 (Network). They make forwarding decisions based on IP address (logical addressing).'
    },
    {
        id: 't4_5', tier: 4,
        question: 'What differentiates a Layer 2 switch from a Layer 3 switch?',
        options: ['Speed', 'Port count', 'Routing capability', 'Cable type'],
        correct: 2,
        explanation: 'A Layer 3 switch can route between VLANs/subnets using IP addresses, while a Layer 2 switch only forwards based on MAC addresses.'
    },
    {
        id: 't4_6', tier: 4,
        question: 'Which field in the Ethernet frame identifies the upper-layer protocol?',
        options: ['Preamble', 'EtherType', 'FCS', 'Destination MAC'],
        correct: 1,
        explanation: 'The EtherType field (2 bytes) identifies the protocol encapsulated in the payload (e.g., 0x0800 = IPv4, 0x0806 = ARP).'
    },

    // ═══ TIER 5 — Expert Level ═══
    {
        id: 't5_1', tier: 5,
        question: 'In TCP, what mechanism handles out-of-order packets?',
        options: ['Checksum', 'Sequence Numbers', 'TTL', 'Window Scaling'],
        correct: 1,
        explanation: 'TCP Sequence Numbers allow the receiver to reorder out-of-order segments and detect missing data.'
    },
    {
        id: 't5_2', tier: 5,
        question: 'What is the MTU for standard Ethernet?',
        options: ['576 bytes', '1460 bytes', '1500 bytes', '9000 bytes'],
        correct: 2,
        explanation: 'Standard Ethernet MTU is 1500 bytes. This is the maximum payload size without fragmentation. Jumbo frames use 9000.'
    },
    {
        id: 't5_3', tier: 5,
        question: 'Which TCP congestion control algorithm uses "slow start"?',
        options: ['Go-Back-N', 'Selective Repeat', 'Tahoe/Reno', 'Stop-and-Wait'],
        correct: 2,
        explanation: 'TCP Tahoe and Reno implement slow start, exponentially increasing the congestion window until a threshold is reached.'
    },
    {
        id: 't5_4', tier: 5,
        question: 'What is the purpose of the "Don\'t Fragment" (DF) bit in IPv4?',
        options: ['Speeds up routing', 'Prevents packet fragmentation along the path', 'Enables multicast', 'Reduces TTL'],
        correct: 1,
        explanation: 'The DF bit tells routers not to fragment the packet. If it exceeds the MTU, the router drops it and sends an ICMP "Fragmentation Needed" message. This is used in Path MTU Discovery.'
    },
    {
        id: 't5_5', tier: 5,
        question: 'In the OSI model, which sublayer of Layer 2 controls access to the physical medium?',
        options: ['LLC (Logical Link Control)', 'MAC (Media Access Control)', 'PHY', 'MII'],
        correct: 1,
        explanation: 'The MAC sublayer of Layer 2 controls when devices can transmit on shared media using methods like CSMA/CD or CSMA/CA.'
    },
    {
        id: 't5_6', tier: 5,
        question: 'What happens when a TCP receiver\'s window size reaches zero?',
        options: ['Connection resets', 'Sender stops transmitting (zero window)', 'Packets are dropped silently', 'TTL expires'],
        correct: 1,
        explanation: 'A zero window means the receiver buffer is full. The sender pauses and periodically sends Window Probe segments until the window reopens.'
    }
];

export default OSI_QUIZ_BANK;
