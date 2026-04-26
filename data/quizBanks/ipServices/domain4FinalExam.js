import { multi, order, single } from './helpers.js';

const T = {
  natTerms: 'ip-services-4-1-nat-concepts-terminology',
  staticNat: 'ip-services-4-2-static-nat',
  dynNat: 'ip-services-4-3-dynamic-nat-pat',
  ntp: 'ip-services-4-4-ntp',
  dns: 'ip-services-4-5-dns',
  dhcp: 'ip-services-4-6-dhcp',
  ssh: 'ip-services-4-7-ssh-remote-access',
  snmp: 'ip-services-4-8-snmp',
  syslog: 'ip-services-4-9-syslog',
  qos: 'ip-services-4-10-qos-fundamentals',
  files: 'ip-services-4-11-tftp-ftp',
};

const domain4FinalExamBank = [
  single('d4-final-q01', T.natTerms, 'What is the main operational purpose of NAT at the network edge?', ['To change address representation across the boundary', 'To elect the DR', 'To build a DHCP scope', 'To synchronize device clocks'], 0, 'easy', 'NAT changes address representation as traffic crosses the inside/outside boundary.'),
  single('d4-final-q02', T.natTerms, 'Which NAT term describes the translated public representation of the inside host?', ['Inside local', 'Inside global', 'Outside local', 'Outside private'], 1, 'easy', 'Inside global is the translated public representation of the inside host.'),

  single('d4-final-q03', T.staticNat, 'What best describes static NAT?', ['Many-to-one sharing using ports', 'Permanent one-to-one mapping', 'DHCP relay behavior', 'Syslog forwarding'], 1, 'easy', 'Static NAT is a permanent one-to-one address mapping.'),
  single('d4-final-q04', T.staticNat, 'Why is static NAT commonly chosen for internal servers?', ['It gives the server a stable public identity', 'It disables inbound access', 'It removes the need for routing', 'It replaces DNS records'], 0, 'medium', 'Static NAT is often used to publish a server through a stable public address.'),

  single('d4-final-q05', T.dynNat, 'What is the key advantage of PAT over plain dynamic NAT?', ['It allows many inside hosts to share one public IP by using ports', 'It removes the need for interface roles', 'It disables ACL matching', 'It requires no translation table'], 0, 'easy', 'PAT scales by distinguishing sessions with unique source ports.'),
  single('d4-final-q06', T.dynNat, 'What is a strong first suspicion if new sessions fail in a dynamic NAT design without overload?', ['Pool exhaustion', 'Wrong syslog severity', 'Missing SSH keys', 'Bad DSCP marking'], 0, 'medium', 'Dynamic NAT without overload can run out of public addresses in the pool.'),
  multi('d4-final-q07', T.dynNat, 'Which TWO statements about PAT are correct? (Select 2)', ['It is also called NAT overload', 'It distinguishes many sessions with Layer 4 ports', 'It always requires one public IP per inside host', 'It removes the need for NAT inside/outside interface roles'], [0, 1], 'medium', 'PAT is NAT overload and scales by using unique source ports across shared public addressing.'),

  single('d4-final-q08', T.ntp, 'What is the main purpose of NTP?', ['To synchronize device clocks', 'To assign IP addresses', 'To translate addresses', 'To encrypt CLI sessions'], 0, 'easy', 'NTP synchronizes device clocks so operational evidence stays consistent.'),
  single('d4-final-q09', T.ntp, 'Which stratum level is directly tied to an authoritative reference source?', ['Stratum 1', 'Stratum 4', 'Stratum 8', 'Stratum 16'], 0, 'easy', 'Stratum 1 is directly tied to an authoritative source such as GPS or an atomic reference.'),

  single('d4-final-q10', T.dns, 'What does DNS primarily do?', ['Translate names into IP addresses', 'Assign default gateways', 'Create NTP associations', 'Replace SSH'], 0, 'easy', 'DNS translates names into IP addresses.'),
  single('d4-final-q11', T.dns, 'Which record type maps a hostname to an IPv6 address?', ['A', 'AAAA', 'MX', 'PTR'], 1, 'easy', 'AAAA records map hostnames to IPv6 addresses.'),

  order('d4-final-q12', T.dhcp, 'Place the DHCP DORA sequence in the correct order:', [['discover', 'Discover'], ['offer', 'Offer'], ['request', 'Request'], ['ack', 'Acknowledge']], ['discover', 'offer', 'request', 'ack'], 'easy', 'DHCP follows Discover, Offer, Request, and Acknowledge.'),
  single('d4-final-q13', T.dhcp, 'What does ip helper-address do in a DHCP design?', ['Relays DHCP traffic across a router toward the server', 'Enables static NAT', 'Creates a DNS record', 'Builds a syslog trap'], 0, 'medium', 'ip helper-address relays DHCP across routed boundaries.'),
  single('d4-final-q14', T.dhcp, 'Which UDP port pair is correct for DHCP?', ['53/53', '67 server and 68 client', '161/162', '20/21'], 1, 'easy', 'DHCP uses UDP 67 on the server side and UDP 68 on the client side.'),

  single('d4-final-q15', T.ssh, 'Why is SSH preferred over Telnet?', ['SSH encrypts the session', 'SSH removes the need for user accounts', 'SSH uses only UDP', 'SSH replaces NTP'], 0, 'easy', 'SSH encrypts the management session, unlike Telnet.'),
  single('d4-final-q16', T.ssh, 'Which VTY transport setting is the secure choice for Cisco-style remote CLI access?', ['transport input ftp', 'transport input telnet', 'transport input ssh', 'transport input tftp'], 2, 'easy', 'transport input ssh limits remote CLI access to the secure protocol.'),

  single('d4-final-q17', T.snmp, 'Which SNMP component lives on the managed device?', ['NMS', 'Agent', 'Resolver', 'Syslog collector'], 1, 'easy', 'The SNMP agent runs on the managed device.'),
  single('d4-final-q18', T.snmp, 'Which SNMP message is an unsolicited notification from the device?', ['Get', 'Set', 'Trap', 'Request'], 2, 'medium', 'A trap is an unsolicited notification from the agent to the manager.'),

  single('d4-final-q19', T.syslog, 'Which Syslog severity is more urgent?', ['7', '6', '4', '1'], 3, 'easy', 'Lower Syslog severity numbers are more urgent than higher ones.'),
  single('d4-final-q20', T.syslog, 'Which UDP port is commonly associated with Syslog?', ['69', '123', '514', '161'], 2, 'easy', 'UDP 514 is the commonly cited Syslog port.'),

  single('d4-final-q21', T.qos, 'Which traffic type is generally most sensitive to delay and jitter?', ['Bulk backup traffic', 'Real-time voice', 'Ordinary best-effort data', 'File transfer only'], 1, 'easy', 'Real-time voice is especially sensitive to delay and jitter.'),
  multi('d4-final-q22', T.qos, 'Which TWO statements about QoS are correct? (Select 2)', ['QoS differentiates treatment under congestion', 'QoS creates new bandwidth on demand', 'Classification identifies traffic type', 'Marking is unrelated to forwarding treatment'], [0, 2], 'medium', 'QoS differentiates treatment under contention, and classification identifies the traffic before policy is applied.'),
  single('d4-final-q23', T.qos, 'What is a common treatment idea for real-time voice compared with ordinary data?', ['Best-effort only', 'Higher-priority low-delay treatment', 'No marking at all', 'Static NAT translation'], 1, 'medium', 'Voice commonly receives expedited low-delay treatment compared with ordinary best-effort data.'),

  single('d4-final-q24', T.files, 'Which protocol is intentionally simpler and commonly associated with UDP 69 for the initial request?', ['FTP', 'SSH', 'TFTP', 'SNMP'], 2, 'easy', 'TFTP is the simple lightweight file transfer protocol associated with UDP 69 for the initial request.'),
  single('d4-final-q25', T.files, 'Which statement best compares FTP and TFTP?', ['FTP uses a richer control/data model and authentication, while TFTP is more minimal', 'TFTP is richer and more secure than FTP', 'They are identical protocols', 'Neither appears in Cisco-style copy workflows'], 0, 'medium', 'FTP is richer and commonly authenticated, while TFTP is much more minimal and is often used in simpler administrative workflows.'),
];

export default domain4FinalExamBank;
