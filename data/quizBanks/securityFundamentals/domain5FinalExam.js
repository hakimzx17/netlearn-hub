import { multi, order, single } from './helpers.js';

const T = {
  concepts: 'security-fundamentals-5-1-security-concepts',
  attacks: 'security-fundamentals-5-2-attack-types',
  social: 'security-fundamentals-5-3-social-engineering',
  aaa: 'security-fundamentals-5-4-password-security-aaa',
  pnac: 'security-fundamentals-5-5-802-1x-pnac',
  acl: 'security-fundamentals-5-6-acl-fundamentals',
  aacl: 'security-fundamentals-5-7-advanced-acls',
  fw: 'security-fundamentals-5-8-firewalls-ips',
  portsec: 'security-fundamentals-5-9-port-security',
  snoop: 'security-fundamentals-5-10-dhcp-snooping',
  dai: 'security-fundamentals-5-11-dynamic-arp-inspection',
  vpnsite: 'security-fundamentals-5-12-vpns-site-to-site',
  vpnra: 'security-fundamentals-5-13-vpns-remote-access',
  wlan: 'security-fundamentals-5-14-securing-wireless-networks',
};

const domain5FinalExamBank = [
  single('d5-final-q01', T.concepts, 'Which CIA principle focuses on limiting data access to authorized parties only?', ['Confidentiality', 'Integrity', 'Availability', 'Accounting'], 0, 'easy', 'Confidentiality is the CIA principle concerned with limiting data access to authorized parties.'),
  single('d5-final-q02', T.concepts, 'Which term best describes a weakness that could be abused?', ['Threat', 'Exploit', 'Vulnerability', 'Mitigation'], 2, 'easy', 'A vulnerability is a weakness that could be abused.'),

  single('d5-final-q03', T.attacks, 'What is the main goal of a DDoS attack?', ['Steal certificates', 'Disrupt availability', 'Publish DNS zones', 'Change VLAN tags'], 1, 'easy', 'DDoS attacks mainly target availability through resource exhaustion.'),
  single('d5-final-q04', T.attacks, 'Which attack type is best associated with malicious software executing or persisting on a host?', ['Malware', 'Reconnaissance', 'Redundancy', 'Shaping'], 0, 'medium', 'Malware refers to malicious software used to harm systems, steal information, or maintain unauthorized access.'),

  single('d5-final-q05', T.social, 'What is phishing?', ['A fake communication or site meant to steal information', 'A QoS policy', 'A static route', 'A DAI binding'], 0, 'easy', 'Phishing uses fake communications or sites to steal information.'),
  single('d5-final-q06', T.social, 'What is the best response to an urgent unexpected request for credentials?', ['Reply immediately', 'Verify through a trusted channel first', 'Disable SSH', 'Raise the STP priority'], 1, 'medium', 'Verification through a trusted channel is a strong defense against social engineering.'),

  single('d5-final-q07', T.aaa, 'What does AAA stand for?', ['Authentication, Authorization, Accounting', 'Availability, Access, Audit', 'Authentication, ACLs, Auditing', 'Allow, Approve, Account'], 0, 'easy', 'AAA stands for Authentication, Authorization, and Accounting.'),
  multi('d5-final-q08', T.aaa, 'Which TWO statements about MFA and centralized AAA are correct? (Select 2)', ['Using multiple factor types is stronger than password-only authentication', 'RADIUS is commonly associated with network access authentication', 'TACACS+ is mainly a wireless encryption standard', 'Certificates replace identity completely'], [0, 1], 'medium', 'MFA strengthens authentication, and RADIUS is commonly associated with broad access-authentication workflows.'),

  single('d5-final-q09', T.pnac, 'Which 802.1X role is the access device controlling entry?', ['Supplicant', 'Authenticator', 'Authentication server', 'Log collector'], 1, 'easy', 'The authenticator is the access device controlling network entry.'),
  single('d5-final-q10', T.pnac, 'What does EAPoL stand for?', ['EAP over LAN', 'Encrypted Access Policy over Link', 'Ethernet Access Protocol Logic', 'Extended ARP Policy over LAN'], 0, 'easy', 'EAPoL stands for EAP over LAN.'),

  single('d5-final-q11', T.acl, 'What does a standard ACL match?', ['Source IP only', 'Protocol and destination port', 'MAC address only', 'Syslog severity only'], 0, 'easy', 'A standard ACL matches the source IP address only.'),
  single('d5-final-q12', T.acl, 'Where is an extended ACL usually placed?', ['Closer to the source', 'Closer to the destination', 'Only on loopbacks', 'Only on APs'], 0, 'medium', 'Extended ACLs are usually placed closer to the source.'),
  single('d5-final-q13', T.acl, 'What is the implicit rule at the end of every ACL?', ['Permit all unmatched traffic', 'Deny all unmatched traffic', 'Encrypt all unmatched traffic', 'Route all unmatched traffic'], 1, 'easy', 'Every ACL ends with an implicit deny for unmatched traffic.'),

  single('d5-final-q14', T.aacl, 'Why are sequence numbers useful in advanced ACLs?', ['They let you insert or edit entries precisely', 'They disable ordering', 'They replace wildcard masks', 'They convert standard ACLs into extended automatically'], 0, 'easy', 'Sequence numbers make it easier to insert or edit entries precisely.'),
  single('d5-final-q15', T.aacl, 'Why are named ACLs valuable?', ['They improve readability and maintainability', 'They remove the need for direction', 'They disable implicit deny', 'They only work on wireless'], 0, 'easy', 'Named ACLs improve readability and maintainability.'),

  single('d5-final-q16', T.fw, 'What best distinguishes stateful inspection from stateless filtering?', ['Stateful inspection tracks session context', 'Stateful inspection ignores ports', 'Stateless filtering knows every flow deeply', 'There is no difference'], 0, 'easy', 'Stateful inspection tracks session context, unlike stateless filtering.'),
  single('d5-final-q17', T.fw, 'Which IPS approach looks for known bad patterns?', ['Anomaly-based', 'Signature-based', 'Wildcard-based', 'Tunnel-based'], 1, 'medium', 'Signature-based IPS looks for known malicious patterns.'),

  single('d5-final-q18', T.portsec, 'What does sticky MAC learning do in Port Security?', ['Learns and retains secure MAC addresses automatically', 'Disables MAC learning', 'Creates ACLs dynamically', 'Encrypts switch traffic'], 0, 'easy', 'Sticky learning lets the switch learn and retain secure MAC addresses automatically.'),
  multi('d5-final-q19', T.portsec, 'Which TWO are valid Port Security behaviors or outcomes to know? (Select 2)', ['Shutdown behavior can err-disable the port', 'Policy can constrain unexpected MAC behavior at the edge', 'Port Security only works on WAN links', 'Sticky learning removes all need for a maximum count'], [0, 1], 'medium', 'Port Security can trigger shutdown behavior and generally constrains MAC behavior at the access edge.'),

  single('d5-final-q20', T.snoop, 'What is the main trust model of DHCP Snooping?', ['Only expected infrastructure ports should send server-like DHCP replies', 'Every access port should be trusted', 'Only wireless clients use DHCP', 'DHCP Snooping replaces NAT'], 0, 'medium', 'DHCP Snooping trusts only the expected infrastructure direction for DHCP server-like replies.'),
  single('d5-final-q21', T.snoop, 'What table built by DHCP Snooping is useful to later security features?', ['Binding table', 'CAM table', 'Route table', 'ARP cache only'], 0, 'easy', 'The DHCP Snooping binding table is useful to later validation features.'),

  single('d5-final-q22', T.dai, 'What attack does DAI help mitigate?', ['ARP poisoning', 'NTP spoofing', 'FTP bounce', 'MFA fatigue'], 0, 'easy', 'DAI helps mitigate ARP poisoning.'),
  single('d5-final-q23', T.dai, 'What source of truth does DAI commonly use?', ['DHCP Snooping bindings', 'DNS MX records', 'Syslog archives', 'SSH keys'], 0, 'easy', 'DAI commonly uses DHCP Snooping bindings to validate IP-to-MAC mappings.'),

  single('d5-final-q24', T.vpnsite, 'What is the core purpose of a site-to-site VPN?', ['Protected network-to-network connectivity', 'Remote user password reset', 'Wireless PMF configuration', 'ACL sequence insertion'], 0, 'easy', 'A site-to-site VPN provides protected network-to-network connectivity.'),
  single('d5-final-q25', T.vpnsite, 'In GRE over IPsec, what provides the security protection?', ['GRE', 'IPsec', 'DHCP Snooping', 'SNMP'], 1, 'medium', 'GRE provides tunnel structure, but IPsec provides the security protection.'),

  single('d5-final-q26', T.vpnra, 'How is a remote-access VPN best classified?', ['User-to-network secure connectivity', 'Network-to-network branch tunnel only', 'Switch-to-switch trunk only', 'Local ARP validation'], 0, 'easy', 'Remote-access VPNs are user-to-network connectivity models.'),
  single('d5-final-q27', T.vpnra, 'What is AnyConnect best understood as?', ['A remote-access client platform that may use different secure tunnel models', 'A fixed GRE tunnel', 'A DHCP relay utility', 'A wireless encryption generation'], 0, 'medium', 'AnyConnect is a client platform, not one single fixed tunnel technology.'),

  order('d5-final-q28', T.wlan, 'Place these wireless security generations in general order from older to newer:', [['wep', 'WEP'], ['wpa', 'WPA/WPA2'], ['wpa3', 'WPA3']], ['wep', 'wpa', 'wpa3'], 'easy', 'Wireless security generally progresses from WEP to WPA/WPA2 and then to WPA3.'),
  single('d5-final-q29', T.wlan, 'What does PMF stand for?', ['Protected Management Frames', 'Priority Mapping Framework', 'Packet Monitoring Filter', 'Port Management Function'], 0, 'medium', 'PMF stands for Protected Management Frames.'),
  single('d5-final-q30', T.wlan, 'Why is forward secrecy important in modern wireless security?', ['It reduces the value of later credential compromise against previously captured sessions', 'It increases AP transmit power', 'It replaces authentication', 'It disables encryption'], 0, 'hard', 'Forward secrecy reduces the usefulness of later compromise against older captured traffic.'),
];

export default domain5FinalExamBank;
