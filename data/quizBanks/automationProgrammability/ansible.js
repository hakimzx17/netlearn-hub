import { q } from './helpers.js';

const ansibleBank = [
  q('d6-6-10-q1', 'What is a defining trait of Ansible?', ['Agentless operation', 'Requires a resident agent on every node', 'Only works with XML', 'Only manages one device at a time'], 0, 'easy', 'Ansible is widely recognized as agentless.'),
  q('d6-6-10-q2', 'What language/format are Ansible playbooks commonly written in?', ['XML', 'YAML', 'CSV', 'BGP'], 1, 'easy', 'Ansible playbooks are commonly written in YAML.'),
  q('d6-6-10-q3', 'Which transport or access model is strongly associated with classic Ansible usage?', ['SSH-driven connections', 'Only serial console connections', 'Only MPLS transport', 'Only SNMP traps'], 0, 'medium', 'Classic Ansible usage is commonly associated with SSH-driven connections.'),
  q('d6-6-10-q4', 'What is the role of inventory in Ansible?', ['Identify which systems are being targeted', 'Encrypt the playbook', 'Replace variables', 'Act as the data plane'], 0, 'easy', 'Inventory defines which systems or groups are being targeted.'),
  q('d6-6-10-q5', 'What is the role of variables in Ansible?', ['Hold reusable values that can change between scenarios', 'Create VLAN trunks', 'Replace the inventory', 'Disable SSH'], 0, 'easy', 'Variables hold reusable values that can change as needed.'),
  q('d6-6-10-q6', 'What is the purpose of templates in Ansible?', ['Generate reusable output or configuration text', 'Replace the playbook engine', 'Provide OAuth tokens', 'Store syslog messages'], 0, 'medium', 'Templates help generate reusable configuration or output text.'),
  q('d6-6-10-q7', 'What is the role of a playbook in Ansible?', ['Describe the ordered automation tasks to execute', 'Act as the routing table', 'Provide only the device password', 'Store wireless encryption settings'], 0, 'easy', 'Playbooks define the ordered tasks in the automation workflow.'),
  q('d6-6-10-q8', 'Why is Ansible appealing in network automation?', ['It combines agentless operation, readability, and repeatable multi-device workflows', 'It requires complex per-node agents', 'It replaces all APIs', 'It is only for data centers'], 0, 'medium', 'Ansible is attractive because it is readable, repeatable, and agentless.'),
  q('d6-6-10-q9', 'What is the best way to distinguish Ansible from Puppet/Chef conceptually?', ['Ansible is strongly associated with agentless YAML playbooks', 'Ansible is more tied to recipe-based Ruby DSL', 'Ansible is a declarative infrastructure-only tool', 'Ansible is a wireless controller'], 0, 'medium', 'Ansible is most strongly associated with agentless YAML playbooks.'),
  q('d6-6-10-q10', 'What is the best summary of Ansible?', ['An agentless, Python-based automation tool using YAML playbooks and repeatable workflows', 'A stateful firewall', 'A VPN tunneling protocol', 'A DNS record type'], 0, 'hard', 'That is the clearest summary of Ansible in this curriculum.'),
];

export default ansibleBank;
