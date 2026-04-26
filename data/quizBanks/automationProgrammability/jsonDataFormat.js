import { q } from './helpers.js';

const jsonDataFormatBank = [
  q('d6-6-8-q1', 'What is JSON best described as?', ['A lightweight structured data format', 'A routing protocol', 'A VPN type', 'A password hash'], 0, 'easy', 'JSON is a lightweight structured data format used heavily in automation.'),
  q('d6-6-8-q2', 'Which JSON element represents a key-value structure?', ['Array', 'Object', 'Boolean', 'Null'], 1, 'easy', 'Objects represent key-value structures in JSON.'),
  q('d6-6-8-q3', 'Which JSON element represents an ordered list?', ['Object', 'Array', 'String', 'Integer'], 1, 'easy', 'Arrays represent ordered lists of values.'),
  q('d6-6-8-q4', 'Which of the following is a JSON primitive?', ['Boolean', 'Template', 'Controller', 'URI path'], 0, 'medium', 'Boolean is one of the basic JSON primitives, along with strings, numbers, and null.'),
  q('d6-6-8-q5', 'What does nesting mean in JSON?', ['Structures such as objects or arrays placed inside other structures', 'Using XML tags inside JSON', 'Encrypting the payload', 'Appending syslog headers'], 0, 'medium', 'Nesting means objects and arrays can exist inside other objects and arrays.'),
  q('d6-6-8-q6', 'Why is JSON common in REST API workflows?', ['It is structured, lightweight, and readable enough for people and machines', 'It replaces HTTP methods', 'It only works on Cisco IOS', 'It is required by DHCP'], 0, 'medium', 'JSON is common because it balances machine structure with human readability.'),
  q('d6-6-8-q7', 'Which mistake commonly breaks JSON validity?', ['Trailing commas in the wrong place', 'Using arrays', 'Using numbers', 'Using quoted keys'], 0, 'medium', 'Trailing commas are a common reason JSON becomes invalid.'),
  q('d6-6-8-q8', 'What is the correct role of null in JSON?', ['It represents an explicit empty/no-value state', 'It means the API succeeded', 'It creates an array', 'It encrypts a field'], 0, 'medium', 'null is used to represent an explicit no-value state.'),
  q('d6-6-8-q9', 'Why is syntax validation important in JSON-driven automation?', ['Invalid JSON breaks the workflow before the logic can even be used', 'Validation only matters for XML', 'Syntax errors are ignored by APIs', 'Only routing tables need validation'], 0, 'hard', 'Bad JSON syntax breaks automation before the system can process the intended logic.'),
  q('d6-6-8-q10', 'What is the best summary of JSON reasoning?', ['Know the primitives, objects, arrays, nesting, and common syntax mistakes', 'Only memorize one sample payload', 'Treat JSON as unstructured text', 'Ignore validity rules'], 0, 'easy', 'That is the core JSON reasoning model for automation questions.'),
];

export default jsonDataFormatBank;
