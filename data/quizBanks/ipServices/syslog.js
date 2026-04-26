import { q } from './helpers.js';

const syslogBank = [
  q('d4-4-9-q1', 'What is the main purpose of Syslog?', ['To provide standardized event logging', 'To allocate IP addresses', 'To encrypt Telnet', 'To translate addresses'], 0, 'easy', 'Syslog provides a standardized model for device event logging.'),
  q('d4-4-9-q2', 'Which severity number is more urgent in Syslog?', ['7', '6', '4', '0'], 3, 'easy', 'Lower Syslog severity numbers represent more urgent conditions.'),
  q('d4-4-9-q3', 'Which severity level name matches level 0?', ['Debug', 'Emergency', 'Warning', 'Notification'], 1, 'easy', 'Level 0 is Emergency, the most urgent severity in the common scale.'),
  q('d4-4-9-q4', 'What is true about Syslog severity ordering?', ['Higher numbers are always more urgent', 'Lower numbers are more urgent, higher numbers are more verbose', 'Severity applies only to FTP', 'Severity replaces message text'], 1, 'medium', 'The Syslog scale runs from urgent low numbers to less severe, often more verbose higher numbers.'),
  q('d4-4-9-q5', 'Which UDP port is commonly associated with Syslog?', ['514', '161', '69', '53'], 0, 'easy', 'UDP 514 is the commonly cited Syslog port.'),
  q('d4-4-9-q6', 'Why is centralized remote logging valuable?', ['It preserves and aggregates evidence even if an individual device is unavailable later', 'It disables the console completely', 'It removes the need for time sync', 'It replaces SSH'], 0, 'medium', 'Centralized logging is valuable because it keeps event history in one place even if a device reloads or fails.'),
  q('d4-4-9-q7', 'Which idea is part of basic Syslog message structure?', ['Facility and severity', 'OUI and duplex', 'Wildcard and mask', 'Area and cost'], 0, 'medium', 'Facility and severity are core parts of how Syslog messages are interpreted conceptually.'),
  q('d4-4-9-q8', 'What is a likely drawback of enabling too much noisy console logging?', ['It can distract operators and clutter interactive sessions', 'It increases the DHCP lease time', 'It forces NAT overload', 'It disables SNMP traps'], 0, 'medium', 'Console logging can be noisy and distracting if not managed carefully.'),
  q('d4-4-9-q9', 'Which destination is best associated with long-term event preservation and correlation?', ['Remote centralized log host', 'Only the console', 'Only the monitor session', 'Only the ARP cache'], 0, 'easy', 'A remote centralized log host is the best fit for long-term event retention and correlation.'),
  q('d4-4-9-q10', 'What is the best operational mindset for Syslog?', ['It is evidence, so both message severity and destination matter', 'It is only decoration on the CLI', 'It is just another routing protocol', 'It replaces ACLs'], 0, 'hard', 'Syslog is operational evidence, so what is logged and where it goes both matter.'),
];

export default syslogBank;
