import { q } from './helpers.js';

const passwordSecurityAaaBank = [
  q('d5-5-4-q1', 'What does AAA stand for?', ['Authentication, Authorization, Accounting', 'Access, Audit, Availability', 'Authenticate, Analyze, Allow', 'Address, Authorization, Audit'], 0, 'easy', 'AAA stands for Authentication, Authorization, and Accounting.'),
  q('d5-5-4-q2', 'Which AAA function answers the question “Who are you?”', ['Authentication', 'Authorization', 'Accounting', 'Availability'], 0, 'easy', 'Authentication verifies identity.'),
  q('d5-5-4-q3', 'Which AAA function answers the question “What can you do?”', ['Authentication', 'Authorization', 'Accounting', 'Encryption'], 1, 'easy', 'Authorization determines what actions are permitted.'),
  q('d5-5-4-q4', 'Which statement about MFA is correct?', ['Using multiple factor types is stronger than password-only authentication', 'MFA means two passwords only', 'MFA replaces authorization', 'MFA is only for NTP'], 0, 'easy', 'MFA is stronger because it combines factor types instead of relying on one password alone.'),
  q('d5-5-4-q5', 'Which is an example of “something you have” in MFA?', ['A hardware token or phone app', 'A memorized password', 'A role-based privilege set', 'A route advertisement'], 0, 'medium', 'A token or phone app is an example of something you have.'),
  q('d5-5-4-q6', 'Which Cisco-style password handling approach is stronger than weak reversible password storage?', ['Hashed or one-way secret handling', 'Plain shared line password only', 'Service password-encryption by itself', 'An SNMP trap'], 0, 'medium', 'Hashed or one-way secret handling is stronger than weak reversible password storage or simple obfuscation.'),
  q('d5-5-4-q7', 'What is a certificate used for at a high level?', ['To establish signed cryptographic identity trust', 'To create a VLAN', 'To mark QoS traffic', 'To store ACL sequence numbers'], 0, 'medium', 'Certificates support identity trust using a cryptographic signing model.'),
  q('d5-5-4-q8', 'Which centralized AAA option is commonly associated with network access authentication scenarios?', ['RADIUS', 'Syslog', 'FTP', 'DHCP'], 0, 'medium', 'RADIUS is commonly associated with broad network access authentication scenarios.'),
  q('d5-5-4-q9', 'Which centralized AAA option is more associated with device administration and deeper command control?', ['TACACS+', 'ARP', 'TFTP', 'NTP'], 0, 'medium', 'TACACS+ is often associated with device administration and more detailed command authorization thinking.'),
  q('d5-5-4-q10', 'What is the best security takeaway for password and AAA design?', ['Strong secrets, MFA, and centralized AAA together reduce weak-credential risk', 'Passwords no longer matter if a firewall exists', 'AAA replaces the need for user identities', 'Certificates are the same as usernames'], 0, 'hard', 'Good security design combines stronger credentials, better factor use, and centralized control rather than relying on one weak mechanism.'),
];

export default passwordSecurityAaaBank;
