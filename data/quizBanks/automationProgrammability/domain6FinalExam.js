import { multi, order, single } from './helpers.js';

const T = {
  auto: 'automation-programmability-6-1-why-network-automation',
  planes: 'automation-programmability-6-2-logical-planes',
  sdn: 'automation-programmability-6-3-sdn-architecture',
  ciscoSdn: 'automation-programmability-6-4-cisco-sdn-solutions',
  dnac: 'automation-programmability-6-5-catalyst-center-dnac',
  rest: 'automation-programmability-6-6-rest-apis',
  auth: 'automation-programmability-6-7-rest-api-authentication',
  json: 'automation-programmability-6-8-json-data-format',
  formats: 'automation-programmability-6-9-xml-yaml',
  ansible: 'automation-programmability-6-10-ansible',
  terraform: 'automation-programmability-6-11-terraform',
  tools: 'automation-programmability-6-12-puppet-chef',
};

const domain6FinalExamBank = [
  single('d6-final-q01', T.auto, 'Why is network automation valuable at scale?', ['It reduces drift and improves repeatability', 'It removes all need for validation', 'It disables APIs', 'It replaces routing protocols'], 0, 'easy', 'Automation reduces drift and improves repeatability at scale.'),
  single('d6-final-q02', T.auto, 'What is configuration drift?', ['A gap between intended state and actual deployed state over time', 'A QoS delay metric', 'A wireless encryption mode', 'A route summarization feature'], 0, 'medium', 'Configuration drift is the divergence between intended and actual deployed state.'),

  single('d6-final-q03', T.planes, 'Which plane is responsible for forwarding traffic?', ['Data plane', 'Control plane', 'Management plane', 'Application plane'], 0, 'easy', 'The data plane forwards traffic.'),
  single('d6-final-q04', T.planes, 'Which plane is associated with configuration and monitoring interfaces?', ['Data plane', 'Control plane', 'Management plane', 'Transport plane'], 2, 'easy', 'The management plane is associated with configuration, monitoring, and administration.'),

  single('d6-final-q05', T.sdn, 'What is a defining trait of SDN architecture?', ['Centralized control and programmable behavior', 'Only Layer 2 switching', 'No APIs', 'No devices'], 0, 'easy', 'SDN architecture emphasizes centralized control and programmable behavior.'),
  order('d6-final-q06', T.sdn, 'Place the common SDN layers from top to bottom:', [['app', 'Application'], ['ctrl', 'Control'], ['infra', 'Infrastructure']], ['app', 'ctrl', 'infra'], 'medium', 'The common SDN model is Application, Control, then Infrastructure.'),
  single('d6-final-q07', T.sdn, 'What do northbound interfaces connect to from the controller perspective?', ['Applications', 'Forwarding devices', 'Only wireless clients', 'Only DNS servers'], 0, 'medium', 'Northbound interfaces face applications from the controller perspective.'),

  single('d6-final-q08', T.ciscoSdn, 'Which Cisco solution best matches campus intent-based segmentation and automation?', ['SD-Access', 'SD-WAN', 'ACI', 'Chef'], 0, 'easy', 'SD-Access is the best match for campus intent-based segmentation and automation.'),
  single('d6-final-q09', T.ciscoSdn, 'Which Cisco solution best matches WAN path and branch transport policy?', ['ACI', 'SD-WAN', 'SD-Access', 'Puppet'], 1, 'medium', 'SD-WAN best matches WAN path and branch transport policy.'),
  single('d6-final-q10', T.ciscoSdn, 'Which Cisco solution best matches application-centric data-center fabric policy?', ['ACI', 'SD-WAN', 'SD-Access', 'RESTCONF'], 0, 'medium', 'ACI best matches the data-center application-centric fabric use case.'),

  single('d6-final-q11', T.dnac, 'What is Catalyst Center best understood as?', ['A campus-oriented controller and automation platform', 'A routing protocol', 'A TFTP server', 'An STP feature'], 0, 'easy', 'Catalyst Center is a campus-oriented controller and automation platform.'),
  multi('d6-final-q12', T.dnac, 'Which TWO capabilities are central to Catalyst Center? (Select 2)', ['Provisioning automation', 'Assurance and analytics', 'Replacing all infrastructure devices', 'Disabling APIs'], [0, 1], 'medium', 'Provisioning and assurance/analytics are central platform capabilities.'),

  single('d6-final-q13', T.rest, 'What does REST stand for?', ['Representational State Transfer', 'Remote Endpoint Secure Transport', 'Routing Encapsulation State Table', 'Response Exchange Schema Tool'], 0, 'easy', 'REST stands for Representational State Transfer.'),
  single('d6-final-q14', T.rest, 'Which HTTP method is commonly mapped to retrieving data without modifying it?', ['POST', 'GET', 'DELETE', 'PATCH'], 1, 'easy', 'GET retrieves data without modifying it.'),
  single('d6-final-q15', T.rest, 'Which response-code family most commonly indicates a client-side request issue?', ['2xx', '3xx', '4xx', '5xx'], 2, 'medium', '4xx commonly indicates a client-side issue with the request.'),

  single('d6-final-q16', T.auth, 'What is the main value of OAuth 2.0 in API security?', ['Delegated access without exposing user credentials directly to every application', 'It replaces HTTP methods', 'It disables tokens', 'It is a DHCP protocol'], 0, 'medium', 'OAuth 2.0 is valuable because it supports delegated access models.'),
  single('d6-final-q17', T.auth, 'What best describes a bearer token?', ['A presented token that grants current access', 'A routing advertisement', 'A VLAN identifier', 'A Syslog facility'], 0, 'easy', 'A bearer token grants access when presented.'),

  single('d6-final-q18', T.json, 'Which JSON structure holds key-value pairs?', ['Array', 'Object', 'String', 'Boolean'], 1, 'easy', 'Objects hold key-value pairs in JSON.'),
  single('d6-final-q19', T.json, 'Which issue commonly breaks JSON validity?', ['Trailing commas', 'Using arrays', 'Using Booleans', 'Using objects'], 0, 'medium', 'Trailing commas are a common reason JSON becomes invalid.'),

  single('d6-final-q20', T.formats, 'Which format is strongly associated with readable playbook-style authoring?', ['YAML', 'XML', 'CSV', 'BGP'], 0, 'easy', 'YAML is strongly associated with readable playbook-style authoring.'),
  single('d6-final-q21', T.formats, 'Which format is most easily recognized by explicit tags?', ['YAML', 'XML', 'JSON only', 'OAuth'], 1, 'easy', 'XML is recognized by explicit tags.'),

  single('d6-final-q22', T.ansible, 'Which tool is best described as agentless and YAML-playbook-driven?', ['Ansible', 'Chef', 'Puppet', 'Terraform'], 0, 'easy', 'Ansible is the agentless YAML-playbook-driven tool in this comparison.'),
  single('d6-final-q23', T.terraform, 'Which workflow is most associated with Terraform?', ['Plan and apply', 'Hello and dead', 'Request and acknowledge', 'Listen and learn'], 0, 'easy', 'Terraform is strongly associated with the plan/apply workflow.'),
  multi('d6-final-q24', T.tools, 'Which TWO clues best distinguish Puppet/Chef from classic Ansible? (Select 2)', ['They are more associated with agent-based thinking', 'They are more associated with manifest/recipe-style authoring', 'They are primarily first-hop redundancy protocols', 'They replace all provisioning tools'], [0, 1], 'medium', 'Agent behavior and authoring style are major clues when distinguishing Puppet/Chef from Ansible.'),
  single('d6-final-q25', T.tools, 'What is the best overall takeaway from comparing automation tools?', ['Different tools fit different automation problems, so classification matters', 'One tool always replaces all the others', 'Only YAML matters', 'Only provisioning matters'], 0, 'hard', 'Different tools fit different problems, so accurate classification matters.'),
];

export default domain6FinalExamBank;
