import { q } from './helpers.js';

const multiAreaOspfBank = [
  q('d3-3-9-q1', 'What is the role of Area 0 in a multi-area OSPF design?', ['It is the OSPF backbone area', 'It is reserved only for IPv6', 'It is the default gateway for hosts', 'It is where ARP entries are stored'], 0, 'easy', 'Area 0 is the backbone area that anchors inter-area communication in multi-area OSPF.'),
  q('d3-3-9-q2', 'What does ABR stand for?', ['Administrative Backup Router', 'Area Border Router', 'Autonomous Backbone Route', 'Area Broadcast Relay'], 1, 'easy', 'An ABR is an Area Border Router that connects Area 0 to one or more other OSPF areas.'),
  q('d3-3-9-q3', 'What is the primary role of an ASBR?', ['To elect the DR on Ethernet', 'To inject routes from outside OSPF into the OSPF domain', 'To replace the router ID', 'To disable SPF on remote areas'], 1, 'easy', 'An ASBR introduces routing information from outside the OSPF autonomous system.'),
  q('d3-3-9-q4', 'Which route category describes reachability learned from another OSPF area through an ABR?', ['Intra-area', 'Inter-area', 'Connected only', 'Local host route'], 1, 'medium', 'Inter-area routes are learned across area boundaries through ABRs.'),
  q('d3-3-9-q5', 'Which route category best describes reachability imported into OSPF from outside the OSPF domain?', ['Local', 'Connected', 'External', 'Passive'], 2, 'medium', 'External routes originate outside OSPF and enter through an ASBR.'),
  q('d3-3-9-q6', 'Why is multi-area OSPF used instead of one flat area in larger designs?', ['To make troubleshooting impossible', 'To improve operational scale and structure topology exchange', 'To eliminate the need for SPF', 'To stop using Area 0'], 1, 'medium', 'Multi-area OSPF is used to structure the design and make larger domains more scalable operationally.'),
  q('d3-3-9-q7', 'What is the best first step when reading a multi-area OSPF topology question?', ['Find Area 0 and then identify ABRs and ASBRs', 'Delete every external route', 'Look for VLAN tags first', 'Start by changing the OSPF metric'], 0, 'medium', 'Marking the backbone and the special router roles first makes the rest of the topology much easier to interpret.'),
  q('d3-3-9-q8', 'A router has interfaces only inside one OSPF area and does not import external routes. Which statement best fits?', ['It is an ABR by default', 'It is an ASBR by default', 'It can be an internal router', 'It must be in Area 0'], 2, 'easy', 'A router that stays inside one area and does not inject external routes is simply an internal router.'),
  q('d3-3-9-q9', 'Which statement about Area 0 is accurate?', ['It is optional in every multi-area design', 'It is the central backbone reference area for inter-area communication', 'It exists only on stub areas', 'It is used only for static routes'], 1, 'easy', 'Area 0 is the backbone reference point in multi-area OSPF.'),
  q('d3-3-9-q10', 'What does an O IA route code commonly indicate?', ['A directly connected route', 'An inter-area OSPF route', 'An external BGP route', 'A local interface host route'], 1, 'hard', 'O IA indicates an inter-area OSPF route learned through an ABR.'),
];

export default multiAreaOspfBank;
