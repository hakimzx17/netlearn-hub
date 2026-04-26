import { multi, order, single } from './helpers.js';

const T = {
  router: 'ip-connectivity-3-1-router-operation',
  table: 'ip-connectivity-3-2-routing-table-fundamentals',
  ad: 'ip-connectivity-3-3-administrative-distance',
  static4: 'ip-connectivity-3-4-ipv4-static-routing',
  trouble4: 'ip-connectivity-3-5-ipv4-troubleshooting',
  ospfConcepts: 'ip-connectivity-3-6-ospf-concepts',
  ospfConfig: 'ip-connectivity-3-7-ospf-configuration',
  ospfTypes: 'ip-connectivity-3-8-ospf-network-types-neighbors',
  multiArea: 'ip-connectivity-3-9-multi-area-ospf',
  static6: 'ip-connectivity-3-10-ipv6-static-routing',
  ndp: 'ip-connectivity-3-11-ipv6-routing-ndp',
  hsrp: 'ip-connectivity-3-12-first-hop-redundancy-hsrp',
};

const domain3FinalExamBank = [
  single('d3-final-q01', T.router, 'Which field does a router primarily use to choose a path toward another network?', ['Destination MAC address', 'Destination IP address', 'Source TCP port', 'Frame Check Sequence'], 1, 'easy', 'Routers make forwarding decisions by matching the destination IP against routing-table prefixes.'),
  order('d3-final-q02', T.router, 'Place these routed forwarding actions in the correct order:', [['strip', 'Remove the incoming Layer 2 header'], ['lookup', 'Match the destination IP against the routing table'], ['select', 'Choose the outgoing interface or next hop'], ['reframe', 'Build a new outgoing Layer 2 frame']], ['strip', 'lookup', 'select', 'reframe'], 'medium', 'A router strips the old frame, performs the Layer 3 lookup, selects the path, and then builds a new frame for the next link.'),
  single('d3-final-q03', T.router, 'Why do routers separate broadcast domains?', ['Because each interface is a Layer 3 boundary', 'Because they flood broadcasts more quickly', 'Because they remove IP addressing', 'Because they disable ARP'], 0, 'easy', 'A router interface is a Layer 3 boundary, so normal Layer 2 broadcasts are not forwarded across it.'),

  single('d3-final-q04', T.table, 'What does a connected route represent in the routing table?', ['A route learned from OSPF', 'A network directly attached to the router', 'A route imported by an ASBR', 'A backup route with AD 200'], 1, 'easy', 'Connected routes represent networks directly attached to the router.'),
  single('d3-final-q05', T.table, 'Which prefix is the default route in IPv4?', ['127.0.0.0/8', '255.255.255.255/32', '0.0.0.0/0', '169.254.0.0/16'], 2, 'easy', '0.0.0.0/0 is the default catch-all route.'),
  single('d3-final-q06', T.table, 'If both 192.168.0.0/16 and 192.168.10.0/24 match the destination, which route wins?', ['192.168.0.0/16', '192.168.10.0/24', 'The route with the higher AD', 'The first route configured'], 1, 'easy', 'Longest prefix match means the most specific route wins first.'),
  multi('d3-final-q07', T.table, 'Which TWO statements about routing-table reading are correct? (Select 2)', ['A local route identifies traffic destined to the router interface IP itself', 'The default route is used only when no more specific route matches', 'Administrative distance is always checked before prefix length', 'A connected route is always less specific than a local host route'], [0, 1], 'hard', 'Local routes point to the router’s own interface IPs, and default routes are only used when no more specific entry matches.'),

  single('d3-final-q08', T.ad, 'What does administrative distance compare?', ['Path speed inside one protocol', 'Trust in the source of a route', 'TTL behavior', 'Switching-table age'], 1, 'easy', 'Administrative distance compares how much the router trusts the source of a route.'),
  single('d3-final-q09', T.ad, 'A router learns the same prefix from OSPF and RIP. Which source wins by default?', ['RIP', 'OSPF', 'Neither until a static route exists', 'Both always load balance'], 1, 'medium', 'OSPF wins because AD 110 is lower than RIP’s AD 120.'),
  single('d3-final-q10', T.ad, 'Why is a floating static route configured with a higher AD than the primary path?', ['So it acts as a backup route', 'So it becomes the most trusted route', 'So it replaces longest prefix match', 'So it disables the default route'], 0, 'medium', 'A floating static route uses a higher AD so it stays in reserve until the preferred route fails.'),

  single('d3-final-q11', T.static4, 'What best describes a static route?', ['A route learned automatically with Hellos', 'A route configured manually by the administrator', 'A route created by ARP', 'A route used only for multicast'], 1, 'easy', 'Static routes are manually configured by the administrator.'),
  single('d3-final-q12', T.static4, 'What is the main purpose of a default static route?', ['To match only loopback traffic', 'To act as a catch-all path', 'To elect the DR', 'To create local host routes'], 1, 'easy', 'A default static route is the catch-all path when no more specific route exists.'),
  single('d3-final-q13', T.static4, 'What does recursive lookup refer to with an IPv4 static route?', ['The router resolving how to reach the next-hop IP address', 'The router reordering OSPF LSAs', 'The switch relearning a MAC address', 'The host requesting a new DHCP lease'], 0, 'medium', 'A next-hop static route often requires the router to resolve how to reach that next-hop address.'),
  multi('d3-final-q14', T.static4, 'Which TWO checks are strong validation steps after adding a static route? (Select 2)', ['Use show ip route to confirm the prefix installed', 'Verify the next hop or outgoing path is actually reachable', 'Assume the configuration is correct if no syntax error appeared', 'Skip ping because routing-table visibility is enough'], [0, 1], 'medium', 'Static routes should be validated both in the routing table and through actual reachability of the path.'),

  single('d3-final-q15', T.trouble4, 'What does a successful ping prove?', ['Only the forward path works', 'A round-trip exchange succeeded', 'OSPF is fully adjacent', 'The switch has no loops'], 1, 'easy', 'A successful ping proves the source reached the destination and the reply made it back.'),
  single('d3-final-q16', T.trouble4, 'How does traceroute map routers along the path?', ['By increasing TTL values step by step', 'By learning MAC addresses from switches', 'By forcing OSPF adjacency', 'By disabling ARP'], 0, 'easy', 'Traceroute increases TTL values so routers along the path send time-exceeded responses.'),
  single('d3-final-q17', T.trouble4, 'If a host cannot ping its default gateway, what is the best first focus area?', ['The local interface and local segment', 'The remote ASBR', 'Area 0 design', 'The far-end WAN provider only'], 0, 'easy', 'Failure to reach the default gateway points first to local addressing, the local link, or the gateway-side interface.'),

  single('d3-final-q18', T.ospfConcepts, 'What type of routing protocol is OSPF?', ['Distance-vector', 'Link-state', 'Application-layer', 'Transport-layer'], 1, 'easy', 'OSPF is a link-state routing protocol.'),
  single('d3-final-q19', T.ospfConcepts, 'What does the OSPF LSDB contain?', ['Only MAC addresses', 'Shared topology information built from link-state advertisements', 'Only static routes', 'Only the default route'], 1, 'medium', 'The LSDB is the shared topology map OSPF routers build from link-state information.'),
  order('d3-final-q20', T.ospfConcepts, 'Place these common OSPF neighbor states in logical order from earliest to latest:', [['down', 'Down'], ['init', 'Init'], ['twoway', '2-Way'], ['exchange', 'Exchange/Database sync'], ['full', 'Full']], ['down', 'init', 'twoway', 'exchange', 'full'], 'medium', 'Neighbor formation starts with no valid Hellos, progresses through discovery and database exchange, and ends at Full adjacency.'),
  single('d3-final-q21', T.ospfConcepts, 'Why does OSPF use DR and BDR roles on broadcast networks?', ['To reduce full-mesh adjacency overhead', 'To replace SPF', 'To disable Hellos', 'To convert routes into static entries'], 0, 'medium', 'DR and BDR roles help scale OSPF on multiaccess networks by reducing unnecessary adjacency overhead.'),
  single('d3-final-q22', T.ospfConcepts, 'What is the OSPF path metric called?', ['Hop count', 'Administrative distance', 'Cost', 'Priority'], 2, 'easy', 'OSPF uses cost as its metric.'),

  single('d3-final-q23', T.ospfConfig, 'What is the effect of making an OSPF interface passive?', ['It advertises the network without sending Hellos there', 'It removes the connected route', 'It forces the router to become DR', 'It blocks IPv4 forwarding'], 0, 'medium', 'Passive interfaces still advertise their networks but do not attempt neighbor formation on that link.'),
  single('d3-final-q24', T.ospfConfig, 'Which command is best for checking OSPF adjacency state directly?', ['show ip ospf neighbor', 'show vlan brief', 'show mac address-table', 'show inventory'], 0, 'easy', 'show ip ospf neighbor directly shows adjacency state.'),
  multi('d3-final-q25', T.ospfConfig, 'Which TWO actions are core OSPF configuration decisions? (Select 2)', ['Choosing the correct interfaces or networks for the intended area', 'Setting passive-interface where neighbors should not form', 'Replacing all connected routes with default routes', 'Disabling the router ID entirely'], [0, 1], 'medium', 'Correct area participation and thoughtful passive-interface use are core configuration choices.'),
  single('d3-final-q26', T.ospfConfig, 'What does default-information originate do in OSPF?', ['Injects a default route into OSPF', 'Removes all default routes from the router', 'Converts OSPF into RIP', 'Elects the BDR'], 0, 'medium', 'default-information originate injects a default route into OSPF for downstream routers.'),

  single('d3-final-q27', T.ospfTypes, 'Which OSPF network type commonly uses DR and BDR election?', ['Broadcast', 'Point-to-point', 'Loopback', 'Passive'], 0, 'easy', 'Broadcast networks commonly elect a DR and BDR.'),
  single('d3-final-q28', T.ospfTypes, 'What is the normal DR/BDR expectation on a point-to-point OSPF link?', ['Both roles are required', 'No DR/BDR election is needed', 'Every neighbor becomes DR', 'OSPF cannot run there'], 1, 'easy', 'Point-to-point links do not need DR/BDR election.'),
  single('d3-final-q29', T.ospfTypes, 'A neighbor relationship stalls during database exchange rather than initial discovery. Which issue is a classic suspect?', ['MTU mismatch', 'A valid default route', 'An HSRP virtual IP', 'A connected route'], 0, 'hard', 'MTU mismatch is a classic cause of stalled database exchange before Full adjacency.'),

  single('d3-final-q30', T.multiArea, 'What is Area 0 in OSPF?', ['The backbone area', 'The default gateway for hosts', 'The HSRP standby area', 'The ARP cache area'], 0, 'easy', 'Area 0 is the OSPF backbone area used for inter-area communication.'),
  single('d3-final-q31', T.multiArea, 'What is an ABR?', ['A router that connects Area 0 to another OSPF area', 'A switch that blocks broadcasts', 'A router that disables SPF', 'A host that forms static routes'], 0, 'easy', 'An ABR is an Area Border Router connecting the backbone to other OSPF areas.'),
  single('d3-final-q32', T.multiArea, 'What role injects routes from outside OSPF into the OSPF domain?', ['DR', 'ABR', 'ASBR', 'BDR'], 2, 'medium', 'An ASBR introduces external routes into OSPF.'),

  single('d3-final-q33', T.static6, 'What must be enabled before a router forwards IPv6 traffic normally?', ['ipv6 unicast-routing', 'ipv6 dr-election', 'ipv6 helper-address', 'ipv6 nat overload'], 0, 'easy', 'ipv6 unicast-routing is required for IPv6 forwarding behavior.'),
  single('d3-final-q34', T.static6, 'Why does a link-local IPv6 next hop also require the exit interface in a static route?', ['Because link-local scope is only valid on the local segment', 'Because IPv6 has no default route', 'Because link-local addresses are globally unique', 'Because OSPFv3 requires it'], 0, 'medium', 'Link-local addresses are ambiguous without interface context because they are valid only on the local link.'),
  single('d3-final-q35', T.static6, 'Which prefix is the IPv6 default route?', ['fe80::/10', 'ff00::/8', '::/0', '2000::/3'], 2, 'easy', '::/0 is the IPv6 default route.'),

  single('d3-final-q36', T.ndp, 'NDP belongs to which protocol family?', ['ICMPv6', 'ARP', 'HSRP', 'SNMP'], 0, 'easy', 'Neighbor Discovery is part of ICMPv6.'),
  order('d3-final-q37', T.ndp, 'Place this simplified IPv6 host startup logic in order:', [['ra', 'Learn router advertisement information'], ['form', 'Form or confirm address information'], ['dad', 'Perform Duplicate Address Detection'], ['use', 'Use the address for active forwarding behavior']], ['ra', 'form', 'dad', 'use'], 'medium', 'Hosts learn IPv6 guidance, form addressing information, confirm uniqueness with DAD, and then use the address actively.'),
  single('d3-final-q38', T.ndp, 'Which comparison is correct?', ['NDP is broader than ARP because it also supports router discovery and address-use checks', 'ARP handles router advertisements directly', 'NDP is used only by switches', 'NDP cannot resolve local neighbors'], 0, 'medium', 'NDP includes local neighbor resolution plus router discovery and safe-address behavior.'),

  single('d3-final-q39', T.hsrp, 'What do hosts normally use as their default gateway in an HSRP design?', ['The active router physical IP only', 'The HSRP virtual IP address', 'The router ID', 'The standby router loopback address'], 1, 'easy', 'Hosts point at the virtual IP so the first-hop identity stays stable during failover.'),
  multi('d3-final-q40', T.hsrp, 'Which TWO statements correctly compare first-hop redundancy options? (Select 2)', ['HSRP uses active/standby gateway redundancy with a virtual gateway identity', 'VRRP is generally the standards-based alternative to HSRP', 'GLBP removes redundancy and keeps only load sharing', 'HSRP requires hosts to change default gateways after failover'], [0, 1], 'medium', 'HSRP provides active/standby redundancy, and VRRP is the standards-based alternative. GLBP adds load sharing rather than removing redundancy.'),
];

export default domain3FinalExamBank;
