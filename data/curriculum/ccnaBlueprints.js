/**
 * ccnaBlueprints.js
 *
 * Phase 1 curriculum architecture for the full CCNA course.
 * This file defines the domain/topic structure, source-traceability
 * requirements, and reusable simulation-engine mapping without
 * attempting to author the final lesson content yet.
 */

import { DEFAULT_SOURCE_REFS } from './sourceLibrary.js';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function topic(domainId, code, title, theoryOutline, simulationType, simulationLabel, quizType, options = {}) {
  return {
    ...options,
    id: options.id || `${domainId}-${slugify(code)}-${slugify(title)}`,
    code,
    title,
    icon: options.icon || 'LEARN',
    theoryOutline: Array.isArray(theoryOutline) ? theoryOutline : [theoryOutline],
    simulationType,
    simulationLabel,
    quizType,
    quizBank: options.quizBank || null,
    quizQuestions: Array.isArray(options.quizQuestions) ? options.quizQuestions : null,
    quizCount: Number.isInteger(options.quizCount) ? options.quizCount : null,
    quizPassingScore: options.quizPassingScore || 70,
    sourceRefs: options.sourceRefs || DEFAULT_SOURCE_REFS,
    sourceMappings: options.sourceMappings || {},
    simulationRouteId: options.simulationRouteId || null,
    status: options.status || 'blueprint',
    estimatedMinutes: options.estimatedMinutes || null,
  };
}

function domain(definition) {
  const topics = definition.topics.map((entry, index, allTopics) => ({
    ...entry,
    order: index + 1,
    prereqTopicId: index === 0 ? null : allTopics[index - 1].id,
    unlocks: index < allTopics.length - 1 ? [allTopics[index + 1].id] : [],
  }));

  return {
    ...definition,
    topics,
    finalExam: {
      id: `${definition.id}-final-exam`,
      title: `${definition.title} Final Exam`,
      questionCount: definition.finalExam.questionCount,
      passingScore: definition.finalExam.passingScore,
      quizType: definition.finalExam.quizType || 'mixed',
      bank: definition.finalExam.bank || null,
      status: definition.finalExam.bank ? 'authored' : 'planned',
      sourceRefs: DEFAULT_SOURCE_REFS,
      sourceMappings: {},
    },
  };
}

export const CCNA_DOMAIN_BLUEPRINTS = [
  domain({
    id: 'fundamentals',
    examDomain: 1,
    title: 'Network Fundamentals',
    shortTitle: 'Fundamentals',
    icon: 'NET',
    color: '#00e676',
    difficulty: 'beginner',
    examWeight: 20,
    estimatedHours: 8,
    learningGoal: 'Understand how networks are structured, how devices communicate, and the foundational models that govern all networking.',
    prerequisites: [],
    topicGroups: [
      { id: 'fundamentals-models', title: 'Models & Ethernet Foundations', topicCodes: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6'] },
      { id: 'fundamentals-addressing', title: 'IPv4 / IPv6 Addressing & Subnetting', topicCodes: ['1.7', '1.8', '1.9', '1.10'] },
      { id: 'fundamentals-transport', title: 'Transport & Ports', topicCodes: ['1.11', '1.12'] },
      { id: 'fundamentals-platforms', title: 'Virtualization & Cloud', topicCodes: ['1.13', '1.14'] },
    ],
    finalExam: {
      questionCount: 30,
      passingScore: 80,
      quizType: 'mcq-drag-fill',
      bank: 'quizBanks/fundamentals/domain1FinalExam',
    },
    topics: [
      topic('fundamentals', '1.1', 'OSI & TCP/IP Models', [
        'Contrast the 7-layer OSI model with the practical 4/5-layer TCP/IP model.',
        'Track PDUs by layer and explain encapsulation and decapsulation across a packet journey.',
      ], 'packet-animator', 'Encapsulation Practice Lab', 'MCQ + label-the-layer drag', {
        icon: 'LEARN', 
        simulationRouteId: 'osi-tcpip',
        quizBank: 'quizBanks/fundamentals/osiTcpIpModels',
        quizCount: 10,
        theory: {
          sections: [
            {
              title: 'The Need for Networking Models',
              content: '<p>Networking models provide a framework that organizes the complex functions required for computers to communicate into distinct, manageable layers. While early networks relied on vendor-proprietary models, modern networking uses <strong>vendor-neutral</strong> models. The layered approach enables <strong>modularity</strong>; an Application Layer protocol like HTTPS functions identically whether the physical connection is a copper Ethernet cable or a Wi-Fi radio wave.</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Why the layered approach matters',
                  content: 'A lesson on models is really a lesson on disciplined troubleshooting: each layer has a defined job, a defined data unit, and a predictable failure domain.',
                  items: [
                    'Standards allow devices from different vendors to interoperate.',
                    'Layer boundaries let engineers isolate faults instead of treating the whole network as one opaque system.',
                    'Protocol changes at one layer should not force redesign at every other layer.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'realWorld',
                  title: 'How engineers actually use models',
                  content: 'In operations, models are less about memorizing diagrams and more about narrowing the blast radius of a problem. If users can resolve DNS names but cannot reach a remote subnet, that points you away from the physical layer and toward Layer 3 or Layer 4 behavior.'
                },
                {
                  type: 'keyTerms',
                  title: 'Field terms to know',
                  terms: [
                    { term: 'Modularity', definition: 'Separating networking responsibilities into distinct layers with clear boundaries.' },
                    { term: 'Interoperability', definition: 'Devices from different vendors working together because they follow common standards.' },
                    { term: 'Protocol stack', definition: 'The collection of protocols operating together across the layers of a network model.' }
                  ]
                }
              ]
            },
            {
              title: 'The OSI Reference Model',
              content: '<p>The Open Systems Interconnection (OSI) model was developed by the ISO. It defines seven distinct layers: <strong>(7) Application, (6) Presentation, (5) Session, (4) Transport, (3) Network, (2) Data Link,</strong> and <strong>(1) Physical</strong>.</p><p>While the OSI model is not used to build modern networks, its <em>terminology</em> remains the universal language of network engineering. Engineers still refer to IP addressing as “Layer 3” and cabling as “Layer 1” based on this model.</p>',
              blocks: [
                {
                  type: 'table',
                  title: 'OSI layers at a glance',
                  columns: ['Layer', 'Primary responsibility', 'Common examples'],
                  rows: [
                    ['7-5', 'Provide application services and data formatting/session functions', 'HTTP, TLS formatting, session state'],
                    ['4', 'End-to-end conversation between processes', 'TCP, UDP, port numbers'],
                    ['3', 'Logical addressing and routing between networks', 'IPv4, IPv6, routers'],
                    ['2', 'Local delivery on the current link', 'Ethernet, MAC addressing, switches'],
                    ['1', 'Signal transmission on the medium', 'Copper, fiber, radio, bits']
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'CCNA language stays OSI-centric',
                  content: 'Even when the curriculum is discussing the TCP/IP suite, question wording often still uses OSI numbering. Expect “Layer 2” and “Layer 3” terminology throughout labs, troubleshooting prompts, and exam items.'
                }
              ]
            },
            {
              title: 'The TCP/IP Model',
              content: '<p>The TCP/IP model (Internet Protocol Suite) is the standard that powers the modern Internet. It consolidates the upper OSI layers into a single Application layer and focuses on the protocols that actually operate on real networks.</p>',
              blocks: [
                {
                  type: 'table',
                  title: 'OSI vs TCP/IP mapping',
                  columns: ['OSI perspective', 'TCP/IP perspective', 'Operational meaning'],
                  rows: [
                    ['Application / Presentation / Session', 'Application', 'User-facing services and data representation'],
                    ['Transport', 'Transport', 'Process-to-process delivery using ports'],
                    ['Network', 'Network', 'End-to-end logical addressing and routing'],
                    ['Data Link + Physical', 'Data Link + Physical', 'Local forwarding and signal transmission']
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'The model CCNA learners should think in',
                  items: [
                    'Use the TCP/IP suite to explain how modern traffic actually moves.',
                    'Use the OSI model as the vocabulary for discussing where a function lives.',
                    'Treat the two models as complementary, not interchangeable one-to-one blueprints.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'commonMistake',
                  title: 'Do not over-force exact layer matches',
                  content: 'The models are similar, but they are not perfect overlays. The TCP/IP Application layer combines responsibilities that the OSI model separates into three distinct layers.'
                }
              ]
            },
            {
              title: 'Data Encapsulation',
              content: '<p>When a host sends data, it undergoes <strong>encapsulation</strong>. The Application layer prepares the payload and each lower layer adds control information needed to move that payload toward the destination. At the receiving end, <strong>de-encapsulation</strong> reverses the process.</p>',
              blocks: [
                {
                  type: 'steps',
                  title: 'Encapsulation sequence',
                  items: [
                    'Application data is generated by the user process or service.',
                    'Layer 4 adds a TCP or UDP header, creating a segment.',
                    'Layer 3 adds an IP header, creating a packet.',
                    'Layer 2 adds an Ethernet header and trailer, creating a frame.',
                    'Layer 1 transmits the frame as bits on the medium.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Know the PDU names cold',
                  content: 'A favorite CCNA check is to ask for the protocol data unit at a given layer. Segment, packet, frame, and bits should be instant recall items.'
                },
                {
                  type: 'checklist',
                  title: 'Packet-journey review checklist',
                  items: [
                    'Which address stays the same end to end? IP address.',
                    'Which address changes hop by hop? MAC address.',
                    'Which layer uses ports to identify the destination service? Transport.',
                    'Which device reads Layer 2 headers for local forwarding? A switch.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'The OSI model has 7 layers (Application, Presentation, Session, Transport, Network, Data Link, Physical).',
            'The modern TCP/IP suite uses 5 layers, condensing OSI layers 5-7 into a single Application layer.',
            'Encapsulation builds the PDU top-down (Data → Segment → Packet → Frame → Bits).',
            'Layer 2 uses MAC addresses for hop-to-hop delivery; Layer 3 uses IP addresses for end-to-end delivery; Layer 4 uses Port numbers to target specific processes.'
          ]
        },
        sourceMappings: {
          'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/solutions/enterprise-networks/campus-lan-wlan/index.html', coverageNotes: 'Official documentation covering theory.' },
          'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
        } 
      }),
      topic('fundamentals', '1.2', 'Ethernet LAN Standards', [
        'Compare 10BASE-T, 100BASE-T, and 1000BASE-T with speed, media, and distance limits.',
        'Relate cabling categories and physical constraints to Ethernet standards.',
      ], 'comparison-viewer', 'Cable Standards Matcher', 'MCQ + matching', { 
        icon: 'L2', 
        quizBank: 'quizBanks/fundamentals/ethernetLanStandards',
        quizCount: 10,
        sourceMappings: {
          'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/solutions/enterprise-networks/campus-lan-wlan/index.html', coverageNotes: 'Official documentation covering theory.' },
          'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
        },
        theory: {
          sections: [
            {
              title: 'IEEE 802.3 Copper Standards',
              content: '<p>The IEEE 802.3 working group defines the physical and data link specifications for Ethernet. Several standards exist to support different speeds over Unshielded Twisted Pair (UTP) cabling, all sharing a strict <strong>100-meter maximum length</strong> before severe signal attenuation becomes a serious design problem.</p>',
              blocks: [
                {
                  type: 'table',
                  title: 'Copper Ethernet quick reference',
                  columns: ['IEEE', 'Common name', 'Speed', 'Typical UTP requirement'],
                  rows: [
                    ['802.3i', '10BASE-T', '10 Mbps', 'Cat 3'],
                    ['802.3u', '100BASE-T', '100 Mbps', 'Cat 5'],
                    ['802.3ab', '1000BASE-T', '1 Gbps', 'Cat 5e'],
                    ['802.3an', '10GBASE-T', '10 Gbps', 'Cat 6a']
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'The distance rule that keeps returning',
                  content: 'For copper Ethernet exam questions, 100 meters is the operational ceiling you should expect unless the prompt clearly switches to fiber or another medium.'
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Decode the naming format',
                  content: 'BASE means baseband signaling, and the suffix usually hints at the medium. T means twisted pair. On the CCNA, the most important memory anchors are speed, medium, and the 100-meter copper limit.'
                }
              ]
            },
            {
              title: 'Pin Pair Usage and Wiring',
              content: '<p>Different Ethernet standards use the wire pairs inside an 8-pin connector differently. This directly affects troubleshooting, cable certification, and performance expectations.</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Pair usage changes with speed',
                  items: [
                    '10BASE-T and 100BASE-T use two pairs: one for transmit and one for receive.',
                    '1000BASE-T and above use all four pairs.',
                    'Gigabit Ethernet can transmit and receive simultaneously on the same pairs.'
                  ]
                },
                {
                  type: 'figure',
                  title: 'Pin-pair field reference',
                  src: 'assets/theory_images/page_102_img1.png',
                  alt: 'Diagram showing 1000BASE-T using all four twisted pairs in an Ethernet cable.',
                  caption: '1000BASE-T uses all eight wires, so pair condition matters across the full cable, not just the classic 1/2 and 3/6 pairs.'
                },
                {
                  type: 'note',
                  variant: 'realWorld',
                  title: 'Why cable faults can look inconsistent',
                  content: 'A marginal cable might still pass traffic at 100 Mbps while failing at 1 Gbps because Fast Ethernet only needs two good pairs, whereas Gigabit Ethernet depends on all four.'
                }
              ]
            },
            {
              title: 'Straight-through vs. Crossover Cables',
              content: '<p>Historically, cable selection depended on whether both ends used the same transmit and receive pins. This was a practical field skill before automatic pair correction became common.</p>',
              blocks: [
                {
                  type: 'table',
                  title: 'Legacy cable decision logic',
                  columns: ['Connection', 'Legacy cable choice', 'Why'],
                  rows: [
                    ['PC to switch', 'Straight-through', 'Transmit pins on the host line up with receive pins on the switch.'],
                    ['Router to switch', 'Straight-through', 'Unlike devices use complementary Tx/Rx pinouts.'],
                    ['Switch to switch', 'Crossover', 'Both sides would otherwise transmit on the same pins.'],
                    ['Router to router', 'Crossover', 'Both sides use the same Tx/Rx orientation.']
                  ]
                },
                {
                  type: 'figure',
                  title: 'Crossover concept',
                  src: 'assets/theory_images/page_099_img1.png',
                  alt: 'Diagram showing Ethernet crossover wiring between transmit and receive pairs.',
                  caption: 'A crossover cable swaps the classic Tx and Rx pairs so like devices can communicate on older interfaces.'
                },
                {
                  type: 'note',
                  variant: 'commonMistake',
                  title: 'Do not treat this as a modern default behavior',
                  content: 'You still need the theory for the exam, but real networks now rely heavily on Auto MDI-X. The CCNA cares that you know the original rule and also know why it matters less today.'
                }
              ]
            },
            {
              title: 'Auto MDI-X',
              content: '<p>Modern network engineering rarely requires maintaining separate stocks of crossover and straight-through cables. This is due to <strong>Auto MDI-X</strong>, which allows interfaces to detect the connected pinout and logically adjust transmit and receive behavior.</p>',
              blocks: [
                {
                  type: 'figure',
                  title: 'Auto MDI-X in practice',
                  src: 'assets/theory_images/page_101_img1.png',
                  alt: 'Illustration of Auto MDI-X automatically adjusting Ethernet transmit and receive pin roles.',
                  caption: 'With Auto MDI-X, the device adapts the interface logic instead of forcing the engineer to choose a special cable.'
                },
                {
                  type: 'note',
                  variant: 'realWorld',
                  title: 'What this changed operationally',
                  content: 'Auto MDI-X reduced one of the most common early-layer wiring mistakes in LAN deployments. Today, if a copper link fails to come up, you are more likely to investigate speed, duplex, pair quality, or administrative state before blaming straight-through versus crossover selection.'
                },
                {
                  type: 'checklist',
                  title: 'Copper link review sequence',
                  items: [
                    'Confirm both interfaces are enabled and negotiating correctly.',
                    'Verify the cable category matches the expected speed.',
                    'Remember the 100-meter maximum for standard copper Ethernet runs.',
                    'Only fall back to crossover theory when the prompt is explicitly testing legacy behavior.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'All major copper Ethernet standards (10BASE-T to 10GBASE-T) have a strict 100-meter distance limitation.',
            'PCs and Routers transmit on pins 1/2. Switches transmit on pins 3/6.',
            'Connect like devices (Router-to-Router, Switch-to-Switch) with Crossover cables. Connect unlike devices with Straight-Through cables.',
            'Auto MDI-X allows modern devices to logically adjust Tx/Rx pinouts, making crossover cables obsolete in practice.',
            '10/100BASE-T uses 2 wire pairs (4 wires). 1000BASE-T uses all 4 wire pairs (8 wires).'
          ]
        }
      }),
      topic('fundamentals', '1.3', 'MAC Addresses', [
        'Break a MAC address into OUI and vendor-specific portions.',
        'Identify unicast, multicast, and broadcast addressing patterns.',
      ], 'calculator-tool', 'MAC Address Builder', 'Fill-in + MCQ', {
        icon: 'ARP',
        quizBank: 'quizBanks/fundamentals/macAddresses',
        quizCount: 10,
        sourceMappings: {
          'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
          'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
        },
        theory: {
          sections: [
            {
              title: 'MAC Address Structure',
              content: '<p>A <strong>MAC address</strong> is the Layer 2 hardware address used on Ethernet LANs. It is 48 bits long and is typically written as 12 hexadecimal digits such as <code>00:1A:2B:3C:4D:5E</code>. The first 24 bits form the <strong>OUI (Organizationally Unique Identifier)</strong>, which identifies the vendor or manufacturer assigned by the IEEE. The final 24 bits are a vendor-assigned value that should uniquely identify a specific network interface card.</p><p>Because MAC addresses are hexadecimal, each character represents 4 bits. This makes them compact and easier to read than their full binary equivalent, while still preserving the exact Layer 2 identity used by switches and network interface hardware.</p>'
            },
            {
              title: 'How MAC Addresses Are Used',
              content: '<p>Ethernet communication is local to the current broadcast domain. When a host wants to send traffic to another device on the same LAN, it needs the destination device\'s MAC address so it can build the Layer 2 Ethernet header. Switches then examine the destination MAC address and forward the frame toward the correct port using their MAC address tables.</p><p>If the destination is on a remote network, the host does <em>not</em> place the remote host\'s MAC in the frame. Instead, it uses the default gateway\'s MAC address as the Layer 2 destination while preserving the remote IP address in the Layer 3 packet.</p>'
            },
            {
              title: 'Unicast, Broadcast, and Multicast',
              content: '<p>CCNA students must distinguish the main Layer 2 delivery styles:</p><ul><li><strong>Unicast:</strong> A frame sent from one device to one specific destination MAC address.</li><li><strong>Broadcast:</strong> A frame sent to <code>FF:FF:FF:FF:FF:FF</code>, which every device in the local broadcast domain must process.</li><li><strong>Multicast:</strong> A frame sent to a group MAC address so only interested receivers process it.</li></ul><p>A useful exam rule is that the least significant bit of the first byte helps indicate whether a MAC is individual or group-oriented. Broadcast is the special all-ones case, while multicast uses group addressing patterns rather than a single host identifier.</p>'
            },
            {
              title: 'Burned-In Address vs. Spoofing',
              content: '<p>Most NICs ship with a <strong>burned-in address (BIA)</strong> from the manufacturer, but many operating systems allow software-based MAC changes. This is sometimes called MAC spoofing. From a CCNA perspective, the important point is that switches learn whatever source MAC they actually receive in incoming frames, regardless of whether the address is factory-set or manually overridden.</p>'
            }
          ],
          keyTakeaways: [
            'A MAC address is a 48-bit Layer 2 hardware address written in hexadecimal.',
            'The first 24 bits are the vendor OUI. The last 24 bits uniquely identify the interface within that vendor space.',
            'Ethernet switches forward frames using destination MAC addresses stored in the MAC address table.',
            'Broadcast uses FF:FF:FF:FF:FF:FF and is flooded to all devices in the local broadcast domain.',
            'For remote destinations, a host sends the frame to the default gateway\'s MAC address, not directly to the remote host\'s MAC.'
          ]
        }
      }),
      topic('fundamentals', '1.4', 'CSMA/CD & Ethernet Frames', [
        'Explain legacy collision detection, jamming, and half-duplex Ethernet behavior.',
        'Label Ethernet II frame fields from preamble through FCS.',
      ], 'packet-animator', 'Frame Builder Simulator', 'Field-label drag-drop', {
        icon: 'L2',
        simulationRouteId: 'ethernet-frame',
        quizBank: 'quizBanks/fundamentals/csmaCdEthernetFrames',
        quizCount: 10,
        sourceMappings: {
          'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
          'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
        },
        theory: {
          sections: [
            {
              title: 'Collision Domains and the Half-Duplex World',
              content: '<p><strong>CSMA/CD applies to half-duplex Ethernet, with hubs and other shared-medium designs serving as the classic exam example.</strong> In early LANs, multiple hosts attached to the same hub and effectively shared one wire segment. That meant every device belonged to the same <strong>collision domain</strong>: if two stations transmitted at the same time, their electrical signals interfered and both frames were ruined.</p><p>Those environments were <strong>half-duplex</strong>. A NIC could transmit or receive, but not do both simultaneously on the same medium. Because multiple devices had equal access to that segment, Ethernet needed a disciplined way to decide when transmitting was safe and what to do when that decision still failed.</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'The design condition that creates collisions',
                  content: 'Collisions are not a generic Ethernet fact. They are a consequence of multiple devices contending for the same half-duplex segment.',
                  items: [
                    'A hub creates one shared collision domain across all active ports.',
                    'Only one successful transmission can exist on that shared medium at a time.',
                    'A switch breaks collision domains per port, which is why switched Ethernet changed everything.'
                  ]
                },
                {
                  type: 'table',
                  title: 'Shared hub Ethernet vs switched Ethernet',
                  columns: ['Characteristic', 'Hub / shared segment', 'Switch / dedicated port'],
                  rows: [
                    ['Medium access', 'Multiple hosts contend for one segment', 'Each host gets a dedicated switched link'],
                    ['Duplex expectation', 'Half-duplex', 'Usually full-duplex'],
                    ['Collision risk', 'Yes, normal operating concern', 'No collisions on a proper full-duplex link'],
                    ['Need for CSMA/CD', 'Required', 'Effectively irrelevant']
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'CCNA framing to remember',
                  content: 'If the prompt mentions hubs, shared media, or half-duplex Ethernet, think collisions and CSMA/CD immediately. If it describes a modern switch port operating full-duplex, collisions should not be part of the normal answer.'
                }
              ]
            },
            {
              title: 'How CSMA/CD Actually Operates',
              content: '<p><strong>CSMA/CD</strong> stands for <strong>Carrier Sense Multiple Access with Collision Detection</strong>. Each word describes a piece of the access method. A station first listens to the medium (<em>carrier sense</em>), because many devices may use that medium (<em>multiple access</em>). If two devices still begin transmitting close enough together in time, they must recognize the corrupted signal and stop (<em>collision detection</em>).</p>',
              blocks: [
                {
                  type: 'steps',
                  title: 'CSMA/CD decision flow',
                  items: [
                    'Listen to the segment to determine whether another device is already transmitting.',
                    'If the medium is idle, begin sending the frame.',
                    'Continue monitoring the signal while transmitting to detect whether a collision occurred.',
                    'If a collision is detected, stop normal transmission and send a jam signal.',
                    'Wait a random backoff interval, then listen again and retry.'
                  ]
                },
                {
                  type: 'keyTerms',
                  title: 'CSMA/CD language decoded',
                  terms: [
                    { term: 'Carrier sense', definition: 'The NIC checks whether the medium appears busy before sending.' },
                    { term: 'Multiple access', definition: 'Many devices have the right to use the same shared Ethernet segment.' },
                    { term: 'Collision detection', definition: 'A transmitting device detects that the observed signal no longer matches what it expected to send.' }
                  ]
                },
                {
                  type: 'note',
                  variant: 'commonMistake',
                  title: 'Listening first does not guarantee success',
                  content: 'Two hosts can both decide the wire is idle and start transmitting almost simultaneously because of propagation delay. CSMA/CD reduces contention; it does not eliminate the possibility of collisions on a shared segment.'
                }
              ]
            },
            {
              title: 'Jam Signals and Binary Exponential Backoff',
              content: '<p>When a transmitting NIC detects a collision, it does not simply go silent and hope for the best. It sends a <strong>jam signal</strong> so every station on the shared segment recognizes that the current transmission is invalid. The damaged frame is abandoned, and each affected host schedules a retry based on <strong>binary exponential backoff</strong>.</p><p>The retry timer grows more flexible after repeated collisions. After each collision, the host chooses randomly from a larger range of waiting slots. That expanding range lowers the chance that the same two hosts retransmit at the same instant again.</p>',
              blocks: [
                {
                  type: 'table',
                  title: 'Backoff behavior in plain terms',
                  columns: ['After collision number', 'Random choice comes from', 'Operational effect'],
                  rows: [
                    ['1', 'A very small slot range', 'Quick retry, but another collision is still possible'],
                    ['2-3', 'A larger slot range', 'Better separation between competing senders'],
                    ['Repeated collisions', 'An increasingly wider range', 'Contention is spread out to reduce repeated clashes']
                  ]
                },
                {
                  type: 'checklist',
                  title: 'What happens immediately after a collision',
                  items: [
                    'The sender detects corruption while it is still transmitting.',
                    'A jam signal is transmitted so all stations recognize the event.',
                    'The damaged frame is discarded rather than salvaged.',
                    'Each sender waits a randomized backoff interval before retrying.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'realWorld',
                  title: 'Why minimum frame size mattered historically',
                  content: 'On a shared half-duplex segment, a sender had to still be transmitting long enough to detect a collision that could occur elsewhere on the medium. That is one reason Ethernet preserves a minimum frame size requirement.'
                }
              ]
            },
            {
              title: 'Why Modern Ethernet Rarely Mentions CSMA/CD',
              content: '<p>Modern enterprise Ethernet is overwhelmingly <strong>switched and full-duplex</strong>. A host connected to a switch port has a dedicated transmit path and a dedicated receive path; it is not competing with neighboring hosts for one shared wire. Because there is no shared half-duplex medium, the classic collision problem disappears and <strong>CSMA/CD becomes effectively irrelevant in day-to-day switched networks</strong>.</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'The reason CSMA/CD faded away',
                  items: [
                    'Switches isolate traffic into separate per-port collision domains.',
                    'Full-duplex links allow simultaneous send and receive operations.',
                    'Without collisions, the collision-detection procedure is no longer needed.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Legacy concept, current exam relevance',
                  content: 'CSMA/CD still matters because it explains older Ethernet behavior and shows why switching was such a major architectural improvement. On the exam, know both the legacy mechanism and the modern reason it no longer operates on normal switch links.'
                }
              ]
            },
            {
              title: 'Ethernet II Frame Layout and Field Purpose',
              content: '<p>The standard <strong>Ethernet II</strong> frame encapsulates upper-layer data such as IPv4, IPv6, and ARP. The receiver processes the frame in a strict field order. CCNA learners should know the order, the size of each field, and the operational purpose each field serves.</p>',
              blocks: [
                {
                  type: 'richText',
                  title: 'Ethernet II frame at a glance',
                  html: '<div class="theory-frame-diagram"><div class="frame-field">Preamble<span>7 bytes</span></div><div class="frame-field">SFD<span>1 byte</span></div><div class="frame-field">Destination MAC<span>6 bytes</span></div><div class="frame-field">Source MAC<span>6 bytes</span></div><div class="frame-field">Type<span>2 bytes</span></div><div class="frame-field frame-payload">Data + Pad<span>46-1500 bytes</span></div><div class="frame-field">FCS<span>4 bytes</span></div></div><p>The <strong>preamble</strong> synchronizes timing, and the <strong>Start Frame Delimiter (SFD)</strong> marks the actual beginning of the frame. The receiver then reads the <strong>destination MAC</strong>, <strong>source MAC</strong>, and <strong>Type</strong> field before processing the payload and finally checking the <strong>FCS</strong>.</p>'
                },
                {
                  type: 'table',
                  title: 'Ethernet II field reference',
                  columns: ['Field', 'Size', 'Purpose', 'CCNA anchor'],
                  rows: [
                    ['Preamble', '7 bytes', 'Synchronizes sender and receiver timing', 'Precedes the actual frame contents'],
                    ['SFD', '1 byte', 'Marks the start of the frame', 'Signals that MAC fields follow'],
                    ['Destination MAC', '6 bytes', 'Identifies the intended Layer 2 recipient', 'Used by switches for forwarding decisions'],
                    ['Source MAC', '6 bytes', 'Identifies the sender on the local segment', 'Learned into the switch MAC table'],
                    ['Type', '2 bytes', 'Identifies the encapsulated Layer 3 protocol', 'Examples: IPv4 0x0800, ARP 0x0806, IPv6 0x86DD'],
                    ['Data and Pad', '46-1500 bytes', 'Carries the payload and any required padding', 'Padding is added if payload is too small'],
                    ['FCS', '4 bytes', 'Carries the CRC result for error detection', 'Bad FCS means the frame is discarded']
                  ]
                },
                {
                  type: 'note',
                  variant: 'note',
                  title: 'Ethernet II vs IEEE 802.3 exam cue',
                  content: 'For Ethernet II, the 2-byte field after the source MAC is a Type field that identifies the Layer 3 payload. That is why Ethernet II is strongly associated with protocols such as IPv4, IPv6, and ARP.'
                }
              ]
            },
            {
              title: 'Minimum Size, Maximum Size, Padding, and FCS',
              content: '<p>From <strong>Destination MAC through FCS</strong>, a standard Ethernet frame must be at least <strong>64 bytes</strong> and no more than <strong>1518 bytes</strong>. If the payload is too short, Ethernet adds <strong>padding</strong> so the frame still reaches the minimum legal size. The preamble and SFD are transmitted on the wire but are not counted in that 64-to-1518-byte frame size calculation.</p><p>The <strong>Frame Check Sequence (FCS)</strong> is a 4-byte CRC value used for <strong>error detection</strong>. The receiver recalculates the CRC and compares it to the arriving FCS. If they do not match, the frame is dropped. Ethernet can detect corruption, but it does <strong>not</strong> correct the corrupted bits itself.</p>',
              blocks: [
                {
                  type: 'table',
                  title: 'Ethernet sizing rules',
                  columns: ['Rule', 'Value', 'Meaning'],
                  rows: [
                    ['Minimum frame size', '64 bytes', 'Measured from Destination MAC through FCS'],
                    ['Maximum standard frame size', '1518 bytes', 'Also excludes preamble and SFD'],
                    ['Minimum data field', '46 bytes', 'Shorter payloads require padding'],
                    ['FCS size', '4 bytes', 'Used for CRC-based error detection']
                  ]
                },
                {
                  type: 'checklist',
                  title: 'Frame validation checklist',
                  items: [
                    'Is the frame at least 64 bytes from Destination MAC through FCS?',
                    'If the payload is shorter than 46 bytes, was padding added?',
                    'Did the receiving NIC calculate the same CRC value as the FCS field?',
                    'If the FCS fails, remember the frame is discarded rather than repaired.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'commonMistake',
                  title: 'Detection is not correction',
                  content: 'The FCS tells the receiver that a frame was damaged, but Ethernet does not rebuild the damaged data. Recovery must come from higher-layer behavior, such as retransmission driven by TCP or by an application process.'
                }
              ]
            }
          ],
          keyTakeaways: [
            'CSMA/CD exists for shared, half-duplex Ethernet collision domains, not for normal switched full-duplex links.',
            'Carrier sense means listen first, multiple access means many devices share the medium, and collision detection means the sender detects corruption while transmitting.',
            'A collision triggers a jam signal and a binary exponential backoff retry process.',
            'Modern switched Ethernet isolates hosts onto full-duplex links, making collisions and CSMA/CD effectively irrelevant in practice.',
            'An Ethernet II frame is ordered as Preamble, SFD, Destination MAC, Source MAC, Type, Data/Pad, and FCS.',
            'Standard Ethernet frames are 64 to 1518 bytes from Destination MAC through FCS; short payloads are padded and FCS provides error detection, not correction.'
          ]
        }
      }),
      topic('fundamentals', '1.5', 'Network Components', [
        'Differentiate routers, Layer 2 and Layer 3 switches, hubs, APs, firewalls, and controllers.',
        'Map device roles to common enterprise network designs.',
      ], 'diagram-builder', 'Component Identifier', 'MCQ + diagram label', { 
        icon: 'NET', 
        quizBank: 'quizBanks/fundamentals/networkComponents',
        quizCount: 10,
        sourceMappings: {
          'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/solutions/enterprise-networks/campus-lan-wlan/index.html', coverageNotes: 'Official documentation covering theory.' },
          'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
        },
        theory: {
          sections: [
            {
              title: 'Why Network Components Matter in CCNA Designs',
              content: '<p>Enterprise networks are built from specialized devices that each solve a different problem. Some devices provide local access, some move traffic between networks, some extend connectivity to wireless clients, and some enforce security policy at trust boundaries. CCNA students are expected to identify <strong>what each component does</strong>, <strong>which layer it primarily operates at</strong>, and <strong>where it usually appears</strong> in a real design.</p><p>A useful mindset is to stop thinking of network devices as interchangeable boxes. A hub, a Layer 2 switch, a router, a multilayer switch, an access point, a wireless controller, and a firewall may all forward traffic in some way, but they make decisions using different information and create different forwarding boundaries.</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Decision lens for device questions',
                  content: 'When comparing network components, anchor on three ideas: what the device examines, what boundary it creates, and where it belongs in the enterprise.',
                  items: [
                    'Hubs repeat bits and do not make forwarding decisions.',
                    'Layer 2 switches forward frames based on MAC addresses inside a LAN.',
                    'Routers and multilayer switches forward packets between IP networks.',
                    'Firewalls enforce policy at network boundaries rather than simply forwarding by best path.',
                    'Wireless devices extend the access layer beyond Ethernet cabling.'
                  ]
                },
                {
                  type: 'table',
                  title: 'Component role snapshot',
                  columns: ['Component', 'Primary layer focus', 'Main job', 'Typical enterprise placement'],
                  rows: [
                    ['Hub', 'Layer 1', 'Repeat incoming bits to other ports', 'Legacy/shared lab examples only'],
                    ['Layer 2 switch', 'Layer 2', 'Forward frames inside the LAN', 'Access layer'],
                    ['Router', 'Layer 3', 'Connect different IP networks and WAN edges', 'Branch edge, WAN edge, Internet edge'],
                    ['Multilayer switch', 'Layer 2 + Layer 3', 'Switch locally and route between VLANs at high speed', 'Distribution/core or collapsed core'],
                    ['Access point', 'Layer 2 bridge role for wireless clients', 'Bridge 802.11 clients into the wired LAN', 'Wireless access layer'],
                    ['Wireless LAN controller', 'Control/management platform', 'Centralize AP policy, RF, and client management', 'Campus distribution/data center/controller cluster'],
                    ['Firewall', 'Layer 3-7 policy enforcement', 'Inspect and permit/deny traffic across trust boundaries', 'Internet edge, data center edge, segmentation points']
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'CCNA habit to build early',
                  content: 'Do not memorize only a layer number. The exam often asks about practical effect: Does the device break collision domains? Does it stop broadcasts? Does it perform inter-VLAN routing? Does it enforce policy statefully?'
                }
              ]
            },
            {
              title: 'Hubs vs. Layer 2 Switches',
              content: '<p><strong>Hubs</strong> are pure Layer 1 repeaters. They do not learn addresses, inspect headers, or make forwarding choices. A signal received on one port is regenerated out the others, which means all connected devices effectively share the same media segment.</p><p><strong>Layer 2 switches</strong> changed Ethernet by learning source MAC addresses and building a MAC address table. Instead of repeating every frame everywhere, a switch forwards a unicast frame only toward the port where the destination MAC is known. Unknown unicast, broadcast, and some multicast traffic may still be flooded, but routine traffic becomes far more efficient.</p>',
              blocks: [
                {
                  type: 'table',
                  title: 'Hub and switch comparison',
                  columns: ['Characteristic', 'Hub', 'Layer 2 switch'],
                  rows: [
                    ['OSI focus', 'Layer 1', 'Layer 2'],
                    ['Forwarding basis', 'No addressing awareness', 'Destination MAC address'],
                    ['Collision domains', 'One shared collision domain', 'One collision domain per port'],
                    ['Broadcast domains', 'One broadcast domain', 'One broadcast domain unless VLANs are used'],
                    ['Duplex expectation', 'Half-duplex/shared media behavior', 'Normally full-duplex on modern links'],
                    ['Enterprise relevance', 'Legacy theory', 'Standard LAN access device']
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'Collision domain vs broadcast domain',
                  items: [
                    'A collision domain is the part of the network where Ethernet frame collisions can occur on shared media.',
                    'A hub keeps all attached devices in one large collision domain.',
                    'A switch creates a separate collision domain on each port, which is why collisions disappear on normal full-duplex switched links.',
                    'A basic Layer 2 switch still forwards broadcasts within the same VLAN, so the VLAN remains the broadcast domain.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'realWorld',
                  title: 'Why hubs matter even though you rarely deploy them',
                  content: 'Hubs survive in the curriculum because they explain why early Ethernet needed shared-medium logic like CSMA/CD. In production enterprise networks, you should expect switched Ethernet instead.'
                },
                {
                  type: 'keyTerms',
                  title: 'Terms tied to switching questions',
                  terms: [
                    { term: 'MAC address table', definition: 'A switch data structure that maps learned source MAC addresses to switch ports.' },
                    { term: 'Collision domain', definition: 'A network segment where simultaneous transmissions on shared media can interfere with one another.' },
                    { term: 'Broadcast domain', definition: 'The set of devices that receive a Layer 2 broadcast frame.' }
                  ]
                }
              ]
            },
            {
              title: 'Routers vs. Multilayer Switches',
              content: '<p><strong>Routers</strong> connect different Layer 3 networks. They examine the destination IP address, consult a routing table, and forward the packet toward the next hop. A router interface is a Layer 3 boundary, so routers do <strong>not</strong> forward Layer 2 broadcasts from one interface to another. Each router interface therefore marks a different broadcast domain.</p><p><strong>Multilayer switches</strong> combine switching and routing in one platform. They still switch frames within a VLAN at Layer 2, but they can also route between VLANs using switched virtual interfaces (SVIs) or routed ports. In enterprise campus designs, this makes them ideal for fast inter-VLAN routing close to users and servers.</p>',
              blocks: [
                {
                  type: 'table',
                  title: 'Router and multilayer switch comparison',
                  columns: ['Question', 'Router', 'Multilayer switch'],
                  rows: [
                    ['Primary strength', 'Connecting different networks and external paths', 'High-speed routing inside the campus LAN'],
                    ['Common use case', 'WAN edge, branch edge, Internet edge', 'Distribution/core and inter-VLAN routing'],
                    ['Broadcast handling', 'Does not forward Layer 2 broadcasts between interfaces', 'Also terminates VLAN broadcast domains when routing between them'],
                    ['Decision basis', 'Routing table and Layer 3 logic', 'MAC switching plus hardware-assisted Layer 3 forwarding'],
                    ['Access port density', 'Usually lower than campus switches', 'Often designed for many switch ports and VLAN services']
                  ]
                },
                {
                  type: 'steps',
                  title: 'How inter-VLAN communication happens',
                  items: [
                    'Host A sends traffic to a device in another IP subnet.',
                    'Host A forwards the frame to its default gateway MAC address.',
                    'A router or multilayer switch receives the packet on the gateway interface/SVI.',
                    'The Layer 3 device consults its routing information and selects the correct outbound network.',
                    'A new Layer 2 frame is built for the next segment while the Layer 3 packet continues toward the destination.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'What separates L2 switching from L3 forwarding',
                  content: 'If the destination is in the same VLAN, a Layer 2 switch can forward using MAC logic alone. If the destination is in a different subnet/VLAN, routing is required and a router or multilayer switch must be involved.'
                },
                {
                  type: 'checklist',
                  title: 'Quick design rule',
                  items: [
                    'Use Layer 2 switches to attach endpoints within the local VLAN.',
                    'Use multilayer switches when many VLANs in the campus need fast inter-VLAN routing.',
                    'Use routers when connecting the campus to remote sites, providers, or the Internet.'
                  ]
                }
              ]
            },
            {
              title: 'Wireless Access Points and Wireless Controllers',
              content: '<p><strong>Access points (APs)</strong> provide wireless connectivity for clients using IEEE 802.11 and bridge that traffic into the wired Ethernet LAN. From the user perspective, an AP is the local entry point to the network. From the enterprise perspective, it extends the access layer into the air rather than through copper alone.</p><p>In small environments, an AP may operate with most intelligence locally. In larger enterprises, many APs are managed centrally by a <strong>Wireless LAN Controller (WLC)</strong>. The controller centralizes SSID policy, client authentication behavior, RF coordination, firmware management, and operational visibility. This lets the organization manage wireless as one system rather than as dozens or hundreds of isolated APs.</p>',
              blocks: [
                {
                  type: 'table',
                  title: 'AP and WLC role split',
                  columns: ['Component', 'Primary role', 'What it handles well'],
                  rows: [
                    ['Access point', 'Provide radio coverage and client connectivity', 'Local wireless access, bridging client traffic to the wired LAN'],
                    ['Wireless LAN controller', 'Centralized control plane and policy management', 'SSID consistency, AP policy, roaming behavior, RF coordination, software management']
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'What CCNA learners should picture',
                  items: [
                    'An AP is not just a wireless antenna; it is the edge device clients associate with.',
                    'A WLC is not a replacement for the AP radio itself; it centralizes management and control across many APs.',
                    'Wireless clients still need Layer 2 and Layer 3 services after association, including VLAN placement, addressing, and gateway reachability.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'realWorld',
                  title: 'Why controllers appear in enterprise networks',
                  content: 'Once an organization has many APs across floors or buildings, individual AP-by-AP management becomes operationally expensive. Centralized control improves consistency, roaming, and troubleshooting.'
                }
              ]
            },
            {
              title: 'Firewalls and Network Boundaries',
              content: '<p><strong>Firewalls</strong> are policy-enforcement devices placed at important trust boundaries such as the Internet edge, a data center boundary, or between internal security zones. A router decides where a packet should go next. A firewall decides whether that traffic should be allowed at all, under what conditions, and as part of which stateful session.</p><p>Modern firewalls can inspect well beyond basic Layer 3 information. They commonly evaluate source and destination addresses, ports, session state, application awareness, and security policy. This makes them central to segmentation and risk reduction, especially where user, server, guest, and Internet-facing traffic meet.</p>',
              blocks: [
                {
                  type: 'table',
                  title: 'Router vs firewall at a boundary',
                  columns: ['Question', 'Router focus', 'Firewall focus'],
                  rows: [
                    ['Primary question answered', 'Where should this packet go?', 'Should this traffic be permitted?'],
                    ['Main logic', 'Best-path forwarding', 'Security policy and stateful inspection'],
                    ['Broadcast behavior', 'Separates Layer 2 broadcast domains', 'Typically deployed at security boundaries rather than discussed in domain terms'],
                    ['Operational purpose', 'Connectivity', 'Connectivity with control and enforcement']
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'Think in trust boundaries',
                  items: [
                    'Internet edge: protect inside users and services from untrusted networks.',
                    'Data center boundary: restrict who can reach server networks and on what ports.',
                    'Internal segmentation: limit movement between user, guest, voice, IoT, and management zones.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'commonMistake',
                  title: 'Do not collapse router and firewall into the same job',
                  content: 'Some platforms can perform both routing and firewall functions, but the CCNA comparison is about role. Routing selects paths; firewalling enforces traffic policy across boundaries.'
                }
              ]
            },
            {
              title: 'Enterprise Role Mapping',
              content: '<p>CCNA questions often become easier when you place each device into a standard enterprise design. The <strong>access layer</strong> attaches endpoints. The <strong>distribution layer</strong> aggregates access switches and frequently provides policy and inter-VLAN routing. The <strong>core</strong> provides fast, resilient transport across the campus. Security boundaries and WAN/Internet edges are handled by specialized Layer 3 and security devices.</p><p>This means the same technology can appear in different places for different reasons. A multilayer switch may act as the distribution layer in a branch, while a router may connect that branch to the service provider. APs serve end users at the edge, but a WLC may sit centrally. Firewalls usually appear where one trust zone meets another.</p>',
              blocks: [
                {
                  type: 'table',
                  title: 'Where components usually live',
                  columns: ['Enterprise area', 'Common components', 'Why they fit there'],
                  rows: [
                    ['Access layer', 'Layer 2 switches, APs', 'Connect user devices and provide local LAN/wireless access'],
                    ['Distribution layer', 'Multilayer switches, WLCs', 'Aggregate access, enforce campus policy, provide inter-VLAN routing and centralized wireless control'],
                    ['Core/collapsed core', 'High-speed multilayer switches', 'Move traffic quickly and resiliently across the campus'],
                    ['WAN/Internet edge', 'Routers, firewalls', 'Reach providers and enforce policy toward external networks'],
                    ['Security segmentation points', 'Firewalls', 'Separate trust zones and inspect traffic between them']
                  ]
                },
                {
                  type: 'checklist',
                  title: 'When you see a design diagram, ask these questions',
                  items: [
                    'Which devices are only extending local access for users?',
                    'Where does traffic have to cross from one subnet or VLAN to another?',
                    'Where does traffic leave the site or cross into a different trust zone?',
                    'Which device is managing wireless access at scale rather than just providing one radio cell?'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'A hub is a Layer 1 repeater that creates one shared collision domain, while a Layer 2 switch forwards by MAC address and creates a separate collision domain per port.',
            'A VLAN is a Layer 2 broadcast domain; routing is required to move traffic between different VLANs or IP networks.',
            'Routers and multilayer switches both perform Layer 3 forwarding, but multilayer switches are commonly used for high-speed inter-VLAN routing inside the enterprise campus.',
            'Access points provide wireless edge connectivity, while wireless LAN controllers centralize policy and operational control for many APs.',
            'Firewalls are placed at trust boundaries to enforce permit/deny policy and stateful inspection, not just path selection.',
            'In enterprise role mapping, switches and APs usually live at the access layer, multilayer switches often serve distribution/core functions, and routers/firewalls commonly appear at WAN, Internet, and segmentation boundaries.'
          ]
        }
      }),
      topic('fundamentals', '1.6', 'WAN Fundamentals', [
        'Introduce WAN links, point-to-point framing, and HDLC behavior.',
        'Contrast LAN and WAN framing expectations in Cisco contexts.',
      ], 'comparison-viewer', 'WAN vs LAN Topology Visualizer', 'MCQ', { 
        icon: 'ROUTE', 
        simulationRouteId: 'packet-journey',
        quizBank: 'quizBanks/fundamentals/wanFundamentals',
        quizCount: 10,
        sourceMappings: {
          'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
          'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
        },
        theory: {
          sections: [
            {
              title: 'LAN vs. WAN',
              content: '<p>A <strong>Local Area Network (LAN)</strong> covers a small geographic area (like an office building) where the organization typically owns all the cabling and switching equipment. LANs act as broadcast multi-access environments via Ethernet.</p><p>A <strong>Wide Area Network (WAN)</strong> connects geographically dispersed LANs (e.g., connecting a New York office to a Tokyo office). Since laying private transatlantic cables is impossible for most companies, they lease these connections from Internet Service Providers (ISPs). WANs often rely on Point-to-Point topologies where broadcasts do not apply.</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'The geographic distinction is the starting point',
                  content: 'The core difference between LAN and WAN is ownership and scale. LANs are owned by the organization occupying the space. WANs cross public boundaries and require carrier involvement.',
                  items: [
                    'LANs typically reside in a single building or campus.',
                    'WANs span cities, countries, or continents.',
                    'LANs use Ethernet. WANs use serial protocols designed for point-to-point links.',
                    'MAC addressing matters inside a LAN but not across a point-to-point WAN link.'
                  ]
                },
                {
                  type: 'table',
                  title: 'LAN vs WAN quick reference',
                  columns: ['Characteristic', 'LAN', 'WAN'],
                  rows: [
                    ['Ownership', 'Organization-owned', 'Service provider leased'],
                    ['Geographic scope', 'Single site', 'Multiple sites / global'],
                    ['Layer 2 protocol', 'Ethernet', 'HDLC, PPP, Frame Relay'],
                    ['Addressing', 'MAC addresses relevant', 'MAC largely irrelevant'],
                    ['Broadcast behavior', 'Supported within the LAN', 'Not applicable on point-to-point']
                  ]
                },
                {
                  type: 'note',
                  variant: 'realWorld',
                  title: 'Modern WAN terminology shift',
                  content: 'The lines blur with SD-WAN. Today, branch offices often use broadband internet (a WAN link) but still run Ethernet internally and use VPN tunnels that behave like LAN segments across the WAN.'
                }
              ]
            },
            {
              title: 'Leased Lines and Serial Links',
              content: '<p>A classic WAN approach is a dedicated <strong>leased line</strong> (also called a point-to-point link or T1 line) connecting two enterprise routers via the provider\'s network. The logical topology is simple: whatever is sent out of one router\'s serial interface arrives directly at the other.</p><p>Because it is a direct pipe with exactly two endpoints, MAC addresses are functionally irrelevant. Instead of Ethernet, these links use specialized WAN Layer 2 protocols like <strong>HDLC (High-Level Data Link Control)</strong> or PPP (Point-to-Point Protocol).</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Why MAC addressing disappears on point-to-point links',
                  content: 'On a point-to-point link between exactly two devices, there is only one possible destination. There is no need for MAC addressing because there is no switching decision to make.',
                  items: [
                    'With only two endpoints, the frame does not need to be "switched" to a specific port.',
                    'The Layer 2 header can be extremely minimal—no source/destination MAC needed.',
                    'Some protocols still include addressing fields but they are fixed and constant.',
                    'This is why WAN protocols like HDLC and PPP look different from Ethernet frames.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Watch for "serial" in CCNA exam questions',
                  content: 'When you see "serial interface" on a Cisco device, think WAN, think point-to-point, and think HDLC or PPP as the encapsulation, not Ethernet.'
                }
              ]
            },
            {
              title: 'Cisco HDLC',
              content: '<p>HDLC is the default Layer 2 protocol used on Cisco serial interfaces. The standard HDLC frame contains a Flag, Address, Control, Data, and FCS. Notably, standard HDLC lacked a "Type" field to identify the encapsulated Layer 3 protocol (like IPv4 or IPv6).</p><p>Cisco implemented a proprietary version of HDLC known as <strong>cHDLC</strong> which specifically injects a 2-byte Type field. Because of this, two endpoints over a serial link must both run Cisco HDLC to communicate properly (or agree to use standard PPP instead).</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'The cHDLC Type field matters for routing',
                  items: [
                    'Without a Type field, the receiving end does not know whether the payload is IPv4, IPv6, or something else.',
                    'cHDLC embeds a Type code so the router knows which Layer 3 protocol to hand the packet to.',
                    'This is why you cannot use standard HDLC to transport IPv6 between two Cisco routers without additional configuration.',
                    'PPP handles multi-protocol support natively, which is why many operators prefer it over HDLC.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'commonMistake',
                  title: 'Do not confuse HDLC with PPP',
                  content: 'Both are WAN encapsulation types, but they are not interchangeable. PPP supports authentication, compression, and multi-protocol natively. Cisco HDLC is proprietary and more limited.'
                },
                {
                  type: 'keyTerms',
                  title: 'WAN framing terms to know',
                  terms: [
                    { term: 'Leased line', definition: 'A dedicated circuit provisioned by a carrier, billed at a fixed monthly rate regardless of actual utilization.' },
                    { term: 'Serial interface', definition: 'A router interface designed for point-to-point WAN connections, typically using HDLC or PPP encapsulation.' },
                    { term: 'cHDLC', definition: 'Cisco\'s proprietary HDLC variant that adds a 2-byte Protocol Type field to identify the encapsulated Layer 3 protocol.' }
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'LANs are geographically small, company-owned, and use Ethernet/MAC addressing.',
            'WANs span long distances, use leased provider equipment, and traditionally use serial connections without typical MAC addressing.',
            'Point-to-point links logically connect exactly two routers together over a leased line.',
            'Cisco\'s proprietary HDLC is the default encapsulation for synchronous serial lines and uniquely includes a Protocol Type field.',
            'When only two devices share a link, MAC addressing becomes unnecessary—Layer 2 framing can be minimal.'
          ]
        }
      }),
      topic('fundamentals', '1.7', 'IPv4 Addressing', [
        'Review classful addressing, dotted decimal notation, and binary conversion.',
        'Classify addresses into Classes A through E and identify default masks.',
      ], 'calculator-tool', 'IP Class Calculator', 'Binary conversion + MCQ', { 
        icon: 'TABLE', 
        simulationRouteId: 'ip-classes',
        quizBank: 'quizBanks/fundamentals/ipv4Addressing',
        quizCount: 10,
        sourceMappings: {
          'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
          'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
        },
        theory: {
          sections: [
            {
              title: 'Structure and Binary Conversion',
              content: '<p>An IPv4 address is a Layer 3 logical address 32 bits long. It is expressed in dotted-decimal notation, divided into four 8-bit pieces called <strong>octets</strong> (e.g., <code>192.168.1.1</code>). Because each octet is 8 bits, its decimal value ranges mathematically from <code>0</code> (all bits off) to <code>255</code> (all bits on).</p><p>Understanding powers of 2 is critical for conversion. The bits in an octet hold values of: 128, 64, 32, 16, 8, 4, 2, 1. If you see the IP <code>192.x.x.x</code>, to find the binary of 192, subtract 128 (yes, bit 1 is on, leaving 64); subtract 64 (yes, bit 2 is on, leaving 0). Thus, 192 in binary is <code>11000000</code>.</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'The octet boundary is your anchor',
                  content: 'IPv4 addresses are always read left-to-right across four decimal numbers. Each decimal is actually an 8-bit binary chunk.',
                  items: [
                    'The first octet contains bits 1-8, the second octet bits 9-16, and so on.',
                    'Each octet can range from 0 to 255, because 2^8 = 256 possible values.',
                    'A "/8" means the first 8 bits (first octet) are the network portion.',
                    'The boundary between network and host bits can fall inside an octet.'
                  ]
                },
                {
                  type: 'figure',
                  title: 'Binary conversion field reference',
                  src: 'assets/theory_images/page_120_img1.png',
                  alt: 'Diagram showing powers of 2 positions in an 8-bit octet.',
                  caption: 'The bit positions in an octet hold decimal values: 128, 64, 32, 16, 8, 4, 2, 1. Add them up to get the decimal value.'
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Convert without writing everything down',
                  content: 'For CCNA, practice converting between binary and decimal in your head. Start with the largest bit (128), subtract if the bit is 1, then move to 64, and so on.'
                }
              ]
            },
            {
              title: 'Classful Addressing Framework',
              content: '<p>Early networking rigidly assigned the network/host boundaries based on the value of the first octet. This is known as Classful routing:</p><ul><li><strong>Class A:</strong> First octet 1-126. Default Mask <code>255.0.0.0</code> (/8). Huge networks, very few of them.</li><li><strong>Class B:</strong> First octet 128-191. Default Mask <code>255.255.0.0</code> (/16). Medium networks.</li><li><strong>Class C:</strong> First octet 192-223. Default Mask <code>255.255.255.0</code> (/24). Small networks, many of them.</li></ul><p><em>Class D (224-239) is strictly reserved for Multicast. Class E (240-255) is experimental. 127 is reserved for loopback testing.</em></p>',
              blocks: [
                {
                  type: 'table',
                  title: 'IPv4 class quick reference',
                  columns: ['Class', 'First octet range', 'Default mask', 'Network bits', 'Host bits', 'Typical use'],
                  rows: [
                    ['A', '1 - 126', '255.0.0.0 (/8)', '8', '24', 'Very large organizations (e.g., IBM, AT&T)'],
                    ['B', '128 - 191', '255.255.0.0 (/16)', '16', '16', 'Medium enterprises'],
                    ['C', '192 - 223', '255.255.255.0 (/24)', '24', '8', 'Small businesses, subnets'],
                    ['D', '224 - 239', 'N/A', 'N/A', 'N/A', 'Multicast groups'],
                    ['E', '240 - 255', 'N/A', 'N/A', 'N/A', 'Experimental / reserved']
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'Why classful addressing broke down',
                  items: [
                    'Class A gave 16 million addresses to one organization—terrible allocation.',
                    'Class C was too small for most organizations (only 254 hosts per network).',
                    'CIDR (Classless Inter-Domain Routing) replaced classful boundaries in 1993.',
                    'The class still matters for CCNA exam questions unless CIDR is specified.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'commonMistake',
                  title: 'Do not forget 127.x.x.x',
                  content: 'The 127.0.0.0/8 range is reserved for loopback testing. It is not a regular Class A network. 127.0.0.1 is your local machine.'
                }
              ]
            },
            {
              title: 'Special Use Addresses (RFC 1918)',
              content: '<p>With only ~4.3 billion possible IPv4 addresses, the world quickly ran out. To slow exhaustion, RFC 1918 defined <strong>Private IP Ranges</strong>. Anyone can use these inside their LAN, but routers globally are configured to drop them on the public internet. They require NAT to reach the outside world. The ranges are:</p><ul><li>Class A: <code>10.0.0.0</code> to <code>10.255.255.255</code></li><li>Class B: <code>172.16.0.0</code> to <code>172.31.255.255</code></li><li>Class C: <code>192.168.0.0</code> to <code>192.168.255.255</code></li></ul><p>Other special IPs include the <strong>Loopback</strong> block (<code>127.0.0.0/8</code>, representing "self") and the <strong>Link-local/APIPA</strong> block (<code>169.254.0.0/16</code>), which a device self-assigns if DHCP fails.</p>',
              blocks: [
                {
                  type: 'table',
                  title: 'Special IPv4 ranges at a glance',
                  columns: ['Range', 'CIDR notation', 'Purpose', 'Routable on internet?'],
                  rows: [
                    ['10.0.0.0 - 10.255.255.255', '10.0.0.0/8', 'RFC 1918 private (Class A)', 'No - requires NAT'],
                    ['172.16.0.0 - 172.31.255.255', '172.16.0.0/12', 'RFC 1918 private (Class B)', 'No - requires NAT'],
                    ['192.168.0.0 - 192.168.255.255', '192.168.0.0/16', 'RFC 1918 private (Class C)', 'No - requires NAT'],
                    ['127.0.0.0 - 127.255.255.255', '127.0.0.0/8', 'Loopback / localhost', 'No - local only'],
                    ['169.254.0.0 - 169.254.255.255', '169.254.0.0/16', 'APIPA (link-local)', 'No - local subnet only'],
                    ['0.0.0.0', '0.0.0.0/32', 'This network (default route)', 'Special']
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'Why NAT matters for private addresses',
                  items: [
                    'Private addresses cannot be routed on the internet.',
                    'NAT (Network Address Translation) maps private addresses to a public IP.',
                    'Without NAT, every device in your home network would need a unique public IP.',
                    'This shortage is why IPv6 exists and why NAT is ubiquitous in enterprise.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'realWorld',
                  title: 'You use private addressing right now',
                  content: 'Your home router likely assigns addresses from 192.168.x.x to your devices. That is RFC 1918 space. The router then uses NAT to share one public IP from your ISP across all your devices.'
                },
                {
                  type: 'keyTerms',
                  title: 'IPv4 addressing vocabulary',
                  terms: [
                    { term: 'Octet', definition: 'One of four 8-bit segments in an IPv4 address, expressed as a decimal number (0-255).' },
                    { term: 'Default mask', definition: 'The natural mask associated with a classful network (Class A = /8, B = /16, C = /24).' },
                    { term: 'RFC 1918', definition: 'The request for comments that defines private IPv4 address ranges.' },
                    { term: 'NAT', definition: 'Network Address Translation—a method of mapping private addresses to a public IP for internet access.' },
                    { term: 'APIPA', definition: 'Automatic Private IP Addressing—a self-assigned address (169.254.x.x) used when DHCP fails.' }
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'IPv4 addresses are 32 bits long, represented as 4 dotted-decimal octets.',
            'Class A (1-126) defaults to /8. Class B (128-191) defaults to /16. Class C (192-223) defaults to /24.',
            'RFC 1918 Private Addressing ranges are: 10.x.x.x, 172.16.x.x–172.31.x.x, and 192.168.x.x.',
            '127.x.x.x is reserved for testing the internal stack (Loopback). 169.254.x.x is APIPA.',
            'Every device on the same network shares the same network portion; the host portion must be unique.'
          ]
        }
      }),
      topic('fundamentals', '1.8', 'IPv4 Subnetting', [
        'Apply CIDR, subnet masks, block sizes, and usable host calculations.',
        'Solve network, broadcast, host range, and VLSM-oriented subnet problems.',
      ], 'calculator-tool', 'Subnet Calculator Simulator', 'Subnetting problems (fill-in)', { 
        icon: 'SUBNET', 
        simulationRouteId: 'subnet-practice',
        quizBank: 'quizBanks/fundamentals/ipv4Subnetting',
        quizCount: 10,
        sourceMappings: {
          'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
          'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
        },
        theory: {
          sections: [
            {
              title: 'The Purpose of Subnetting',
              content: '<p>Subnetting is the process of borrowing host bits from an IP address to create smaller, distinct network blocks. By splitting a large broadcast domain into smaller ones, we increase security, reduce broadcast overhead, and conserve IP addresses. A subnet mask (e.g., <code>255.255.255.0</code>) or CIDR notation (e.g., <code>/24</code>) draws the line indicating exactly where the <em>network</em> portion ends and the <em>host</em> portion begins.</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'What subnetting actually accomplishes',
                  items: [
                    'Divides a large network into smaller, manageable pieces.',
                    'Reduces broadcast traffic by creating separate broadcast domains.',
                    'Improves security by isolating subnets from each other.',
                    'Makes IP allocation more efficient than classful allocation.',
                    'Enables hierarchical design: headquarters → branch → floor.'
                  ]
                },
                {
                  type: 'table',
                  title: 'Common CIDR prefixes and their block sizes',
                  columns: ['CIDR', 'Mask', 'Block size', 'Hosts per subnet'],
                  rows: [
                    ['/24', '255.255.255.0', '256', '254 usable'],
                    ['/25', '255.255.255.128', '128', '126 usable'],
                    ['/26', '255.255.255.192', '64', '62 usable'],
                    ['/27', '255.255.255.224', '32', '30 usable'],
                    ['/28', '255.255.255.240', '16', '14 usable'],
                    ['/29', '255.255.255.248', '8', '6 usable'],
                    ['/30', '255.255.255.252', '4', '2 usable (point-to-point)']
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'The /30 for point-to-point rule',
                  content: 'For routers connected by a point-to-point serial link, you only need 2 usable IP addresses. Using a /30 avoids wasting 252 addresses compared to a /24.'
                }
              ]
            },
            {
              title: 'The "Magic Number" Block Size Method',
              content: '<p>The easiest way to calculate subnet boundaries quickly without drawing out columns of binary is the <strong>Magic Number</strong> or block size method.</p><ol><li>Find the "interesting octet" (the octet where the mask is neither 255 nor 0). Suppose the mask is 255.255.255.192. The interesting octet is the fourth one.</li><li>Subtract the interesting mask value from 256. (e.g., <code>256 - 192 = 64</code>). Your block size/magic number is 64.</li><li>Count up from 0 by your block size to find the Network IDs: <code>.0</code>, <code>.64</code>, <code>.128</code>, <code>.192</code>.</li></ol><p>If your Network ID is <code>.64</code>, the Broadcast ID is exactly one less than the next network: <code>.127</code>. The valid hosts are everything between them: <code>.65</code> through <code>.126</code>.</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'The three rules for any subnet',
                  items: [
                    'Network ID: the first address in the block. All host bits = 0. Cannot be assigned to a host.',
                    'Broadcast ID: the last address in the block. All host bits = 1. Cannot be assigned to a host.',
                    'Usable hosts: everything between Network ID + 1 and Broadcast ID - 1.'
                  ]
                },
                {
                  type: 'figure',
                  title: 'Magic number calculation example',
                  src: 'assets/theory_images/page_130_img1.png',
                  alt: 'Diagram showing subnet calculation for 192.168.1.0/26.',
                  caption: 'With 255.255.255.192 as the mask (interesting octet = 192), the block size is 64. Networks are .0, .64, .128, .192. The usable range in the .64 network is .65 to .126.'
                },
                {
                  type: 'note',
                  variant: 'commonMistake',
                  title: 'Do not forget to subtract 2 for usable hosts',
                  content: 'Many students correctly calculate 256 - 192 = 64, but then forget that each /26 subnetwork gives you 64 total addresses, of which only 62 are usable. The Network ID and Broadcast ID are not assignable.'
                }
              ]
            },
            {
              title: 'VLSM (Variable Length Subnet Masking)',
              content: '<p>Traditional classful routing required all subnets in an infrastructure to use the identical mask (FLSM), wasting enormous numbers of IPs. <strong>VLSM</strong> is "subnetting a subnet." Modern routing protocols (OSPF, EIGRP, RIPv2) include the subnet mask in routing updates, permitting you to use a <code>/24</code> for an office LAN with 200 users, and a tight <code>/30</code> for a point-to-point link between two routers which only requires exactly two valid host IPs (eliminating waste).</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'VLSM in practice',
                  items: [
                    'Start with the largest subnet needed and work downward.',
                    'Use a larger prefix (fewer bits) for networks with many hosts.',
                    'Use a smaller prefix (more bits) for point-to-point links.',
                    'Always account for growth—give the engineering team a /26 even if they only have 40 machines today.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'realWorld',
                  title: 'You use VLSM every day without knowing it',
                  content: 'When you configure a router interface with 192.168.10.1/24 and another with 192.168.10.2/30 on the same device, you are using VLSM. The routing protocol carries both masks so devices know the exact subnet boundaries.'
                },
                {
                  type: 'keyTerms',
                  title: 'Subnetting vocabulary',
                  terms: [
                    { term: 'CIDR', definition: 'Classless Inter-Domain Routing—supernetting/subnetting without class boundaries, using /-prefix notation.' },
                    { term: 'Block size', definition: 'The result of 256 minus the interesting octet value; defines the increment between subnet boundaries.' },
                    { term: 'Network ID', definition: 'The first address in a subnet, with all host bits set to 0. Cannot be assigned to a host.' },
                    { term: 'Broadcast address', definition: 'The last address in a subnet, with all host bits set to 1. Cannot be assigned to a host.' },
                    { term: 'VLSM', definition: 'Variable Length Subnet Masking—the ability to use different subnet masks of different sizes within the same address space.' }
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Subnetting reduces broadcast domains and mathematically groups IP addresses into manageable boundaries.',
            'The Network ID has all host bits set to 0. The Broadcast ID has all host bits set to 1. Neither can be assigned to a PC.',
            'To find the block size, subtract the custom subnet mask octet from 256. Count by that number to find networks.',
            'VLSM allows the use of multiple different subnet masks within the same overall address space.',
            'Use /30 for point-to-point links, larger prefixes for LANs with many hosts.'
          ]
        }
      }),
      topic('fundamentals', '1.9', 'IPv6 Fundamentals', [
        'Explain 128-bit addressing, compression rules, and major IPv6 address families.',
        'Recognize GUA, ULA, link-local, multicast, and anycast roles.',
      ], 'calculator-tool', 'IPv6 Abbreviation Tool', 'Address type MCQ + abbreviation', { 
        icon: 'NET', 
        simulationRouteId: 'ip-classes',
        quizBank: 'quizBanks/fundamentals/ipv6Fundamentals',
        quizCount: 10,
        sourceMappings: {
          'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
          'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
        },
        theory: {
          sections: [
            {
              title: 'The Need for IPv6',
              content: '<p>With only ~4.3 billion possible IPv4 addresses, the Internet ran out of space. IPv6 expands the address space drastically to 128 bits, providing 340 undecillion possible addresses. It removes the need for NAT and eliminates network broadcasts entirely.</p><p>An IPv6 address is expressed in 8 segments (hextets) of four hexadecimal characters, separated by colons: <code>2001:0db8:0000:0000:0000:ff00:0042:8329</code>.</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Why IPv6 became necessary',
                  items: [
                    'IPv4 exhaustion: IANA handed out the last /8 blocks in 2011.',
                    'IPv6 provides practically unlimited addressing—2^128 addresses.',
                    'IPv6 removes the need for NAT by giving every device a unique global address.',
                    'IPv6 eliminates broadcast storms and simplifies network design.',
                    'IPv6 includes built-in security (IPsec) as a standard, not an add-on.'
                  ]
                },
                {
                  type: 'figure',
                  title: 'IPv6 hextet structure',
                  src: 'assets/theory_images/page_150_img1.png',
                  alt: 'Diagram showing 8 hextets of an IPv6 address.',
                  caption: 'Each hextet is 16 bits (4 hex characters). The full address is 128 bits.'
                },
                {
                  type: 'note',
                  variant: 'realWorld',
                  title: 'You are already using IPv6',
                  content: 'Many home ISPs now assign IPv6 addresses to your router. When you visit websites that support IPv6, your traffic often goes over IPv6 without you noticing.'
                }
              ]
            },
            {
              title: 'Abbreviation Rules',
              content: '<p>IPv6 addresses can be visually intimidating, but two strict rules exist to compress them:</p><ol><li><strong>Omit Leading Zeros:</strong> Within any hextet, you can remove leading zeroes. <code>0db8</code> becomes <code>db8</code>. <code>0042</code> becomes <code>42</code>. <code>0000</code> becomes exactly one <code>0</code>.</li><li><strong>The Double Colon:</strong> Once (and ONLY once) per address, you can replace a contiguous block of purely zero hextets with a double colon <code>::</code>.</li></ol><p>Applying these rules, <code>2001:0db8:0000:0000:0000:ff00:0042:8329</code> compresses to <code>2001:db8::ff00:42:8329</code>.</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Double colon rules to remember',
                  items: [
                    'Only ONE double colon per address. You cannot abbreviate two separate zero blocks.',
                    'If your address has only one zero block, use the double colon there.',
                    'If your address has two zero blocks but equal in size, abbreviate the larger one.',
                    'When in doubt, expand fully to avoid ambiguity.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Calculate the full hextets from a compressed address',
                  content: 'If you see ::1, that means 7 hextets of 0 followed by :0001. If you see fe80::1, that means fe80:0000:0000:0000:0000:0000:0001.'
                }
              ]
            },
            {
              title: 'IPv6 Address Types',
              content: '<p>IPv6 does not use broadcasts. It relies exclusively on Unicast, Multicast, and Anycast:</p><ul><li><strong>Global Unicast (GUA):</strong> The IPv6 equivalent of public IPv4 addresses. Globally routable across the internet. Currently assigned from the <code>2000::/3</code> range.</li><li><strong>Unique Local (ULA):</strong> The IPv6 equivalent of RFC 1918 private addresses. Used inside an organization but not routable on the public internet. They begin with <code>fd</code> (technically <code>fc00::/7</code>).</li><li><strong>Link-Local:</strong> Every IPv6 interface must automatically generate a Link-Local address to communicate on its immediate subnet (e.g., for routing protocols). These addresses always begin with <code>fe80::/10</code>.</li><li><strong>Multicast:</strong> Replaces broadcasts. Always begins with <code>ff00::/8</code>.</li></ul>',
              blocks: [
                {
                  type: 'table',
                  title: 'IPv6 address type quick reference',
                  columns: ['Type', 'Prefix', 'Scope', 'CCNA role'],
                  rows: [
                    ['Global Unicast', '2000::/3', 'Internet-wide', 'Public addressing'],
                    ['Unique Local', 'fc00::/7', 'Organization-only', 'Private addressing'],
                    ['Link-Local', 'fe80::/10', 'Single subnet', 'Router discovery, ND'],
                    ['Multicast', 'ff00::/8', 'Varies', 'Group communication'],
                    ['Loopback', '::1', 'Local only', 'IPv6 localhost']
                  ]
                },
                {
                  type: 'note',
                  variant: 'commonMistake',
                  title: 'Do not confuse /64 with /128',
                  content: 'A /64 is a typical LAN subnet (network prefix). A /128 is a single interface address (like 127.0.0.1 in IPv4).'
                }
              ]
            }
          ],
          keyTakeaways: [
            'IPv6 addresses are 128 bits long, written as 8 hextets in hexadecimal.',
            'Double colons (::) can replace consecutive blocks of zeroes, but can only be used once per address.',
            'Global Unicast (GUA) addresses start with 2 or 3 (2000::/3).',
            'Link-local addresses start with fe80::/10 and are strictly confined to a single subnet.',
            'IPv6 completely abandons the concept of network-wide broadcasts, relying heavily on Multicast (ff00::/8).'
          ]
        }
      }),
      topic('fundamentals', '1.10', 'IPv6 Addressing & EUI-64', [
        'Build an interface identifier from a MAC address using EUI-64.',
        'Relate SLAAC, DHCPv6, and static addressing to host configuration choices.',
      ], 'calculator-tool', 'EUI-64 Generator', 'Step-calculation + MCQ', { 
        icon: 'AUTO', 
        simulationRouteId: 'ip-classes',
        quizBank: 'quizBanks/fundamentals/ipv6AddressingEui64',
        quizCount: 10,
        sourceMappings: {
          'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
          'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
        },
        theory: {
          sections: [
            {
              title: 'IPv6 Address Configuration',
              content: '<p>Unlike IPv4 which relies heavily on manual configuration or DHCP, IPv6 was designed for massive-scale stateless auto-configuration. While an administrator can statically configure an address, an IPv6 host typically builds its own 128-bit address autonomously using a 64-bit Network Prefix provided by a router, and generating its own 64-bit Interface ID (host portion).</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'The 64/64 split you must know',
                  items: [
                    'A typical IPv6 address is exactly half network prefix (first 64 bits) and half interface ID (last 64 bits).',
                    'The /64 is the standard subnet size in IPv6—no smaller subnets are needed, even for point-to-point links.',
                    'Routers advertise /64 prefixes via Router Advertisements (RAs).',
                    'Every interface gets a Link-Local address automatically, plus potentially a GUA or ULA.'
                  ]
                },
                {
                  type: 'figure',
                  title: 'IPv6 address composition',
                  src: 'assets/theory_images/page_155_img1.png',
                  alt: 'Diagram showing network prefix and interface ID split.',
                  caption: 'The left half (network prefix) comes from the router. The right half (interface ID) is generated by the host.'
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'CCNA expects you to calculate prefix + interface ID',
                  content: 'If given prefix 2001:db8::/64 and interface ID ::1:2:3:4, the full address is 2001:db8::1:2:3:4.'
                }
              ]
            },
            {
              title: 'Modified EUI-64 Algorithm',
              content: '<p>One way an IPv6 interface guarantees a globally unique 64-bit Interface ID is by generating it mathematically from its own 48-bit burned-in MAC address using the <strong>EUI-64</strong> process:</p><ol><li>Split the 48-bit MAC address directly in half. (e.g. <code>001A.2B</code> and <code>3C.4D5E</code>)</li><li>Insert exactly 16 bits of padding—specifically <code>FFFE</code>—into the middle. (Result: <code>001A.2BFF.FE3C.4D5E</code>).</li><li>Invert (flip) the 7th bit in the first byte. The hex digit <code>00</code> (which is 00000000 in binary) flips its 7th bit to 00000010, which is <code>02</code>. </li></ol><p>Final EUI-64 Interface ID: <code>021a:2bff:fe3c:4d5e</code>. This is appended to the /64 network prefix to form the full IPv6 address.</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Why the 7th bit flip?',
                  items: [
                    'The flipped bit indicates whether the address is derived from a globally unique MAC (U bit = 1) or a locally administered one (U bit = 0).',
                    'Flipping it to 1 signals that this interface ID is globally unique.',
                    'This mechanism was designed to prevent address conflicts when multiple vendors generate IDs.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'commonMistake',
                  title: 'Remember to insert FFFE, not FFFF',
                  content: 'The middle 16 bits are always FFFE—that is the EUI-64 padding pattern. The 7th bit flip happens separately.'
                }
              ]
            },
            {
              title: 'SLAAC vs. DHCPv6',
              content: '<p>When a host boots up, it sends an ICMPv6 <strong>Router Solicitation (RS)</strong>. The local router replies with a <strong>Router Advertisement (RA)</strong> containing the /64 network prefix.</p><ul><li><strong>SLAAC (Stateless Address Auto-Configuration):</strong> The host uses the RA prefix and combines it with its own generated EUI-64 (or randomized) Interface ID. The router keeps no state or record of the IPs.</li><li><strong>Stateless DHCPv6:</strong> The host uses SLAAC for its IP, but queries a DHCPv6 server purely for "other" information (like the DNS server IP).</li><li><strong>Stateful DHCPv6:</strong> Operates like classic IPv4 DHCP. The router basically says "I don\'t hand out prefixes here, go ask the DHCPv6 server for an IP." The server tracks leases centrally.</li></ul>',
              blocks: [
                {
                  type: 'table',
                  title: 'IPv6 address assignment methods',
                  columns: ['Method', 'Who assigns IP?', 'Who tracks assignments?', 'DNS info from?'],
                  rows: [
                    ['SLAAC', 'Host (from RA prefix)', 'Nobody (stateless)', 'Router Advertisement'],
                    ['Stateless DHCPv6', 'Host (from RA prefix)', 'Nobody', 'DHCPv6 server'],
                    ['Stateful DHCPv6', 'DHCPv6 server', 'DHCPv6 server', 'DHCPv6 server']
                  ]
                },
                {
                  type: 'note',
                  variant: 'realWorld',
                  title: 'Modern Windows and macOS use random interface IDs',
                  content: 'Contemporary OSes often use privacy extensions (randomized) instead of EUI-64 for GUAs. This changes over time to improve privacy.'
                },
                {
                  type: 'keyTerms',
                  title: 'IPv6 configuration vocabulary',
                  terms: [
                    { term: 'Interface ID', definition: 'The last 64 bits of an IPv6 address, identifying a specific device on a network.' },
                    { term: 'EUI-64', definition: 'Extended Unique Identifier—a method of deriving a 64-bit interface ID from a 48-bit MAC address.' },
                    { term: 'SLAAC', definition: 'Stateless Address Auto-Configuration—the method where hosts build their own IPv6 address from a router-advertised prefix.' },
                    { term: 'Router Solicitation (RS)', definition: 'An ICMPv6 message sent by a host asking for router advertisements.' },
                    { term: 'Router Advertisement (RA)', definition: 'A router message containing network prefix and other configuration information.' }
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'A typical IPv6 address is evenly split into a 64-bit Network Prefix and a 64-bit Interface ID.',
            'EUI-64 mathematically generates a 64-bit host ID using the 48-bit MAC, injecting FFFE in the center, and flipping the 7th bit.',
            'SLAAC allows IPv6 hosts to autonomously generate their own globally routable IP addresses without needing a DHCP server.',
            'Router Solicitation (RS) and Router Advertisement (RA) messages via ICMPv6 are the backbone of SLAAC auto-configuration.',
            'DHCPv6 can be stateless (only DNS info) or stateful (full IP assignment).'
          ]
        }
      }),
      topic('fundamentals', '1.11', 'TCP vs UDP', [
        'Compare connection-oriented TCP with connectionless UDP.',
        'Walk through the three-way handshake, teardown, ports, and reliability tradeoffs.',
      ], 'packet-animator', 'TCP Handshake Animator', 'Sequence ordering + MCQ', { 
        icon: 'PKT', 
        simulationRouteId: 'packet-journey',
        quizBank: 'quizBanks/fundamentals/tcpVsUdp',
        quizCount: 10,
        sourceMappings: {
          'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
          'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
        },
        theory: {
          sections: [
            {
              title: 'Transmission Control Protocol (TCP)',
              content: '<p>TCP is a <strong>connection-oriented</strong> Layer 4 protocol designed for guaranteed, reliable packet delivery. It provides error recovery via acknowledgments, flow control via windowing, and sequencing to ensure packets are reassembled in the correct order. Because of this overhead, TCP headers are 20 bytes long.</p><p>A TCP session begins with the <strong>Three-Way Handshake</strong> to establish the connection before any data is sent:</p><ol><li><strong>SYN:</strong> Host A sends a Synchronize packet to Host B.</li><li><strong>SYN-ACK:</strong> Host B responds acknowledging Host A, and synchronizing its own sequence.</li><li><strong>ACK:</strong> Host A acknowledges Host B. The connection is established.</li></ol><p>TCP guarantees delivery. If an ACK is not received, the packet is retransmitted. Example TCP protocols: HTTP, HTTPS, SSH, FTP.</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Why TCP matters for reliability',
                  items: [
                    'TCP ensures every packet is acknowledged (ACK).',
                    'If a packet is lost, TCP automatically retransmits it.',
                    'Packets are numbered (sequenced) so they can be reassembled in the correct order.',
                    'Flow control (sliding window) prevents the sender from overwhelming the receiver.'
                  ]
                },
                {
                  type: 'figure',
                  title: 'Three-way handshake visualization',
                  src: 'assets/theory_images/page_170_img1.png',
                  alt: 'Diagram showing SYN, SYN-ACK, ACK exchange.',
                  caption: 'The three-way handshake establishes a bidirectional logical connection before data flows.'
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Handshake appears on the CCNA',
                  content: 'You may see questions asking which messages are exchanged (SYN → SYN-ACK → ACK), what the sequence numbers represent, or what state each host is in after each message.'
                }
              ]
            },
            {
              title: 'User Datagram Protocol (UDP)',
              content: '<p>UDP is a <strong>connectionless</strong> "best effort" protocol. It features zero overhead, no handshake, no sequencing, and no acknowledgments. It simply takes data from Layer 5 and blasts it at the destination IP. UDP headers are highly stripped down at only 8 bytes.</p><p>Because there is no guaranteed delivery or retransmission, UDP is much faster and more efficient than TCP. It is used for real-time traffic where a slightly dropped packet is acceptable, but waiting for a retransmission would ruin the experience (e.g., VoIP calls or live video streaming) as well as quick query/response protocols (DNS, DHCP).</p>',
              blocks: [
                {
                  type: 'table',
                  title: 'TCP vs UDP quick comparison',
                  columns: ['Characteristic', 'TCP', 'UDP'],
                  rows: [
                    ['Connection', 'Connection-oriented', 'Connectionless'],
                    ['Header size', '20 bytes', '8 bytes'],
                    ['Reliability', 'Guaranteed delivery', 'Best effort'],
                    ['Ordering', 'Sequenced', 'No ordering'],
                    ['Flow control', 'Yes (sliding window)', 'None'],
                    ['Speed', 'Slower (overhead)', 'Faster (minimal overhead)'],
                    ['Typical use', 'HTTP, SSH, FTP', 'DNS, DHCP, VoIP']
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'Why UDP survives despite no reliability',
                  items: [
                    'Real-time applications cannot wait for retransmission—a dropped packet should just be skipped.',
                    'The overhead of reliability would add latency that ruins voice/video quality.',
                    'DNS queries are small, self-contained, and can be retried manually if lost.',
                    'Simpler protocols mean faster implementation and less code to exploit.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'commonMistake',
                  title: 'Do not say "UDP has no header"',
                  content: 'UDP has an 8-byte header (source port, destination port, length, checksum). It is just much smaller than TCP\'s 20-byte header.'
                }
              ]
            },
            {
              title: 'Port Multiplexing',
              content: '<p>Both TCP and UDP use ports to enable <strong>multiplexing</strong>: the ability for a single device to run multiple network applications simultaneously.</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'How multiplexing works',
                  items: [
                    'An IP address gets a packet to the correct device (host).',
                    'A port number gets the packet to the correct application on that host.',
                    'A single client can have multiple concurrent connections (different source ports).',
                    'A server can listen on multiple ports simultaneously (e.g., 80 for HTTP, 443 for HTTPS).'
                  ]
                },
                {
                  type: 'keyTerms',
                  title: 'Transport layer vocabulary',
                  terms: [
                    { term: 'Socket', definition: 'The combination of an IP address and a port number (e.g., 192.168.1.10:443).' },
                    { term: 'Multiplexing', definition: 'The ability to multiple distinct conversations on a single network using ports.' },
                    { term: 'Three-way handshake', definition: 'The SYN → SYN-ACK → ACK exchange that establishes a TCP connection.' },
                    { term: 'Windowing', definition: 'A TCP flow control mechanism that determines how many unacknowledged packets can be outstanding.' }
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'TCP is reliable, stateful, performs error recovery, and requires a 3-way handshake to establish a connection.',
            'UDP is unreliable, stateless, features no error recovery, and sends data immediately without a handshake.',
            'TCP is used for file transfers and web browsing (HTTP, FTP, SSH).',
            'UDP is used for real-time voice/video, DNS queries, and TFTP.',
            'Multiplexing allows a single host to maintain multiple simultaneous connections (e.g., browsing the web while downloading a file) using unique Source Ports.'
          ]
        }
      }),
      topic('fundamentals', '1.12', 'IP Ports & Applications', [
        'Associate well-known ports with common protocols and transport choices.',
        'Use service-to-port matching to reinforce exam recall and troubleshooting.',
      ], 'diagram-builder', 'Port Matching Game', 'Matching drag-drop', { 
        icon: 'PORTS', 
        simulationRouteId: 'packet-journey',
        quizBank: 'quizBanks/fundamentals/ipPortsApplications',
        quizCount: 10,
        sourceMappings: {
          'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
          'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
        },
        theory: {
          sections: [
            {
              title: 'The Purpose of Ports',
              content: '<p>While an IP address gets a packet to the correct <em>computer</em>, the Layer 4 Port gets the packet to the correct <em>application</em> running on that computer. The port number combined with the IP address forms a <strong>Socket</strong>. Ports range from 0 to 65535.</p><ul><li><strong>Well-Known Ports (0-1023):</strong> Strict, standardized ports reserved for common system services (e.g., a web server always listens on 80 and 443).</li><li><strong>Ephemeral/Dynamic Ports (49152-65535):</strong> Random, temporary source ports automatically chosen by a client OS when initiating an outbound connection.</li></ul>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Why ports matter in networking',
                  items: [
                    'Without ports, a single IP could only run one network application.',
                    'A web server typically listens on port 80 (HTTP) and 443 (HTTPS).',
                    'A client chooses a random ephemeral port for its side of the connection.',
                    'Firewalls filter based on port numbers to permit or block specific services.'
                  ]
                },
                {
                  type: 'figure',
                  title: 'Socket concept diagram',
                  src: 'assets/theory_images/page_175_img1.png',
                  alt: 'Diagram showing IP + port = socket concept.',
                  caption: '192.168.1.10:8080 represents a specific application on a specific device.'
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Memorize the well-known port range',
                  content: 'The range 0-1023 is reserved for well-known ports. These are the ones most likely to appear on the CCNA exam.'
                }
              ]
            },
            {
              title: 'Essential CCNA TCP Ports',
              content: '<ul><li><strong>FTP:</strong> 20 (Data) and 21 (Control)</li><li><strong>SSH:</strong> 22 (Secure CLI access)</li><li><strong>Telnet:</strong> 23 (Insecure, unencrypted CLI access)</li><li><strong>SMTP:</strong> 25 (Sending email)</li><li><strong>HTTP / HTTPS:</strong> 80 / 443 (Web browsing)</li></ul>',
              blocks: [
                {
                  type: 'table',
                  title: 'Key TCP ports for CCNA',
                  columns: ['Port', 'Protocol', 'Use case', 'Security note'],
                  rows: [
                    ['20/21', 'FTP', 'File transfer', 'Old protocol; SFTP is preferred.'],
                    ['22', 'SSH', 'Secure remote access', 'Encrypted—use this, not Telnet.'],
                    ['23', 'Telnet', 'Remote access (legacy)', 'Sends everything in cleartext—never use.'],
                    ['25', 'SMTP', 'Email sending', 'Email relay between servers.'],
                    ['80', 'HTTP', 'Web traffic (unencrypted)', 'Unencrypted—use HTTPS in production.'],
                    ['443', 'HTTPS', 'Web traffic (encrypted)', 'TLS/SSL encrypted web access.']
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'Why SSH replaced Telnet',
                  items: [
                    'Telnet sends username, password, and all commands in plain text.',
                    'Anyone on the same network can capture the traffic and read credentials.',
                    'SSH encrypts the entire session, including authentication.',
                    'For CCNA, know both: SSH for secure access, Telnet only for legacy/learning.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'realWorld',
                  title: 'FTP is still around, but barely',
                  content: 'FTP is a legacy protocol that uses two channels (control and data). Modern file transfer uses SFTP (SSH-based) or cloud storage.'
                }
              ]
            },
            {
              title: 'Essential CCNA UDP Ports',
              content: '<ul><li><strong>DNS:</strong> 53 (Resolves names to IPs. Usually UDP, but TCP for zone transfers).</li><li><strong>DHCP:</strong> 67 (Server) and 68 (Client)</li><li><strong>TFTP:</strong> 69 (Trivial FTP, often used in Cisco router configs)</li><li><strong>NTP:</strong> 123 (Network Time Protocol)</li><li><strong>SNMP:</strong> 161 (Simple Network Management Protocol)</li></ul>',
              blocks: [
                {
                  type: 'table',
                  title: 'Key UDP ports for CCNA',
                  columns: ['Port', 'Protocol', 'Use case'],
                  rows: [
                    ['53', 'DNS', 'Name resolution'],
                    ['67/68', 'DHCP', 'Automatic IP assignment'],
                    ['69', 'TFTP', 'Simple file transfer (no auth)'],
                    ['123', 'NTP', 'Time synchronization'],
                    ['161', 'SNMP', 'Network monitoring']
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'DHCP as a practical example',
                  items: [
                    'When you connect to WiFi, your laptop broadcasts from source port 68 to destination port 67.',
                    'The DHCP server responds with an IP address (and other settings like gateway/DNS).',
                    'The process is DORA: Discover, Offer, Request, Acknowledge.',
                    'If DHCP fails, the OS self-assigns an APIPA address (169.254.x.x).'
                  ]
                },
                {
                  type: 'note',
                  variant: 'commonMistake',
                  title: 'DNS uses TCP for large responses',
                  content: 'Most DNS queries use UDP for speed. However, if a response exceeds 512 bytes (or for zone transfers), DNS uses TCP.'
                }
              ]
            },
            {
              title: 'Port Ranges Summary',
              content: '<p>Understanding port ranges helps you reason about network traffic and firewall rules.</p>',
              blocks: [
                {
                  type: 'keyTerms',
                  title: 'Port range definitions',
                  terms: [
                    { term: 'Well-known (0-1023)', definition: 'Assigned by IANA; reserved for system services like HTTP, SSH, DHCP.' },
                    { term: 'Registered (1024-49151)', definition: 'Assigned by IANA for specific applications; can be used by user processes.' },
                    { term: 'Dynamic/Ephemeral (49152-65535)', definition: 'Automatically assigned by the OS to client applications for outgoing connections.' },
                    { term: 'Socket', definition: 'The combination of IP address + port number (e.g., 192.168.1.1:443).' }
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Port numbers distinguish which application process should receive an incoming network packet.',
            'Servers listen on Well-Known destination ports (0-1023). Clients generate Ephemeral source ports.',
            'SSH (22) encrypts data and credentials. Telnet (23) sends everything in cleartext and should be disabled in modern networks.',
            'DNS (53) and DHCP (67/68) both utilize connectionless UDP for rapid service querying.',
            'A socket uniquely identifies a specific application on a specific device (IP + port).'
          ]
        }
      }),
      topic('fundamentals', '1.13', 'Virtualization Fundamentals', [
        'Compare Type 1 and Type 2 hypervisors, VMs, containers, and virtual switching.',
        'Relate vNICs, vSwitches, Docker, and VRFs to modern infrastructure abstractions.',
      ], 'comparison-viewer', 'Hypervisor Architecture Diagram', 'MCQ + diagram', { 
        icon: 'AUTO', 
        simulationRouteId: 'packet-journey',
        quizBank: 'quizBanks/fundamentals/virtualizationFundamentals',
        quizCount: 10,
        sourceMappings: {
          'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
          'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
        },
        theory: {
          sections: [
            {
              title: 'Server Virtualization',
              content: '<p>Traditionally, one physical server ran one Operating System (OS) and one application, wasting massive amounts of CPU/RAM. <strong>Virtualization</strong> abstracts the physical hardware, allowing a single physical server to run multiple independent Virtual Machines (VMs) simultaneously.</p><p>This abstraction is managed by a <strong>Hypervisor</strong>. VMs have their own virtual CPUs (vCPUs), virtual RAM, and Virtual NICs (vNICs).</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Why virtualization changed everything',
                  items: [
                    'Before virtualization, a server with 64 cores might run one app using only 4 cores—wasting 60.',
                    'Virtualization lets you carve that server into 16 VMs, each running a different app with its own OS.',
                    'This dramatically improves hardware utilization and simplifies management.',
                    'VMs can be moved, cloned, and snapshot-created without affecting the physical hardware.'
                  ]
                },
                {
                  type: 'figure',
                  title: 'Virtualization architecture',
                  src: 'assets/theory_images/page_185_img1.png',
                  alt: 'Diagram showing hypervisor layer between hardware and VMs.',
                  caption: 'The hypervisor sits between the physical hardware and the virtual machines.'
                }
              ]
            },
            {
              title: 'Type 1 vs. Type 2 Hypervisors',
              content: '<ul><li><strong>Type 1 (Bare Metal):</strong> The hypervisor is installed directly onto the physical hardware (no underlying OS). This offers maximum performance and scalability for enterprise data centers (e.g., VMware ESXi, Microsoft Hyper-V).</li><li><strong>Type 2 (Hosted):</strong> The hypervisor is installed as an application on top of a normal OS (like Windows or macOS). Useful for personal testing, but not production servers (e.g., VirtualBox, VMware Workstation).</li></ul>',
              blocks: [
                {
                  type: 'table',
                  title: 'Hypervisor comparison',
                  columns: ['Type', 'Installation target', 'Performance', 'Use case'],
                  rows: [
                    ['Type 1 (Bare Metal)', 'Directly on hardware', 'Highest', 'Production data centers'],
                    ['Type 2 (Hosted)', 'Inside a host OS', 'Lower (overhead)', 'Lab/testing, developer workstations']
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'What matters in production',
                  items: [
                    'Production servers use Type 1 hypervisors because there is no host OS adding latency.',
                    'VMware vSphere/ESXi and Microsoft Hyper-V dominate enterprise data centers.',
                    'Type 2 is excellent for learning, labs, and quick testing, but not for CCNA production scenarios.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Know the hypervisor type for exam questions',
                  content: 'If the scenario describes a data center or enterprise network, think Type 1 (bare metal). If it describes a personal computer running VirtualBox, think Type 2.'
                }
              ]
            },
            {
              title: 'Virtual Switching and VRF',
              content: '<p>VMs running on the same host connect to a <strong>Virtual Switch (vSwitch)</strong> managed by the hypervisor. This vSwitch performs normal Layer 2 MAC switching, connecting VMs directly or bridging them to the physical NIC to reach the outside network.</p><p><strong>Containers (e.g., Docker)</strong> take virtualization to the next level. Instead of virtualizing the entire hardware and booting multiple heavy OS environments, containers just virtualize the OS kernel. This allows dozens of isolated applications to run extremely fast on a single OS.</p>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'vSwitch vs physical switch',
                  items: [
                    'A vSwitch operates exactly like a physical Layer 2 switch but in software.',
                    'It maintains a MAC address table and performs frame forwarding.',
                    'vSwitches can connect VMs to each other locally or to the outside world via a trunk to the physical network.',
                    'Distributed vSwitches (like VMware dvSwitch) span multiple hosts for consistent networking across clusters.'
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'VRF explained simply',
                  items: [
                    'VRF (Virtual Routing and Forwarding) creates multiple isolated routing tables on a single physical router.',
                    'Each VRF is like its own virtual router—complete with its own interfaces and routing process.',
                    'Service providers use VRFs to keep different customers completely separated on the same hardware.',
                    'In enterprise, VRFs separate different departments or security zones.'
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'VMs vs Containers',
                  items: [
                    'A VM includes an entire OS—tens of gigabytes. A container is just the application and its dependencies—megabytes.',
                    'Starting a VM takes minutes. Starting a container takes seconds.',
                    'Containers share the host OS kernel, so they cannot run a different OS than the host (no Windows container on Linux).',
                    'VMs provide stronger isolation. Containers provide faster deployment and better density.'
                  ]
                },
                {
                  type: 'keyTerms',
                  title: 'Virtualization vocabulary',
                  terms: [
                    { term: 'Hypervisor', definition: 'Software that creates and runs VMs; either Type 1 (bare metal) or Type 2 (hosted).' },
                    { term: 'vNIC', definition: 'Virtual Network Interface Card—a virtualized network adapter presented to a VM.' },
                    { term: 'vSwitch', definition: 'Virtual Switch—software-based Layer 2 switching within the hypervisor.' },
                    { term: 'VRF', definition: 'Virtual Routing and Forwarding—a technology that creates multiple isolated routing instances on one physical router.' }
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Virtualization converts physical compute resources into isolated logical components (VMs).',
            'Type 1 (Bare-Metal) hypervisors run directly on hardware. Type 2 (Hosted) run on top of a host OS.',
            'A Virtual Switch (vSwitch) provides L2 switching logic purely in software within the hypervisor.',
            'Virtual Routing and Forwarding (VRF) virtualizes the routing table of a physical router, allowing multiple isolated routing instances on one box.',
            'Containers share the host OS kernel and are much lighter, faster, and more portable than full VMs.'
          ]
        }
      }),
      topic('fundamentals', '1.14', 'Cloud Computing', [
        'Explain the NIST five characteristics of cloud computing.',
        'Differentiate IaaS, PaaS, SaaS and public, private, community, and hybrid deployment models.',
      ], 'comparison-viewer', 'Cloud Service Model Sorter', 'MCQ + sorting', { 
        icon: 'TABLE', 
        simulationRouteId: 'packet-journey',
        quizBank: 'quizBanks/fundamentals/cloudComputing',
        quizCount: 10,
        sourceMappings: {
          'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
          'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
        },
        theory: {
          sections: [
            {
              title: 'The Five NIST Characteristics',
              content: '<p>The National Institute of Standards and Technology (NIST) strictly defines Cloud Computing as having five essential traits:</p><ol><li><strong>On-demand self-service:</strong> Users can provision compute capabilities automatically without human interaction with the provider.</li><li><strong>Broad network access:</strong> Services are available over the network and accessed through standard mechanisms (web browsers/APIs).</li><li><strong>Resource pooling:</strong> The provider\'s resources are pooled to serve multiple consumers simultaneously using a multi-tenant model.</li><li><strong>Rapid elasticity:</strong> Capabilities can be elastically provisioned and released, often automatically, to scale rapidly outward and inward commensurate with demand.</li><li><strong>Measured service:</strong> Resource usage is monitored, controlled, and reported automatically ("pay only for what you use").</li></ol>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Why these five define "real" cloud',
                  items: [
                    'A service is not truly "cloud" unless it has all five characteristics.',
                    'On-demand self-service is what distinguishes cloud from traditional hosting.',
                    'Resource pooling is how providers achieve economies of scale across many customers.',
                    'Elasticity is what makes cloud cost-effective—you scale up when needed, scale down when you do not.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Memorize the five characteristics',
                  content: 'The five NIST characteristics appear frequently on the CCNA. Be ready to identify which of five given traits are part of the definition.'
                }
              ]
            },
            {
              title: 'Cloud Service Models',
              content: '<p>Cloud offerings abstract away different levels of IT overhead:</p><ul><li><strong>Infrastructure as a Service (IaaS):</strong> The provider manages the hardware, networking, and hypervisor. You manage the OS, runtime, and application (e.g., AWS EC2, Azure VMs).</li><li><strong>Platform as a Service (PaaS):</strong> The provider handles the OS and runtime environment. You just deploy your application code (e.g., AWS Elastic Beanstalk, Heroku).</li><li><strong>Software as a Service (SaaS):</strong> The provider manages absolutely everything. You just consume the software via a browser (e.g., Office 365, Salesforce).</li></ul>',
              blocks: [
                {
                  type: 'table',
                  title: 'Service model responsibility matrix',
                  columns: ['What you manage', 'IaaS', 'PaaS', 'SaaS'],
                  rows: [
                    ['Physical infrastructure', 'Provider', 'Provider', 'Provider'],
                    ['Hypervisor/OS', 'Provider', 'Provider', 'Provider'],
                    ['Runtime/Container', 'You', 'Provider', 'Provider'],
                    ['Application', 'You', 'You', 'Provider'],
                    ['Data', 'You', 'You', 'You']
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'Who manages what in each model',
                  items: [
                    'IaaS gives you a virtual machine. You patch the OS, configure security, and deploy your software.',
                    'PaaS gives you a running platform (e.g., a Node.js environment). You just push your code.',
                    'SaaS gives you a finished application. You just log in and use it.'
                  ]
                },
                {
                  type: 'figure',
                  title: 'Service model stack',
                  src: 'assets/theory_images/page_195_img1.png',
                  alt: 'Diagram showing IaaS, PaaS, SaaS stack layers.',
                  caption: 'As you move from IaaS to SaaS, the provider takes on more management responsibility.'
                }
              ]
            },
            {
              title: 'Deployment Models',
              content: '<p>Where the cloud lives matters for security and budget:</p><ul><li><strong>Public Cloud:</strong> Infrastructure is owned by a monolithic provider targeting the general public (AWS, GCP).</li><li><strong>Private Cloud:</strong> Cloud infrastructure provisioned for exclusive use by a single organization. It can be physically located in the company\'s on-premise data center.</li><li><strong>Hybrid Cloud:</strong> A composition of two or more distinct cloud infrastructures (private AND public) bound together, highly useful for "cloud bursting" when local loads get too high.</li></ul>',
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'When to use each model',
                  items: [
                    'Public Cloud: Fast deployment, elastic scale, OpEx model—use for dev/test, burst capacity, or new projects.',
                    'Private Cloud: Strict security/compliance requirements, regulatory control, or existing infrastructure investment.',
                    'Hybrid: Keep sensitive data on-prem while using public cloud for general workloads—common in enterprise.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'realWorld',
                  title: 'Most enterprises are hybrid',
                  content: 'Few organizations go fully public cloud. Most keep sensitive systems on private infrastructure and use public cloud for general compute, burst capacity, or specific services.'
                },
                {
                  type: 'keyTerms',
                  title: 'Cloud vocabulary',
                  terms: [
                    { term: 'NIST', definition: 'National Institute of Standards and Technology—a US agency that defines cloud computing standards.' },
                    { term: 'Multi-tenant', definition: 'A model where multiple customers share the same physical infrastructure while remaining logically isolated.' },
                    { term: 'Elasticity', definition: 'The ability to automatically scale resources up or down based on demand.' },
                    { term: 'Cloud bursting', definition: 'Using public cloud resources to handle overflow traffic from a private cloud or data center.' }
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'True Cloud Computing must feature rapid elasticity, measured service, resource pooling, broad access, and on-demand self-service.',
            'IaaS hands you a bare virtual machine. PaaS hands you a coding runtime. SaaS hands you a finished application.',
            'Private clouds offer total security and control but lack the rapid scalability (elasticity) provided by massive Public clouds.',
            'Hybrid clouds blend Private and Public models.',
            'Multi-tenancy allows providers to serve many customers from shared infrastructure while maintaining isolation.'
          ]
        }
      }),
    ],
  }),
  domain({
    id: 'network-access',
    examDomain: 2,
    title: 'Network Access',
    shortTitle: 'Network Access',
    icon: 'SW',
    color: '#ffb800',
    difficulty: 'intermediate',
    examWeight: 20,
    estimatedHours: 10,
    learningGoal: 'Configure and verify switched LAN infrastructure, wireless architectures, and Layer 2 protocols.',
    prerequisites: ['fundamentals'],
    topicGroups: [
      { id: 'access-switching', title: 'Switch Operation & CLI', topicCodes: ['2.1', '2.2', '2.3'] },
      { id: 'access-vlans', title: 'VLANs, Trunking & Voice', topicCodes: ['2.4', '2.5', '2.6', '2.7'] },
      { id: 'access-l2-control', title: 'STP, RSTP & EtherChannel', topicCodes: ['2.8', '2.9', '2.10', '2.11'] },
      { id: 'access-wireless', title: 'Wireless Fundamentals, Architecture & Security', topicCodes: ['2.12', '2.13', '2.14', '2.15'] },
    ],
    finalExam: { questionCount: 35, passingScore: 80, quizType: 'mcq-config-diagram', bank: 'quizBanks/networkAccess/domain2FinalExam' },
    topics: [
      topic('network-access', '2.1', 'Switch Operation & MAC Table', [
        'Explain MAC learning, aging, flooding, forwarding, and filtering decisions.',
        'Trace how unknown unicast, broadcast, and learned entries affect switch behavior.',
      ], 'decision-simulator', 'MAC Table Simulator', 'MCQ + scenario', { icon: 'SW', simulationRouteId: 'mac-table', quizBank: 'quizBanks/networkAccess/switchOperationMacTable', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'How a Layer 2 Switch Makes Decisions',
              content: `<p>A switch operates primarily at Layer 2. Its job is to examine the Ethernet frame, learn the <strong>source MAC address</strong>, and then decide how to handle the frame based on the <strong>destination MAC address</strong>. This makes switching a local-delivery function rather than a routed, end-to-end decision.</p><p>The switch does not need a complete map before traffic begins. It builds that knowledge dynamically as frames arrive on its interfaces, which is why early traffic in a LAN often involves flooding until the switch has enough learned entries to forward more selectively.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'The four outcomes to know',
                  content: 'Almost every CCNA switching question reduces to one of four outcomes after the switch learns the source address.',
                  items: [
                    'Learn: record the source MAC and the port it arrived on.',
                    'Forward: send the frame only out the known destination port.',
                    'Flood: send the frame out all other ports in the VLAN when the destination is unknown or broadcast.',
                    'Filter: do not forward the frame when the destination lives on the same ingress port.'
                  ]
                },
                {
                  type: 'keyTerms',
                  title: 'Operational terms',
                  terms: [
                    { term: 'MAC address table', definition: 'The switch data structure that maps learned MAC addresses to switch ports inside a VLAN.' },
                    { term: 'Unknown unicast', definition: 'A unicast frame whose destination MAC is not yet in the switch table, causing flood behavior.' },
                    { term: 'Filtering', definition: 'Dropping the forwarding action because the destination is reachable through the same port that received the frame.' }
                  ]
                }
              ]
            },
            {
              title: 'Learning, Aging, and Flood Domains',
              content: `<p>Switches learn by watching the <strong>source</strong> field of every arriving frame. Each learned entry is associated with both a port and a VLAN. Over time, the switch removes stale entries through an <strong>aging timer</strong> so the table reflects the current network rather than preserving outdated locations forever.</p><p>Flooding is not an error by itself. It is the normal response for broadcasts and for destinations the switch has not learned yet. The important control point is the VLAN boundary: flooding stays inside the local broadcast domain instead of crossing routers automatically.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Typical table behaviors',
                  columns: ['Observed event', 'Switch action', 'Why it matters'],
                  rows: [
                    ['Frame arrives from a new source MAC', 'Add or refresh the MAC table entry for that source on the ingress port', 'Learning happens from the source, not the destination'],
                    ['Destination MAC is already known on another port', 'Forward only to that port', 'Known unicast keeps traffic selective and efficient'],
                    ['Destination MAC is unknown', 'Flood within the same VLAN only', 'The switch must discover where the destination lives'],
                    ['Entry ages out after inactivity', 'Remove the stale mapping', 'The table must adapt when hosts move or go silent']
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Source learning happens first',
                  content: 'On switch-operation questions, remember that the switch learns the source MAC before it decides what to do with the destination. That order is a frequent exam trap.'
                }
              ]
            },
            {
              title: 'Reading Switch Behavior Like an Operator',
              content: `<p>Operationally, you should be able to predict whether a frame is forwarded, flooded, or filtered just by knowing three things: the ingress port, the destination MAC, and whether the address table already has a matching entry for that VLAN. That mental model is what turns packet-walk questions into deterministic outcomes instead of guesswork.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Frame-walk checklist',
                  items: [
                    'Identify the source MAC and note that the switch will learn or refresh it on the incoming port.',
                    'Check whether the destination MAC is broadcast, unknown unicast, or a learned unicast.',
                    'Keep the lookup inside the VLAN; a switch table entry is not globally valid across all VLANs.',
                    'If the destination points back to the same interface, the forwarding action is filtered.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'A switch learns source MAC addresses dynamically and stores them per VLAN and per port.',
            'Unknown unicasts and broadcasts flood within the VLAN; known unicasts forward selectively.',
            'Filtering occurs when the destination is reachable through the same port that received the frame.',
            'MAC table entries age out so the switch can adapt to topology and host-location changes.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/what-is-network-security.html', coverageNotes: 'Cisco security overview aligned to foundational security concepts and CIA-style reasoning.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('network-access', '2.2', 'CLI Basics', [
        'Navigate user EXEC, privileged EXEC, and configuration modes.',
        'Use foundational IOS commands for show, save, erase, and copy workflows.',
      ], 'cli-sandbox', 'IOS CLI Sandbox', 'Command-fill + MCQ', { icon: 'CLI', quizBank: 'quizBanks/networkAccess/cliBasics', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Understanding IOS Mode Hierarchy',
              content: `<p>Cisco IOS uses a mode-based command structure. Each mode gives a different level of access to operational visibility or configuration authority. Moving between these modes cleanly is foundational because the same command can be valid in one context and invalid in another.</p><p>The key pattern is to start in <strong>user EXEC</strong>, move to <strong>privileged EXEC</strong> with <code>enable</code>, then enter one of the configuration modes when you need to change device behavior.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Common IOS modes',
                  columns: ['Mode', 'Typical prompt', 'Purpose'],
                  rows: [
                    ['User EXEC', 'Switch>', 'Basic reachability and limited monitoring commands'],
                    ['Privileged EXEC', 'Switch#', 'Full operational visibility and access to configuration entry'],
                    ['Global configuration', 'Switch(config)#', 'Device-wide settings such as hostname, VLANs, and management options'],
                    ['Sub-configuration modes', 'Switch(config-if)# and similar', 'Targeted changes for interfaces, lines, routing processes, or VLAN context']
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'Mode transitions to know cold',
                  items: [
                    'Use enable to move from user EXEC to privileged EXEC.',
                    'Use configure terminal to enter global configuration mode.',
                    'Use exit to move back one level and end or Ctrl+Z to jump back to privileged EXEC.'
                  ]
                }
              ]
            },
            {
              title: 'Operational Commands and Save Workflow',
              content: `<p>Operators use IOS in two different ways: to <strong>observe</strong> current device state and to <strong>change</strong> it. Observation usually starts with <code>show</code> commands, while change control is completed only when the configuration is saved from running memory into startup memory.</p><p>This distinction matters because a device can appear properly configured in the moment but lose those changes on reload if the running configuration is never copied into NVRAM.</p>`,
              blocks: [
                {
                  type: 'steps',
                  title: 'Core day-one workflow',
                  items: [
                    'Connect to the device and enter privileged EXEC mode.',
                    'Use show commands to understand the current state before making changes.',
                    'Enter configuration mode and apply the required updates in the correct context.',
                    'Verify the result with another show command rather than assuming success.',
                    'Save the configuration with copy running-config startup-config.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'commonMistake',
                  title: 'Running config is not startup config',
                  content: 'A common CCNA and real-world mistake is believing a working change is automatically persistent. Running-config reflects the active device state; startup-config is what survives a reload.'
                }
              ]
            },
            {
              title: 'Efficiency Features and Safe Habits',
              content: `<p>IOS includes small productivity tools that become major time savers: context-sensitive help with <code>?</code>, command completion with the Tab key, command recall with the arrow keys, and abbreviated commands when the meaning is unambiguous. These reduce syntax errors and make operators faster under pressure.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'CLI habits that prevent avoidable mistakes',
                  items: [
                    'Use ? before guessing syntax, especially in deeper configuration modes.',
                    'Verify the prompt before entering a command so you know the exact context.',
                    'Use show running-config or targeted show commands to confirm what changed.',
                    'Use no followed by the original command pattern when a configuration line must be removed.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'IOS is mode-based, so the prompt tells you what commands are valid and how much authority you have.',
            'Privileged EXEC is the operational hub, while global and sub-configuration modes are where device changes are made.',
            'Show before change, verify after change, and save running-config to startup-config if you want persistence.',
            'Help, completion, and prompt awareness are operator skills, not optional conveniences.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/index.html', coverageNotes: 'Cisco security portfolio reference aligned to common attack families and mitigation context.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('network-access', '2.3', 'Switch Interface Config', [
        'Configure speed and duplex behavior and recognize auto-negotiation outcomes.',
        'Interpret interface status and common error counters such as CRC, runts, giants, and collisions.',
      ], 'decision-simulator', 'Interface Mismatch Detector', 'Scenario + MCQ', { icon: 'PORT', quizBank: 'quizBanks/networkAccess/switchInterfaceConfig', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Interface State Begins with Physical Reality',
              content: `<p>A switch interface is where Layer 1 conditions and Layer 2 operation meet. Before you can reason about VLAN membership or forwarding behavior, you need to understand whether the port is physically up, administratively enabled, and operating with a compatible speed and duplex relationship on both ends of the link.</p><p>That is why interface troubleshooting often begins with status and protocol indicators. If the interface itself is down, higher-layer logic is not the first problem to chase.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Common interface states',
                  columns: ['Observed state', 'What it usually means', 'Primary next thought'],
                  rows: [
                    ['Administratively down', 'The interface is shut down in configuration', 'Check for a shutdown command and enable the port intentionally'],
                    ['Down/down', 'No usable physical signal or no active peer', 'Inspect cable, peer state, optics, and link presence'],
                    ['Up/up', 'Layer 1 and Layer 2 link conditions are good', 'Move on to VLAN, addressing, or forwarding questions'],
                    ['Err-disabled', 'The switch disabled the port after a protection or fault condition', 'Identify the triggering feature before re-enabling it']
                  ]
                }
              ]
            },
            {
              title: 'Speed, Duplex, and Auto-Negotiation',
              content: `<p>Ethernet interfaces typically negotiate speed and duplex automatically. When both sides behave correctly, this creates a clean link with matched expectations. Problems begin when one side is hard-coded and the other is left to negotiate, or when both sides are forced into incompatible settings.</p><p>Duplex mismatches are especially important because they often create deceptively partial connectivity: the link may appear up, but performance is poor and error counters begin to climb.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Mismatch symptoms that matter',
                  items: [
                    'CRC errors often indicate corrupted frames, bad cabling, or duplex-related problems.',
                    'Late collisions point toward duplex mismatch rather than normal modern switched Ethernet behavior.',
                    'Input errors, runts, and poor throughput together often mean the link is up but unhealthy.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'realWorld',
                  title: 'Why duplex mismatches waste time',
                  content: 'They are frustrating because the link does not always fail completely. Users see slowness, retransmissions, or intermittent issues while the interface still looks active at first glance.'
                }
              ]
            },
            {
              title: 'Verification and Counter Reading',
              content: `<p>Interface verification is not only about whether a port is up. You also need to read the counters and infer the story behind them. A healthy operator treats statistics as evidence: they show whether the medium, the peer, or the configuration is misaligned.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Counter interpretation quick guide',
                  columns: ['Counter', 'What it suggests', 'Typical interpretation'],
                  rows: [
                    ['CRC', 'Frames failed the checksum', 'Physical corruption, cabling issues, or duplex-related corruption'],
                    ['Runts', 'Frames smaller than the minimum valid Ethernet frame', 'Collision or corruption symptoms'],
                    ['Giants', 'Frames larger than expected', 'MTU mismatch, malformed traffic, or encapsulation issues'],
                    ['Late collisions', 'Collisions after the normal collision window', 'Strong duplex-mismatch signal on older/shared logic']
                  ]
                },
                {
                  type: 'checklist',
                  title: 'Interface verification sequence',
                  items: [
                    'Confirm administrative state and link state first.',
                    'Check negotiated or configured speed and duplex on both ends.',
                    'Read errors and counters instead of stopping at the first up/up status.',
                    'Correlate the evidence with user symptoms before changing settings blindly.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Interface troubleshooting starts with physical and administrative state before higher-layer assumptions.',
            'Auto-negotiation is normal, but mismatched speed or duplex creates degraded rather than always-failed links.',
            'CRC errors, runts, giants, and late collisions are diagnostic evidence, not just numbers.',
            'A clean verification flow checks state, settings, and counters in that order.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/email-security/index.html', coverageNotes: 'Cisco security reference aligned to phishing, user-targeted threats, and social-engineering awareness.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('network-access', '2.4', 'VLANs', [
        'Explain VLAN IDs, access ports, and the role of VLAN segmentation in broadcast isolation.',
        'Read and reason about operational VLAN output such as show vlan brief.',
      ], 'topology-builder', 'VLAN Segregation Visualizer', 'Config fill-in + MCQ', { icon: 'SW', quizBank: 'quizBanks/networkAccess/vlans', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why VLANs Exist',
              content: `<p>A VLAN creates a logical Layer 2 broadcast domain. Instead of treating every switch port as part of one flat Ethernet segment, VLANs let you segment users and devices into separate local networks even when they share the same physical switching infrastructure.</p><p>This improves control and scalability. Broadcast traffic stays inside its assigned VLAN, policy can be applied per segment, and departments or device roles no longer need to share the same Layer 2 environment just because they terminate on the same switch.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'What a VLAN changes',
                  items: [
                    'It separates the broadcast domain at Layer 2.',
                    'It usually maps to its own IP subnet in a well-designed campus network.',
                    'It does not by itself provide inter-VLAN communication; routing is still required between VLANs.'
                  ]
                },
                {
                  type: 'keyTerms',
                  title: 'VLAN field terms',
                  terms: [
                    { term: 'VLAN ID', definition: 'The numeric identifier that represents a logical Layer 2 segment.' },
                    { term: 'Access port', definition: 'A switch port that carries traffic for a single VLAN in normal end-host operation.' },
                    { term: 'Broadcast domain', definition: 'The Layer 2 scope in which broadcasts are flooded.' }
                  ]
                }
              ]
            },
            {
              title: 'Access Ports and VLAN Membership',
              content: `<p>Most end devices connect through <strong>access ports</strong>. An access port belongs to one VLAN, and frames from the attached host are handled as traffic for that VLAN. This keeps host-facing switch ports simple while still allowing the broader switching fabric to maintain many independent segments.</p><p>Operationally, engineers create the VLAN, name it if needed, and then assign interfaces into that VLAN. Verification matters because a created VLAN with no assigned ports, or a port left in the wrong VLAN, produces immediate reachability problems.</p>`,
              blocks: [
                {
                  type: 'steps',
                  title: 'Basic VLAN workflow',
                  items: [
                    'Create or confirm the VLAN in the switch database.',
                    'Assign the end-host interface as an access port.',
                    'Place that port into the intended VLAN.',
                    'Verify the result with operational output such as show vlan brief.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'VLAN assignment is local until carried across the fabric',
                  content: 'Seeing the correct VLAN on one switch does not mean the segment exists end to end across multiple switches. The inter-switch path still has to carry that VLAN correctly.'
                }
              ]
            },
            {
              title: 'Operational Thinking and Common Limits',
              content: `<p>When users in the same VLAN can communicate but users in different VLANs cannot, that is usually normal until a routing function is introduced. VLANs are segmentation tools, not routing solutions. This distinction matters because many troubleshooting questions are really asking whether the problem is a Layer 2 membership issue or a missing Layer 3 gateway.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'When reading VLAN output, verify',
                  items: [
                    'The VLAN exists on the switch.',
                    'The expected interfaces are assigned to that VLAN.',
                    'The port is operating as an access port when it is meant for a single end host.',
                    'Inter-VLAN traffic expectations are backed by a router or multilayer switch rather than assumed.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'A VLAN is a logical Layer 2 broadcast domain that segments traffic on shared switching infrastructure.',
            'Access ports normally carry one VLAN for an attached host.',
            'VLAN segmentation improves control, but inter-VLAN communication still requires Layer 3 routing.',
            'Verification focuses on VLAN existence, correct port membership, and realistic reachability expectations.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/identity-services-engine/index.html', coverageNotes: 'Cisco identity and access reference aligned to AAA, authentication control, and centralized policy.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('network-access', '2.5', 'VLAN Trunking (802.1Q)', [
        'Compare 802.1Q and ISL and explain native VLAN, allowed VLANs, and DTP outcomes.',
        'Predict trunk state formation from dynamic-auto and dynamic-desirable combinations.',
      ], 'decision-simulator', 'Trunk Negotiation Simulator', 'Mode-outcome matching', { icon: 'L2', quizBank: 'quizBanks/networkAccess/vlanTrunking8021q', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why Trunks Are Required',
              content: `<p>When multiple VLANs must cross the same physical link between switches, that link cannot behave like a normal access port. It must preserve VLAN identity for traffic from many broadcast domains at once. That is the purpose of a <strong>trunk</strong>.</p><p>Modern CCNA switching focuses on <strong>802.1Q</strong>, which tags frames so downstream devices know which VLAN each frame belongs to. The tag is not normally added to the native VLAN, which is why native-VLAN understanding matters for both design and troubleshooting.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Access link versus trunk link',
                  columns: ['Link type', 'Traffic carried', 'Typical use'],
                  rows: [
                    ['Access', 'One VLAN', 'Host-facing interface for PCs, printers, phones, and similar endpoints'],
                    ['Trunk', 'Multiple VLANs', 'Switch-to-switch, switch-to-router, or switch-to-wireless infrastructure links']
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: '802.1Q is the important encapsulation',
                  content: 'ISL is part of CCNA history and comparison language, but 802.1Q is the practical trunking standard you should expect to reason about in modern networks.'
                }
              ]
            },
            {
              title: 'Tagging, Native VLAN, and Allowed VLANs',
              content: `<p>An 802.1Q trunk marks frames with VLAN identity so the receiving switch can place traffic back into the correct broadcast domain. The exception is the <strong>native VLAN</strong>, whose frames are sent untagged by default. This behavior is operationally significant because mismatched native VLANs create confusing traffic symptoms rather than obvious link failure.</p><p>Engineers can also restrict which VLANs are permitted across the trunk. This keeps unnecessary broadcast domains off links that do not need them and makes the trunk behavior easier to reason about.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Three trunk settings that change outcomes',
                  items: [
                    'Encapsulation or tagging method determines how VLAN identity is preserved.',
                    'The native VLAN defines which traffic is left untagged on the trunk.',
                    'The allowed VLAN list limits which VLANs are actually carried across the link.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'commonMistake',
                  title: 'Native VLAN does not mean management VLAN',
                  content: 'These are separate concepts. The native VLAN is about untagged traffic on a trunk; the management VLAN is about where management-plane connectivity lives.'
                }
              ]
            },
            {
              title: 'DTP and Trunk Formation Logic',
              content: `<p>Dynamic Trunking Protocol (DTP) is Cisco logic that can negotiate whether a link becomes a trunk. The important CCNA skill is to predict the outcome from the mode combination on both ends, not to memorize configuration in isolation.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Mode intent at a glance',
                  columns: ['Mode', 'Intent', 'Operational idea'],
                  rows: [
                    ['access', 'Stay non-trunk', 'The interface behaves as a single-VLAN host port'],
                    ['trunk', 'Force trunking', 'The interface trunks regardless of negotiation preference'],
                    ['dynamic desirable', 'Actively try to form a trunk', 'Negotiates more aggressively'],
                    ['dynamic auto', 'Wait for the other side to initiate', 'Passive behavior that may or may not form a trunk']
                  ]
                },
                {
                  type: 'checklist',
                  title: 'Trunk troubleshooting sequence',
                  items: [
                    'Confirm whether both ends intend access or trunk behavior.',
                    'Check for native-VLAN mismatch warnings or unexpected untagged traffic behavior.',
                    'Verify the allowed VLAN list when one VLAN works but another does not.',
                    'Treat DTP outcome questions as a two-sided negotiation, not a one-sided command lookup.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Trunks let multiple VLANs cross one physical link, while access ports carry only one VLAN.',
            '802.1Q is the key CCNA trunking standard and uses tagging to preserve VLAN identity.',
            'The native VLAN is sent untagged by default, so native-VLAN mismatches matter operationally.',
            'DTP outcome questions depend on the combination of both sides, not one interface alone.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/identity-services-engine/index.html', coverageNotes: 'Cisco identity-services reference aligned to 802.1X, policy-based access control, and enterprise authentication flows.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('network-access', '2.6', 'Voice VLANs', [
        'Explain the dual-VLAN model for IP phones and downstream PCs on one access port.',
        'Relate CDP and LLDP to phone provisioning and voice/data segmentation.',
      ], 'topology-builder', 'Voice VLAN Topology Builder', 'MCQ + config', { icon: 'PORTS', quizBank: 'quizBanks/networkAccess/voiceVlans', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why Voice VLANs Exist',
              content: `<p>An IP phone often shares a single physical switchport with a downstream PC. That creates a design problem: both devices use the same cable path, but their traffic should not live in the same Layer 2 segment. A <strong>voice VLAN</strong> solves this by allowing the phone to tag voice traffic into one VLAN while the attached PC continues to use the normal access VLAN for data traffic.</p><p>This creates a dual-VLAN access-edge model: one switchport, one physical path, but two operational traffic classes with separate policy and broadcast scope.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'The access-edge voice model',
                  items: [
                    'The PC usually remains in the data VLAN on the access port.',
                    'The phone places voice traffic into the configured voice VLAN.',
                    'The switch treats both flows differently even though they arrive on the same physical interface.'
                  ]
                },
                {
                  type: 'keyTerms',
                  title: 'Terms to recognize',
                  terms: [
                    { term: 'Voice VLAN', definition: 'The VLAN used by the IP phone for voice signaling and media traffic.' },
                    { term: 'Data VLAN', definition: 'The access VLAN used by the downstream PC or host connected through the phone.' },
                    { term: 'Inline access edge', definition: 'A design where the phone sits between the switch and the PC on one switchport.' }
                  ]
                }
              ]
            },
            {
              title: 'Provisioning and Discovery',
              content: `<p>Phones need to learn how they should behave on the port. Cisco environments commonly use <strong>CDP</strong>, while multi-vendor environments often use <strong>LLDP/LLDP-MED</strong>, to advertise operational details such as the voice VLAN. This lets the phone tag voice traffic correctly without forcing a manual configuration workflow on every handset.</p><p>Discovery matters because the switch and phone have to agree on how traffic is separated. If that discovery process fails, phones may sit in the wrong VLAN or fail to receive the expected provisioning behavior.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Discovery protocol role on a voice edge',
                  columns: ['Component', 'Operational role', 'Why it matters'],
                  rows: [
                    ['CDP', 'Cisco neighbor-discovery and advertisement', 'Common method for telling Cisco phones which voice VLAN to use'],
                    ['LLDP / LLDP-MED', 'Standards-based discovery', 'Supports voice and endpoint advertisement in multi-vendor environments'],
                    ['Switchport voice configuration', 'Defines the intended voice segment', 'Provides the policy the endpoint is meant to follow']
                  ]
                }
              ]
            },
            {
              title: 'Design Intent and Troubleshooting Signals',
              content: `<p>Voice VLANs are not only about segmentation. They also help preserve voice quality and policy separation. Voice traffic is delay-sensitive, so keeping it logically distinct makes QoS treatment, troubleshooting, and endpoint operations more predictable.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'When a phone edge does not behave as expected, verify',
                  items: [
                    'The switchport has both the correct access VLAN and voice VLAN logic applied.',
                    'The phone is discovering the voice VLAN through CDP or LLDP as expected.',
                    'The PC remains in the data VLAN rather than inheriting voice tagging behavior.',
                    'The problem is not being misdiagnosed as trunking; voice VLAN on a host edge is a special access-edge pattern.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Voice VLANs let a phone and downstream PC share one switchport while keeping voice and data in different VLANs.',
            'The PC usually remains in the data VLAN and the phone tags voice traffic into the voice VLAN.',
            'CDP and LLDP help phones learn the intended voice VLAN dynamically.',
            'Voice VLAN design supports segmentation, operational clarity, and better handling of delay-sensitive traffic.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/index.html', coverageNotes: 'Cisco security reference aligned to access-control policy fundamentals and traffic filtering logic.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('network-access', '2.7', 'VTP', [
        'Compare server, client, transparent, and off modes and the risk of revision-based overwrites.',
        'Explain version differences and why VTP is treated cautiously in production networks.',
      ], 'attack-defense', 'VTP Bomb Simulator', 'MCQ + scenario', { icon: 'WARN', quizBank: 'quizBanks/networkAccess/vtp', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What VTP Tries to Solve',
              content: `<p>VLAN Trunking Protocol (VTP) is Cisco control-plane logic for distributing VLAN database information across switches in the same VTP domain. Its appeal is obvious: instead of creating VLANs manually on every switch, administrators can propagate changes centrally.</p><p>The reason VTP is treated cautiously is that it distributes control, not just convenience. When the database information is wrong, the protocol can spread that mistake just as efficiently as it spreads the intended design.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'VTP value versus VTP risk',
                  items: [
                    'It reduces repeated manual VLAN entry across many Cisco switches.',
                    'It depends on shared domain logic and synchronized revision tracking.',
                    'A bad database can propagate quickly if the environment trusts the wrong source.'
                  ]
                }
              ]
            },
            {
              title: 'Modes and Database Behavior',
              content: `<p>VTP behavior depends on the switch mode. Some devices can originate changes, some only receive them, and some simply forward or ignore VTP state. The CCNA expectation is to understand what each mode is allowed to do and what operational risk follows from that behavior.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'VTP modes at a glance',
                  columns: ['Mode', 'Can change the VLAN database?', 'Operational meaning'],
                  rows: [
                    ['Server', 'Yes', 'Can create, modify, and advertise VLAN database changes'],
                    ['Client', 'No local authoring', 'Learns VLAN information from the domain and depends on advertisements'],
                    ['Transparent', 'Local only', 'Does not participate in the same database logic in the classic sense but can forward VTP information'],
                    ['Off', 'No participation', 'VTP is disabled for practical participation purposes']
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Transparent does not mean invisible',
                  content: 'Transparent mode is a common exam nuance. It does not join the database the same way a server or client does, but it is not identical to being operationally absent.'
                }
              ]
            },
            {
              title: 'Revision Numbers and Production Caution',
              content: `<p>The most important VTP risk is the <strong>configuration revision number</strong>. A switch with a higher revision can overwrite the VLAN database of other switches in the same domain if the domain trusts it. That is why engineers often reset or isolate VTP state before introducing reused hardware into a production network.</p><p>This is also why many production environments either use transparent/off behavior or keep VTP tightly controlled instead of treating it as a default convenience feature.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Why engineers handle VTP carefully',
                  items: [
                    'Revision number can matter more than operator intent if an old switch is introduced carelessly.',
                    'A mistaken VLAN database can spread domain-wide instead of staying local.',
                    'Version and domain consistency still matter even before you think about actual VLAN content.',
                    'Many teams prefer manual control or transparent behavior over automatic propagation.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'VTP distributes VLAN database information across Cisco switches in the same domain.',
            'Server, client, transparent, and off modes change who can author, consume, or ignore VLAN database changes.',
            'The configuration revision number is the major operational risk because newer-looking data can overwrite intended state.',
            'VTP is powerful, but that same power is why many production networks treat it cautiously.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/index.html', coverageNotes: 'Cisco security reference aligned to advanced ACL configuration and administrative access-control scope.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('network-access', '2.8', 'STP Concepts', [
        'Explain root bridge election, port roles, timers, and BPDU exchange.',
        'Determine root, designated, and blocking outcomes from switch priorities and MAC addresses.',
      ], 'state-machine', 'STP Election Visualizer', 'Port-role labeling', { icon: 'SW', quizBank: 'quizBanks/networkAccess/stpConcepts', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why Spanning Tree Exists',
              content: `<p>Redundant Layer 2 links improve availability, but unmanaged redundancy creates switching loops. Unlike Layer 3, Ethernet has no built-in TTL field to stop a frame from circulating forever. The result can be broadcast storms, MAC table instability, and duplicated frames.</p><p>Spanning Tree Protocol (STP) solves this by intentionally placing some interfaces into a non-forwarding role so the active Layer 2 topology becomes loop-free while still preserving redundant physical paths for failover.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'The three classic loop symptoms',
                  items: [
                    'Broadcast storms consume bandwidth and CPU.',
                    'MAC address table instability causes hosts to appear to move unpredictably between ports.',
                    'Duplicate frames create confusing and unstable traffic behavior.'
                  ]
                }
              ]
            },
            {
              title: 'Root Bridge Election and Port Roles',
              content: `<p>STP organizes the switching topology around a single logical reference point: the <strong>root bridge</strong>. Every non-root switch then decides which port offers its best path toward that root. From there, each shared segment determines which interface will forward traffic as the designated path while other links are blocked to prevent loops.</p><p>The election logic depends on bridge identifiers, priorities, MAC addresses, and path cost. The important practical skill is to walk the logic step by step rather than memorizing outcomes blindly.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Core STP roles',
                  columns: ['Role', 'Meaning', 'Forwarding expectation'],
                  rows: [
                    ['Root bridge', 'The switch all other paths are calculated toward', 'All of its relevant designated ports forward'],
                    ['Root port', 'The best path from a non-root switch toward the root bridge', 'Forwards'],
                    ['Designated port', 'The forwarding port chosen for a segment', 'Forwards'],
                    ['Non-designated / blocked port', 'The redundant port not selected for forwarding', 'Does not forward normal data traffic']
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Lowest bridge ID wins root election',
                  content: 'Priority is evaluated before MAC address. If priorities tie, the lower MAC address becomes the deciding factor.'
                }
              ]
            },
            {
              title: 'BPDUs, Timers, and Operational Reasoning',
              content: `<p>STP relies on Bridge Protocol Data Units (BPDUs) to communicate topology information. Timers and state transitions determine how cautiously the network moves from one stable topology to another. For CCNA purposes, you need to understand the intent: STP trades a bit of convergence speed for loop prevention and deterministic Layer 2 behavior.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'How to solve an STP election question',
                  items: [
                    'Identify the root bridge first from priority and MAC address.',
                    'On each non-root switch, determine the lowest-cost path to the root.',
                    'For each segment, decide which side becomes designated.',
                    'Any redundant path that loses the election becomes the non-forwarding path.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'STP prevents Layer 2 loops by intentionally keeping some redundant links from forwarding traffic.',
            'The root bridge is elected by the lowest bridge ID, which is based on priority and then MAC address.',
            'Root ports and designated ports forward; redundant losing paths are blocked to preserve a loop-free topology.',
            'Most STP questions are solved by evaluating root election, path cost, and segment-by-segment role decisions.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/firewalls/index.html', coverageNotes: 'Cisco firewall reference aligned to stateful inspection, zone policy, and NGFW concepts.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('network-access', '2.9', 'RSTP & Per-VLAN STP', [
        'Describe RSTP convergence improvements, alternate and backup ports, and port-protection features.',
        'Compare PVST+, Rapid PVST+, and MST design choices.',
      ], 'state-machine', 'RSTP Convergence Animator', 'MCQ + config', { icon: 'FAST', quizBank: 'quizBanks/networkAccess/rstpPerVlanStp', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why RSTP Improved Classic STP',
              content: `<p>Classic STP protects the network, but it converges conservatively. Rapid Spanning Tree Protocol (RSTP) improves this by speeding up how switches react to topology changes while still preserving loop prevention. The goal is not to remove control, but to recover faster when a preferred path fails or a new path becomes usable.</p><p>From an operational standpoint, RSTP turns Spanning Tree from a slow safety mechanism into a faster control-plane process better suited for modern switched networks.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'RSTP changes the feel of convergence',
                  items: [
                    'Rapid transitions reduce delay when the topology changes.',
                    'Additional role awareness helps the switch identify standby paths sooner.',
                    'The protocol still prevents loops; it simply does so with faster decision making.'
                  ]
                }
              ]
            },
            {
              title: 'Port Roles, Edge Logic, and Protection',
              content: `<p>RSTP introduces clearer standby path roles such as <strong>alternate</strong> and <strong>backup</strong> ports, which helps the network respond faster to failure. It also treats edge-facing ports differently so host ports do not wait through unnecessary transitional behavior when no loop risk exists.</p><p>In practice, engineers combine this with protection features such as PortFast and BPDU-related guard behaviors so the access layer can come up quickly without sacrificing control-plane safety.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'RSTP operational ideas',
                  columns: ['Concept', 'Meaning', 'Operational effect'],
                  rows: [
                    ['Alternate port', 'A standby path toward the root', 'Can become active quickly if the root path fails'],
                    ['Backup port', 'A redundant path on the same segment', 'Provides local standby logic in specific designs'],
                    ['Edge port', 'A host-facing port not expected to create loops', 'Can move to forwarding more quickly'],
                    ['Protection features', 'PortFast, BPDU guard, and related controls', 'Balance quick access-edge startup with loop safety']
                  ]
                }
              ]
            },
            {
              title: 'PVST+, Rapid PVST+, and MST',
              content: `<p>Spanning Tree design also changes depending on whether the network runs a separate tree per VLAN or groups VLANs into shared instances. Cisco environments often reference <strong>PVST+</strong> and <strong>Rapid PVST+</strong>, while larger designs may use <strong>MST</strong> to scale more efficiently by mapping many VLANs into a smaller number of spanning-tree instances.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Comparison lens for exam questions',
                  items: [
                    'PVST+ keeps separate STP logic per VLAN.',
                    'Rapid PVST+ applies RSTP-style convergence to per-VLAN operation.',
                    'MST reduces control-plane scale by grouping VLANs into common instances.',
                    'The design choice is a tradeoff between granularity and scalability.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'RSTP improves convergence speed while preserving the loop-prevention purpose of Spanning Tree.',
            'Alternate, backup, and edge-port logic help switches respond faster to topology events.',
            'Rapid PVST+ brings rapid behavior to per-VLAN spanning-tree operation.',
            'MST is a scalability design that groups VLANs into shared spanning-tree instances.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/switches/index.html', coverageNotes: 'Cisco switching reference aligned to secure switchport behavior and access-edge protections.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('network-access', '2.10', 'EtherChannel', [
        'Build an EtherChannel with PAgP, LACP, or static on modes and verify compatibility.',
        'Differentiate Layer 2 and Layer 3 EtherChannel use cases and failure modes.',
      ], 'decision-simulator', 'EtherChannel Negotiation Simulator', 'Mode-compatibility table + MCQ', { icon: 'PORTS', quizBank: 'quizBanks/networkAccess/etherChannel', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why EtherChannel Matters',
              content: `<p>EtherChannel combines multiple physical links into one logical channel. This increases aggregate bandwidth while also simplifying control-plane behavior because protocols such as STP see the bundle as a single logical path rather than many separate competing links.</p><p>That combination of bandwidth aggregation and cleaner topology behavior is why EtherChannel is a standard feature in campus switching rather than just a throughput trick.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'What EtherChannel gives you',
                  items: [
                    'More aggregate bandwidth than a single physical link.',
                    'Redundancy inside the bundle if one member fails.',
                    'A single logical interface from the perspective of protocols such as STP.'
                  ]
                }
              ]
            },
            {
              title: 'Negotiation Models and Compatibility',
              content: `<p>EtherChannel can be formed statically or through negotiation. Cisco historically used <strong>PAgP</strong>, while standards-based environments use <strong>LACP</strong>. The CCNA skill is to predict which combinations will actually form a bundle and to recognize that mismatched settings usually leave links unbundled or misbehaving.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Formation methods',
                  columns: ['Method', 'Nature', 'Typical operational idea'],
                  rows: [
                    ['On', 'Static', 'Forces a bundle without protocol negotiation'],
                    ['PAgP', 'Cisco proprietary', 'Negotiates a bundle using Cisco-only control logic'],
                    ['LACP', 'IEEE standard', 'Negotiates a bundle in a vendor-neutral way']
                  ]
                },
                {
                  type: 'note',
                  variant: 'commonMistake',
                  title: 'A physical match is not enough',
                  content: 'Links also have to agree on key operational characteristics such as speed, duplex, trunk/access behavior, and VLAN-related settings where applicable. Similar-looking links can still fail to bundle cleanly.'
                }
              ]
            },
            {
              title: 'Layer 2 Versus Layer 3 Port-Channels',
              content: `<p>An EtherChannel can operate as a Layer 2 switchport bundle or as a Layer 3 routed bundle. The logic is similar, but the operational role changes: a Layer 2 port-channel carries VLAN-based switching, while a Layer 3 port-channel behaves like a routed interface between devices.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'EtherChannel design and troubleshooting checks',
                  items: [
                    'Decide first whether the channel is meant to be Layer 2 or Layer 3.',
                    'Make sure member links share the same key operational settings.',
                    'Verify the bundle formed instead of assuming matching commands were enough.',
                    'Remember that STP sees the logical port-channel, not each member as separate forwarding choices.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'EtherChannel bundles multiple physical links into one logical channel for bandwidth and resilience.',
            'STP treats the bundle as one logical interface, which simplifies loop-avoidance behavior.',
            'PAgP is Cisco proprietary, LACP is standards-based, and static on mode skips negotiation.',
            'Member-link compatibility matters; similar cables alone do not guarantee a valid bundle.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/switches/index.html', coverageNotes: 'Cisco switching reference aligned to DHCP Snooping, access-edge trust, and Layer 2 validation features.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('network-access', '2.11', 'CDP & LLDP', [
        'Compare Cisco proprietary CDP and standards-based LLDP behavior, defaults, and timers.',
        'Read neighbor-discovery output and map it into a topology view.',
      ], 'diagram-builder', 'Network Discovery Mapper', 'Show output reading + MCQ', { icon: 'NET', quizBank: 'quizBanks/networkAccess/cdpLldp', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why Neighbor Discovery Matters',
              content: `<p>CDP and LLDP are Layer 2 neighbor-discovery protocols. Their purpose is to let directly connected devices advertise identity and interface information so engineers can understand local topology without guessing from cables alone.</p><p>This matters operationally because a surprising amount of switching work begins with answering simple questions: what is connected here, on which port, and what type of device is it? Neighbor discovery turns those questions into observable data.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'What neighbor discovery usually provides',
                  items: [
                    'The identity of the neighboring device.',
                    'The local and remote interfaces that form the connection.',
                    'Useful metadata such as platform, capabilities, or management addressing.'
                  ]
                }
              ]
            },
            {
              title: 'CDP Versus LLDP',
              content: `<p><strong>CDP</strong> is Cisco proprietary, while <strong>LLDP</strong> is the standards-based alternative used across multi-vendor environments. The CCNA expectation is not just to know that difference, but to understand why it matters: the network may expose similar topology information, but the protocol choice reflects the vendor model of the environment.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Protocol comparison',
                  columns: ['Protocol', 'Type', 'Operational meaning'],
                  rows: [
                    ['CDP', 'Cisco proprietary', 'Best aligned to Cisco-only discovery and endpoint integration features'],
                    ['LLDP', 'IEEE standard', 'Used for vendor-neutral Layer 2 neighbor discovery'],
                    ['LLDP-MED', 'LLDP extension', 'Adds richer endpoint and voice-related advertisement behavior']
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'The protocol is local, not routed',
                  content: 'Neighbor discovery describes directly connected relationships. It does not map the entire network transitively across routed hops.'
                }
              ]
            },
            {
              title: 'Reading Output and Operational Caution',
              content: `<p>Show command output from CDP or LLDP is often the fastest path to building an access-layer topology map. It helps confirm cabling, trace uplinks, and support features such as phone provisioning. At the same time, it exposes useful information about the device, which is why some environments disable it on untrusted edges.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'When interpreting neighbor data, check',
                  items: [
                    'Which local interface is reporting the neighbor.',
                    'Which remote device and remote port are attached.',
                    'Whether the environment is Cisco-only or multi-vendor, which affects CDP versus LLDP expectations.',
                    'Whether discovery should remain enabled on that segment from a security perspective.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'CDP and LLDP are Layer 2 protocols that describe directly connected neighbors.',
            'CDP is Cisco proprietary, while LLDP is the standards-based alternative.',
            'Neighbor discovery output is valuable for topology mapping, endpoint integration, and troubleshooting.',
            'Because these protocols reveal useful device information, they are not always appropriate on untrusted interfaces.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/switches/index.html', coverageNotes: 'Cisco switching reference aligned to Dynamic ARP Inspection and Layer 2 identity validation features.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('network-access', '2.12', 'Wireless LAN Fundamentals', [
        'Explain Wi-Fi bands, channels, standards, CSMA/CA, and BSS terminology.',
        'Recognize interference patterns and channel-planning basics such as 1-6-11 reuse.',
      ], 'comparison-viewer', 'Channel Overlap Visualizer', 'Standard-to-band matching + MCQ', { icon: 'NET', quizBank: 'quizBanks/networkAccess/wirelessLanFundamentals', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Wireless Is Shared RF, Not a Cable',
              content: `<p>Wireless LANs deliver Layer 2 access over radio frequency instead of copper. That changes the engineering model immediately: the medium is shared, interference matters, and all stations compete for airtime rather than transmitting over isolated physical wire pairs.</p><p>Understanding wireless starts with bands, channels, and standards. The point is not to memorize every historical detail, but to understand how the medium behaves so channel choice, client experience, and coverage decisions make sense.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Core wireless building blocks',
                  items: [
                    'Bands define the RF range in use, commonly 2.4 GHz and 5 GHz at the CCNA level.',
                    'Channels subdivide the band into operational transmission space.',
                    '802.11 standards define how efficiently clients and access points use that space.'
                  ]
                }
              ]
            },
            {
              title: 'Contention, CSMA/CA, and Wireless Terms',
              content: `<p>Unlike classic shared Ethernet, Wi-Fi uses <strong>CSMA/CA</strong> rather than CSMA/CD. Devices try to avoid collisions because they cannot reliably detect them the same way a shared wired medium once did. This makes airtime discipline, retransmissions, and contention central to wireless performance.</p><p>You also need the basic vocabulary: a <strong>BSS</strong> is the service area around an AP, an <strong>ESS</strong> ties multiple AP service areas into one larger wireless network, and the <strong>SSID</strong> is the network name users associate with.</p>`,
              blocks: [
                {
                  type: 'keyTerms',
                  title: 'Wireless terms',
                  terms: [
                    { term: 'BSS', definition: 'The basic service set; the wireless cell around an access point.' },
                    { term: 'ESS', definition: 'A larger WLAN made of multiple coordinated BSS areas under one wireless network identity.' },
                    { term: 'SSID', definition: 'The service set identifier; the user-visible wireless network name.' }
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Wireless is contention-based',
                  content: 'Wi-Fi performance is not only about signal presence. It is also about how many devices share airtime and how cleanly they contend for access to the medium.'
                }
              ]
            },
            {
              title: 'Channel Planning and Interference',
              content: `<p>Channel planning is one of the most practical wireless skills. In 2.4 GHz, overlapping channels create interference and poor airtime behavior, which is why the classic planning set is <strong>1, 6, and 11</strong>. The design goal is not just coverage, but usable airtime with minimal self-interference.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Wireless planning mindset',
                  items: [
                    'Do not treat more APs as automatically better if they create channel overlap problems.',
                    'Remember that 2.4 GHz has fewer clean non-overlapping choices than 5 GHz.',
                    'Think in terms of airtime, interference, and contention, not only signal bars.',
                    'Channel reuse works only when neighboring cells are designed to avoid harmful overlap.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Wireless LANs operate on a shared RF medium, so airtime and interference matter as much as connectivity.',
            'Bands, channels, and 802.11 standards define how wireless networks use spectrum.',
            'Wi-Fi uses CSMA/CA because clients contend for access to the medium rather than relying on collision detection.',
            'In 2.4 GHz planning, 1, 6, and 11 are the classic non-overlapping channel set.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/vpn-endpoint-security-clients/index.html', coverageNotes: 'Cisco VPN reference aligned to site-to-site secure tunneling and IPsec-related connectivity models.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('network-access', '2.13', 'Wireless LAN Architectures', [
        'Compare autonomous, lightweight, and cloud-managed AP models.',
        'Explain split-MAC operation and CAPWAP control/data tunneling.',
      ], 'comparison-viewer', 'CAPWAP Tunnel Flow Diagram', 'Architecture matching + MCQ', { icon: 'AUTO', quizBank: 'quizBanks/networkAccess/wirelessLanArchitectures', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'The Main WLAN Architecture Models',
              content: `<p>Wireless networks can be built with different control models. In an <strong>autonomous</strong> design, each AP operates largely on its own. In a <strong>lightweight</strong> design, APs depend on a wireless LAN controller (WLC) for centralized control. In a <strong>cloud-managed</strong> design, orchestration and visibility shift toward a cloud management platform.</p><p>The architecture choice affects where configuration lives, how policy is enforced, and how scalable day-two operations become.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Architecture comparison',
                  columns: ['Model', 'Control pattern', 'Operational tradeoff'],
                  rows: [
                    ['Autonomous AP', 'Each AP is configured individually', 'Simple for small environments but harder to scale consistently'],
                    ['Lightweight AP + WLC', 'Central controller manages AP behavior', 'Strong policy consistency and visibility with controller dependence'],
                    ['Cloud-managed AP', 'Management plane is centralized through a cloud platform', 'Operational simplicity with cloud dependency and provider workflow']
                  ]
                }
              ]
            },
            {
              title: 'Split-MAC and CAPWAP',
              content: `<p>Lightweight wireless designs often use a <strong>split-MAC</strong> model. Time-sensitive, local radio functions stay on the AP, while broader management and control functions are handled by the controller. This lets the network combine distributed RF presence with centralized decision-making.</p><p><strong>CAPWAP</strong> is the protocol that ties APs to controllers. At the CCNA level, the key idea is that APs and controllers exchange control information, and traffic may also be tunneled depending on the deployment model.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'What split-MAC means in practice',
                  items: [
                    'The AP still handles immediate radio-facing tasks.',
                    'The controller centralizes policy, configuration, and broader control decisions.',
                    'CAPWAP provides the relationship between the AP and controller.'
                  ]
                }
              ]
            },
            {
              title: 'Centralized Versus Local Switching Decisions',
              content: `<p>Some wireless designs carry user traffic back to the controller, while others let it break out more locally at the branch or access edge. This choice affects bandwidth usage, policy placement, survivability, and operational simplicity.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Architecture questions usually ask',
                  items: [
                    'Where does management control live?',
                    'Where does client traffic actually switch or tunnel?',
                    'How much consistency versus local autonomy does the design need?',
                    'Is the environment small and standalone, campus-wide, or distributed across branches?'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Autonomous, lightweight, and cloud-managed APs represent different WLAN control models.',
            'Lightweight designs centralize policy and management through a controller.',
            'Split-MAC keeps immediate radio functions on the AP while broader control lives on the controller.',
            'CAPWAP is the key controller-AP relationship protocol in lightweight architectures.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/vpn-endpoint-security-clients/index.html', coverageNotes: 'Cisco VPN client reference aligned to remote-access VPN concepts and user-focused secure connectivity.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('network-access', '2.14', 'Wireless LAN Security', [
        'Compare WEP, WPA, WPA2, and WPA3 and relate them to PSK, 802.1X, SAE, and PMF.',
        'Map encryption and integrity options such as TKIP, CCMP, and GCMP to the correct generation.',
      ], 'comparison-viewer', 'WPA Protocol Timeline', 'Protocol-to-WPA matching', { icon: 'LOCK', quizBank: 'quizBanks/networkAccess/wirelessLanSecurity', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why Wireless Security Evolved',
              content: `<p>Wireless traffic is transmitted through the air, so anyone in RF range can potentially observe it. That makes strong authentication, confidentiality, and integrity essential. Wireless security history is largely the story of weak early methods being replaced by stronger generations as attacks exposed their limits.</p><p>The CCNA expectation is to know the order of that evolution and to match each generation to the appropriate authentication and encryption ideas.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Wireless security generations',
                  columns: ['Generation', 'Security position', 'Operational meaning'],
                  rows: [
                    ['WEP', 'Obsolete and weak', 'No longer considered acceptable protection'],
                    ['WPA', 'Transitional improvement', 'Better than WEP but still legacy'],
                    ['WPA2', 'Long-standing modern baseline', 'Strong security when paired with correct methods'],
                    ['WPA3', 'Current stronger generation', 'Improved authentication and modern protections']
                  ]
                }
              ]
            },
            {
              title: 'Authentication Models',
              content: `<p>Wireless security is not only about encryption. The network also has to decide <strong>who is allowed to join</strong>. Smaller environments often use <strong>PSK</strong>, while enterprise environments rely on <strong>802.1X</strong>. WPA3 also introduces <strong>SAE</strong> as a stronger password-based approach for personal security models.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Authentication choices by intent',
                  items: [
                    'PSK is shared-secret authentication and is common in simpler environments.',
                    '802.1X supports enterprise-style identity-based access control.',
                    'SAE improves password-based security by replacing weaker legacy approaches.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Do not confuse authentication with encryption',
                  content: 'The method that proves the user or device can be different from the cipher suite that protects the traffic after association.'
                }
              ]
            },
            {
              title: 'Cipher Suites and Modern Protections',
              content: `<p>Different WLAN generations are also associated with different protection technologies. Legacy designs are tied to weaker options such as <strong>TKIP</strong>, while stronger generations use mechanisms such as <strong>CCMP</strong> and <strong>GCMP</strong>. Modern security also adds controls such as <strong>Protected Management Frames (PMF)</strong> to reduce attacks against management traffic itself.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Security comparison lens',
                  items: [
                    'WEP is weak and obsolete.',
                    'TKIP is legacy and should signal transitional rather than preferred security.',
                    'CCMP and later GCMP are the stronger modern protection direction.',
                    'PMF matters because not all attacks target user data directly; some target management behavior.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Wireless security evolved from weak WEP to stronger WPA2 and WPA3 models.',
            'Authentication choices include PSK, 802.1X, and SAE depending on the deployment model.',
            'Cipher suites such as CCMP and GCMP represent stronger protection than legacy TKIP.',
            'Modern WLAN security also protects management behavior, not just user payload encryption.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/wireless/index.html', coverageNotes: 'Cisco wireless reference aligned to WPA evolution, wireless authentication, and modern WLAN protection.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('network-access', '2.15', 'Wireless LAN Configuration', [
        'Walk through the WLC workflow for interfaces, WLANs, security, QoS, and advanced tuning.',
        'Model common deployment options such as FlexConnect, load balancing, and controller LAG.',
      ], 'config-lab', 'WLC Configuration Walkthrough', 'Config sequence ordering', { icon: 'CONFIG', quizBank: 'quizBanks/networkAccess/wirelessLanConfiguration', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'How WLC Configuration Is Organized',
              content: `<p>Wireless LAN controllers are configured through a structured workflow rather than one flat list of settings. At a high level, you define the controller-facing interfaces, create the WLAN itself, bind security and policy choices, and then verify how APs and clients will actually use that service.</p><p>This is why controller configuration questions often feel architectural rather than purely command-based: each step depends on the design intent of the WLAN.</p>`,
              blocks: [
                {
                  type: 'steps',
                  title: 'Typical WLC build sequence',
                  items: [
                    'Define the relevant controller interfaces and connectivity assumptions.',
                    'Create the WLAN and map it to the correct client-facing network or policy context.',
                    'Apply authentication and security settings.',
                    'Confirm service behavior with operational verification and client association logic.'
                  ]
                }
              ]
            },
            {
              title: 'Security, QoS, and Service Behavior',
              content: `<p>Configuring a WLAN is not only about making a network name appear. The controller also determines how clients authenticate, how traffic is prioritized, and what service profile the WLAN represents. Voice-oriented WLANs, guest services, and employee access often need different policy behavior even if they share the same physical AP estate.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'The policy dimensions of a WLAN',
                  items: [
                    'Security decides who can associate and how that identity is validated.',
                    'QoS affects how delay-sensitive traffic is treated.',
                    'Advanced tuning influences roaming, RF behavior, and deployment-specific outcomes.'
                  ]
                }
              ]
            },
            {
              title: 'Distributed Deployments and Operational Options',
              content: `<p>Enterprise wireless is not always a single-campus design. Features such as <strong>FlexConnect</strong>, load balancing, and controller link aggregation adapt the solution to branch survivability, client distribution, and controller-side scale. The key exam skill is understanding the intent of the feature, not memorizing every interface screen.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Common deployment options',
                  columns: ['Feature', 'Why it exists', 'Operational effect'],
                  rows: [
                    ['FlexConnect', 'Support branch-style local behavior', 'Allows APs to maintain useful local operation in distributed designs'],
                    ['Load balancing', 'Avoid over-concentrating clients', 'Helps distribute client associations more sensibly'],
                    ['Controller LAG', 'Increase controller-side bandwidth and resilience', 'Aggregates controller uplinks into a logical bundle']
                  ]
                },
                {
                  type: 'checklist',
                  title: 'When reading a WLAN configuration problem, ask',
                  items: [
                    'What client group is this WLAN serving?',
                    'Which security model is intended?',
                    'Is the design centralized, branch-aware, or high-scale?',
                    'Which advanced options are solving a deployment problem rather than adding random features?'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'WLC configuration follows a workflow: interfaces, WLAN definition, security/policy, and verification.',
            'A WLAN is a service policy object as much as it is a visible SSID.',
            'QoS, security, and advanced tuning shape the real behavior clients experience.',
            'Features such as FlexConnect, load balancing, and controller LAG exist to solve distributed or scaled deployment needs.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
    ],
  }),
  domain({
    id: 'ip-connectivity',
    examDomain: 3,
    title: 'IP Connectivity',
    shortTitle: 'IP Connectivity',
    icon: 'ROUTE',
    color: '#ff7043',
    difficulty: 'intermediate',
    examWeight: 25,
    estimatedHours: 12,
    learningGoal: 'Understand how routers make forwarding decisions and configure dynamic routing protocols.',
    prerequisites: ['network-access'],
    topicGroups: [
      { id: 'connectivity-routing-basics', title: 'Router & Routing Table Foundations', topicCodes: ['3.1', '3.2', '3.3'] },
      { id: 'connectivity-static', title: 'Static Routing & Troubleshooting', topicCodes: ['3.4', '3.5'] },
      { id: 'connectivity-ospf', title: 'OSPF Core Concepts', topicCodes: ['3.6', '3.7', '3.8', '3.9'] },
      { id: 'connectivity-ipv6-fhrp', title: 'IPv6 Routing, NDP & FHRP', topicCodes: ['3.10', '3.11', '3.12'] },
    ],
    finalExam: { questionCount: 40, passingScore: 80, quizType: 'mcq-config-trace', bank: 'quizBanks/ipConnectivity/domain3FinalExam' },
    topics: [
      topic('ip-connectivity', '3.1', 'Router Operation', [
        'Differentiate router forwarding behavior from switching behavior and review key router interfaces.',
        'Interpret show ip interface brief and show protocols for operational status.',
      ], 'decision-simulator', 'Router vs Switch Decision Diagram', 'MCQ + scenario', { icon: 'ROUTE', quizBank: 'quizBanks/ipConnectivity/routerOperation', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What a Router Actually Does',
              content: `<p>A router is a Layer 3 device. It reads the <strong>destination IP address</strong>, compares that address against the routing table, and chooses the best path toward the next network. This is fundamentally different from switching, where the decision is based on Layer 2 MAC addresses inside one local broadcast domain.</p><p>Each router interface is a Layer 3 boundary. Because of that, routers do not forward Layer 2 broadcasts from one interface to another. That single fact explains why routers break up broadcast domains and why they are the devices that join separate IP networks together.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Switching versus routing',
                  columns: ['Function', 'Primary lookup', 'Result'],
                  rows: [
                    ['Layer 2 switching', 'Destination MAC address', 'Local forwarding inside the current VLAN'],
                    ['Layer 3 routing', 'Destination IP prefix', 'Forwarding toward another network or next hop'],
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'Operational meaning',
                  items: [
                    'Switches decide local delivery on the current segment.',
                    'Routers decide how traffic leaves the current network.',
                    'A router interface marks a new broadcast domain.'
                  ]
                }
              ]
            },
            {
              title: 'Reading Router Interface State',
              content: `<p>Router questions often become simple once you read interface state correctly. Commands such as <code>show ip interface brief</code> and <code>show protocols</code> tell you whether an interface is administratively enabled, whether line protocol is up, and whether the address plan on the box matches the intended design.</p><p>You should treat interface state as evidence rather than decoration. If the interface is down, the routing table may still contain older information, but the router cannot actually forward traffic through that path in real time.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Common router interface interpretations',
                  columns: ['Observed state', 'Meaning', 'Primary next thought'],
                  rows: [
                    ['Up/up', 'Interface and line protocol are operational', 'Move to routing logic and reachability checks'],
                    ['Administratively down', 'The interface is shut down in configuration', 'Check for intentional disablement'],
                    ['Up/down', 'Physical signal exists but the data-link condition is incomplete', 'Check encapsulation or peer-side status'],
                    ['Down/down', 'No usable physical connection', 'Check cable, remote device, optics, or carrier state'],
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Start at the edge of the problem',
                  content: 'Before debugging the routing table, confirm the router actually has a working outgoing interface. Layer 3 reasoning is useless if the interface path is unavailable.'
                }
              ]
            },
            {
              title: 'How a Router Forwards a Packet',
              content: `<p>When a packet arrives, the router strips the incoming Layer 2 frame, examines the Layer 3 destination, performs a routing-table lookup, and then prepares a new outgoing Layer 2 frame for the next segment. The IP packet keeps moving toward the final destination, but the local Layer 2 header changes hop by hop.</p>`,
              blocks: [
                {
                  type: 'steps',
                  title: 'Forwarding sequence',
                  items: [
                    'Receive the frame and remove the incoming Layer 2 header.',
                    'Read the destination IP address and match it against the routing table.',
                    'Choose the best route and identify the outgoing interface or next hop.',
                    'Resolve the next-hop Layer 2 address if needed.',
                    'Decrement the TTL, build a new outgoing frame, and send the packet onward.'
                  ]
                },
                {
                  type: 'checklist',
                  title: 'Packet-walk review',
                  items: [
                    'The destination IP normally stays the final destination end to end.',
                    'The source and destination MAC addresses change on every routed hop.',
                    'The router needs a valid route and a working outgoing interface to forward the packet.',
                    'TTL drops by one at each router hop.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Routers make forwarding decisions using destination IP prefixes, not destination MAC addresses.',
            'Each router interface is a Layer 3 boundary and creates a separate broadcast domain.',
            'show ip interface brief and show protocols are core commands for validating router operational state.',
            'On each routed hop, the Layer 2 frame changes while the Layer 3 packet continues toward the final destination.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-connectivity', '3.2', 'Routing Table Fundamentals', [
        'Read connected, local, static, dynamic, and default routes in a routing table.',
        'Apply longest prefix match to determine the selected next hop.',
      ], 'decision-simulator', 'Routing Table Reader', 'Table-reading exercises', { icon: 'TABLE', simulationRouteId: 'routing-table', quizBank: 'quizBanks/ipConnectivity/routingTableFundamentals', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What the Routing Table Represents',
              content: `<p>The routing table is the router's Layer 3 decision map. It lists known destination networks and how to reach them. Some routes are learned because the network is directly connected, some are configured manually, and some arrive through dynamic routing protocols.</p><p>The key beginner mistake is to memorize route codes without understanding the decision model. A route entry always answers one practical question: <strong>if a packet is trying to reach this prefix, what is the best next step?</strong></p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Common route types',
                  columns: ['Route type', 'How it appears', 'Meaning'],
                  rows: [
                    ['Connected', 'Directly attached network', 'The router can reach the subnet through one of its own interfaces'],
                    ['Local', 'Host route for an interface IP', 'Traffic to the interface address terminates on the router itself'],
                    ['Static', 'Manually configured route', 'The administrator defined the next hop or exit path'],
                    ['Dynamic', 'Learned from a routing protocol', 'The router accepted the route from a control-plane source'],
                    ['Default', '0.0.0.0/0 or ::/0', 'Catch-all path when no more specific route exists']
                  ]
                }
              ]
            },
            {
              title: 'Longest Prefix Match',
              content: `<p>Route selection starts with specificity. If multiple routes could match the same destination, the router chooses the one with the <strong>longest prefix length</strong>. This is called longest prefix match, and it is more important than whether the route is static or dynamic.</p><p>That means a more specific route can beat the default route immediately, and two routes with different prefix lengths are not competing as equals. They serve different levels of precision.</p>`,
              blocks: [
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Specificity comes first',
                  content: 'A /24 beats a /16 for a destination inside that /24, and both beat the default route. Always solve prefix length before you solve trust or metric.'
                },
                {
                  type: 'steps',
                  title: 'How to solve a route lookup',
                  items: [
                    'Write down the destination IP address.',
                    'Identify every route whose prefix includes that destination.',
                    'Choose the route with the longest prefix length.',
                    'Only if the prefix length ties should you compare route source trust and metric.'
                  ]
                }
              ]
            },
            {
              title: 'Reading the Operational Outcome',
              content: `<p>After the router selects the best entry, it still needs usable forwarding details such as a next hop, an outgoing interface, or both. In practice, route-reading questions are not just about matching a prefix; they are about predicting which interface the router will actually use and whether that route is active.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Routing-table reading checklist',
                  items: [
                    'Separate connected, local, static, dynamic, and default routes mentally.',
                    'Solve longest prefix match before reading administrative distance or metric.',
                    'Confirm the selected route points to a reachable next hop or valid outgoing interface.',
                    'Do not confuse a local interface host route with a connected subnet route.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'The routing table is the router decision map for destination prefixes and next-hop choices.',
            'Connected, local, static, dynamic, and default routes each represent a different source of routing knowledge.',
            'Longest prefix match is the first and most important route-selection rule.',
            'A selected route still depends on usable forwarding details such as an active outgoing path.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-connectivity', '3.3', 'Administrative Distance', [
        'Rank route trust using administrative distance and floating static design.',
        'Predict route installation when multiple protocols advertise the same prefix.',
      ], 'decision-simulator', 'AD Tiebreaker Simulator', 'AD ranking drag-drop', { icon: 'FOCUS', quizBank: 'quizBanks/ipConnectivity/administrativeDistance', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What Administrative Distance Means',
              content: `<p>Administrative distance (AD) is the router's trust value for the <strong>source</strong> of a route. It does not describe path quality inside a protocol; it answers a different question: if two protocols tell the router about the same prefix, which source should be believed first?</p><p>This distinction matters because many learners confuse AD with a metric. A metric compares paths <em>within</em> the same routing method. Administrative distance compares route sources <em>between</em> different methods.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Common AD values to know',
                  columns: ['Route source', 'Typical AD', 'Interpretation'],
                  rows: [
                    ['Connected', '0', 'Most directly trustworthy because the network is on the router'],
                    ['Static', '1', 'Manually defined by the administrator'],
                    ['eBGP', '20', 'Externally learned BGP route'],
                    ['EIGRP internal', '90', 'Dynamic route with higher trust than OSPF'],
                    ['OSPF', '110', 'Common link-state routing source'],
                    ['RIP', '120', 'Lower trust than OSPF in default comparison']
                  ]
                }
              ]
            },
            {
              title: 'When Administrative Distance Matters',
              content: `<p>Administrative distance matters only when the competing routes are for the <strong>same prefix length</strong>. If one route is more specific, longest prefix match wins before AD is even considered. But when the prefix ties, the router installs the route with the lower administrative distance.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Selection order to remember',
                  items: [
                    'Prefix specificity first.',
                    'Administrative distance second if the prefix length ties.',
                    'Metric third when the router is choosing between paths from the same protocol source.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'commonMistake',
                  title: 'AD is not a performance score',
                  content: 'A lower AD does not mean the path is faster. It means the router trusts the route source more when identical prefixes compete.'
                }
              ]
            },
            {
              title: 'Floating Static Routes',
              content: `<p>A floating static route is a static route configured with an administrative distance higher than the preferred primary path. It stays in reserve until the primary route disappears, which makes it a common backup-design tool.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Floating static design logic',
                  items: [
                    'Keep the backup route pointed at the same destination prefix as the primary route.',
                    'Set the backup static route to a higher AD than the preferred primary source.',
                    'Verify failover by confirming the primary route disappears before the backup installs.',
                    'Use show ip route to confirm which source is active at the moment.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Administrative distance measures trust in a route source, not path quality inside the protocol.',
            'AD is only compared after longest prefix match has already narrowed the decision.',
            'Lower AD wins when identical prefixes arrive from different route sources.',
            'Floating static routes use a higher AD to remain as backup paths until the primary route fails.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-connectivity', '3.4', 'IPv4 Static Routing', [
        'Build static and default routes with next-hop and exit-interface variants.',
        'Explain floating static routes and verification with show ip route.',
      ], 'config-lab', 'Static Route Lab', 'Config fill-in + trace', { icon: 'CONFIG', quizBank: 'quizBanks/ipConnectivity/ipv4StaticRouting', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why Static Routes Still Matter',
              content: `<p>Static routes are administrator-defined routes. They are useful when the path is simple, stable, security-sensitive, or intended as a predictable backup. Unlike dynamic routing, there is no control-plane discovery process deciding the path for you. The router follows exactly what the administrator configured.</p><p>This makes static routing easy to reason about in small topologies and especially important for default routes, stub networks, edge links, and fallback designs.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Common static-route uses',
                  columns: ['Use case', 'Why static fits', 'Typical example'],
                  rows: [
                    ['Default route', 'One simple exit toward the rest of the network', 'Branch router pointing to an upstream provider'],
                    ['Stub network path', 'Only one valid way to reach the destination', 'Small remote subnet behind one next hop'],
                    ['Backup route', 'Predictable standby behavior', 'Floating static route behind a dynamic primary path']
                  ]
                }
              ]
            },
            {
              title: 'Next Hop, Exit Interface, and Recursive Logic',
              content: `<p>An IPv4 static route can point to a <strong>next-hop IP address</strong>, an <strong>exit interface</strong>, or in some cases both. A next-hop route requires the router to resolve how to reach that next hop, which is why you will hear the term <strong>recursive lookup</strong>. An exit-interface route points directly to the interface that should be used for forwarding.</p><p>The important design question is not which syntax is prettier, but what forwarding behavior is being described and how clearly the route ties to the intended path.</p>`,
              blocks: [
                {
                  type: 'steps',
                  title: 'Static-route workflow',
                  items: [
                    'Identify the destination network and prefix length.',
                    'Choose the intended next-hop address, exit interface, or both.',
                    'Configure the route so the router has a deterministic path for that prefix.',
                    'Verify that the route installs into the routing table as intended.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Default route is still a route',
                  content: 'A default route is just the least specific static route. It is used when no more specific entry matches the destination.'
                }
              ]
            },
            {
              title: 'Verification and Failure Checks',
              content: `<p>Static routes are easy to configure incorrectly because the syntax may be accepted even when the path is unusable. That is why verification matters: you need to confirm the route is installed, the next hop is reachable, and real traffic follows the intended path.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Static-route validation checklist',
                  items: [
                    'Use show ip route to confirm the prefix appears in the routing table.',
                    'Verify the outgoing interface or next hop is actually reachable.',
                    'Use ping or traceroute to confirm real forwarding behavior.',
                    'If the route is missing, check for interface failure or an unresolved next hop.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Static routes are manually defined and are useful for simple, stable, or backup path design.',
            'An IPv4 static route can reference a next-hop IP, an exit interface, or both.',
            'Default routes are simply catch-all routes used when no more specific prefix exists.',
            'A static route must still be validated in the routing table and with real reachability tests.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-connectivity', '3.5', 'IPv4 Troubleshooting', [
        'Interpret ping and traceroute results, TTL behavior, and reverse-path dependency.',
        'Compare IOS UDP traceroute with Windows ICMP traceroute and extended ping use cases.',
      ], 'decision-simulator', 'Ping & Traceroute Simulator', 'Scenario diagnosis + MCQ', { icon: 'TIME', simulationRouteId: 'ttl-simulation', quizBank: 'quizBanks/ipConnectivity/ipv4Troubleshooting', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What Ping and Traceroute Really Test',
              content: `<p><strong>Ping</strong> is the fastest basic reachability test. It answers whether the destination responded and whether the return path also worked. <strong>Traceroute</strong> goes further by showing the routed path hop by hop, which makes it useful when reachability fails somewhere in the middle rather than at the endpoints only.</p><p>A beginner trap is to treat a failed ping as one single problem. In reality, failure can come from local interface issues, missing routes, ACL policy, broken reverse path, or an endpoint that simply does not answer the test.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'What each tool gives you',
                  items: [
                    'Ping is a binary reachability and latency sanity check.',
                    'Traceroute exposes where along the path the response pattern changes.',
                    'Both depend on a usable return path, not only a usable forward path.'
                  ]
                }
              ]
            },
            {
              title: 'TTL and Traceroute Behavior',
              content: `<p>Traceroute works by sending packets with increasing <strong>TTL</strong> values. When a router decrements TTL to zero, it returns a time-exceeded message. By starting with a low TTL and increasing it one hop at a time, traceroute maps the path through the routed network.</p><p>The command varies by platform. Cisco IOS traditionally uses <strong>UDP</strong> traceroute by default, while Windows commonly uses <strong>ICMP</strong>. The goal is the same, but the packet type on the wire differs.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Traceroute comparison',
                  columns: ['Platform style', 'Typical probe type', 'Operational meaning'],
                  rows: [
                    ['Cisco IOS traceroute', 'UDP', 'Routers respond when TTL expires along the path'],
                    ['Windows tracert', 'ICMP', 'Same hop-mapping goal using ICMP echo style probes']
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'TTL tells you router count',
                  content: 'TTL is decremented by routers, not by switches. If the traceroute advances one hop, one routed device handled the packet.'
                }
              ]
            },
            {
              title: 'A Clean Troubleshooting Workflow',
              content: `<p>Good IPv4 troubleshooting starts nearest to the failure domain and expands outward. Check the local interface, then the local default gateway, then the route logic, then the remote side. This prevents you from jumping into deep routing theory when the real problem is a shut interface or a missing ARP resolution.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'IPv4 troubleshooting sequence',
                  items: [
                    'Validate local addressing, mask, and gateway assumptions.',
                    'Test local interface and default gateway reachability first.',
                    'Use show ip route and show ip interface brief to confirm router readiness.',
                    'Use traceroute to locate the hop where the path or response pattern breaks.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Ping tests basic reachability, while traceroute reveals how traffic behaves hop by hop.',
            'Both tools depend on a usable return path, not only the forward path.',
            'Traceroute maps routers by exploiting TTL expiration behavior.',
            'Cisco IOS and Windows use different default probe styles, but the troubleshooting goal is the same.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-connectivity', '3.6', 'OSPF Concepts', [
        'Explain link-state flooding, the LSDB, SPF calculation, neighbor states, and DR/BDR election.',
        'Track the control packets that move an adjacency from Down to Full.',
      ], 'state-machine', 'OSPF Neighbor State Machine', 'State-sequence ordering', { icon: 'ROUTE', quizBank: 'quizBanks/ipConnectivity/ospfConcepts', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why OSPF Is Different',
              content: `<p>OSPF is a <strong>link-state</strong> routing protocol. Instead of exchanging full routing tables in the style of a classic distance-vector protocol, OSPF builds a shared view of topology through link-state advertisements and then runs the <strong>Shortest Path First (SPF)</strong> calculation to determine the best routes.</p><p>The operational idea is that routers first agree on topology information, then each router calculates its own best paths from that database.</p>`,
              blocks: [
                {
                  type: 'keyTerms',
                  title: 'Core OSPF terms',
                  terms: [
                    { term: 'LSDB', definition: 'The link-state database, which is the shared topology map built from OSPF advertisements.' },
                    { term: 'SPF', definition: 'The algorithm that calculates the best paths after the LSDB is built.' },
                    { term: 'Area', definition: 'A logical OSPF scope used to organize topology and control flooding behavior.' }
                  ]
                }
              ]
            },
            {
              title: 'Neighbor Formation and Adjacency State',
              content: `<p>OSPF routers must first discover each other with <strong>Hello</strong> packets. From there, the relationship moves through neighbor states until the routers are ready to exchange full topology information. Not every neighbor becomes fully adjacent in the same way on every network type, which is why state reasoning matters.</p>`,
              blocks: [
                {
                  type: 'steps',
                  title: 'Common OSPF state progression',
                  items: [
                    'Down: no valid Hellos are being seen from the peer.',
                    'Init: a Hello was received from the peer.',
                    '2-Way: bidirectional Hello awareness exists.',
                    'ExStart and Exchange: database synchronization begins.',
                    'Loading and Full: missing details are requested and the adjacency is completed.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: '2-Way is not Full',
                  content: 'Seeing a neighbor in 2-Way state means bidirectional discovery exists, but it does not automatically mean the routers are fully adjacent.'
                }
              ]
            },
            {
              title: 'Flooding, DR/BDR, and Route Calculation',
              content: `<p>Once adjacencies exist, OSPF floods link-state information so routers can maintain a consistent LSDB. On multiaccess networks, OSPF uses <strong>DR</strong> and <strong>BDR</strong> roles to reduce unnecessary full-mesh adjacency overhead. After the LSDB is synchronized, each router runs SPF to choose the best paths.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'OSPF concept checkpoints',
                  items: [
                    'OSPF shares topology information first and calculates routes second.',
                    'Hello packets support neighbor discovery and maintenance.',
                    'DR and BDR roles matter on multiaccess segments.',
                    'The routing table is the result of SPF, not the thing being flooded directly.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'OSPF is a link-state protocol that builds an LSDB and then runs SPF to calculate best paths.',
            'Neighbor discovery begins with Hello packets and progresses through defined states before full adjacency.',
            'DR and BDR roles help scale OSPF behavior on multiaccess networks.',
            'OSPF floods topology information, not a simple copy of the routing table.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-connectivity', '3.7', 'OSPF Configuration', [
        'Configure OSPF networks, passive interfaces, cost behavior, and default-route advertisement.',
        'Verify adjacency and route learning with common show commands.',
      ], 'config-lab', 'OSPF Config Lab', 'Config fill-in + verification', { icon: 'CONFIG', quizBank: 'quizBanks/ipConnectivity/ospfConfiguration', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What OSPF Configuration Is Trying to Achieve',
              content: `<p>Configuring OSPF is not only about turning on a routing protocol. You are telling the router which interfaces should participate, what router identity it should use, and how the router should advertise or suppress certain information inside the OSPF design.</p><p>The exam-level skill is to connect commands to behavior: if an interface is in OSPF, it sends Hellos; if it is passive, it advertises the network without attempting neighbor formation on that interface.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Core configuration decisions',
                  items: [
                    'Choose the OSPF process and router ID intentionally.',
                    'Enable the correct interfaces or networks inside the correct area.',
                    'Decide which interfaces should remain passive.',
                    'Verify that the protocol behavior matches the intended topology.'
                  ]
                }
              ]
            },
            {
              title: 'Router ID, Passive Interfaces, Cost, and Default Information',
              content: `<p>The <strong>router ID</strong> is the logical identifier OSPF uses for the device. It matters for neighbor relationships and troubleshooting readability. <strong>Passive interfaces</strong> let the router advertise the connected network without sending Hellos out that interface, which is useful on user-facing or non-neighbor segments.</p><p>OSPF also supports cost tuning and, when appropriate, default-route advertisement. These controls shape path choice and what routing information other devices see.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Configuration features and intent',
                  columns: ['Feature', 'Purpose', 'Operational effect'],
                  rows: [
                    ['Router ID', 'Identify the router inside OSPF', 'Makes neighbor and topology output deterministic'],
                    ['Passive interface', 'Stop Hellos where neighbors should not form', 'Advertises the network without adjacency on that link'],
                    ['Cost tuning', 'Influence preferred path selection', 'Changes SPF preference for competing paths'],
                    ['Default-information originate', 'Inject a default route into OSPF', 'Allows downstream routers to use this router as an exit point']
                  ]
                }
              ]
            },
            {
              title: 'Verification After Configuration',
              content: `<p>OSPF configuration is incomplete until you verify neighbor relationships and learned routes. The most useful operational questions are straightforward: did the adjacency form, did routes appear, and does the selected path match the design?</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'OSPF verification flow',
                  items: [
                    'Use show ip ospf neighbor to confirm adjacency state.',
                    'Use show ip route ospf to confirm learned routes appear in the routing table.',
                    'Use show ip protocols or show running-config to confirm passive-interface and area choices.',
                    'If the expected route is missing, check adjacency first before blaming SPF.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'OSPF configuration defines router identity, participating interfaces, and area membership.',
            'Passive interfaces advertise networks without attempting neighbor formation on that interface.',
            'OSPF cost tuning and default-route advertisement change operational path behavior and visibility.',
            'Neighbor verification and route verification are the first post-configuration checks.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-connectivity', '3.8', 'OSPF Network Types & Neighbors', [
        'Compare the five OSPF network types and their neighbor expectations.',
        'Diagnose adjacency failure from mismatched area, timers, MTU, or network type.',
      ], 'decision-simulator', 'OSPF Adjacency Checker', 'Requirement checklist MCQ', { icon: 'FOCUS', quizBank: 'quizBanks/ipConnectivity/ospfNetworkTypesNeighbors', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'OSPF Network Types Change Expectations',
              content: `<p>OSPF behavior is not identical on every link. The <strong>network type</strong> influences how Hellos behave, whether a DR and BDR are elected, and what kind of adjacency pattern the routers expect. This is why you cannot debug every OSPF interface with one memorized assumption.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Common OSPF network-type behavior',
                  columns: ['Network type', 'Typical trait', 'Why it matters'],
                  rows: [
                    ['Broadcast', 'DR/BDR election on multiaccess media', 'Common on Ethernet segments'],
                    ['Point-to-point', 'No DR/BDR election', 'Simple two-router adjacency logic'],
                    ['Nonbroadcast', 'Neighbor handling differs on NBMA media', 'Requires different operational expectations'],
                    ['Point-to-multipoint', 'Treats peers as point-to-point style relationships', 'Useful when a full broadcast model is not appropriate'],
                    ['Point-to-multipoint nonbroadcast', 'Similar design intent with no broadcast assumption', 'Changes discovery expectations further']
                  ]
                }
              ]
            },
            {
              title: 'Why Adjacencies Fail',
              content: `<p>OSPF adjacency problems usually come from a small set of mismatches. If area, timers, MTU, or network-type assumptions do not align, the routers may see each other partially or not at all. The troubleshooting skill is to stop guessing and compare the required conditions one by one.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Frequent adjacency blockers',
                  items: [
                    'Area mismatch',
                    'Hello and dead timer mismatch',
                    'MTU mismatch',
                    'Wrong network type expectation',
                    'Interface not actually participating in OSPF'
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Partial visibility still counts as a clue',
                  content: 'If a router appears stuck before Full state, the problem is often not complete reachability failure but a mismatch during database exchange or adjacency requirements.'
                }
              ]
            },
            {
              title: 'Reading the Symptom Like an Engineer',
              content: `<p>Adjacency troubleshooting becomes much faster when you translate the symptom into a requirement question. Are Hellos being exchanged? Is the area correct? Is the network type consistent with the link? Is the database exchange finishing?</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Adjacency troubleshooting checklist',
                  items: [
                    'Confirm the interface is enabled for OSPF and in the expected area.',
                    'Compare Hello and dead timers on both sides.',
                    'Confirm the network type matches the design expectations of the link.',
                    'If progress stops after 2-Way or Exchange, investigate MTU or database-sync issues next.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'OSPF network type changes neighbor expectations and DR or BDR behavior.',
            'Broadcast and point-to-point links do not behave identically in OSPF.',
            'Area, timer, MTU, and network-type mismatches are common causes of adjacency failure.',
            'Adjacency troubleshooting is strongest when you compare explicit requirements instead of guessing.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-connectivity', '3.9', 'Multi-Area OSPF', [
        'Explain Area 0, ABRs, ASBRs, and inter-area versus external route types.',
        'Identify the router roles and LSA behavior in a multi-area design.',
      ], 'topology-builder', 'Multi-Area OSPF Topology', 'Router-type labeling', { icon: 'NET', quizBank: 'quizBanks/ipConnectivity/multiAreaOspf', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why Multi-Area OSPF Exists',
              content: `<p>As OSPF domains grow, one flat area becomes harder to scale operationally. Multi-area OSPF uses <strong>Area 0</strong> as the backbone and organizes other areas around it. The design goal is to keep topology exchange structured while still preserving end-to-end reachability.</p><p>The backbone area matters because inter-area communication depends on it. That is why Area 0 is not just another number; it is the central reference area in the multi-area design.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Core multi-area roles',
                  columns: ['Role', 'Meaning', 'Why it matters'],
                  rows: [
                    ['Backbone area (Area 0)', 'Central transit area', 'Inter-area traffic is anchored through the backbone'],
                    ['ABR', 'Area Border Router', 'Connects Area 0 to other areas and summarizes area knowledge'],
                    ['ASBR', 'Autonomous System Boundary Router', 'Injects routes from outside OSPF into the domain']
                  ]
                }
              ]
            },
            {
              title: 'Inter-Area and External Route Reasoning',
              content: `<p>Not every OSPF route represents the same kind of reachability. Some routes are learned from the local area, some arrive from another OSPF area, and some are external to OSPF entirely. The exam skill is to identify what the router is looking at and what device role likely introduced that information.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Route categories to separate mentally',
                  items: [
                    'Intra-area routes stay inside the current area view.',
                    'Inter-area routes cross an ABR boundary from another OSPF area.',
                    'External routes come into OSPF from outside the OSPF autonomous system through an ASBR.'
                  ]
                }
              ]
            },
            {
              title: 'Design and Troubleshooting Perspective',
              content: `<p>Multi-area OSPF questions are easier when you map the topology first and the route codes second. Identify which routers are inside one area only, which routers touch the backbone and another area, and which router is importing non-OSPF information. Once the roles are clear, the route behavior becomes much less abstract.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Multi-area reading checklist',
                  items: [
                    'Find Area 0 first and treat it as the backbone reference point.',
                    'Mark ABRs before trying to reason about inter-area routes.',
                    'Mark ASBRs before trying to reason about external routes.',
                    'Differentiate topology role questions from plain route-installation questions.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Multi-area OSPF uses Area 0 as the backbone that connects the wider design.',
            'ABRs connect areas to the backbone, while ASBRs inject routes from outside OSPF.',
            'Inter-area routes and external routes represent different sources of knowledge inside OSPF.',
            'Multi-area troubleshooting becomes easier when router roles are identified before route codes are analyzed.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-connectivity', '3.10', 'IPv6 Static Routing', [
        'Configure IPv6 routes, default routes, and link-local next-hop syntax requirements.',
        'Enable IPv6 unicast routing and verify installed routes.',
      ], 'config-lab', 'IPv6 Static Route Builder', 'Config fill-in + MCQ', { icon: 'CONFIG', quizBank: 'quizBanks/ipConnectivity/ipv6StaticRouting', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What Makes IPv6 Static Routing Slightly Different',
              content: `<p>IPv6 static routing follows the same basic logic as IPv4: the router needs a destination prefix and a usable forwarding path. The difference is that IPv6 relies heavily on interface-aware next-hop logic, especially when <strong>link-local addresses</strong> are involved.</p><p>There is also one global requirement that matters immediately: IPv6 forwarding behavior does not begin until the router has <code>ipv6 unicast-routing</code> enabled.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Core IPv6 static-routing ideas',
                  items: [
                    'Enable IPv6 routing globally before expecting routed behavior.',
                    'A route still needs a destination prefix and forwarding information.',
                    'Default IPv6 routes serve the same catch-all role as IPv4 defaults.'
                  ]
                }
              ]
            },
            {
              title: 'Global Unicast and Link-Local Next Hops',
              content: `<p>IPv6 static routes can use a global unicast next hop, an exit interface, or both. But when the next hop is a <strong>link-local address</strong>, the router also needs the exit interface because link-local addresses are only significant on the local segment. Without the interface context, the next hop is ambiguous.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'IPv6 static-route interpretation',
                  columns: ['Style', 'When it works cleanly', 'Why it matters'],
                  rows: [
                    ['Global unicast next hop', 'When the next-hop address is globally reachable', 'The router can resolve the path recursively'],
                    ['Exit interface', 'When the route is directly tied to one path', 'The router has explicit forwarding direction'],
                    ['Link-local next hop plus interface', 'When using a local-segment next-hop address', 'The interface is required to remove ambiguity']
                  ]
                }
              ]
            },
            {
              title: 'Verification and Failure Points',
              content: `<p>IPv6 static-route problems usually come from one of three issues: IPv6 forwarding is not globally enabled, the next-hop logic is incomplete, or the outgoing path is not actually usable. The verification approach is the same as everywhere else in routing: confirm the route installs, confirm the interface is healthy, and then test actual reachability.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'IPv6 static-route verification',
                  items: [
                    'Confirm ipv6 unicast-routing is enabled on the router.',
                    'Use show ipv6 route to verify the prefix installs correctly.',
                    'If using a link-local next hop, confirm the route also specifies the correct exit interface.',
                    'Use ping or traceroute tests to validate actual IPv6 forwarding behavior.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'IPv6 static routing uses the same basic destination-prefix logic as IPv4 static routing.',
            'The router must have ipv6 unicast-routing enabled for IPv6 forwarding to occur.',
            'Link-local next-hop routes require the exit interface because link-local scope is local to the segment.',
            'IPv6 static routes still need routing-table and real reachability verification.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-connectivity', '3.11', 'IPv6 Routing & NDP', [
        'Compare NDP with ARP and walk through NS, NA, RS, RA, DAD, and SLAAC.',
        'Explain why IPv6 neighbor discovery is more than a direct ARP replacement.',
      ], 'comparison-viewer', 'NDP vs ARP Comparison Simulator', 'Process-step ordering', { icon: 'ARP', quizBank: 'quizBanks/ipConnectivity/ipv6RoutingNdp', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why NDP Is More Than IPv6 ARP',
              content: `<p>Neighbor Discovery Protocol (NDP) is part of ICMPv6 and covers several jobs that IPv4 spreads across multiple mechanisms. It handles neighbor resolution, router discovery, duplicate-address checks, and parts of automatic addressing logic. That is why calling NDP "just IPv6 ARP" is too shallow.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'NDP message functions',
                  columns: ['Message', 'Purpose', 'Operational effect'],
                  rows: [
                    ['NS', 'Neighbor Solicitation', 'Ask for link-layer information or test address ownership'],
                    ['NA', 'Neighbor Advertisement', 'Reply with ownership or update neighbor knowledge'],
                    ['RS', 'Router Solicitation', 'Ask routers for immediate advertisement information'],
                    ['RA', 'Router Advertisement', 'Provide prefix and gateway-related guidance to hosts']
                  ]
                }
              ]
            },
            {
              title: 'SLAAC, DAD, and Address Formation',
              content: `<p>IPv6 hosts can form addresses and learn gateway-related information dynamically through <strong>SLAAC</strong>. Before using an address, the host performs <strong>Duplicate Address Detection (DAD)</strong> to make sure the address is not already in use on the link. This means neighbor discovery participates directly in safe address activation, not only in next-hop resolution.</p>`,
              blocks: [
                {
                  type: 'steps',
                  title: 'Simplified IPv6 host bring-up logic',
                  items: [
                    'The host listens for or requests router advertisement information.',
                    'The host forms or confirms its IPv6 address information.',
                    'The host performs DAD before using the address actively.',
                    'Neighbor resolution is then used for local-link forwarding decisions.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'Router advertisements do more than answer one host',
                  content: 'RA messages help hosts learn important local IPv6 behavior, including prefix context and default-router guidance.'
                }
              ]
            },
            {
              title: 'Operational Comparison with ARP',
              content: `<p>ARP answers one narrow IPv4 question: what MAC address owns this IPv4 address on the local segment? NDP still handles local next-hop resolution, but it also supports router discovery, reachability maintenance, and safe address use. That broader role is why IPv6 neighbor discovery is an ecosystem rather than a one-for-one ARP clone.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'NDP reasoning checklist',
                  items: [
                    'Use NS and NA for neighbor resolution and ownership confirmation.',
                    'Use RS and RA for host-to-router discovery logic.',
                    'Remember that SLAAC and DAD are part of the same operational family.',
                    'Do not reduce NDP to only MAC resolution.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'NDP handles neighbor resolution, router discovery, and safe address behavior in IPv6.',
            'NS and NA support local neighbor discovery, while RS and RA support router discovery and host guidance.',
            'SLAAC and DAD make NDP broader than a simple ARP replacement.',
            'IPv6 neighbor discovery is an operational framework, not a single-message feature.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-connectivity', '3.12', 'First Hop Redundancy (HSRP)', [
        'Explain virtual IP and MAC operation, active/standby roles, preemption, and load balancing design.',
        'Contrast HSRP with VRRP and GLBP.',
      ], 'decision-simulator', 'HSRP Failover Simulator', 'MCQ + scenario', { icon: 'PASS', quizBank: 'quizBanks/ipConnectivity/firstHopRedundancyHsrp', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why First Hop Redundancy Exists',
              content: `<p>Hosts usually rely on one default gateway address. If that single gateway fails, the host may still have working local connectivity but lose access to remote networks. First Hop Redundancy Protocols solve this by presenting a <strong>virtual gateway</strong> that remains available even if one physical device fails.</p><p>HSRP does this with a <strong>virtual IP address</strong> and a <strong>virtual MAC address</strong>. Hosts keep pointing at the same logical gateway, while the routers coordinate which one is actively forwarding.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Role model',
                  items: [
                    'One router is active and forwards for the virtual gateway.',
                    'Another router is standby and prepared to take over.',
                    'Hosts do not need to change their configured default gateway during failover.'
                  ]
                }
              ]
            },
            {
              title: 'Priority, Preemption, and Design Choices',
              content: `<p>HSRP elections use priority so the routers know which device should normally be active. <strong>Preemption</strong> allows a higher-priority router to reclaim the active role after it returns. Engineers can also use interface tracking so a router gives up the active role when an important upstream path fails, not only when the whole box dies.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'HSRP operational controls',
                  columns: ['Control', 'Purpose', 'Result'],
                  rows: [
                    ['Priority', 'Choose the preferred active router', 'Higher-priority device is preferred'],
                    ['Preemption', 'Allow the preferred router to reclaim active status', 'Restores intended primary ownership after recovery'],
                    ['Tracking', 'React to important path failure', 'Reduces active priority when key connectivity is lost']
                  ]
                }
              ]
            },
            {
              title: 'HSRP Compared with VRRP and GLBP',
              content: `<p>HSRP is Cisco-oriented first-hop redundancy logic. <strong>VRRP</strong> serves a similar gateway redundancy purpose with a standards-based orientation, while <strong>GLBP</strong> goes further by combining gateway redundancy with load-sharing behavior. The exam skill is to understand the design intent of each protocol rather than memorize them as unrelated acronyms.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'FHRP comparison lens',
                  items: [
                    'HSRP provides active and standby gateway redundancy.',
                    'VRRP provides similar first-hop redundancy with a standards-based model.',
                    'GLBP adds load sharing in addition to gateway redundancy.',
                    'All three exist to keep the first-hop gateway function available to hosts.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'First-hop redundancy keeps remote-network access available even if one physical gateway fails.',
            'HSRP presents a virtual IP and virtual MAC so hosts keep using one logical default gateway.',
            'Priority, preemption, and tracking determine how failover and recovery behave.',
            'HSRP, VRRP, and GLBP share the first-hop redundancy goal but differ in standards position and load-sharing behavior.'
          ]
        },
        sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
    ],
  }),
  domain({
    id: 'ip-services',
    examDomain: 4,
    title: 'IP Services',
    shortTitle: 'IP Services',
    icon: 'PORTS',
    color: '#29b6f6',
    difficulty: 'intermediate',
    examWeight: 10,
    estimatedHours: 7,
    learningGoal: 'Configure and verify essential network services that support network operation.',
    prerequisites: ['ip-connectivity'],
    topicGroups: [
      { id: 'services-nat', title: 'NAT', topicCodes: ['4.1', '4.2', '4.3'] },
      { id: 'services-core', title: 'Core Services', topicCodes: ['4.4', '4.5', '4.6'] },
      { id: 'services-management', title: 'Secure Management & Monitoring', topicCodes: ['4.7', '4.8', '4.9'] },
      { id: 'services-qos-transfer', title: 'QoS & File Transfer', topicCodes: ['4.10', '4.11'] },
    ],
    finalExam: { questionCount: 25, passingScore: 80, quizType: 'mcq-config-table', bank: 'quizBanks/ipServices/domain4FinalExam' },
    topics: [
      topic('ip-services', '4.1', 'NAT Concepts & Terminology', [
        'Define inside local, inside global, outside local, and outside global terminology.',
        'Explain that NAT terminology is perspective-based and changes as packets traverse the edge.',
      ], 'diagram-builder', 'NAT Terminology Labeler', 'Address-labeling exercise', { icon: 'TABLE', quizBank: 'quizBanks/ipServices/natConceptsTerminology', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why NAT Exists',
              content: `<p>Network Address Translation (NAT) exists mainly because private IPv4 addressing must often reach public IPv4 destinations through a limited number of public addresses. NAT lets the edge device change addressing information as packets cross the boundary between the inside network and the outside network.</p><p>At the CCNA level, the important point is that NAT is not a routing protocol. Routing decides <strong>where</strong> the packet goes; NAT changes <strong>how the addresses are represented</strong> as the packet passes the edge.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Operational role of NAT',
                  items: [
                    'Private RFC 1918 addresses are typically translated before Internet access.',
                    'The edge router or firewall performs the translation at the boundary.',
                    'NAT changes address representation, while routing still determines the path.'
                  ]
                }
              ]
            },
            {
              title: 'Inside and Outside Terminology',
              content: `<p>NAT terms are perspective-based. The labels <strong>inside</strong> and <strong>outside</strong> describe which side of the translation boundary the host belongs to. The labels <strong>local</strong> and <strong>global</strong> describe whether the address is the internal-facing form or the externally significant form.</p><p>This is why the same packet can be described with multiple terms without changing the underlying endpoint. The terms explain how the address is viewed at the NAT boundary.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Core NAT terms',
                  columns: ['Term', 'Meaning', 'Typical example'],
                  rows: [
                    ['Inside local', 'The inside host address as it exists on the internal network', '192.168.10.10'],
                    ['Inside global', 'The translated public representation of the inside host', '203.0.113.10'],
                    ['Outside global', 'The real address of the outside host as known globally', '198.51.100.20'],
                    ['Outside local', 'How the outside host appears from the inside perspective', 'Often the same as the outside global address']
                  ]
                }
              ]
            },
            {
              title: 'Reading a NAT Scenario Correctly',
              content: `<p>Most NAT exam questions become manageable when you mark the inside device first, then decide which address is the untranslated internal address and which address is the translated public-facing form. After that, the outside host terms become easier to label.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'NAT terminology workflow',
                  items: [
                    'Identify which device is on the inside network.',
                    'Mark the original internal address as the inside local address.',
                    'Mark the translated public representation as the inside global address.',
                    'Treat outside local and outside global as perspective labels for the remote endpoint.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'NAT changes address representation at the network edge; routing still determines the packet path.',
            'Inside and outside identify the side of the boundary, while local and global identify the address perspective.',
            'Inside local is the original internal address, and inside global is the translated public form.',
            'NAT terminology questions are easiest when solved from the translation boundary outward.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-services', '4.2', 'Static NAT', [
        'Explain one-to-one address mapping and the required inside/outside interface roles.',
        'Verify static translations and bidirectional reachability.',
      ], 'config-lab', 'Static NAT Lab', 'Config fill-in + table reading', { icon: 'CONFIG', quizBank: 'quizBanks/ipServices/staticNat', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What Static NAT Does',
              content: `<p>Static NAT creates a permanent <strong>one-to-one</strong> mapping between an inside local address and an inside global address. It is commonly used when an internal server must be reachable from outside networks through one stable public address.</p><p>Because the mapping is fixed, static NAT is predictable and easy to document. The tradeoff is that each published internal service generally consumes a dedicated public address.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'When static NAT fits best',
                  items: [
                    'Publishing an internal server with a stable public address.',
                    'Creating a predictable one-to-one translation for documentation and troubleshooting.',
                    'Supporting bidirectional reachability where the outside network must initiate sessions inward.'
                  ]
                }
              ]
            },
            {
              title: 'Inside and Outside Interface Roles',
              content: `<p>Static NAT depends on correct interface roles. The inside interface faces the private addressing side, and the outside interface faces the public or upstream side. Without those roles, the router does not know where translation should happen.</p><p>The translation itself is simple: traffic leaving the inside can have its source changed to the configured public mapping, and traffic arriving from the outside toward that public address can be translated back toward the internal host.</p>`,
              blocks: [
                {
                  type: 'steps',
                  title: 'Static NAT logic',
                  items: [
                    'Choose the inside local address that represents the internal host.',
                    'Choose the public inside global address that will represent that host externally.',
                    'Mark the correct interfaces as NAT inside and NAT outside.',
                    'Verify that traffic can translate in the intended direction.'
                  ]
                }
              ]
            },
            {
              title: 'Verification and Common Failure Points',
              content: `<p>Static NAT syntax alone does not guarantee the service will work. You still need correct routing, correct inside and outside roles, and a path for return traffic. Verification should always include both the translation table and actual reachability testing.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Static NAT validation',
                  items: [
                    'Confirm the static mapping was configured with the correct inside local and inside global addresses.',
                    'Verify the interfaces are marked correctly as inside and outside.',
                    'Use show ip nat translations or related verification output to confirm the mapping exists.',
                    'Test both outbound and inbound reachability where the design requires it.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'examTip',
                  title: 'One translation, one public identity',
                  content: 'Static NAT is the cleanest model to recognize on the exam because one internal address maps to one stable public address.'
                }
              ]
            }
          ],
          keyTakeaways: [
            'Static NAT is a permanent one-to-one mapping between an inside local and inside global address.',
            'It is commonly used to publish internal services that need a stable external identity.',
            'Correct NAT inside and NAT outside interface roles are required for translation to occur properly.',
            'Verification must include both translation-state checks and real reachability testing.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-services', '4.3', 'Dynamic NAT & PAT', [
        'Configure pools, match ACLs, overload behavior, and interface PAT.',
        'Track concurrent sessions with address-plus-port translation state.',
      ], 'decision-simulator', 'PAT Session Tracker', 'MCQ + table interpretation', { icon: 'CYCLE', quizBank: 'quizBanks/ipServices/dynamicNatPat', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Dynamic NAT Versus PAT',
              content: `<p><strong>Dynamic NAT</strong> uses a pool of public addresses and creates temporary one-to-one translations as sessions require them. <strong>PAT</strong>, also called NAT overload, goes further by allowing many inside hosts to share one public address through unique Layer 4 port translations.</p><p>At the CCNA level, this distinction matters because dynamic NAT can run out of addresses in the pool, while PAT is the common model for scaling many clients through one public IP.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Translation models',
                  columns: ['Model', 'Address behavior', 'Operational impact'],
                  rows: [
                    ['Dynamic NAT', 'Temporary one-to-one mapping from a public pool', 'Pool size limits simultaneous translations'],
                    ['PAT / overload', 'Many inside hosts share one public IP using unique source ports', 'Scales far better for common Internet access designs']
                  ]
                }
              ]
            },
            {
              title: 'Pools, ACL Matching, and Overload Logic',
              content: `<p>Dynamic NAT and PAT both rely on matching inside traffic that should be translated. In Cisco-style configuration, an ACL commonly identifies which inside source addresses are eligible, and the router then applies either a pool or an overload rule to that traffic.</p><p>The key design question is simple: are you assigning one public address per session from a pool, or are you multiplexing many sessions through shared public addressing with ports?</p>`,
              blocks: [
                {
                  type: 'steps',
                  title: 'Dynamic NAT or PAT workflow',
                  items: [
                    'Define which inside source traffic should be translated.',
                    'Decide whether translation uses a public pool or overload on one address or interface.',
                    'Mark inside and outside interfaces correctly.',
                    'Verify the translation table while traffic is active.'
                  ]
                }
              ]
            },
            {
              title: 'Translation State and Exhaustion',
              content: `<p>PAT works because the router tracks conversations using address-plus-port combinations. Dynamic NAT without overload does not have that same scaling advantage, so the pool can be exhausted when too many concurrent inside hosts need translations.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'What to look for operationally',
                  items: [
                    'Dynamic NAT consumes public addresses from a defined pool.',
                    'PAT distinguishes simultaneous sessions by translated source ports.',
                    'Translation tables are the evidence that the design is working as intended.',
                    'If new sessions fail under dynamic NAT, check for pool exhaustion first.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Dynamic NAT uses temporary one-to-one translations from a public address pool.',
            'PAT allows many inside hosts to share one public IP by tracking unique Layer 4 ports.',
            'ACL matching and correct inside or outside interface roles still control which traffic is translated.',
            'PAT scales better than plain dynamic NAT because pool exhaustion is less likely in common client-access designs.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-services', '4.4', 'NTP', [
        'Explain strata, primary and secondary servers, peer relationships, and authentication basics.',
        'Read NTP associations and timing state from IOS output.',
      ], 'diagram-builder', 'NTP Stratum Hierarchy Builder', 'Stratum calculation + MCQ', { icon: 'TIME', quizBank: 'quizBanks/ipServices/ntp', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why Accurate Time Matters',
              content: `<p>Network Time Protocol (NTP) keeps device clocks synchronized. That sounds simple, but accurate time is foundational for log correlation, certificate validation, troubleshooting sequences, and security investigations. If device clocks disagree, the evidence trail across the network becomes much harder to trust.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Why engineers care about time sync',
                  items: [
                    'Logs from different devices must line up during troubleshooting.',
                    'Security events are harder to investigate when timestamps drift.',
                    'Consistent time improves change tracking, monitoring, and auditability.'
                  ]
                }
              ]
            },
            {
              title: 'Strata and Time Hierarchy',
              content: `<p>NTP uses a hierarchy of time sources called <strong>strata</strong>. A device directly connected to an authoritative source such as an atomic clock or GPS reference is stratum 1. Devices that learn from those sources become higher-stratum consumers. As the stratum number rises, the source is generally farther from the original reference.</p><p>In design terms, a device may behave as an NTP client consuming time from an upstream source, as a server providing time to downstream devices, or in some cases as a peer in a more collaborative relationship. The CCNA expectation is to recognize the hierarchy and the direction of trust in the time chain.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Reading NTP strata',
                  columns: ['Stratum', 'General meaning', 'Operational reading'],
                  rows: [
                    ['1', 'Directly tied to an authoritative reference source', 'Top-level reference in the hierarchy'],
                    ['2', 'Learns from a stratum 1 source', 'A secondary but still strong source'],
                    ['Higher numbers', 'Further away from the original reference', 'More hops away from the authoritative source']
                  ]
                },
                {
                  type: 'keyTopic',
                  title: 'Role relationships',
                  items: [
                    'An NTP client learns time from a chosen upstream source.',
                    'An NTP server provides time to downstream devices.',
                    'Peer relationships can help devices compare and maintain time with each other under the intended design.'
                  ]
                }
              ]
            },
            {
              title: 'Associations and Verification',
              content: `<p>NTP is not just about configuration; it is about confirming that the device has formed a usable time relationship with an intended source. Commands such as <code>show ntp status</code> and <code>show ntp associations</code> help you verify whether synchronization is working and which source is currently trusted.</p><p>Authentication basics matter because bad time is still bad time even if it looks synchronized. The secure operational mindset is that devices should trust intended sources rather than blindly accepting time information from anywhere.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'NTP verification flow',
                  items: [
                    'Confirm the intended server or peer relationship is configured.',
                    'Check NTP status to see whether the device is synchronized.',
                    'Use association output to identify which source is selected.',
                    'Investigate reachability, authentication, and hierarchy problems if synchronization is missing.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'NTP synchronizes device clocks so logs, security events, and operational evidence stay trustworthy.',
            'Stratum numbers describe how far a device is from an authoritative reference source.',
            'Lower stratum generally means closer to the reference source in the time hierarchy.',
            'NTP must be verified with operational status and association output, not only by configuration syntax.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-services', '4.5', 'DNS', [
        'Walk recursive and iterative DNS resolution from client to root, TLD, and authoritative servers.',
        'Relate record types, cache behavior, and TTL to name resolution outcomes.',
      ], 'packet-animator', 'DNS Resolution Walkthrough', 'Query-path ordering', { icon: 'DOCS', quizBank: 'quizBanks/ipServices/dns', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What DNS Really Does',
              content: `<p>Domain Name System (DNS) translates human-readable names into IP addresses. In practice, DNS is a distributed and hierarchical database rather than one single server. Clients usually ask a local resolver first, and that resolver may then walk the hierarchy to find an authoritative answer.</p><p>For the CCNA, the operational point is that DNS is both an application service and a dependency for many other workflows. Name resolution issues often look like network failure even when basic IP reachability is still fine.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Why DNS matters operationally',
                  items: [
                    'Applications commonly depend on names even when the underlying network uses IP addresses.',
                    'A DNS failure can look like a connectivity problem to the user.',
                    'Resolvers, caches, and authoritative servers each play different roles in the lookup path.'
                  ]
                }
              ]
            },
            {
              title: 'Recursive and Iterative Resolution',
              content: `<p>A <strong>recursive</strong> query asks the resolver to return the final answer if possible. An <strong>iterative</strong> process returns referrals that guide the resolver to the next server in the hierarchy. In a normal lookup path, a client usually expects recursion from its local resolver, while the resolver performs iterative discovery toward root, TLD, and authoritative servers.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Recursive versus iterative behavior',
                  columns: ['Model', 'Who performs the work', 'Typical result'],
                  rows: [
                    ['Recursive query', 'The resolver takes responsibility for finding the final answer', 'The client receives the final resolution if available'],
                    ['Iterative query', 'The responder points toward the next likely server', 'The resolver continues the lookup through the hierarchy']
                  ]
                }
              ]
            },
            {
              title: 'Record Types, Caching, and TTL',
              content: `<p>DNS records describe different kinds of information. A and AAAA records map names to IPv4 and IPv6 addresses, CNAME provides aliases, MX identifies mail exchangers, and PTR supports reverse lookup. DNS caches improve efficiency, and <strong>TTL</strong> controls how long cached information is considered valid.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'DNS reasoning checklist',
                  items: [
                    'Separate the client resolver role from the authoritative server role.',
                    'Remember that recursion is usually expected by the client-facing resolver.',
                    'Use the correct record type for the question being asked.',
                    'Treat TTL as the lifetime of cached information rather than a routing timer.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'DNS is a distributed naming system that resolves hostnames to IP addresses.',
            'Clients usually rely on recursive resolution from a local resolver, while the resolver performs iterative discovery through the hierarchy.',
            'Common record types include A, AAAA, CNAME, MX, NS, and PTR.',
            'Caching improves efficiency, and TTL controls how long cached DNS information is kept.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-services', '4.6', 'DHCP', [
        'Explain DORA, client/server ports, pools, excluded addresses, and relay operation.',
        'Track source and destination addressing changes across the DHCP exchange.',
      ], 'packet-animator', 'DHCP DORA Animator', 'DORA sequence + MCQ', { icon: 'PKT', quizBank: 'quizBanks/ipServices/dhcp', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why DHCP Exists',
              content: `<p>Dynamic Host Configuration Protocol (DHCP) automates client addressing so hosts can learn IP configuration without manual per-device setup. A DHCP exchange can provide much more than just an address: it can also deliver the subnet mask, default gateway, DNS servers, and lease timing.</p><p>Because routers do not forward broadcasts by default, DHCP design questions often become relay questions when the client and the server are on different subnets.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'What DHCP commonly provides',
                  items: [
                    'An IPv4 address from the intended scope or pool.',
                    'Default gateway information for off-subnet traffic.',
                    'DNS server information and lease timing details.'
                  ]
                }
              ]
            },
            {
              title: 'The DORA Exchange',
              content: `<p>DHCP is often taught through the <strong>DORA</strong> sequence: Discover, Offer, Request, and Acknowledge. The client starts by broadcasting to find a server. The server offers an address, the client requests that offer, and the server acknowledges the lease. On the exam, you should also remember the client and server UDP ports: client 68 and server 67.</p>`,
              blocks: [
                {
                  type: 'steps',
                  title: 'DHCP DORA flow',
                  items: [
                    'Discover: the client broadcasts to find available DHCP servers.',
                    'Offer: a server proposes an address and related configuration.',
                    'Request: the client asks to use the selected offer.',
                    'Acknowledge: the server confirms the lease and configuration.'
                  ]
                }
              ]
            },
            {
              title: 'Pools, Exclusions, and Relay',
              content: `<p>DHCP servers allocate addresses from a defined pool. Administrators often exclude important addresses such as gateways or statically assigned infrastructure nodes. If the client and server are separated by a router, a relay feature such as <code>ip helper-address</code> forwards the client broadcast as unicast to the remote server.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'DHCP operational checklist',
                  items: [
                    'Confirm the address pool matches the intended subnet.',
                    'Exclude addresses that should remain reserved or static.',
                    'Verify the default router and DNS values in the pool configuration.',
                    'Use relay when the client and the DHCP server are on different routed segments.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'DHCP automates IP configuration and can provide addressing, gateway, DNS, and lease information.',
            'The DORA sequence is Discover, Offer, Request, and Acknowledge.',
            'DHCP uses UDP 67 on the server side and UDP 68 on the client side.',
            'Routers require relay behavior such as ip helper-address to support DHCP across subnets.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-services', '4.7', 'SSH & Remote Access', [
        'Contrast Telnet and SSH and configure the prerequisites for secure remote access.',
        'Apply VTY protections including login methods, transport settings, and access control.',
      ], 'config-lab', 'SSH Configuration Lab', 'Step-sequence fill-in', { icon: 'CLI', quizBank: 'quizBanks/ipServices/sshRemoteAccess', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why SSH Replaced Telnet',
              content: `<p>Telnet provides remote terminal access but sends data, including credentials, in clear text. Secure Shell (SSH) solves that problem by encrypting the management session. For modern network operations, SSH is the expected standard for secure CLI-based remote administration.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Telnet versus SSH',
                  columns: ['Protocol', 'Security model', 'Operational meaning'],
                  rows: [
                    ['Telnet', 'Clear text', 'Legacy access method that should be avoided for production management'],
                    ['SSH', 'Encrypted session', 'Preferred CLI remote-access method for secure administration']
                  ]
                }
              ]
            },
            {
              title: 'SSH Prerequisites and VTY Setup',
              content: `<p>SSH does not appear automatically. The device needs the basic prerequisites such as a hostname, a domain name, and locally generated cryptographic keys. VTY lines must then be configured to use secure login methods and to permit SSH as the transport.</p>`,
              blocks: [
                {
                  type: 'steps',
                  title: 'Secure remote-access sequence',
                  items: [
                    'Set hostname and domain information required for key generation.',
                    'Generate the cryptographic keys needed for SSH.',
                    'Create the intended local user or AAA-backed login method.',
                    'Configure the VTY lines to use secure login and SSH transport.'
                  ]
                }
              ]
            },
            {
              title: 'Hardening the Remote-Access Surface',
              content: `<p>Secure remote access is more than enabling SSH. Engineers should also consider who is allowed to connect, which interfaces should accept management traffic, and how long idle sessions should remain open. ACL-based restriction and disciplined VTY configuration reduce unnecessary exposure.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Remote-access hardening checklist',
                  items: [
                    'Prefer SSH over Telnet for encrypted management sessions.',
                    'Use local users or AAA-backed authentication rather than weak shared access.',
                    'Restrict VTY access with transport settings and ACLs where appropriate.',
                    'Apply session timeout and management-plane hygiene to reduce exposure.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'SSH is the secure replacement for Telnet because it encrypts the management session.',
            'SSH requires prerequisites such as hostname, domain information, and key generation.',
            'VTY lines must be configured to allow SSH and use the intended login method.',
            'Secure remote access also depends on limiting who can reach the device and how the management plane is exposed.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-services', '4.8', 'SNMP', [
        'Explain NMS, managed devices, MIB/OID structure, and message types.',
        'Compare SNMPv1/v2c community-based security with SNMPv3 user-based security.',
      ], 'diagram-builder', 'SNMP Message Type Sorter', 'Message-type MCQ + port MCQ', { icon: 'TABLE', quizBank: 'quizBanks/ipServices/snmp', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What SNMP Is For',
              content: `<p>Simple Network Management Protocol (SNMP) lets a management system monitor and manage network devices. The manager, often called the <strong>NMS</strong>, communicates with an <strong>agent</strong> running on the managed device. The information is organized using the <strong>MIB</strong> and <strong>OID</strong> structure.</p><p>At the CCNA level, SNMP is about visibility and control, not forwarding. It gives operators a standardized way to read status and sometimes set values on managed infrastructure.</p>`,
              blocks: [
                {
                  type: 'keyTerms',
                  title: 'Core SNMP components',
                  terms: [
                    { term: 'NMS', definition: 'The network management station that polls or receives notifications from devices.' },
                    { term: 'Agent', definition: 'The SNMP-capable process on the managed device.' },
                    { term: 'MIB / OID', definition: 'The structured naming model for managed information and specific objects.' }
                  ]
                }
              ]
            },
            {
              title: 'Polling, Message Types, and Versions',
              content: `<p>SNMP often works through polling, where the manager asks the device for information. It can also use asynchronous notification through <strong>traps</strong>, where the device proactively alerts the manager. Security differs sharply by version: v1 and v2c rely on community strings, while v3 adds stronger authentication and encryption support.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'SNMP message and version comparison',
                  columns: ['Feature', 'What it means', 'Why it matters'],
                  rows: [
                    ['Get', 'The manager reads information from the agent', 'Supports regular monitoring and visibility'],
                    ['Set', 'The manager writes or changes a managed value', 'Provides limited remote management control'],
                    ['Trap / Inform', 'The agent sends an unsolicited event notification', 'Useful for faster awareness of important events'],
                    ['v1/v2c', 'Community-string model', 'Simple but weaker from a security perspective'],
                    ['v3', 'User-based model with stronger security', 'Preferred where secure management is required']
                  ]
                }
              ]
            },
            {
              title: 'Ports and Security Thinking',
              content: `<p>SNMP commonly uses UDP 161 for queries and UDP 162 for notifications such as traps. Because management traffic exposes device information and sometimes control, version choice and access limitation matter. On modern networks, the secure mindset is to prefer stronger SNMP models and restrict who can reach the management surface.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'SNMP reasoning checklist',
                  items: [
                    'Separate the management station role from the managed device role.',
                    'Know that Get and Set are manager-driven, while traps or informs are event-driven notifications.',
                    'Remember UDP 161 for queries and UDP 162 for notifications.',
                    'Treat SNMPv3 as the stronger security direction compared with v1 or v2c.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'SNMP gives management systems a standard way to monitor and sometimes manage network devices.',
            'Core SNMP components include the NMS, the agent, and the MIB or OID information model.',
            'Polling and traps are different behaviors: polling is manager-driven, while traps are device-driven notifications.',
            'SNMPv3 improves security compared with the older community-string model used by v1 and v2c.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-services', '4.9', 'Syslog', [
        'Interpret Syslog severity levels, destinations, and message structure.',
        'Configure console, monitor, buffer, and remote logging behavior.',
      ], 'diagram-builder', 'Syslog Message Decoder', 'Message-parsing exercise', { icon: 'LOG', quizBank: 'quizBanks/ipServices/syslog', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why Syslog Matters',
              content: `<p>Syslog provides a standard way for devices to generate and send log messages. Those messages can stay local in memory or on the console, and they can also be forwarded to a remote logging server for centralized visibility. In operations, Syslog is often the first place engineers look when they need event evidence.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'What Syslog gives the operator',
                  items: [
                    'A timeline of events reported by devices.',
                    'A consistent severity model for message importance.',
                    'The ability to centralize logging rather than checking each device one by one.'
                  ]
                }
              ]
            },
            {
              title: 'Severity Levels and Message Meaning',
              content: `<p>Syslog severity levels run from 0 to 7. Lower numbers indicate more urgent conditions, while higher numbers are less severe and often more verbose. The exam skill is to understand the ordering and to recognize that the logging destination and threshold determine what messages you actually keep or export.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Syslog severity overview',
                  columns: ['Level', 'Name', 'Operational meaning'],
                  rows: [
                    ['0', 'Emergency', 'System is unusable'],
                    ['1', 'Alert', 'Immediate action required'],
                    ['2', 'Critical', 'Serious failure condition'],
                    ['3', 'Error', 'Operational error condition'],
                    ['4', 'Warning', 'Warning or abnormal condition'],
                    ['5', 'Notification', 'Normal but significant event'],
                    ['6', 'Informational', 'Routine informational message'],
                    ['7', 'Debug', 'Detailed debugging output']
                  ]
                }
              ]
            },
            {
              title: 'Local and Remote Logging Strategy',
              content: `<p>Logging to the console, monitor session, buffer, and remote server each serves a different operational purpose. Centralized remote logging is powerful because it preserves events even when the individual device is unavailable or reloaded. At the same time, noisy destinations such as console logging can become distracting if not managed carefully.</p><p>At a basic interpretation level, Syslog messages combine <strong>facility</strong> and <strong>severity</strong> to describe what generated the message and how urgent it is. You do not need deep parser-level memorization for every platform, but you should understand that the message is more than just free text.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Syslog operational checklist',
                  items: [
                    'Know that Syslog uses UDP 514 in common network discussions.',
                    'Treat lower severity numbers as more urgent conditions.',
                    'Recognize facility and severity as the core structure behind Syslog event interpretation.',
                    'Differentiate local destinations such as console or buffer from remote log hosts.',
                    'Use centralized logging when long-term visibility and correlation matter.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Syslog provides a standard event-logging model for network devices.',
            'Severity levels run from 0 to 7, with lower numbers representing more urgent conditions.',
            'Devices can log locally and also forward messages to remote centralized collectors.',
            'Syslog is operational evidence, so destination choice and message severity both matter.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-services', '4.10', 'QoS Fundamentals', [
        'Explain delay, jitter, and loss sensitivity and the role of classification, marking, policing, and shaping.',
        'Map DSCP and per-hop behavior choices to voice and data treatment.',
      ], 'decision-simulator', 'QoS Policy Builder', 'DSCP value MCQ + scenario', { icon: 'FOCUS', quizBank: 'quizBanks/ipServices/qosFundamentals', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why QoS Exists',
              content: `<p>Quality of Service (QoS) exists because not all traffic reacts to congestion in the same way. Voice and video are more sensitive to <strong>delay</strong>, <strong>jitter</strong>, and <strong>loss</strong> than many bulk-data applications. QoS lets the network recognize traffic classes and apply differentiated treatment.</p><p>QoS does not create bandwidth from nothing. It decides how the available resources are used when the link becomes contested.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Core QoS problem space',
                  items: [
                    'Delay is how long packets take to arrive.',
                    'Jitter is variation in delay over time.',
                    'Loss is packet drop, which affects traffic classes differently.'
                  ]
                }
              ]
            },
            {
              title: 'Classification, Marking, Policing, and Shaping',
              content: `<p>QoS decisions begin by identifying traffic. <strong>Classification</strong> decides what the traffic is, and <strong>marking</strong> labels it for downstream treatment. <strong>Policing</strong> enforces a rate by dropping or remarking excess traffic, while <strong>shaping</strong> smooths traffic by buffering it and sending it more gradually.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'QoS building blocks',
                  columns: ['Function', 'Purpose', 'Typical effect'],
                  rows: [
                    ['Classification', 'Identify traffic type', 'Separates voice, signaling, bulk data, and other classes'],
                    ['Marking', 'Apply QoS labels such as DSCP', 'Lets downstream devices recognize treatment intent'],
                    ['Policing', 'Enforce a rate limit', 'May drop or remark excess traffic'],
                    ['Shaping', 'Smooth traffic to a target rate', 'Buffers and delays traffic rather than dropping immediately']
                  ]
                }
              ]
            },
            {
              title: 'DSCP and Treatment Strategy',
              content: `<p>QoS treatment often follows marked values such as DSCP. The exact queueing design can vary, but the exam-level skill is to understand why the network would prioritize real-time traffic differently from best-effort data. Voice commonly receives higher-priority treatment because it is especially sensitive to delay and jitter.</p><p>At a practical mapping level, the learner should connect a marking choice to an expected per-hop behavior. The point is not memorizing every enterprise QoS policy on earth, but understanding why one traffic class would be expedited while another remains best-effort.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Simple DSCP treatment map',
                  columns: ['Traffic class', 'Typical marking idea', 'Expected treatment'],
                  rows: [
                    ['Real-time voice', 'EF-style expedited marking', 'Higher-priority low-delay treatment'],
                    ['Interactive signaling or important control traffic', 'Marked above default but below strict voice priority', 'Protected from casual starvation while avoiding voice-like priority abuse'],
                    ['Ordinary data', 'Best-effort / default treatment', 'Normal forwarding without premium queue preference']
                  ]
                },
                {
                  type: 'checklist',
                  title: 'QoS reasoning checklist',
                  items: [
                    'QoS is about differentiated treatment under congestion, not infinite bandwidth creation.',
                    'Real-time traffic is generally more sensitive to delay and jitter than bulk transfers.',
                    'Classification and marking happen before downstream queueing decisions can use them.',
                    'DSCP choices should map to treatment intent, not be applied randomly.',
                    'Policing and shaping are not the same: one enforces harshly, the other smooths.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'QoS exists because different traffic types respond differently to congestion.',
            'Delay, jitter, and loss are the main service-quality concepts to track.',
            'Classification and marking identify traffic; policing and shaping control how traffic is handled.',
            'QoS prioritizes scarce resources under contention instead of creating new bandwidth.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('ip-services', '4.11', 'TFTP & FTP', [
        'Compare TFTP and FTP transports, control/data channels, authentication, and IOS file-copy workflows.',
        'Relate protocol properties to common image-management tasks.',
      ], 'comparison-viewer', 'File Transfer Protocol Comparison', 'Protocol property MCQ + command fill', { icon: 'DOCS', quizBank: 'quizBanks/ipServices/tftpFtp', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why TFTP and FTP Are Compared Together',
              content: `<p>TFTP and FTP both transfer files, but they do so with very different operational assumptions. <strong>TFTP</strong> is intentionally simple and lightweight, while <strong>FTP</strong> is richer and connection-oriented. For Cisco-style administration, both often appear in the context of image transfers, backups, and file-copy workflows.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'TFTP versus FTP overview',
                  columns: ['Protocol', 'Transport', 'Operational profile'],
                  rows: [
                    ['TFTP', 'UDP 69 for the initial request', 'Simple, low-overhead file transfer with minimal features'],
                    ['FTP', 'TCP 21 control plus a separate TCP data connection', 'Richer file-transfer model with separate control and data behavior']
                  ]
                }
              ]
            },
            {
              title: 'Control and Data Behavior',
              content: `<p>FTP uses a dedicated control channel and a separate data connection. That makes it more capable but also more complex to reason about. TFTP is simpler, beginning with a request to UDP 69 and then continuing with a lightweight transfer model, but it lacks the richer control and security features of more advanced file-transfer approaches.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Transfer-model differences',
                  items: [
                    'FTP separates control traffic from the actual data transfer behavior.',
                    'TFTP uses a much simpler request and transfer model.',
                    'Simplicity can help operationally, but it also means fewer protections and capabilities.'
                  ]
                }
              ]
            },
            {
              title: 'Operational Use and Security Perspective',
              content: `<p>When thinking operationally, the right question is not only which protocol transfers the file, but also whether the transfer method is appropriate for the environment. TFTP and classic FTP are both less secure than modern encrypted alternatives, so the exam often expects you to recognize them as traditional administrative tools rather than ideal security choices.</p><p>FTP uses user authentication, while TFTP is generally much more minimal and commonly treated as an unauthenticated simple transfer service. On Cisco-style devices, both may appear in <code>copy</code> workflows for moving images or backing up configuration files.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'File-transfer reasoning checklist',
                  items: [
                    'Know that TFTP uses UDP 69 and is intentionally simple.',
                    'Know that FTP uses TCP, separates control from file-transfer behavior, and normally expects user authentication.',
                    'Know that TFTP is much more minimal and is commonly treated as an unauthenticated transfer model.',
                    'Associate both protocols with common IOS copy and image-management tasks.',
                    'Remember that classic FTP and TFTP are not the secure default choice for hostile environments.'
                  ]
                },
                {
                  type: 'note',
                  variant: 'realWorld',
                  title: 'IOS file-copy mindset',
                  content: 'A Cisco-style copy workflow is really a source-to-destination file movement decision: for example, copying an IOS image from a server to flash or backing up the running configuration to an external file server.'
                }
              ]
            }
          ],
          keyTakeaways: [
            'TFTP and FTP both transfer files but use very different transport and control models.',
            'TFTP is lightweight and simple, while FTP is richer and connection-oriented.',
            'FTP uses a control channel and separate data-transfer behavior; TFTP is more minimal.',
            'Both protocols appear in traditional device-management workflows, but neither should be treated as a strong modern security choice by default.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
    ],
  }),
  domain({
    id: 'security-fundamentals',
    examDomain: 5,
    title: 'Security Fundamentals',
    shortTitle: 'Security',
    icon: 'LOCK',
    color: '#ef5350',
    difficulty: 'advanced',
    examWeight: 15,
    estimatedHours: 9,
    learningGoal: 'Implement Layer 2 and Layer 3 security features and understand fundamental security principles.',
    prerequisites: ['ip-services'],
    topicGroups: [
      { id: 'security-core', title: 'Core Security Concepts & Attacks', topicCodes: ['5.1', '5.2', '5.3'] },
      { id: 'security-identity', title: 'Identity, AAA & 802.1X', topicCodes: ['5.4', '5.5'] },
      { id: 'security-controls', title: 'ACLs, Firewalls & IPS', topicCodes: ['5.6', '5.7', '5.8'] },
      { id: 'security-l2', title: 'Layer 2 Protections', topicCodes: ['5.9', '5.10', '5.11'] },
      { id: 'security-vpn-wireless', title: 'VPNs & Wireless Security', topicCodes: ['5.12', '5.13', '5.14'] },
    ],
    finalExam: { questionCount: 30, passingScore: 80, quizType: 'mcq-scenario-config', bank: 'quizBanks/securityFundamentals/domain5FinalExam' },
    topics: [
      topic('security-fundamentals', '5.1', 'Security Concepts', [
        'Explain the CIA triad and the vulnerability, exploit, threat, and attack chain.',
        'Relate mitigation techniques to security objectives and attack reduction.',
      ], 'decision-simulator', 'CIA Triad Attack Classifier', 'MCQ + scenario', { icon: 'LOCK', quizBank: 'quizBanks/securityFundamentals/securityConcepts', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'The CIA Triad as the Security Baseline',
              content: `<p>The CIA triad summarizes the three core goals of security: <strong>confidentiality</strong>, <strong>integrity</strong>, and <strong>availability</strong>. Confidentiality limits data access to authorized parties, integrity protects data from unauthorized change, and availability keeps systems and services reachable when users need them.</p><p>At the CCNA level, the CIA triad is useful because it gives you a consistent lens for evaluating attacks and mitigations. A control such as encryption mostly protects confidentiality, while redundancy is often about availability.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'CIA triad overview',
                  columns: ['Principle', 'What it protects', 'Common examples'],
                  rows: [
                    ['Confidentiality', 'Data secrecy and restricted access', 'Encryption, strong authentication, access control'],
                    ['Integrity', 'Accuracy and trustworthiness of data', 'Hashing, signatures, validation controls'],
                    ['Availability', 'Service continuity and reachable systems', 'Redundancy, resilience, DDoS protection']
                  ]
                }
              ]
            },
            {
              title: 'Vulnerability, Threat, Exploit, and Attack Chain',
              content: `<p>Security language becomes easier when each term has a precise role. A <strong>vulnerability</strong> is a weakness. A <strong>threat</strong> is a potential danger or actor that may use that weakness. An <strong>exploit</strong> is the technique or mechanism used to take advantage of the weakness. An <strong>attack</strong> is the real event where the exploit is used against the target.</p>`,
              blocks: [
                {
                  type: 'keyTerms',
                  title: 'Core security vocabulary',
                  terms: [
                    { term: 'Vulnerability', definition: 'A weakness that can potentially be abused.' },
                    { term: 'Threat', definition: 'A potential danger, actor, or condition that may cause harm.' },
                    { term: 'Exploit', definition: 'The method used to abuse a vulnerability.' },
                    { term: 'Attack', definition: 'The actual hostile action against the target.' }
                  ]
                }
              ]
            },
            {
              title: 'Connecting Controls to Objectives',
              content: `<p>Security controls only make sense when you connect them to what they defend. Encryption helps confidentiality. Input validation and signatures help integrity. Redundancy, failover, and resilient service design support availability. Good security questions often ask which control best reduces a given attack path.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Security reasoning checklist',
                  items: [
                    'Identify whether the problem is primarily about confidentiality, integrity, or availability.',
                    'Separate the weakness from the threat actor and from the exploit method.',
                    'Choose controls that directly reduce the relevant attack path.',
                    'Treat security as risk reduction rather than absolute elimination of danger.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'The CIA triad is the core model for evaluating security objectives.',
            'Vulnerability, threat, exploit, and attack are related but not identical concepts.',
            'Security controls should be tied to the objective they defend, such as confidentiality or availability.',
            'Most security questions become easier when you map the problem to the correct objective and attack path.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/what-is-network-security.html', coverageNotes: 'Cisco security overview aligned to foundational security concepts and CIA-style reasoning.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('security-fundamentals', '5.2', 'Attack Types', [
        'Recognize DoS, spoofing, amplification, MITM, reconnaissance, malware, and password attacks.',
        'Classify scenarios by attacker goal and primary mechanism.',
      ], 'attack-defense', 'Attack Identifier Game', 'MCQ + scenario matching', { icon: 'WARN', quizBank: 'quizBanks/securityFundamentals/attackTypes', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Recognizing Common Attack Families',
              content: `<p>Security attacks are easier to classify when you focus on their main purpose. Some attacks overwhelm resources, some impersonate trusted devices or users, some intercept traffic, and some gather information before a larger compromise. The CCNA expectation is not advanced forensics, but accurate classification of the main mechanism and likely objective.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Common attack categories',
                  columns: ['Category', 'Primary goal', 'Example thinking'],
                  rows: [
                    ['DoS / DDoS', 'Disrupt availability', 'Overwhelm a service or device so users cannot reach it'],
                    ['Spoofing / MITM', 'Impersonate or intercept', 'Pretend to be a trusted identity or sit between endpoints'],
                    ['Reconnaissance', 'Gather intelligence', 'Map the target before launching deeper attacks'],
                    ['Malware / password attacks', 'Gain access or persistence', 'Steal credentials, execute code, or maintain foothold']
                  ]
                }
              ]
            },
            {
              title: 'How Attack Mechanisms Differ',
              content: `<p>A denial-of-service attack is mainly about exhaustion. A spoofing attack is about false identity. A man-in-the-middle attack is about interception and possible modification. Amplification attacks abuse another service to magnify traffic toward the victim. Password attacks target weak authentication paths. These differences matter because the right mitigation depends on the mechanism.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Mechanism-based clues',
                  items: [
                    'Availability collapse points toward DoS or DDoS logic.',
                    'False identity claims point toward spoofing.',
                    'Interception between two trusted parties suggests MITM behavior.',
                    'Credential guessing or reuse points toward password attack families.'
                  ]
                }
              ]
            },
            {
              title: 'Mitigation Starts with Correct Classification',
              content: `<p>The reason classification matters is practical: you do not defend every attack in the same way. Rate limiting and resilience help with flood-style attacks. Strong authentication and validation help with spoofing. User education may matter more for phishing and credential theft than for volumetric attack scenarios.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Attack classification workflow',
                  items: [
                    'Decide whether the attack is targeting confidentiality, integrity, or availability first.',
                    'Identify whether the mechanism is exhaustion, impersonation, interception, or intelligence gathering.',
                    'Choose mitigations that match the mechanism rather than treating every attack the same way.',
                    'Remember that multiple attack families can appear in sequence during a larger compromise.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Attack types differ by their main mechanism, not only by their name.',
            'DoS and DDoS attack availability, while spoofing and MITM focus more on trust and interception.',
            'Reconnaissance often happens before more direct compromise attempts.',
            'Mitigation choices depend on correct classification of the attack method.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/index.html', coverageNotes: 'Cisco security reference aligned to common attack families and mitigation context.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('security-fundamentals', '5.3', 'Social Engineering', [
        'Differentiate phishing variants, pretexting, tailgating, and other human-focused attacks.',
        'Connect awareness training and physical controls to defense strategy.',
      ], 'attack-defense', 'Social Engineering Scenario Trainer', 'Scenario MCQ', { icon: 'TIP', quizBank: 'quizBanks/securityFundamentals/socialEngineering', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why Social Engineering Works',
              content: `<p>Social engineering attacks target people instead of network protocols directly. The attacker exploits trust, urgency, fear, curiosity, or routine behavior to persuade the victim to reveal information or grant access. In many real incidents, technical controls fail only after the human layer is manipulated first.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Human attack surface',
                  items: [
                    'Attackers often exploit emotion and urgency rather than technical weakness alone.',
                    'A person can become the bridge around otherwise good technical controls.',
                    'Awareness and process discipline are part of network security, not separate from it.'
                  ]
                }
              ]
            },
            {
              title: 'Phishing, Pretexting, and Tailgating',
              content: `<p><strong>Phishing</strong> tries to trick users into revealing credentials or clicking malicious links. <strong>Pretexting</strong> builds a believable false story to gain trust. <strong>Tailgating</strong> abuses physical courtesy to gain unauthorized entry. These attacks differ in style, but all rely on manipulation rather than direct technical exploitation.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Common social engineering styles',
                  columns: ['Attack type', 'Main method', 'Typical sign'],
                  rows: [
                    ['Phishing', 'Fake communication or site', 'Urgent login reset or suspicious link'],
                    ['Pretexting', 'Invented story or identity', 'A believable but false reason to request access or data'],
                    ['Tailgating', 'Physical entry abuse', 'Someone follows an authorized person into a restricted area']
                  ]
                }
              ]
            },
            {
              title: 'Awareness and Physical Defense',
              content: `<p>Strong defense against social engineering combines user awareness with process controls. Training helps users recognize suspicious patterns, but physical controls, visitor procedures, badge checks, and escalation paths are just as important for preventing manipulation from becoming actual access.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Social engineering defense checklist',
                  items: [
                    'Pause when an unexpected request uses urgency or fear to force a quick response.',
                    'Verify identity through a trusted channel before sharing credentials or data.',
                    'Treat physical access requests with the same discipline as digital access requests.',
                    'Use awareness training to reinforce recognition, escalation, and reporting behavior.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Social engineering attacks manipulate people rather than attacking technology directly first.',
            'Phishing, pretexting, and tailgating are distinct examples of human-focused attack methods.',
            'Awareness training matters, but physical and procedural controls matter too.',
            'A good defense mindset is to verify identity and intent before granting access or sharing information.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/email-security/index.html', coverageNotes: 'Cisco security reference aligned to phishing, user-targeted threats, and social-engineering awareness.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('security-fundamentals', '5.4', 'Password Security & AAA', [
        'Compare password best practices, Cisco password types, MFA factors, and certificate concepts.',
        'Contrast RADIUS and TACACS+ for authentication and administrative control.',
      ], 'diagram-builder', 'Password Hash Type Identifier', 'MCQ + hashing type matching', { icon: 'LOCK', quizBank: 'quizBanks/securityFundamentals/passwordSecurityAaa', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Password Security as Access Control',
              content: `<p>Password security is still foundational because weak authentication undermines many other defenses. Strong passwords, safe storage, and disciplined authentication design reduce the chance that stolen or guessed credentials become the easiest attack path into the environment.</p><p>At the CCNA level, password security also includes understanding that not all password storage or authentication methods provide the same protection. A stronger secret or one-way hashed style of handling is preferable to weak reversible storage or simple obfuscation.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Authentication hygiene',
                  items: [
                    'Use strong, unique credentials rather than weak shared passwords.',
                    'Prefer stronger secret or hash models over weak reversible handling.',
                    'Combine authentication strength with policy controls such as MFA where appropriate.'
                  ]
                },
                {
                  type: 'table',
                  title: 'Password, MFA, and trust comparison',
                  columns: ['Area', 'Comparison point', 'Operational takeaway'],
                  rows: [
                    ['Cisco password handling', 'Weak reversible password handling vs stronger secret/hash models such as enable-secret style thinking', 'Prefer stronger one-way secret handling over weak reversible approaches'],
                    ['MFA', 'Something you know, have, or are', 'Combining factor types is stronger than password-only authentication'],
                    ['Certificates', 'Cryptographic identity and trust validation', 'Useful when trust should be based on signed identity rather than only shared secrets']
                  ]
                }
              ]
            },
            {
              title: 'AAA, MFA, and Certificate Thinking',
              content: `<p><strong>AAA</strong> stands for Authentication, Authorization, and Accounting. Authentication answers who the user is, authorization decides what the user can do, and accounting records what happened. Multi-factor authentication (MFA) strengthens authentication by combining factors such as something you know, something you have, or something you are. Certificates extend trust decisions beyond simple passwords by using a cryptographic identity model.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'AAA roles',
                  columns: ['AAA function', 'Question answered', 'Operational meaning'],
                  rows: [
                    ['Authentication', 'Who are you?', 'Validates identity'],
                    ['Authorization', 'What can you do?', 'Controls permitted access or commands'],
                    ['Accounting', 'What happened?', 'Records usage and activity for audit or tracking']
                  ]
                }
              ]
            },
            {
              title: 'RADIUS Versus TACACS+',
              content: `<p>RADIUS and TACACS+ both support centralized authentication, but they differ in operational emphasis. RADIUS is widely used for network access control and commonly appears with user authentication workflows. TACACS+ is often associated with device administration and deeper command-level control. The exam skill is to match the method to the management goal.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'AAA comparison checklist',
                  items: [
                    'Use AAA to separate identity, privilege, and activity tracking.',
                    'Treat MFA as stronger than a password-only model.',
                    'Associate RADIUS with broad access-authentication scenarios.',
                    'Associate TACACS+ with administrative control and more detailed command authorization thinking.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Password security matters because weak credentials can defeat otherwise strong defenses.',
            'AAA separates identity, privilege, and activity tracking into Authentication, Authorization, and Accounting.',
            'MFA strengthens authentication by using multiple factor types rather than one password alone.',
            'RADIUS and TACACS+ are centralized AAA options with different operational emphasis.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/identity-services-engine/index.html', coverageNotes: 'Cisco identity and access reference aligned to AAA, authentication control, and centralized policy.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('security-fundamentals', '5.5', '802.1X & PNAC', [
        'Explain supplicant, authenticator, authentication server, and EAPoL flow.',
        'Compare common EAP method families used in enterprise access control.',
      ], 'state-machine', '802.1X Authentication Flow', 'Process-ordering exercise', { icon: 'PASS', quizBank: 'quizBanks/securityFundamentals/ieee8021xPnac', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What 802.1X Tries to Control',
              content: `<p>802.1X is a network access control method that decides whether a device should be allowed onto the network based on identity and policy. Instead of assuming every connected host is trusted, the network requires an authentication process before normal access is granted.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: '802.1X role model',
                  items: [
                    'The supplicant is the endpoint requesting access.',
                    'The authenticator is the access device controlling entry, often a switch or AP.',
                    'The authentication server validates the identity and returns the decision.'
                  ]
                }
              ]
            },
            {
              title: 'EAPoL Flow and Authentication Exchange',
              content: `<p>802.1X uses an access-control exchange that begins on the local link. The endpoint and the authenticator exchange EAP over LAN (EAPoL), while the authenticator relays the identity conversation toward the authentication server. This keeps the access decision tied to a controlled workflow rather than open access by default.</p>`,
              blocks: [
                {
                  type: 'steps',
                  title: 'Simplified 802.1X sequence',
                  items: [
                    'The endpoint requests network access.',
                    'The authenticator begins the EAPoL-based identity exchange.',
                    'The authentication server validates the credentials or method.',
                    'The network either authorizes access or denies it according to policy.'
                  ]
                }
              ]
            },
            {
              title: 'EAP Method Families and Access Control Thinking',
              content: `<p>EAP is a framework with multiple method families rather than one single credential type. The exam focus is high-level comparison: some methods are certificate-heavy, some rely on user credentials inside protected tunnels, and all exist to strengthen identity verification before access is granted.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Common EAP-family comparisons',
                  columns: ['Method family', 'High-level distinction', 'Why it matters'],
                  rows: [
                    ['EAP-TLS', 'Certificate-oriented authentication', 'Strong identity model built around certificate trust'],
                    ['PEAP', 'Protected tunnel carrying inner user-credential exchange', 'Common way to protect user authentication inside a secure wrapper'],
                    ['EAP-FAST', 'Protected access method family with tunneled credential exchange', 'Another enterprise access-control approach to compare conceptually']
                  ]
                },
                {
                  type: 'checklist',
                  title: '802.1X reasoning checklist',
                  items: [
                    'Separate the supplicant, authenticator, and authentication server roles clearly.',
                    'Recognize EAPoL as the local-link exchange mechanism in 802.1X discussions.',
                    'Treat 802.1X as access control before normal network trust is granted.',
                    'Know that different EAP methods exist and differ in how they establish and protect identity.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            '802.1X is a network access control system that validates identity before granting normal access.',
            'The three key roles are supplicant, authenticator, and authentication server.',
            'EAPoL carries the local-link identity exchange that begins the authorization workflow.',
            'Different EAP methods represent different ways to prove identity under the same access-control framework.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/identity-services-engine/index.html', coverageNotes: 'Cisco identity-services reference aligned to 802.1X, policy-based access control, and enterprise authentication flows.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('security-fundamentals', '5.6', 'ACL Fundamentals', [
        'Differentiate standard and extended ACLs, wildcard masks, order of operation, and implicit deny.',
        'Predict permit and deny outcomes from interface direction and entry order.',
      ], 'decision-simulator', 'ACL Logic Builder', 'Packet-outcome prediction', { icon: 'FOCUS', quizBank: 'quizBanks/securityFundamentals/aclFundamentals', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What an ACL Does',
              content: `<p>An access control list (ACL) evaluates packets against ordered permit and deny statements. In Cisco-style thinking, the ACL itself is just the policy list; the actual filtering happens when that ACL is applied in the correct place and direction.</p><p>The key beginner mistake is to think of ACLs as broad “security on/off” settings. They are really packet-matching logic that becomes effective only when attached to the right interface or feature.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'ACL core behavior',
                  items: [
                    'ACL entries are processed from top to bottom.',
                    'The first match wins.',
                    'The ACL must be applied in the right place and direction to have the intended effect.'
                  ]
                }
              ]
            },
            {
              title: 'Standard Versus Extended ACLs',
              content: `<p>A <strong>standard ACL</strong> matches only the source IP address. An <strong>extended ACL</strong> can match source and destination, protocol, and often port-level detail. Because extended ACLs are more specific, they are usually placed closer to the traffic source to stop unwanted traffic earlier.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'ACL comparison',
                  columns: ['ACL type', 'What it matches', 'Usual placement logic'],
                  rows: [
                    ['Standard', 'Source IP only', 'Usually closer to the destination'],
                    ['Extended', 'Source, destination, protocol, and port context', 'Usually closer to the source']
                  ]
                }
              ]
            },
            {
              title: 'Wildcard Masks, Order, and Implicit Deny',
              content: `<p>ACLs use wildcard masks rather than normal subnet-mask logic in many Cisco examples. A 0 bit means “must match,” and a 1 bit means “ignore this bit.” Every ACL also ends with an <strong>implicit deny</strong>, which means unmatched traffic is dropped unless an earlier permit statement allows it.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'ACL fundamentals checklist',
                  items: [
                    'Remember that wildcard masks invert the usual subnet-mask logic.',
                    'Read ACL entries top to bottom and stop at the first match.',
                    'Plan placement based on whether the ACL is standard or extended.',
                    'Never forget the implicit deny at the end of every ACL.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'ACLs are ordered packet-matching policies that become active when applied in the correct place and direction.',
            'Standard ACLs match source only, while extended ACLs can match source, destination, protocol, and port context.',
            'Wildcard masks use 0 as must-match and 1 as ignore.',
            'Every ACL ends with an implicit deny, so unmatched traffic is dropped.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/index.html', coverageNotes: 'Cisco security reference aligned to access-control policy fundamentals and traffic filtering logic.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('security-fundamentals', '5.7', 'Advanced ACLs', [
        'Use named ACLs, sequence numbers, operator keywords, and insertion behavior.',
        'Apply ACLs to interfaces and VTY lines with the correct direction and scope.',
      ], 'config-lab', 'ACL Configuration Lab', 'Config + outcome MCQ', { icon: 'CONFIG', quizBank: 'quizBanks/securityFundamentals/advancedAcls', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Named ACLs and Sequence Control',
              content: `<p>Advanced ACL work is often about maintainability. Named ACLs make policies easier to read, and sequence numbers make it easier to insert or adjust entries without rebuilding the whole list from scratch.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Why advanced ACLs matter operationally',
                  items: [
                    'Named ACLs are easier to read than anonymous numbered lists in complex scenarios.',
                    'Sequence numbers help you insert new logic in the correct place.',
                    'Operational clarity matters because ACL order directly affects traffic outcome.'
                  ]
                }
              ]
            },
            {
              title: 'Operator Keywords and Match Precision',
              content: `<p>Advanced ACLs often use operator keywords to match ports or ranges with more precision. The point is not memorizing every keyword in isolation, but understanding that ACL logic becomes more exact as protocol and port conditions are added.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Advanced ACL thinking',
                  columns: ['Feature', 'Purpose', 'Operational effect'],
                  rows: [
                    ['Named ACLs', 'Readable policy definition', 'Improves maintainability and troubleshooting'],
                    ['Sequence numbers', 'Insert or edit rules precisely', 'Reduces the need to rebuild an ACL from scratch'],
                    ['Operator keywords', 'Match more specific traffic conditions', 'Improves policy precision for protocol and port logic']
                  ]
                }
              ]
            },
            {
              title: 'Interfaces, Directions, and Scope',
              content: `<p>An ACL can be logically correct and still fail operationally if applied in the wrong direction or to the wrong interface. Advanced ACL questions often test the relationship between policy intent and placement: inbound versus outbound, interface versus VTY, and source versus destination perspective.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Advanced ACL checklist',
                  items: [
                    'Confirm the ACL logic matches the intended source, destination, and protocol conditions.',
                    'Check whether the ACL belongs inbound or outbound on the interface.',
                    'Remember that VTY access control is a different use case from transit packet filtering.',
                    'Treat sequence order as part of the policy, not decoration.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Advanced ACL work emphasizes maintainability, readability, and precise matching.',
            'Named ACLs and sequence numbers improve policy management.',
            'Operator keywords make ACL matching more exact for protocol and port logic.',
            'Correct direction and application scope are just as important as the ACL statements themselves.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/index.html', coverageNotes: 'Cisco security reference aligned to advanced ACL configuration and administrative access-control scope.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('security-fundamentals', '5.8', 'Firewalls & IPS', [
        'Compare stateless filtering with stateful inspection, security zones, and NGFW capabilities.',
        'Explain signature-based and anomaly-based IPS detection in modern deployments.',
      ], 'comparison-viewer', 'Stateful vs Stateless Firewall Comparison', 'MCQ + scenario', { icon: 'LOCK', quizBank: 'quizBanks/securityFundamentals/firewallsIps', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Firewalls as Traffic Control Points',
              content: `<p>A firewall is a policy enforcement point that monitors and filters traffic between trust boundaries. The firewall role is broader than a simple ACL because many firewall designs maintain session awareness and security context while deciding whether traffic should pass.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Stateless versus stateful thinking',
                  columns: ['Model', 'What it tracks', 'Operational effect'],
                  rows: [
                    ['Stateless filtering', 'Individual packets only', 'Evaluates each packet without full session memory'],
                    ['Stateful inspection', 'Connection state and session context', 'Makes decisions with awareness of the larger flow']
                  ]
                }
              ]
            },
            {
              title: 'Zones, NGFW Features, and Visibility',
              content: `<p>Modern security design often groups traffic into zones and enforces policy between them. Next-generation firewall (NGFW) capabilities extend beyond basic port and protocol filtering by incorporating deeper application and threat-awareness features.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Modern firewall perspective',
                  items: [
                    'Security zones define traffic boundaries for policy enforcement.',
                    'Stateful inspection improves decision quality by tracking sessions.',
                    'NGFW thinking adds more context than simple port-based filtering alone.'
                  ]
                }
              ]
            },
            {
              title: 'IPS Detection Approaches',
              content: `<p>An intrusion prevention system (IPS) looks for suspicious or malicious behavior and can take action to block or alert on it. <strong>Signature-based</strong> detection looks for known bad patterns, while <strong>anomaly-based</strong> detection looks for behavior that deviates from expected norms.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Firewall and IPS checklist',
                  items: [
                    'Use stateful versus stateless comparison to understand packet inspection depth.',
                    'Treat zones as trust boundaries rather than simple labels.',
                    'Associate signature-based IPS with known attack patterns.',
                    'Associate anomaly-based IPS with suspicious deviations from expected behavior.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Firewalls enforce policy at trust boundaries, often with more context than a simple ACL.',
            'Stateful inspection tracks session context, while stateless filtering does not.',
            'Security zones organize policy boundaries in modern firewall design.',
            'IPS commonly uses signature-based and anomaly-based detection approaches.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/firewalls/index.html', coverageNotes: 'Cisco firewall reference aligned to stateful inspection, zone policy, and NGFW concepts.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('security-fundamentals', '5.9', 'Port Security', [
        'Use static, dynamic, and sticky secure MAC learning with violation modes and aging.',
        'Relate port security to MAC flooding mitigation and errdisable behavior.',
      ], 'attack-defense', 'Port Security Attack Simulator', 'Config fill-in + violation mode MCQ', { icon: 'PORT', quizBank: 'quizBanks/securityFundamentals/portSecurity', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What Port Security Controls',
              content: `<p>Port Security limits which MAC addresses may use a switchport. This is especially useful on access ports where the expected number of attached devices is small and predictable. By constraining MAC learning behavior, Port Security helps reduce the effect of unauthorized devices and some MAC flooding scenarios.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Why Port Security matters',
                  items: [
                    'It limits how many MAC addresses can appear on a port.',
                    'It can bind expected addresses statically or through sticky learning.',
                    'It helps reduce some Layer 2 misuse and CAM-table abuse scenarios.'
                  ]
                }
              ]
            },
            {
              title: 'Static, Dynamic, Sticky, and Violation Modes',
              content: `<p>Port Security can use different secure-MAC learning approaches. Static definitions are explicit, while sticky learning lets the switch learn and retain expected addresses more automatically. Violation modes matter too: some only drop traffic, while others can drive the port into an err-disabled style shutdown condition.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Port Security behavior choices',
                  columns: ['Feature', 'Purpose', 'Operational effect'],
                  rows: [
                    ['Static secure MAC', 'Explicitly define allowed address', 'Predictable control of expected endpoint identity'],
                    ['Sticky secure MAC', 'Learn and retain seen addresses', 'Simplifies controlled learning of expected endpoints'],
                    ['Violation mode', 'Define what happens on mismatch', 'Can drop, log, count, or shut down the port depending on policy']
                  ]
                }
              ]
            },
            {
              title: 'Aging, Errdisable, and Troubleshooting',
              content: `<p>Port Security is operational, not just preventive. Aging behavior, violation counters, and shutdown responses all affect how the port behaves over time. If the wrong endpoint appears or too many addresses are learned, the port may restrict traffic or move into an err-disabled style state that must be investigated.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Port Security checklist',
                  items: [
                    'Match the maximum MAC count to the expected device count on the port.',
                    'Choose static or sticky learning based on operational needs.',
                    'Know the violation mode because it determines the failure behavior.',
                    'Treat errdisable-style shutdown as evidence of a policy breach or mismatch that needs review.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Port Security limits acceptable MAC-address behavior on a switchport.',
            'Static and sticky learning provide different ways to establish secure MAC expectations.',
            'Violation modes determine whether mismatches are dropped, logged, counted, or lead to shutdown behavior.',
            'Port Security helps reduce Layer 2 misuse, including some MAC flooding risks.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/switches/index.html', coverageNotes: 'Cisco switching reference aligned to secure switchport behavior and access-edge protections.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('security-fundamentals', '5.10', 'DHCP Snooping', [
        'Explain rogue DHCP risks, trusted versus untrusted ports, binding tables, and validation checks.',
        'Apply option 82 and rate limiting concepts to DHCP protection.',
      ], 'attack-defense', 'DHCP Snooping Defense Lab', 'Attack scenario + config MCQ', { icon: 'LOCK', quizBank: 'quizBanks/securityFundamentals/dhcpSnooping', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why DHCP Snooping Exists',
              content: `<p>DHCP Snooping protects the network from rogue DHCP behavior by controlling which ports may send server-like DHCP messages. In a basic campus design, the switch should trust only uplinks toward legitimate DHCP infrastructure, while ordinary access ports remain untrusted.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Core protection idea',
                  items: [
                    'Trusted ports are allowed to send DHCP server-style replies.',
                    'Untrusted access ports should not be allowed to impersonate a DHCP server.',
                    'Rogue DHCP is dangerous because it can hand clients false gateway or DNS information.'
                  ]
                }
              ]
            },
            {
              title: 'Bindings, Validation, and Option 82',
              content: `<p>DHCP Snooping builds a binding table that links client identity and lease information. That binding table becomes useful not only for DHCP itself but also for related Layer 2 protections. Option 82 adds relay-related context in some environments to improve control and visibility.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'DHCP Snooping building blocks',
                  columns: ['Element', 'Purpose', 'Operational value'],
                  rows: [
                    ['Trusted / untrusted ports', 'Separate allowed server paths from access edges', 'Blocks rogue DHCP replies on user-facing ports'],
                    ['Binding table', 'Record legitimate DHCP lease information', 'Supports later validation logic'],
                    ['Option 82', 'Add relay/context information', 'Improves visibility and policy precision in some designs']
                  ]
                }
              ]
            },
            {
              title: 'Rate Limiting and Practical Defense',
              content: `<p>DHCP Snooping is not only about trusting the right ports. Rate limiting on untrusted ports can help reduce abuse, and the overall design should make it difficult for a rogue endpoint to impersonate infrastructure services. The operational mindset is that the switch should know which direction legitimate DHCP behavior is expected from.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'DHCP Snooping checklist',
                  items: [
                    'Trust only the interfaces that should legitimately carry DHCP server responses.',
                    'Leave user-facing access ports untrusted by default.',
                    'Use the binding table as evidence of legitimate lease activity.',
                    'Consider rate limiting and validation as part of the broader rogue-DHCP defense posture.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'DHCP Snooping protects clients from rogue DHCP behavior by controlling trust at the switchport level.',
            'Trusted ports should carry legitimate DHCP infrastructure traffic, while user-facing ports stay untrusted.',
            'The binding table records lease information that can support later validation logic.',
            'Rate limiting and context features such as Option 82 strengthen the overall protection model.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/switches/index.html', coverageNotes: 'Cisco switching reference aligned to DHCP Snooping, access-edge trust, and Layer 2 validation features.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('security-fundamentals', '5.11', 'Dynamic ARP Inspection', [
        'Use DHCP snooping bindings to validate ARP traffic and stop poisoning attacks.',
        'Explain trusted ports, optional checks, and rate limiting on untrusted segments.',
      ], 'attack-defense', 'ARP Poisoning to DAI Defense Sim', 'Inspection logic MCQ', { icon: 'ARP', quizBank: 'quizBanks/securityFundamentals/dynamicArpInspection', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What Dynamic ARP Inspection Protects Against',
              content: `<p>Dynamic ARP Inspection (DAI) helps defend against ARP poisoning by validating ARP traffic on untrusted ports. Instead of trusting every ARP claim on the segment, the switch checks whether the MAC-to-IP relationship matches known legitimate lease information.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Why DAI matters',
                  items: [
                    'ARP poisoning works by sending false IP-to-MAC mappings.',
                    'DAI reduces trust in unsolicited ARP claims on untrusted ports.',
                    'The goal is to stop attackers from redirecting local traffic through fake ownership claims.'
                  ]
                }
              ]
            },
            {
              title: 'DHCP Snooping Bindings and Trust Model',
              content: `<p>DAI commonly depends on the DHCP Snooping binding table as a source of truth for valid IP-to-MAC relationships. Trust still matters: trusted ports are handled differently from untrusted ones because not every segment should be validated the same way.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'DAI operational model',
                  columns: ['Element', 'Purpose', 'Operational effect'],
                  rows: [
                    ['DHCP Snooping bindings', 'Provide expected IP-to-MAC mappings', 'Lets the switch validate ARP claims'],
                    ['Trusted ports', 'Carry known infrastructure behavior', 'Not treated like ordinary user-facing access edges'],
                    ['Untrusted ports', 'Higher-risk access edge', 'ARP traffic is inspected and validated more strictly']
                  ]
                }
              ]
            },
            {
              title: 'Optional Checks and Rate Limiting',
              content: `<p>DAI is not only about binary allow or deny. Optional validation checks and rate limiting help control how aggressively the switch responds to suspicious ARP behavior. The larger design goal is to keep local Layer 2 identity claims consistent with what the network already knows is legitimate.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'DAI checklist',
                  items: [
                    'Understand that DAI is a direct defense against ARP poisoning.',
                    'Associate DAI with DHCP Snooping binding validation in common Cisco-style designs.',
                    'Separate trusted and untrusted port behavior carefully.',
                    'Treat rate limiting and optional checks as operational tuning tools for suspicious ARP behavior.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'DAI validates ARP behavior to reduce poisoning and impersonation on the local segment.',
            'DHCP Snooping bindings commonly provide the validation data DAI relies on.',
            'Trusted and untrusted ports are treated differently in the inspection model.',
            'DAI is a Layer 2 trust-control feature, not just a general logging mechanism.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/switches/index.html', coverageNotes: 'Cisco switching reference aligned to Dynamic ARP Inspection and Layer 2 identity validation features.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('security-fundamentals', '5.12', 'VPNs — Site-to-Site', [
        'Explain IPsec tunneling, GRE, GRE over IPsec, and DMVPN evolution.',
        'Visualize how packets are encrypted and encapsulated between sites.',
      ], 'packet-animator', 'IPsec Tunnel Visualizer', 'Encapsulation layer MCQ', { icon: 'PKT', quizBank: 'quizBanks/securityFundamentals/vpnsSiteToSite', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why Site-to-Site VPNs Exist',
              content: `<p>A site-to-site VPN securely connects one network to another across an untrusted transport such as the Internet. Instead of exposing private traffic directly, the VPN creates a protected tunnel so that separate locations can communicate as if they were part of one trusted design.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Site-to-site design goal',
                  items: [
                    'Join remote networks securely over untrusted transport.',
                    'Protect confidentiality and integrity while traffic crosses the public path.',
                    'Keep the focus on network-to-network connectivity rather than individual user sessions.'
                  ]
                }
              ]
            },
            {
              title: 'IPsec, GRE, and GRE over IPsec',
              content: `<p><strong>IPsec</strong> provides the security properties for the protected tunnel. <strong>GRE</strong> adds flexible encapsulation that can carry traffic types and routing behaviors more easily in some designs. <strong>GRE over IPsec</strong> combines both ideas: GRE provides the tunnel structure, and IPsec protects it.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Site-to-site VPN building blocks',
                  columns: ['Component', 'Main role', 'Why it matters'],
                  rows: [
                    ['IPsec', 'Provide confidentiality and integrity', 'Secures traffic over the untrusted path'],
                    ['GRE', 'Provide flexible tunnel encapsulation', 'Can support additional routing or encapsulation needs'],
                    ['GRE over IPsec', 'Combine tunnel flexibility with protection', 'Useful when both encapsulation flexibility and encryption are needed']
                  ]
                }
              ]
            },
            {
              title: 'DMVPN as an Evolution',
              content: `<p>Dynamic Multipoint VPN (DMVPN) reflects the idea that large site-to-site designs should scale beyond manually defining every tunnel pair. The exam-level takeaway is not low-level implementation detail but understanding that DMVPN represents a more scalable evolution of secure multi-site connectivity.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Site-to-site VPN checklist',
                  items: [
                    'Treat site-to-site VPNs as network-to-network protected tunnels.',
                    'Associate IPsec with security services such as confidentiality and integrity.',
                    'Associate GRE with flexible tunnel encapsulation rather than encryption itself.',
                    'Recognize DMVPN as a scalability-oriented evolution for multi-site designs.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Site-to-site VPNs securely connect whole networks across untrusted transport.',
            'IPsec provides the protection layer for confidentiality and integrity.',
            'GRE and GRE over IPsec represent tunnel-structure choices with different flexibility goals.',
            'DMVPN is a scalable evolution of secure multi-site VPN design.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/vpn-endpoint-security-clients/index.html', coverageNotes: 'Cisco VPN reference aligned to site-to-site secure tunneling and IPsec-related connectivity models.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('security-fundamentals', '5.13', 'VPNs — Remote Access', [
        'Differentiate remote-access and site-to-site VPN use cases.',
        'Compare TLS-based and IPsec-based client VPN approaches such as AnyConnect.',
      ], 'comparison-viewer', 'Remote vs Site-to-Site VPN Comparison', 'Scenario to type MCQ', { icon: 'PASS', quizBank: 'quizBanks/securityFundamentals/vpnsRemoteAccess', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Remote Access Versus Site-to-Site Thinking',
              content: `<p>A remote-access VPN is built for an individual user or device that must connect securely into the network from elsewhere. That is different from a site-to-site VPN, which connects one network to another. The key distinction is whether the tunnel represents a person/device session or a whole network relationship.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'VPN use-case comparison',
                  columns: ['VPN type', 'Who is being connected', 'Typical purpose'],
                  rows: [
                    ['Site-to-site', 'One network to another network', 'Branch or site connectivity'],
                    ['Remote access', 'One user or device to a network', 'Secure user connectivity from outside the office']
                  ]
                }
              ]
            },
            {
              title: 'TLS-Based and IPsec-Based Client Models',
              content: `<p>Remote-access VPNs commonly use either TLS-based approaches or IPsec-based client approaches. The exam focus is conceptual: both aim to protect the user’s connection into the network, but they differ in transport style, client expectations, and operational design choices.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Remote-access comparison lens',
                  items: [
                    'TLS-based VPNs are often associated with secure application-style remote connectivity.',
                    'IPsec-based VPNs emphasize encrypted network-layer style remote connectivity.',
                    'AnyConnect is best understood as a remote-access client platform that can be deployed with different tunnel technologies depending on design.'
                  ]
                }
              ]
            },
            {
              title: 'Design Choice and User Experience',
              content: `<p>Remote-access VPN design is partly about user experience and partly about security requirements. The right method depends on who the users are, what devices they use, what access they need, and how tightly the organization wants to control identity and tunnel behavior.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Remote-access VPN checklist',
                  items: [
                    'Start by identifying whether the problem is user-to-network or network-to-network.',
                    'Treat TLS and IPsec client VPNs as different remote-access approaches, not unrelated technologies.',
                    'Associate AnyConnect-style solutions with user remote access rather than branch-site tunnels, while remembering the client can support different secure tunnel models depending on deployment.',
                    'Choose the VPN model according to user access requirements and security expectations.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Remote-access VPNs connect individual users or devices into the network, unlike site-to-site VPNs that connect whole networks.',
            'TLS-based and IPsec-based remote-access models solve a similar security problem through different approaches.',
            'AnyConnect is a user-focused remote-access client platform and should not be confused with a single fixed tunnel technology.',
            'VPN design choices should match the user, access scope, and security model required.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/security/vpn-endpoint-security-clients/index.html', coverageNotes: 'Cisco VPN client reference aligned to remote-access VPN concepts and user-focused secure connectivity.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('security-fundamentals', '5.14', 'Securing Wireless Networks', [
        'Review WPA family differences, authentication choices, encryption, integrity, PMF, and forward secrecy.',
        'Use structured comparison to distinguish wireless security generations on the exam.',
      ], 'diagram-builder', 'WPA Version Comparison Table Builder', 'Table-fill drag-drop', { icon: 'LOCK', quizBank: 'quizBanks/securityFundamentals/securingWirelessNetworks', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why Wireless Security Evolves',
              content: `<p>Wireless networks require strong security because the medium is open to anyone in range, not just to someone with a cable in hand. That is why the WPA family evolved over time from weaker approaches toward stronger authentication, encryption, and session-protection models.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Wireless security progression',
                  columns: ['Generation', 'General security direction', 'Operational takeaway'],
                  rows: [
                    ['WEP', 'Legacy and weak', 'Not acceptable as a modern secure baseline'],
                    ['WPA/WPA2', 'Improved protection and stronger encryption models', 'Major step up from WEP'],
                    ['WPA3', 'Stronger modern protections', 'Improved resistance and session security features']
                  ]
                }
              ]
            },
            {
              title: 'Authentication, Encryption, and Integrity',
              content: `<p>Wireless security is not just the password prompt. It includes how users authenticate, how traffic is encrypted, and how integrity is protected. Enterprise choices often differ from personal or pre-shared key models because the identity and access-control requirements are more demanding.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Security components to compare',
                  items: [
                    'Authentication determines how the user or device proves identity.',
                    'Encryption protects confidentiality of the wireless traffic.',
                    'Integrity protections help detect tampering and keep frames trustworthy.'
                  ]
                }
              ]
            },
            {
              title: 'PMF, Forward Secrecy, and Modern Expectations',
              content: `<p>Modern wireless security discussions often include <strong>Protected Management Frames (PMF)</strong> and <strong>forward secrecy</strong>. The exam-level idea is to recognize that modern wireless protection goes beyond simply encrypting data traffic; it also protects control behavior and reduces the value of later credential compromise against older captured sessions.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Wireless security checklist',
                  items: [
                    'Treat WEP as legacy and weak compared with the WPA family.',
                    'Compare wireless security by authentication, encryption, and integrity features together.',
                    'Recognize PMF as protection for management-frame behavior.',
                    'Recognize forward secrecy as a modern security improvement in newer wireless designs.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Wireless security must be strong because the medium is open and easily reachable by nearby attackers.',
            'The WPA family evolved to improve authentication, encryption, and resilience over older weak models.',
            'Authentication, encryption, and integrity should be compared together when evaluating wireless security.',
            'Modern protections such as PMF and forward secrecy go beyond simple data encryption alone.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/wireless/index.html', coverageNotes: 'Cisco wireless reference aligned to WPA evolution, wireless authentication, and modern WLAN protection.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
    ],
  }),
  domain({
    id: 'automation-programmability',
    examDomain: 6,
    title: 'Automation & Programmability',
    shortTitle: 'Automation',
    icon: 'AUTO',
    color: '#8b5cf6',
    difficulty: 'advanced',
    examWeight: 10,
    estimatedHours: 6,
    learningGoal: 'Understand how modern networks are automated, programmatically controlled, and managed at scale.',
    prerequisites: ['security-fundamentals'],
    topicGroups: [
      { id: 'automation-foundations', title: 'Automation Value, Planes & SDN', topicCodes: ['6.1', '6.2', '6.3', '6.4'] },
      { id: 'automation-cisco', title: 'Cisco Controllers & APIs', topicCodes: ['6.5', '6.6', '6.7'] },
      { id: 'automation-data', title: 'Data Formats', topicCodes: ['6.8', '6.9'] },
      { id: 'automation-tools', title: 'Automation Tools', topicCodes: ['6.10', '6.11', '6.12'] },
    ],
    finalExam: { questionCount: 25, passingScore: 80, quizType: 'mcq-matrix-scenario', bank: 'quizBanks/automationProgrammability/domain6FinalExam' },
    topics: [
      topic('automation-programmability', '6.1', 'Why Network Automation', [
        'Explain why manual configuration does not scale and how automation reduces drift and error.',
        'Connect automation to operational speed, consistency, and lower overhead.',
      ], 'comparison-viewer', 'Manual vs Automated Config Comparison', 'MCQ + scenario', { icon: 'AUTO', quizBank: 'quizBanks/automationProgrammability/whyNetworkAutomation', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why Manual Change Does Not Scale',
              content: `<p>Manual configuration works for small environments, but it does not scale well when device count, change frequency, and operational complexity increase. Humans are inconsistent under repetition, and the more devices that must be touched one by one, the more opportunity there is for delay, drift, and error.</p><p>Network automation exists because consistency, speed, and repeatability matter. The objective is not to remove engineers from the process, but to move repetitive work into predictable systems that engineers can validate, version, and improve.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Manual versus automated change thinking',
                  columns: ['Approach', 'Strength', 'Weakness'],
                  rows: [
                    ['Manual configuration', 'Simple for tiny environments or one-off fixes', 'Slow, inconsistent, and error-prone at scale'],
                    ['Automated workflows', 'Fast, repeatable, and easier to standardize', 'Require design discipline, testing, and trust in the workflow']
                  ]
                }
              ]
            },
            {
              title: 'Drift, Consistency, and Operational Speed',
              content: `<p>Configuration drift happens when intended standards and real deployed state slowly diverge. Automation helps reduce drift by applying the same logic repeatedly and by making the desired outcome easier to define and reapply. It also improves operational speed by turning many-step repetitive work into a controlled workflow.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Why teams automate',
                  items: [
                    'To reduce human inconsistency across many devices.',
                    'To make standard changes faster and easier to repeat.',
                    'To improve visibility into intended state and actual deployed state.'
                  ]
                }
              ]
            },
            {
              title: 'Automation as an Operational Discipline',
              content: `<p>Automation is not only about scripts. It is an operational discipline that combines standardization, validation, and repeatable change. Good automation should be understandable, testable, and easier to audit than ad hoc manual change.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Automation reasoning checklist',
                  items: [
                    'Think of automation as repeatable change, not magic.',
                    'Associate automation with lower drift and improved consistency.',
                    'Expect engineers to design, validate, and monitor automation outcomes.',
                    'Use automation where repetition and scale make manual work risky or slow.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Network automation exists because manual change does not scale well across many devices and frequent updates.',
            'Automation reduces drift and improves consistency by applying repeatable logic.',
            'Operational speed improves when repetitive work becomes a controlled workflow.',
            'Automation is an engineering discipline built on standardization, validation, and repeatability.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://developer.cisco.com/', coverageNotes: 'Cisco developer overview aligned to automation value, programmability, and repeatable network operations.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('automation-programmability', '6.2', 'Logical Planes', [
        'Classify data-plane, control-plane, and management-plane functions.',
        'Relate each plane to both traditional networks and SDN abstractions.',
      ], 'diagram-builder', 'Plane Classification Sorter', 'Drag-to-plane exercise', { icon: 'TABLE', quizBank: 'quizBanks/automationProgrammability/logicalPlanes', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'The Three Logical Planes',
              content: `<p>Modern network discussions often separate behavior into the <strong>data plane</strong>, <strong>control plane</strong>, and <strong>management plane</strong>. This model helps engineers classify what a device is doing: forwarding traffic, making path decisions, or being administered and observed.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Plane comparison',
                  columns: ['Plane', 'Main role', 'Typical examples'],
                  rows: [
                    ['Data plane', 'Forward traffic', 'Switching frames, forwarding packets'],
                    ['Control plane', 'Decide and maintain forwarding knowledge', 'Routing protocols, topology decisions'],
                    ['Management plane', 'Configure, monitor, and administer devices', 'CLI, APIs, telemetry, SSH, SNMP']
                  ]
                }
              ]
            },
            {
              title: 'Traditional Devices Versus SDN Thinking',
              content: `<p>In traditional networking, each device usually contains its own control and data plane logic. In SDN discussions, the control function is often described as more centralized, while forwarding remains on the devices. That shift makes the plane model especially useful when comparing old and new operational approaches.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Why the plane model matters',
                  items: [
                    'It separates forwarding from decision-making and from administration.',
                    'It makes SDN discussions easier because centralization mostly affects control behavior.',
                    'It helps classify which tools and protocols belong to which operational function.'
                  ]
                }
              ]
            },
            {
              title: 'Using the Model Operationally',
              content: `<p>The plane model is not only theory. It helps you answer practical questions such as whether a problem is caused by bad forwarding, broken route calculation, or a management access issue. It also helps explain why APIs and automation typically belong to the management-plane conversation, even when they influence the rest of the system.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Plane reasoning checklist',
                  items: [
                    'Use the data plane for packet and frame forwarding behavior.',
                    'Use the control plane for topology and path decision logic.',
                    'Use the management plane for visibility, configuration, and automation interfaces.',
                    'Remember that SDN centralization affects the control discussion more than the raw forwarding hardware itself.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'The data, control, and management planes describe different functions in a networked system.',
            'Traditional devices commonly hold control and forwarding logic together, while SDN often centralizes more of the control function.',
            'The plane model helps classify protocols, tools, and failure domains.',
            'Automation and APIs are usually discussed as management-plane capabilities even when they influence other planes.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://developer.cisco.com/', coverageNotes: 'Cisco developer overview aligned to management interfaces and modern operational models.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('automation-programmability', '6.3', 'SDN Architecture', [
        'Explain centralized control and the three-layer SDN model.',
        'Differentiate northbound and southbound interfaces in controller-driven networks.',
      ], 'diagram-builder', 'SDN Layer Architecture Builder', 'Layer-placement drag', { icon: 'NET', quizBank: 'quizBanks/automationProgrammability/sdnArchitecture', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why SDN Architecture Is Different',
              content: `<p>Software-defined networking (SDN) emphasizes centralized control and programmable behavior. Instead of every device independently holding the full intelligence of the network, controller-based designs make the network easier to manage as one coordinated system.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'SDN mindset',
                  items: [
                    'Control logic becomes more centralized in the controller layer.',
                    'Devices remain responsible for fast forwarding in the infrastructure layer.',
                    'Applications can request network behavior through controller-facing APIs.'
                  ]
                }
              ]
            },
            {
              title: 'The Three-Layer SDN Model',
              content: `<p>At a conceptual level, SDN is often described in three layers: the <strong>application layer</strong>, the <strong>control layer</strong>, and the <strong>infrastructure layer</strong>. Applications express intent or consume network services, the controller translates that intent into policy and logic, and the infrastructure layer forwards traffic.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'SDN layers',
                  columns: ['Layer', 'Main role', 'Typical relationship'],
                  rows: [
                    ['Application', 'Express intent or consume services', 'Talks to the controller through northbound APIs'],
                    ['Control', 'Translate policy and maintain centralized network logic', 'Connects applications to infrastructure'],
                    ['Infrastructure', 'Forward traffic and apply received behavior', 'Receives instructions through southbound interfaces']
                  ]
                }
              ]
            },
            {
              title: 'Northbound and Southbound Interfaces',
              content: `<p>The controller sits between applications and infrastructure. <strong>Northbound</strong> interfaces connect applications to the controller. <strong>Southbound</strong> interfaces connect the controller to the forwarding devices. The naming only makes sense if you remember the controller is the center of the model.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'SDN architecture checklist',
                  items: [
                    'Use the controller as the center reference point for northbound and southbound naming.',
                    'Associate the application layer with intent and service requests.',
                    'Associate the infrastructure layer with forwarding behavior on devices.',
                    'Treat SDN architecture as centralized control plus programmable interfaces, not as a totally different forwarding physics model.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'SDN architecture emphasizes centralized control and programmable network behavior.',
            'The common SDN model includes application, control, and infrastructure layers.',
            'Northbound interfaces face applications, while southbound interfaces face devices.',
            'The controller is the translation point between high-level intent and forwarding behavior.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://developer.cisco.com/docs/', coverageNotes: 'Cisco developer documentation aligned to controller-driven architectures and programmable interfaces.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('automation-programmability', '6.4', 'Cisco SDN Solutions', [
        'Compare SD-Access, SD-WAN, and ACI, including controller roles and overlay concepts.',
        'Match campus, WAN, and data-center scenarios to the correct Cisco solution family.',
      ], 'comparison-viewer', 'SDN Solution Matcher', 'Scenario to solution MCQ', { icon: 'AUTO', quizBank: 'quizBanks/automationProgrammability/ciscoSdnSolutions', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why Cisco Has Different SDN Families',
              content: `<p>Cisco SDN solutions are not one single platform for every environment. Different operational domains have different problems, so Cisco uses different solution families for campus networks, WAN environments, and data centers. The CCNA skill is to match the environment to the right family.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Cisco SDN family alignment',
                  columns: ['Solution', 'Main environment', 'What it solves'],
                  rows: [
                    ['SD-Access', 'Campus', 'Intent-based campus segmentation and automation'],
                    ['SD-WAN', 'WAN', 'Policy-driven wide-area connectivity and transport control'],
                    ['ACI', 'Data center', 'Policy-based application-centric data-center fabric']
                  ]
                }
              ]
            },
            {
              title: 'Controllers and Overlay Thinking',
              content: `<p>These Cisco solution families share a controller-oriented mindset, but they apply it differently. They often use overlays and abstracted policy models so the network can be operated by intent and outcome rather than by repetitive per-device CLI work.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Common design ideas',
                  items: [
                    'Controllers simplify policy distribution and visibility.',
                    'Overlay thinking separates logical intent from the raw underlying transport.',
                    'The family name matters because campus, WAN, and data-center requirements are not identical.'
                  ]
                }
              ]
            },
            {
              title: 'Scenario Matching at the CCNA Level',
              content: `<p>Scenario questions are usually easier than they look. If the problem is campus segmentation and fabric-style access policy, think SD-Access. If the problem is branch and WAN path control, think SD-WAN. If the problem is application-centric policy in the data center, think ACI.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'SDN solution checklist',
                  items: [
                    'Campus usually points toward SD-Access.',
                    'WAN path and branch policy usually point toward SD-WAN.',
                    'Data-center fabric and application policy usually point toward ACI.',
                    'Use environment context first before worrying about specific controller names.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Cisco uses different SDN families because campus, WAN, and data-center problems are different.',
            'SD-Access aligns to campus, SD-WAN to WAN, and ACI to the data center.',
            'Controllers and overlays are common architectural ideas across these families.',
            'Scenario matching is mostly about identifying the environment and operational goal correctly.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://developer.cisco.com/docs/', coverageNotes: 'Cisco official developer/documentation reference aligned to controller-based SDN solutions and programmable fabrics.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('automation-programmability', '6.5', 'Catalyst Center (DNAC)', [
        'Explain Catalyst Center as an SD-Access controller with assurance and AI capabilities.',
        'Identify northbound and southbound API roles across the platform.',
      ], 'comparison-viewer', 'DNAC Dashboard Walkthrough', 'Feature-identification MCQ', { icon: 'DOCS', quizBank: 'quizBanks/automationProgrammability/catalystCenterDnac', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What Catalyst Center Is',
              content: `<p>Catalyst Center, formerly known as DNA Center, is Cisco’s controller and management platform for intent-based campus operations. It is closely associated with SD-Access discussions, but it also represents a broader management and automation platform with design, policy, provisioning, and assurance capabilities.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Catalyst Center perspective',
                  items: [
                    'It acts as a central platform for campus-oriented automation and visibility.',
                    'It is closely tied to SD-Access design and operation.',
                    'It combines planning, provisioning, and assurance in one management model.'
                  ]
                }
              ]
            },
            {
              title: 'Assurance, Automation, and AI-Oriented Value',
              content: `<p>Catalyst Center is not only a provisioning tool. It also emphasizes assurance and analytics, giving operators visibility into network health and policy behavior. The platform’s AI-oriented capabilities are part of the broader goal of making operations more predictive and less reactive.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Catalyst Center capability lens',
                  columns: ['Capability', 'What it supports', 'Operational effect'],
                  rows: [
                    ['Design / policy', 'Intent definition and planning', 'Improves standardization and repeatability'],
                    ['Provisioning', 'Automated deployment of intended changes', 'Reduces repetitive device-by-device work'],
                    ['Assurance', 'Visibility and analytics', 'Helps operators validate health and investigate issues']
                  ]
                }
              ]
            },
            {
              title: 'Northbound and Southbound Roles in the Platform',
              content: `<p>Catalyst Center also fits the SDN interface model. It exposes northbound APIs for higher-level integration and uses southbound communication toward the infrastructure it manages. The CCNA-level value is understanding where the platform sits in the operational stack.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Catalyst Center checklist',
                  items: [
                    'Associate Catalyst Center with campus automation and SD-Access control.',
                    'Remember that assurance is a major operational theme, not an optional side note.',
                    'Use northbound for application/integration perspective and southbound for infrastructure/device perspective.',
                    'Treat the platform as a controller and management layer rather than just a GUI replacement for CLI.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Catalyst Center is Cisco’s campus-oriented controller and automation platform, strongly associated with SD-Access.',
            'It combines design, provisioning, and assurance rather than acting as only a deployment tool.',
            'Assurance and analytics are central to its operational value.',
            'The platform participates in both northbound and southbound API relationships.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/products/cloud-systems-management/catalyst-center/index.html', coverageNotes: 'Cisco Catalyst Center product reference aligned to SD-Access control, assurance, and platform capabilities.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('automation-programmability', '6.6', 'REST APIs', [
        'Map CRUD operations to HTTP methods and interpret common response-code families.',
        'Read URI structure and understand REST as an application-to-application interface.',
      ], 'decision-simulator', 'REST API Request Builder', 'Method-to-CRUD + response code MCQ', { icon: 'DOCS', quizBank: 'quizBanks/automationProgrammability/restApis', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What a REST API Is',
              content: `<p>REST stands for Representational State Transfer. In practice, a REST API is an application-to-application interface that uses HTTP methods and resource-oriented URIs so software systems can request or update information in a predictable way.</p><p>The CCNA focus is practical rather than philosophical: know that REST APIs are how software talks to other software, and understand the common HTTP methods and response-code patterns that appear in automation workflows.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'REST mindset',
                  items: [
                    'REST is about software-to-software interaction, not human CLI input.',
                    'Resources are identified through URIs.',
                    'HTTP methods communicate the intended action on that resource.'
                  ]
                }
              ]
            },
            {
              title: 'CRUD and HTTP Method Mapping',
              content: `<p>REST questions often reduce to mapping CRUD behavior to HTTP methods. GET reads data, POST creates, PUT replaces, PATCH partially updates, and DELETE removes. The exact implementation can vary, but this mapping is the core exam-level model.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'HTTP and CRUD mapping',
                  columns: ['HTTP method', 'Typical CRUD meaning', 'Operational reading'],
                  rows: [
                    ['GET', 'Read', 'Retrieve state without modifying it'],
                    ['POST', 'Create', 'Submit a new resource or action request'],
                    ['PUT / PATCH', 'Replace / partial update', 'Modify existing data'],
                    ['DELETE', 'Delete', 'Remove the resource or object']
                  ]
                }
              ]
            },
            {
              title: 'URIs, Status Codes, and Statelessness',
              content: `<p>URIs identify the resource being acted on, while response codes describe the result. Successful and failed requests are not just “worked” or “did not work”; they return structured status information. REST is also commonly described as stateless, meaning each request should contain enough context for the server to understand it.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Common response-code families',
                  columns: ['Family', 'High-level meaning', 'Typical reading'],
                  rows: [
                    ['2xx', 'Success', 'The request was accepted and handled successfully'],
                    ['4xx', 'Client-side issue', 'The request was malformed, unauthorized, or otherwise invalid from the client perspective'],
                    ['5xx', 'Server-side issue', 'The server encountered a failure while trying to handle the request']
                  ]
                },
                {
                  type: 'checklist',
                  title: 'REST API checklist',
                  items: [
                    'Use the URI to identify what resource is being addressed.',
                    'Map the HTTP method to the intended CRUD behavior.',
                    'Read the response code family to understand success, client error, or server error outcomes.',
                    'Treat REST as an application-to-application interface rather than a human administration method.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'REST APIs are application-to-application interfaces built around HTTP and resource-oriented URIs.',
            'CRUD behavior is commonly mapped to HTTP methods such as GET, POST, PUT/PATCH, and DELETE.',
            'URIs identify the resource, and response codes describe the outcome of the request.',
            'REST is a core automation concept because it lets software systems exchange and manage network data predictably.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://developer.cisco.com/docs/', coverageNotes: 'Cisco developer documentation aligned to API-driven automation, REST interfaces, and programmable workflows.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('automation-programmability', '6.7', 'REST API Authentication', [
        'Compare basic auth, bearer tokens, API keys, and OAuth 2.0 at a decision level.',
        'Select authentication methods from security and delegation requirements.',
      ], 'decision-simulator', 'Auth Method Selector', 'Scenario to auth type MCQ', { icon: 'LOCK', quizBank: 'quizBanks/automationProgrammability/restApiAuthentication', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why API Authentication Matters',
              content: `<p>An API is a control surface, so authentication matters just as much as it does for human administration. If an API can read or change network state, the system must know who is calling it and what that caller is allowed to do.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Authentication mindset',
                  items: [
                    'APIs are management interfaces and should be treated as sensitive control paths.',
                    'Authentication proves identity before the system returns data or accepts change requests.',
                    'Method choice should match both security needs and integration style.'
                  ]
                }
              ]
            },
            {
              title: 'Basic Auth, API Keys, and Bearer Tokens',
              content: `<p>Different API authentication methods exist because not every workflow has the same trust and delegation model. <strong>Basic authentication</strong> is simple but limited. <strong>API keys</strong> identify an approved calling context. <strong>Bearer tokens</strong> support stronger session-oriented access patterns where possession of the token proves current access.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'API authentication comparison',
                  columns: ['Method', 'High-level idea', 'When it fits'],
                  rows: [
                    ['Basic auth', 'Credentials are presented directly', 'Simple controlled integrations or lab scenarios'],
                    ['API key', 'A key identifies the calling application or request context', 'Straightforward service integration with managed key distribution'],
                    ['Bearer token', 'A presented token grants current access', 'Session-oriented or delegated API workflows']
                  ]
                }
              ]
            },
            {
              title: 'OAuth 2.0 and Delegation Thinking',
              content: `<p>OAuth 2.0 matters because it introduces a delegation model rather than handing the calling application the user’s password directly. The exam-level goal is to recognize that OAuth is valuable when one system needs limited authorized access to another on behalf of a user or service relationship.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'API authentication checklist',
                  items: [
                    'Use simple methods like basic auth only where the risk and design justify them.',
                    'Treat API keys as identity signals for approved integration contexts.',
                    'Treat bearer tokens as access artifacts that must be protected like credentials.',
                    'Associate OAuth 2.0 with delegated access and more mature authorization design.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'API authentication protects a sensitive control surface and should be treated like any other management interface.',
            'Basic auth, API keys, and bearer tokens represent different authentication and access patterns.',
            'Bearer-token designs depend on protecting the token itself as a proof of access.',
            'OAuth 2.0 is important because it supports delegated access rather than exposing user credentials directly.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://developer.cisco.com/docs/', coverageNotes: 'Cisco developer documentation aligned to API authentication, tokens, and integration security.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('automation-programmability', '6.8', 'JSON Data Format', [
        'Explain JSON primitives, objects, arrays, nesting, and syntactic rules.',
        'Validate examples for common mistakes such as trailing commas and incorrect literals.',
      ], 'calculator-tool', 'JSON Validator', 'Error-identification exercise', { icon: 'DOCS', quizBank: 'quizBanks/automationProgrammability/jsonDataFormat', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why JSON Matters in Automation',
              content: `<p>JSON is a lightweight structured data format that appears constantly in network automation, especially in REST API workflows. It is popular because it is both machine-friendly and readable enough for humans to inspect during troubleshooting and development.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Why engineers see JSON often',
                  items: [
                    'REST APIs commonly return or accept JSON.',
                    'The format is structured enough for machines but still readable by operators.',
                    'JSON supports nested data, which matches real network objects well.'
                  ]
                }
              ]
            },
            {
              title: 'Primitives, Objects, Arrays, and Nesting',
              content: `<p>JSON is built from a small set of primitives and structures. Strings, numbers, Booleans, and null values represent basic data. Objects hold key-value pairs. Arrays hold ordered lists. Nesting happens when objects contain arrays, arrays contain objects, or both.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'JSON structure overview',
                  columns: ['Element', 'What it means', 'Typical reading'],
                  rows: [
                    ['Primitive', 'Basic value such as string, number, Boolean, or null', 'The smallest unit of meaning'],
                    ['Object', 'Key-value structure', 'Represents a structured entity'],
                    ['Array', 'Ordered list of values', 'Represents a collection'],
                    ['Nesting', 'Structures inside structures', 'Represents more complex real-world relationships']
                  ]
                }
              ]
            },
            {
              title: 'Syntax Mistakes and Validation Thinking',
              content: `<p>JSON questions often test simple syntax discipline. Common mistakes include trailing commas, incorrect literal usage, bad quotation, or invalid nesting. The automation lesson is that structured data must be syntactically valid before a tool or API can use it reliably.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'JSON validation checklist',
                  items: [
                    'Check for trailing commas and broken quotation first.',
                    'Remember that arrays and objects have different structural roles.',
                    'Use proper JSON literals such as true, false, and null correctly.',
                    'Treat valid syntax as the minimum requirement before discussing meaning.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'JSON is a lightweight structured data format used heavily in network automation and REST APIs.',
            'Key JSON building blocks include primitives, objects, arrays, and nesting.',
            'Nested structures make JSON useful for representing real network objects and relationships.',
            'Syntax validity matters because invalid JSON breaks automation workflows before the logic can even be processed.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://developer.cisco.com/docs/', coverageNotes: 'Cisco developer documentation aligned to JSON-based automation workflows and API data exchange.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('automation-programmability', '6.9', 'XML & YAML', [
        'Compare XML and YAML structures, readability, and common network-automation uses.',
        'Recognize format snippets and understand when each appears in tooling.',
      ], 'comparison-viewer', 'Format Comparison Viewer', 'Format identification MCQ', { icon: 'TABLE', quizBank: 'quizBanks/automationProgrammability/xmlYaml', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why Multiple Data Formats Exist',
              content: `<p>Network automation does not use one universal format for every task. XML, YAML, and JSON each exist because different tools and protocols emphasize different strengths such as strict structure, human readability, or ecosystem popularity.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Format comparison mindset',
                  items: [
                    'Do not assume one format replaces all others.',
                    'Compare formats by readability, structure, and where they commonly appear.',
                    'Recognize that tooling choice often drives format choice.'
                  ]
                }
              ]
            },
            {
              title: 'XML Versus YAML',
              content: `<p>XML is highly structured and tag-oriented. YAML is designed for readability and is often easier for humans to write directly. The CCNA-level comparison is not about every syntax rule, but about recognizing the general look and common usage pattern of each format.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'XML and YAML comparison',
                  columns: ['Format', 'General character', 'Common impression'],
                  rows: [
                    ['XML', 'Tag-based and explicit', 'More verbose but very structured'],
                    ['YAML', 'Indentation- and readability-focused', 'More human-friendly for direct authoring']
                  ]
                }
              ]
            },
            {
              title: 'Recognizing Formats in Tooling',
              content: `<p>Some protocols and tools are strongly associated with particular formats. YAML is strongly associated with Ansible playbooks. XML often appears in older or protocol-specific management workflows. JSON appears heavily in REST APIs. The exam skill is to identify the format and connect it to the likely tooling context.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Format recognition checklist',
                  items: [
                    'Look for tags when identifying XML.',
                    'Look for indentation-driven readability when identifying YAML.',
                    'Associate YAML strongly with playbook-style automation workflows.',
                    'Treat format recognition as part of tool and protocol recognition.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Multiple formats exist because different tools and protocols optimize for different strengths.',
            'XML is more explicit and tag-based, while YAML emphasizes readability.',
            'Format recognition is a useful exam skill because it often signals the surrounding tooling context.',
            'YAML is especially associated with human-authored playbook-style automation.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://developer.cisco.com/docs/', coverageNotes: 'Cisco developer documentation aligned to structured data exchange and automation-tool data formats.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('automation-programmability', '6.10', 'Ansible', [
        'Explain Ansible as a Python-based, agentless, SSH-driven automation tool using YAML playbooks.',
        'Place inventory, templates, variables, and playbooks into the correct workflow order.',
      ], 'diagram-builder', 'Ansible Workflow Diagram', 'File-type matching + MCQ', { icon: 'AUTO', quizBank: 'quizBanks/automationProgrammability/ansible', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'What Makes Ansible Different',
              content: `<p>Ansible is widely recognized for being <strong>agentless</strong>, <strong>Python-based</strong>, and for using human-readable <strong>YAML playbooks</strong>. Rather than requiring a resident agent on every managed node, it commonly connects through SSH or API-based workflows and applies the described tasks from the automation controller side.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Ansible profile',
                  items: [
                    'Ansible is commonly described as a Python-based automation tool.',
                    'Agentless operation is one of Ansible’s most important distinguishing traits.',
                    'YAML playbooks make intended tasks readable and structured.',
                    'SSH-driven workflows make it familiar in many network environments.'
                  ]
                }
              ]
            },
            {
              title: 'Inventory, Variables, Templates, and Playbooks',
              content: `<p>Ansible workflows are easier to understand when you separate the main building blocks. <strong>Inventory</strong> identifies what systems are being targeted. <strong>Variables</strong> define values that can change. <strong>Templates</strong> help generate intended configuration text. <strong>Playbooks</strong> define the ordered tasks to apply.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Ansible workflow elements',
                  columns: ['Element', 'Purpose', 'Operational meaning'],
                  rows: [
                    ['Inventory', 'List or group of managed systems', 'Defines what devices are being targeted'],
                    ['Variables', 'Values that can be reused or changed', 'Improve flexibility and reuse'],
                    ['Templates', 'Reusable text patterns', 'Help generate intended config or output'],
                    ['Playbooks', 'Ordered automation tasks in YAML', 'Describe the actual workflow to execute']
                  ]
                }
              ]
            },
            {
              title: 'Why Ansible Fits Network Automation',
              content: `<p>Ansible is appealing because it combines structured readability with practical control over many systems. At the exam level, you should connect Ansible to agentless operation, YAML playbooks, SSH-driven workflow, and repeatable multi-device task execution.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Ansible checklist',
                  items: [
                    'Associate Ansible with YAML playbooks and agentless operation.',
                    'Remember that inventory, variables, templates, and playbooks have different jobs.',
                    'Treat Ansible as a tool for repeatable multi-device automation rather than one-off scripting only.',
                    'Expect SSH or API-style connections rather than per-node resident agents in the classic model.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Ansible is widely known as an agentless automation tool that commonly uses SSH and YAML playbooks.',
            'Inventory, variables, templates, and playbooks are distinct parts of the workflow.',
            'Ansible emphasizes readable, repeatable multi-device automation.',
            'Its agentless model is a major reason it is popular in network automation discussions.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://developer.cisco.com/docs/', coverageNotes: 'Cisco developer documentation aligned to automation tooling, APIs, and controller-driven workflows.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('automation-programmability', '6.11', 'Terraform', [
        'Contrast declarative provisioning with configuration management and explain plan/apply workflow.',
        'Identify when Terraform is a better fit than Ansible for infrastructure tasks.',
      ], 'comparison-viewer', 'Terraform vs Ansible Comparator', 'Tool-selection MCQ', { icon: 'AUTO', quizBank: 'quizBanks/automationProgrammability/terraform', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Declarative Provisioning Versus Configuration Management',
              content: `<p>Terraform is often taught through the idea of <strong>declarative provisioning</strong>. Instead of describing every command to run step by step, the engineer describes the intended end state, and the tool works toward that result. This makes Terraform a strong conceptual contrast to tools that are more directly associated with ongoing configuration management tasks.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Terraform comparison lens',
                  columns: ['Concept', 'Terraform emphasis', 'Why it matters'],
                  rows: [
                    ['Declarative model', 'Describe desired end state', 'The tool works toward the intended result'],
                    ['Provisioning focus', 'Create or shape infrastructure', 'Strong fit for infrastructure build and lifecycle tasks'],
                    ['Compared with config management', 'Less about per-device ongoing state enforcement', 'Helps differentiate it from tools like Ansible in exam questions']
                  ]
                }
              ]
            },
            {
              title: 'Plan and Apply Workflow',
              content: `<p>The Terraform workflow is often summarized as <strong>plan</strong> and <strong>apply</strong>. Plan previews the proposed change, while apply executes it. This reinforces the idea that infrastructure automation should be reviewed before the system is changed.</p>`,
              blocks: [
                {
                  type: 'steps',
                  title: 'Terraform workflow idea',
                  items: [
                    'Describe the intended infrastructure state.',
                    'Generate a plan that shows the expected change.',
                    'Review the plan for correctness and intent.',
                    'Apply the plan to move the infrastructure toward the desired state.'
                  ]
                }
              ]
            },
            {
              title: 'When Terraform Fits Better Than Ansible',
              content: `<p>Terraform is usually the stronger fit when the question is about provisioning or lifecycle management of infrastructure resources. Ansible is often the easier fit when the question is about agentless task automation and direct configuration workflows. The exam skill is to choose the better conceptual match for the problem.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Terraform checklist',
                  items: [
                    'Associate Terraform with declarative desired-state provisioning.',
                    'Remember plan/apply as the key workflow pattern.',
                    'Use Terraform when the problem sounds like infrastructure provisioning or lifecycle control.',
                    'Use Ansible when the problem sounds like agentless task execution or direct configuration workflow.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Terraform is associated with declarative desired-state provisioning.',
            'The plan/apply workflow reinforces safe review before infrastructure change.',
            'Terraform is often a better conceptual fit for infrastructure lifecycle tasks than pure configuration management.',
            'A common exam skill is knowing when Terraform fits better than Ansible.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://developer.cisco.com/docs/', coverageNotes: 'Cisco developer documentation aligned to infrastructure automation, API consumption, and programmable deployment models.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
      topic('automation-programmability', '6.12', 'Puppet & Chef', [
        'Compare Puppet and Chef with Ansible and Terraform by language, model, agent behavior, and workflow style.',
        'Use a comparison matrix to reinforce the exam-level differences across tools.',
      ], 'diagram-builder', 'Config Management Tool Comparison Matrix', 'Matrix fill-in', { icon: 'TABLE', quizBank: 'quizBanks/automationProgrammability/puppetChef', quizCount: 10,
        theory: {
          sections: [
            {
              title: 'Why Puppet and Chef Are Compared',
              content: `<p>Puppet and Chef are often compared together because both are associated with configuration-management thinking, but they differ in language style, workflow approach, and operational model. In the CCNA context, the goal is not deep tool mastery but clear differentiation between the main automation families.</p>`,
              blocks: [
                {
                  type: 'keyTopic',
                  title: 'Comparison mindset',
                  items: [
                    'Focus on how the tools differ rather than memorizing every feature.',
                    'Compare language style, agent model, and workflow behavior.',
                    'Use the comparison to separate them from Ansible and Terraform conceptually.'
                  ]
                }
              ]
            },
            {
              title: 'Language, Agents, and Workflow Style',
              content: `<p>Puppet and Chef are both more strongly associated with agent-based thinking than classic Ansible. They are also associated with different DSL or code styles and with their own workflow assumptions about how desired configuration is defined and maintained.</p>`,
              blocks: [
                {
                  type: 'table',
                  title: 'Tool comparison matrix',
                  columns: ['Tool', 'Language / authoring style', 'High-level style', 'Main comparison point'],
                  rows: [
                    ['Puppet', 'Manifest / DSL-style authoring', 'Agent-oriented configuration management', 'Associated with manifest-style policy definition'],
                    ['Chef', 'Recipe / Ruby-DSL-style authoring', 'Agent-oriented configuration management', 'Associated with recipe-style workflow and code-driven structure'],
                    ['Ansible', 'YAML playbooks', 'Agentless task/playbook automation', 'Associated with YAML playbooks and SSH-style execution'],
                    ['Terraform', 'Declarative infrastructure definitions', 'Declarative provisioning', 'Associated with desired-state infrastructure lifecycle control']
                  ]
                }
              ]
            },
            {
              title: 'Using the Matrix to Answer Exam Questions',
              content: `<p>Many exam questions are simply tool-classification questions in disguise. If the scenario emphasizes agents and ongoing configuration management, Puppet or Chef is a stronger candidate. If it emphasizes agentless playbooks, think Ansible. If it emphasizes infrastructure provisioning and plan/apply, think Terraform.</p>`,
              blocks: [
                {
                  type: 'checklist',
                  title: 'Tool-classification checklist',
                  items: [
                    'Use agent behavior as one of the first major clues.',
                    'Use workflow style and language form as secondary clues.',
                    'Separate configuration-management tools from provisioning tools.',
                    'Answer by the best conceptual fit, not by memorizing tool names alone.'
                  ]
                }
              ]
            }
          ],
          keyTakeaways: [
            'Puppet and Chef are best compared as configuration-management tools with their own workflow and language styles.',
            'Agent behavior is a major clue when distinguishing Puppet and Chef from Ansible.',
            'Terraform belongs in the provisioning conversation, not the same conceptual bucket as every configuration-management tool.',
            'A comparison matrix helps map each tool to its best conceptual use case.'
          ]
        }, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://developer.cisco.com/docs/', coverageNotes: 'Cisco developer documentation aligned to automation-tool ecosystems, APIs, and programmable operations.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),
    ],
  }),
];
