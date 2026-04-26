import { q } from './helpers.js';

const ieee8021xPnacBank = [
  q('d5-5-5-q1', 'What is the main purpose of 802.1X?', ['To control network access before normal trust is granted', 'To translate private IPs', 'To create QoS classes', 'To replace ACLs'], 0, 'easy', '802.1X controls access before the endpoint is treated as fully trusted on the network.'),
  q('d5-5-5-q2', 'Which 802.1X role is the endpoint requesting network access?', ['Supplicant', 'Authenticator', 'Authentication server', 'Syslog collector'], 0, 'easy', 'The supplicant is the endpoint requesting access.'),
  q('d5-5-5-q3', 'Which 802.1X role is commonly the switch or AP controlling entry?', ['Supplicant', 'Authenticator', 'Agent', 'Resolver'], 1, 'easy', 'The authenticator controls access at the edge device, often a switch or AP.'),
  q('d5-5-5-q4', 'What is the job of the authentication server in 802.1X?', ['Validate identity and return the authorization decision', 'Generate DHCP leases', 'Perform NAT overload', 'Select the root bridge'], 0, 'medium', 'The authentication server validates the credentials or method and returns the decision.'),
  q('d5-5-5-q5', 'What does EAPoL refer to?', ['EAP over LAN', 'Encrypted Access Policy over Link', 'Ethernet ARP Policy on Link', 'Extended AAA Protocol over Loopback'], 0, 'easy', 'EAPoL stands for EAP over LAN.'),
  q('d5-5-5-q6', 'Why is EAPoL important in 802.1X?', ['It carries the local-link identity exchange that begins access control', 'It replaces certificates', 'It creates a GRE tunnel', 'It disables wireless encryption'], 0, 'medium', 'EAPoL is the local-link exchange used to start the access-control process.'),
  q('d5-5-5-q7', 'Which EAP method family is best associated with certificate-oriented authentication?', ['EAP-TLS', 'PEAP', 'EAP-FAST', 'TACACS+'], 0, 'medium', 'EAP-TLS is the certificate-oriented EAP method family in this comparison.'),
  q('d5-5-5-q8', 'Which EAP family is commonly described as a protected tunnel carrying inner user authentication?', ['PEAP', 'WEP', 'NTP', 'Syslog'], 0, 'medium', 'PEAP is commonly described as a protected tunnel that carries inner user authentication.'),
  q('d5-5-5-q9', 'What is the best summary of 802.1X trust logic?', ['The network requires identity validation before granting normal access', 'Every connected host is trusted by default', 'Only routers can use 802.1X', '802.1X is only a wireless feature'], 0, 'easy', '802.1X exists so the network does not blindly trust every newly connected endpoint.'),
  q('d5-5-5-q10', 'Why is comparing EAP method families useful at the CCNA level?', ['Because they illustrate different ways identity can be protected and validated', 'Because they replace DHCP', 'Because they determine VLAN speed', 'Because they are all the same'], 0, 'medium', 'Different EAP families illustrate different approaches to proving and protecting identity during network access.'),
];

export default ieee8021xPnacBank;
