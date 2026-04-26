import { q } from './helpers.js';

const dhcpSnoopingBank = [
  q('d5-5-10-q1', 'What problem does DHCP Snooping primarily address?', ['Rogue DHCP behavior on the access edge', 'NTP drift', 'DNS recursion loops', 'Route summarization'], 0, 'easy', 'DHCP Snooping helps stop rogue DHCP behavior on the access edge.'),
  q('d5-5-10-q2', 'Which ports should normally be trusted in a DHCP Snooping design?', ['Ports toward legitimate DHCP infrastructure', 'All access ports', 'Only disabled ports', 'Only wireless client ports'], 0, 'easy', 'Trusted ports are usually the uplinks toward legitimate DHCP infrastructure.'),
  q('d5-5-10-q3', 'How should ordinary user-facing access ports usually be treated in DHCP Snooping?', ['Trusted by default', 'Untrusted by default', 'Converted to routed ports', 'Assigned to Area 0'], 1, 'easy', 'User-facing access ports are usually untrusted by default.'),
  q('d5-5-10-q4', 'What is the DHCP Snooping binding table used for?', ['Recording legitimate lease-related identity information', 'Choosing firewall zones', 'Storing syslog severity', 'Electing the DR'], 0, 'medium', 'The binding table records lease information and supports later validation logic.'),
  q('d5-5-10-q5', 'Why is rogue DHCP dangerous?', ['It can hand out false gateway or DNS information to clients', 'It always disables ARP', 'It creates stronger authentication', 'It reduces jitter'], 0, 'medium', 'A rogue DHCP service can push false network settings such as gateway or DNS to clients.'),
  q('d5-5-10-q6', 'What is Option 82 associated with in DHCP Snooping discussions?', ['Additional relay/context information', 'Wireless PMF', 'Port Security sticky mode', 'AAA accounting'], 0, 'medium', 'Option 82 adds relay-related context information in some DHCP designs.'),
  q('d5-5-10-q7', 'Why can rate limiting matter on untrusted ports?', ['It helps reduce abusive DHCP behavior from the access edge', 'It replaces the need for trusted ports', 'It creates tunnels', 'It enables SSH'], 0, 'medium', 'Rate limiting can help reduce DHCP abuse from untrusted user-facing ports.'),
  q('d5-5-10-q8', 'What is the core trust model behind DHCP Snooping?', ['Only expected infrastructure directions should carry server-like DHCP replies', 'Every port should act like a DHCP server', 'Only trunk ports use DHCP', 'Only RADIUS can validate leases'], 0, 'medium', 'DHCP Snooping is based on trusting only the expected infrastructure path for server replies.'),
  q('d5-5-10-q9', 'Which feature commonly benefits from the DHCP Snooping binding table later?', ['Dynamic ARP Inspection', 'Route summarization', 'FTP control', 'Syslog severity'], 0, 'easy', 'DAI commonly uses the DHCP Snooping binding table as validation data.'),
  q('d5-5-10-q10', 'What is the best summary of DHCP Snooping?', ['It separates trusted DHCP infrastructure from untrusted access edges and records valid lease information', 'It encrypts DHCP', 'It replaces NAT', 'It is only for WAN links'], 0, 'hard', 'DHCP Snooping controls DHCP trust boundaries and records binding information for validation.'),
];

export default dhcpSnoopingBank;
