import { q } from './helpers.js';

const xmlYamlBank = [
  q('d6-6-9-q1', 'What is a common high-level trait of XML?', ['Tag-based and explicit structure', 'Only indentation matters', 'It is always shorter than YAML', 'It cannot represent nested data'], 0, 'easy', 'XML is commonly recognized by its explicit tag-based structure.'),
  q('d6-6-9-q2', 'What is a common high-level trait of YAML?', ['Readability-focused and indentation-driven structure', 'Tag-based verbosity', 'Only machine-readable syntax', 'A binary format'], 0, 'easy', 'YAML is commonly recognized for readability and indentation-driven structure.'),
  q('d6-6-9-q3', 'Why do multiple data formats exist in automation?', ['Different tools and protocols optimize for different strengths', 'Because one format cannot store text', 'Because formats replace APIs', 'Because each vendor requires a separate OSI layer'], 0, 'medium', 'Multiple formats exist because different tools optimize for different strengths.'),
  q('d6-6-9-q4', 'Which format is strongly associated with Ansible playbooks?', ['XML', 'YAML', 'CSV', 'GIF'], 1, 'easy', 'Ansible playbooks are strongly associated with YAML.'),
  q('d6-6-9-q5', 'What is the best way to recognize XML at a glance?', ['Look for explicit tags', 'Look for only square brackets', 'Look for HTTP methods', 'Look for STP states'], 0, 'medium', 'XML is usually recognized by its explicit tag-based notation.'),
  q('d6-6-9-q6', 'What is the best way to recognize YAML at a glance?', ['Look for indentation-driven structure and readability-focused formatting', 'Look for angle-bracket tags', 'Look for only IP addresses', 'Look for syslog severities'], 0, 'medium', 'YAML is recognized by indentation and readability-focused formatting.'),
  q('d6-6-9-q7', 'Why is format recognition useful on the exam?', ['It often signals the likely tooling or protocol context', 'It replaces all understanding of the tool', 'It only matters for VLANs', 'It changes the data plane'], 0, 'medium', 'Recognizing the format often helps you infer the surrounding tool or protocol context.'),
  q('d6-6-9-q8', 'Which statement best compares XML and YAML?', ['XML is more explicit and verbose; YAML is more human-friendly to author directly', 'YAML is always more verbose than XML', 'They are identical', 'XML cannot be nested'], 0, 'medium', 'That is the core high-level distinction between the two formats.'),
  q('d6-6-9-q9', 'Which format is most strongly associated with a “playbook-style” automation workflow?', ['YAML', 'XML', 'BGP', 'SNMP'], 0, 'easy', 'YAML is the format most strongly associated with playbook-style automation workflows.'),
  q('d6-6-9-q10', 'What is the best summary of XML and YAML reasoning?', ['Compare them by structure, readability, and likely tool context', 'Treat them as random text', 'Only memorize tag names', 'Ignore how tools use them'], 0, 'hard', 'The best exam approach is to compare them by structure, readability, and likely tool context.'),
];

export default xmlYamlBank;
