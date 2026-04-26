import { q } from './helpers.js';

const securityConceptsBank = [
  q('d5-5-1-q1', 'What does the C in the CIA triad stand for?', ['Confidentiality', 'Continuity', 'Classification', 'Certification'], 0, 'easy', 'The C in the CIA triad stands for confidentiality.'),
  q('d5-5-1-q2', 'Which CIA principle is most directly concerned with preventing unauthorized modification of data?', ['Confidentiality', 'Integrity', 'Availability', 'Authentication'], 1, 'easy', 'Integrity is about keeping data accurate and protected from unauthorized change.'),
  q('d5-5-1-q3', 'Which security principle is most closely supported by redundancy and failover?', ['Confidentiality', 'Integrity', 'Availability', 'Hashing'], 2, 'easy', 'Redundancy and failover mainly support availability.'),
  q('d5-5-1-q4', 'What is a vulnerability?', ['A potential danger or actor', 'A weakness that could be abused', 'The actual hostile event', 'The record of the incident'], 1, 'medium', 'A vulnerability is a weakness that may be exploited.'),
  q('d5-5-1-q5', 'What best describes an exploit?', ['A method used to take advantage of a weakness', 'A backup security control', 'A central identity store', 'A routing decision'], 0, 'medium', 'An exploit is the technique used to abuse a vulnerability.'),
  q('d5-5-1-q6', 'Which statement best distinguishes a threat from an attack?', ['A threat is the actual use of force, while an attack is only potential', 'A threat is a potential danger; an attack is the real hostile action', 'They are identical terms', 'A threat exists only after a successful exploit'], 1, 'medium', 'A threat is potential danger, while an attack is the real hostile event.'),
  q('d5-5-1-q7', 'Which control most directly supports confidentiality?', ['Encryption', 'Redundancy', 'Load balancing', 'Route summarization'], 0, 'easy', 'Encryption is a direct confidentiality control.'),
  q('d5-5-1-q8', 'Which control most directly supports integrity?', ['Hashing and digital signatures', 'Port aggregation', 'DHCP relay', 'NTP stratum tuning'], 0, 'medium', 'Hashing and digital signatures help verify integrity.'),
  q('d5-5-1-q9', 'Why is the CIA triad useful to an engineer?', ['It provides a structured way to map attacks and defenses to security objectives', 'It replaces packet filtering', 'It eliminates risk completely', 'It disables spoofing attacks automatically'], 0, 'medium', 'The CIA triad gives a structured way to reason about the security objective under attack.'),
  q('d5-5-1-q10', 'What best describes an attack chain at a high level?', ['A sequence of related steps an attacker uses to move from weakness toward compromise', 'A list of firewall brands', 'A backup routing method', 'A DHCP lease table'], 0, 'hard', 'An attack chain is the sequence of steps an attacker uses as a weakness is discovered, exploited, and expanded toward compromise.'),
];

export default securityConceptsBank;
