import { q } from './helpers.js';

const snmpBank = [
  q('d4-4-8-q1', 'What does SNMP primarily help an operator do?', ['Monitor and manage network devices', 'Translate private IPs', 'Provide encrypted shell access only', 'Allocate DHCP leases'], 0, 'easy', 'SNMP helps monitoring systems observe and sometimes manage devices using a standard model.'),
  q('d4-4-8-q2', 'What does NMS stand for in SNMP discussions?', ['Network Management Station', 'Network Marking System', 'Native Management Server', 'Node Memory Service'], 0, 'easy', 'The NMS is the management station that polls or receives notifications from devices.'),
  q('d4-4-8-q3', 'What is the role of the SNMP agent?', ['It runs on the managed device and exposes management information', 'It is the syslog server', 'It generates SSH keys', 'It replaces the routing table'], 0, 'easy', 'The agent is the process on the managed device that participates in SNMP operations.'),
  q('d4-4-8-q4', 'What do MIB and OID help define?', ['The structured information model for managed data', 'The DHCP lease duration', 'The VLAN trunk native setting', 'The NTP stratum hierarchy'], 0, 'medium', 'MIB and OID define the structured naming and organization of managed information.'),
  q('d4-4-8-q5', 'Which SNMP operation is manager-driven and used to read information from the device?', ['Trap', 'Get', 'Syslog', 'DHCP Offer'], 1, 'medium', 'A Get is a manager-driven read operation used to obtain information from the agent.'),
  q('d4-4-8-q6', 'What is the purpose of an SNMP trap?', ['It is an unsolicited notification from the device to the manager', 'It is a static NAT mapping', 'It is a DNS referral', 'It is an SSH key exchange'], 0, 'easy', 'A trap lets the device proactively notify the manager about an important event.'),
  q('d4-4-8-q7', 'Which UDP port pair is commonly associated with SNMP?', ['67 and 68', '161 and 162', '20 and 21', '22 and 23'], 1, 'easy', 'SNMP commonly uses UDP 161 for queries and UDP 162 for notifications.'),
  q('d4-4-8-q8', 'What best distinguishes SNMPv3 from SNMPv1/v2c?', ['SNMPv3 offers stronger authentication and encryption support', 'SNMPv3 removes the MIB', 'SNMPv3 uses DHCP ports', 'SNMPv3 cannot send notifications'], 0, 'medium', 'SNMPv3 improves security compared with the weaker community-string model of SNMPv1/v2c.'),
  q('d4-4-8-q9', 'Which statement best describes Set in SNMP?', ['It allows a manager to write or change a managed value', 'It is a routing metric', 'It is only used by Syslog', 'It is the same as a trap'], 0, 'medium', 'Set is the manager-driven write/change operation in the SNMP model.'),
  q('d4-4-8-q10', 'Why should access to SNMP be controlled carefully?', ['Because management traffic exposes operational information and sometimes control', 'Because SNMP replaces VLANs', 'Because SNMP is required for routing', 'Because SNMP disables logging'], 0, 'medium', 'SNMP can expose device information and, in some cases, permit changes, so the management surface should be restricted.'),
];

export default snmpBank;
