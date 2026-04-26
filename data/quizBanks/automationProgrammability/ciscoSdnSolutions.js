import { q } from './helpers.js';

const ciscoSdnSolutionsBank = [
  q('d6-6-4-q1', 'Which Cisco SDN family is most associated with campus intent-based segmentation and automation?', ['SD-Access', 'SD-WAN', 'ACI', 'HSRP'], 0, 'easy', 'SD-Access is the Cisco family most associated with campus intent-based segmentation and automation.'),
  q('d6-6-4-q2', 'Which Cisco SDN family is most associated with WAN policy and transport control?', ['SD-Access', 'SD-WAN', 'ACI', 'RESTCONF'], 1, 'easy', 'SD-WAN aligns to WAN path and branch policy control.'),
  q('d6-6-4-q3', 'Which Cisco SDN family is most associated with the data center and application-centric fabric policy?', ['ACI', 'SD-WAN', 'SD-Access', 'Ansible'], 0, 'easy', 'ACI is the data-center application-centric fabric solution.'),
  q('d6-6-4-q4', 'Why does Cisco have multiple SDN solution families?', ['Campus, WAN, and data-center environments have different operational problems', 'Because one solution cannot route', 'Because controllers cannot use APIs', 'Because overlays are impossible in one platform'], 0, 'medium', 'Cisco uses different SDN families because different environments solve different problems.'),
  q('d6-6-4-q5', 'What is a common architectural idea across Cisco SDN families?', ['Controllers and overlay/policy abstraction', 'Removing all forwarding devices', 'Eliminating the control plane', 'Only using Telnet'], 0, 'medium', 'Controllers and overlay-style abstraction are common ideas across multiple Cisco SDN families.'),
  q('d6-6-4-q6', 'A question describes branch path selection and WAN transport policy. Which family is the best fit?', ['ACI', 'SD-WAN', 'SD-Access', 'SNMP'], 1, 'medium', 'Branch path selection and WAN transport policy point toward SD-WAN.'),
  q('d6-6-4-q7', 'A question describes policy-driven campus fabric access. Which family is the best fit?', ['SD-Access', 'ACI', 'SD-WAN', 'Terraform'], 0, 'medium', 'Campus fabric-style access control points toward SD-Access.'),
  q('d6-6-4-q8', 'What is the best first clue when matching Cisco SDN solutions in an exam scenario?', ['The environment: campus, WAN, or data center', 'The device hostname', 'The console password', 'The subnet mask'], 0, 'easy', 'Environment context is usually the first and most useful clue.'),
  q('d6-6-4-q9', 'Why are overlays mentioned in Cisco SDN solution discussions?', ['They separate logical intent from the underlying transport', 'They replace all APIs', 'They disable controllers', 'They are only for DHCP'], 0, 'medium', 'Overlay thinking helps separate logical intent from the raw underlay transport.'),
  q('d6-6-4-q10', 'What is the best summary of Cisco SDN solution matching?', ['Match the operational environment first, then the solution family', 'Always choose ACI', 'Always choose SD-Access', 'Ignore the environment and focus only on product names'], 0, 'hard', 'The best approach is to identify the operational environment first, then match the solution family.'),
];

export default ciscoSdnSolutionsBank;
