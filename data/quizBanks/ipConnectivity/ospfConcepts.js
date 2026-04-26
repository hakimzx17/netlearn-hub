import { q } from './helpers.js';

const ospfConceptsBank = [
  q('d3-3-6-q1', 'What type of routing protocol is OSPF?', ['Distance-vector', 'Link-state', 'Path-vector', 'Application-layer'], 1, 'easy', 'OSPF is a link-state protocol that builds a shared topology view and then calculates best paths.'),
  q('d3-3-6-q2', 'What does LSDB stand for in OSPF?', ['Link-State Database', 'Local Switching Decision Base', 'Logical Segment Data Buffer', 'Layered Static Default Backup'], 0, 'easy', 'The LSDB is the link-state database that represents OSPF’s shared topology information.'),
  q('d3-3-6-q3', 'Which algorithm does OSPF use to calculate best paths after learning topology information?', ['Bellman-Ford', 'Dijkstra SPF', 'Round robin', 'Binary search'], 1, 'easy', 'OSPF uses the Shortest Path First algorithm, commonly associated with Dijkstra.'),
  q('d3-3-6-q4', 'Which OSPF packet type is responsible for neighbor discovery and maintenance?', ['Hello', 'ARP', 'DHCP', 'Syslog'], 0, 'easy', 'Hello packets are used to discover and maintain OSPF neighbors.'),
  q('d3-3-6-q5', 'What is the best interpretation of a 2-Way OSPF neighbor state?', ['The routers are always fully adjacent', 'Bidirectional discovery exists, but full adjacency is not guaranteed yet', 'The routing table is fully synchronized', 'The routers have failed DR election'], 1, 'medium', '2-Way means the routers see each other bidirectionally, but they may not yet be fully adjacent.'),
  q('d3-3-6-q6', 'Why are DR and BDR roles used on broadcast multiaccess segments?', ['To eliminate IP addressing', 'To reduce the overhead of unnecessary full-mesh adjacencies', 'To replace SPF', 'To advertise default routes automatically'], 1, 'medium', 'DR and BDR roles help scale OSPF on multiaccess networks by limiting adjacency overhead.'),
  q('d3-3-6-q7', 'What does OSPF flood through the domain?', ['A simple copy of the routing table only', 'Topology information in link-state advertisements', 'Ethernet FCS values', 'ARP cache entries'], 1, 'medium', 'OSPF floods topology information, not just a plain copy of the routing table.'),
  q('d3-3-6-q8', 'Which statement best describes the OSPF control-plane model?', ['Routers exchange full forwarding tables and never build a topology view', 'Routers first build topology knowledge and then each calculates routes locally', 'Routers forward only based on MAC addresses', 'Routers use static routes before Hello packets'], 1, 'medium', 'OSPF routers synchronize topology knowledge first and then each router runs SPF for its own route calculation.'),
  q('d3-3-6-q9', 'Which state typically follows Init in the common OSPF state progression?', ['Loading', 'Exchange', '2-Way', 'Full'], 2, 'medium', 'After Init, the next familiar milestone is 2-Way when bidirectional Hello awareness exists.'),
  q('d3-3-6-q10', 'What is the OSPF metric called?', ['Administrative distance', 'Cost', 'Hop count', 'Priority only'], 1, 'easy', 'OSPF uses cost as its path metric.'),
];

export default ospfConceptsBank;
