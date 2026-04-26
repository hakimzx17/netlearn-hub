import { q } from './helpers.js';

const aclFundamentalsBank = [
  q('d5-5-6-q1', 'How are ACL entries processed?', ['Bottom to top', 'Randomly', 'Top to bottom with first match winning', 'Only after routing fails'], 2, 'easy', 'ACLs are processed top to bottom and the first match wins.'),
  q('d5-5-6-q2', 'What does a standard ACL match?', ['Source IP only', 'Source and destination IP with ports', 'Only MAC addresses', 'Only application names'], 0, 'easy', 'A standard ACL matches only the source IP address.'),
  q('d5-5-6-q3', 'What can an extended ACL match that a standard ACL cannot?', ['Destination, protocol, and port context', 'Only interface speed', 'Only device hostname', 'Only syslog severity'], 0, 'easy', 'Extended ACLs can match more detailed traffic context such as destination, protocol, and ports.'),
  q('d5-5-6-q4', 'Where is an extended ACL usually placed?', ['Closer to the source', 'Closer to the destination', 'Only on loopbacks', 'Only on DHCP servers'], 0, 'medium', 'Extended ACLs are usually placed closer to the source so unwanted traffic is stopped earlier.'),
  q('d5-5-6-q5', 'Where is a standard ACL usually placed?', ['Closer to the source', 'Closer to the destination', 'Only on WAN links', 'Only on APs'], 1, 'medium', 'Standard ACLs are usually placed closer to the destination because they only match the source.'),
  q('d5-5-6-q6', 'In a Cisco wildcard mask, what does a 0 bit mean?', ['Ignore this bit', 'Must match this bit', 'Encrypt this bit', 'Treat as broadcast'], 1, 'medium', 'In wildcard logic, 0 means the bit must match.'),
  q('d5-5-6-q7', 'What does the implicit rule at the end of every ACL effectively do?', ['Permit all remaining traffic', 'Deny all unmatched traffic', 'Convert traffic to best effort', 'Enable SSH'], 1, 'easy', 'Every ACL ends with an implicit deny for unmatched traffic.'),
  q('d5-5-6-q8', 'Why can ACL direction matter?', ['Because the same policy may behave differently inbound versus outbound', 'Because direction only affects NTP', 'Because direction replaces wildcard masks', 'Because direction is ignored by interfaces'], 0, 'medium', 'Inbound versus outbound application changes which traffic is evaluated and when.'),
  q('d5-5-6-q9', 'What is the main operational mistake to avoid with ACLs?', ['Forgetting placement, direction, or the implicit deny', 'Using source IPs in a standard ACL', 'Reading entries from top to bottom', 'Matching protocols in an extended ACL'], 0, 'hard', 'Placement, direction, and the implicit deny are common causes of unintended ACL behavior.'),
  q('d5-5-6-q10', 'What is the best summary of ACL fundamentals?', ['ACLs are ordered packet-matching policies whose effect depends on correct application', 'ACLs are general encryption systems', 'ACLs replace firewalls completely', 'ACLs only apply to physical interfaces'], 0, 'medium', 'ACLs are ordered traffic-matching policies and must be applied correctly to have the intended effect.'),
];

export default aclFundamentalsBank;
