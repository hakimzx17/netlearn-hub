import { q } from './helpers.js';

const dynamicArpInspectionBank = [
  q('d5-5-11-q1', 'What attack does Dynamic ARP Inspection directly help mitigate?', ['ARP poisoning', 'NTP spoofing', 'Syslog flooding', 'FTP bounce'], 0, 'easy', 'DAI helps mitigate ARP poisoning by validating ARP traffic.'),
  q('d5-5-11-q2', 'What does DAI commonly use as its source of truth for valid IP-to-MAC mappings?', ['DHCP Snooping binding table', 'DNS MX records', 'Syslog history', 'AAA accounting logs'], 0, 'easy', 'DAI commonly relies on the DHCP Snooping binding table.'),
  q('d5-5-11-q3', 'Why is ARP poisoning dangerous?', ['It can falsely redirect local traffic by claiming wrong MAC ownership for an IP', 'It changes the OSPF cost', 'It disables TLS', 'It creates new DHCP scopes'], 0, 'medium', 'ARP poisoning is dangerous because false ARP ownership claims can redirect traffic.'),
  q('d5-5-11-q4', 'How are untrusted ports generally treated in DAI?', ['ARP traffic is inspected and validated more strictly', 'They are automatically given all privileges', 'They disable DHCP Snooping', 'They become NTP peers'], 0, 'medium', 'Untrusted ports are where ARP traffic is inspected more strictly.'),
  q('d5-5-11-q5', 'What is the role of trusted ports in DAI?', ['They carry expected infrastructure behavior and are treated differently from user-facing edges', 'They always drop ARP', 'They only carry FTP', 'They remove the need for bindings'], 0, 'medium', 'Trusted ports are treated differently because they represent expected infrastructure paths.'),
  q('d5-5-11-q6', 'Why is DAI often discussed together with DHCP Snooping?', ['Because the Snooping bindings provide validation data for DAI', 'Because both features are routing protocols', 'Because DAI replaces trusted ports', 'Because DAI only works over SSH'], 0, 'easy', 'DAI and DHCP Snooping are linked because DAI commonly uses the Snooping bindings.'),
  q('d5-5-11-q7', 'What is the main design goal of DAI?', ['Reduce trust in false ARP identity claims on the segment', 'Increase WAN throughput', 'Create wireless PMF', 'Replace ACLs'], 0, 'medium', 'DAI exists to reduce trust in false ARP ownership claims.'),
  q('d5-5-11-q8', 'Why might rate limiting be relevant in DAI?', ['To tune response to suspicious ARP behavior on untrusted ports', 'To increase DNS caching', 'To generate certificates', 'To set the router ID'], 0, 'medium', 'Rate limiting is part of tuning how the switch responds to suspicious ARP behavior.'),
  q('d5-5-11-q9', 'What kind of feature is DAI best understood as?', ['A Layer 2 trust-control and validation feature', 'A WAN routing protocol', 'A file transfer method', 'An NTP authentication method'], 0, 'easy', 'DAI is best understood as a Layer 2 trust-control feature.'),
  q('d5-5-11-q10', 'What is the best summary of DAI?', ['It validates ARP behavior against known legitimate mappings to reduce poisoning', 'It encrypts all ARP traffic', 'It replaces DHCP Snooping', 'It is only for wireless users'], 0, 'hard', 'DAI validates ARP claims using known-good information to reduce poisoning risk.'),
];

export default dynamicArpInspectionBank;
