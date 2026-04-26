import { q } from './helpers.js';

const attackTypesBank = [
  q('d5-5-2-q1', 'What is the primary goal of a DoS or DDoS attack?', ['Steal credentials', 'Disrupt availability', 'Modify routing tables silently', 'Build a certificate chain'], 1, 'easy', 'DoS and DDoS attacks mainly target availability.'),
  q('d5-5-2-q2', 'Which attack type is most associated with pretending to be a trusted identity?', ['Spoofing', 'Redundancy', 'Hashing', 'Sandboxing'], 0, 'easy', 'Spoofing is about false identity claims.'),
  q('d5-5-2-q3', 'Which phrase best describes a man-in-the-middle attack?', ['Overwhelming a service with traffic', 'Intercepting traffic between two parties', 'Physically stealing hardware', 'Only gathering public information'], 1, 'medium', 'A MITM attack intercepts communication between two parties.'),
  q('d5-5-2-q4', 'What is reconnaissance in a security context?', ['Gathering information before a deeper attack', 'Dropping packets randomly', 'Changing DHCP options', 'Disabling NAT'], 0, 'medium', 'Reconnaissance is information gathering that often happens before a later attack.'),
  q('d5-5-2-q5', 'What is an amplification attack trying to abuse?', ['Another service or protocol to magnify traffic toward the victim', 'A one-way password hash', 'A static route', 'A VLAN access port'], 0, 'medium', 'Amplification attacks abuse an intermediate service to magnify traffic at the victim.'),
  q('d5-5-2-q6', 'Which attack family is most directly associated with repeated credential guessing?', ['Brute force / password attack', 'Tailgating', 'NTP drift', 'ARP inspection'], 0, 'easy', 'Password attacks often rely on brute-force or repeated guessing techniques.'),
  q('d5-5-2-q7', 'Which clue points most strongly to a spoofing attack?', ['A claimed identity does not match reality', 'Traffic volume overwhelms a server', 'A backup path fails over correctly', 'The log server is centralized'], 0, 'medium', 'Spoofing attacks are identified by false or impersonated identity.'),
  q('d5-5-2-q8', 'Which category is best matched to “availability collapse through resource exhaustion”?', ['MITM', 'DoS / DDoS', 'Reconnaissance', 'Pretexting'], 1, 'easy', 'Availability collapse through exhaustion is the classic DoS/DDoS pattern.'),
  q('d5-5-2-q9', 'Why does correct attack classification matter?', ['Because the right mitigation depends on the mechanism being used', 'Because all attacks are mitigated the same way', 'Because classification eliminates the need for controls', 'Because only malware matters'], 0, 'medium', 'Different attack mechanisms require different defenses, so classification matters.'),
  q('d5-5-2-q10', 'Which description best matches malware in an attack-classification discussion?', ['Malicious software used to damage, steal, or persist on a target system', 'A protection mechanism for Layer 2 trust', 'A type of DNS record', 'A normal SDN overlay behavior'], 0, 'medium', 'Malware is malicious software used to damage systems, steal information, or maintain unauthorized access.'),
];

export default attackTypesBank;
