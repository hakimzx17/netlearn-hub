import { q } from './helpers.js';

const restApisBank = [
  q('d6-6-6-q1', 'What does REST stand for?', ['Representational State Transfer', 'Remote Execution Service Transport', 'Routing Endpoint State Table', 'Real-Time Exchange Security Token'], 0, 'easy', 'REST stands for Representational State Transfer.'),
  q('d6-6-6-q2', 'What best describes a REST API?', ['An application-to-application interface built around HTTP and resources', 'A replacement for Layer 2 switching', 'A certificate authority', 'A local console protocol'], 0, 'easy', 'REST APIs are application-to-application interfaces built around HTTP and resource-oriented URIs.'),
  q('d6-6-6-q3', 'Which HTTP method is commonly mapped to read operations?', ['POST', 'GET', 'DELETE', 'PATCH'], 1, 'easy', 'GET is commonly mapped to read/retrieve operations.'),
  q('d6-6-6-q4', 'Which HTTP method is commonly associated with creating a resource?', ['POST', 'GET', 'DELETE', 'OPTIONS'], 0, 'easy', 'POST is commonly associated with create behavior.'),
  q('d6-6-6-q5', 'Which pair best matches update behavior?', ['PUT or PATCH', 'GET or HEAD', 'FTP or TFTP', 'AAA or ACL'], 0, 'medium', 'PUT and PATCH are commonly associated with update/modify behavior.'),
  q('d6-6-6-q6', 'What is the role of the URI in a REST API?', ['It identifies the resource being acted on', 'It assigns a DHCP lease', 'It encrypts the request', 'It replaces the HTTP method'], 0, 'medium', 'The URI identifies the resource involved in the request.'),
  q('d6-6-6-q7', 'What does a 2xx response-code family generally mean?', ['Success', 'Client-side issue', 'Server-side failure', 'Authentication disabled'], 0, 'medium', '2xx generally indicates success.'),
  q('d6-6-6-q8', 'What does a 4xx response-code family generally mean?', ['Client-side issue with the request', 'Guaranteed success', 'Server-side crash only', 'Time synchronization'], 0, 'medium', '4xx generally indicates a client-side problem such as a bad or unauthorized request.'),
  q('d6-6-6-q9', 'What does statelessness mean in REST discussions?', ['Each request should contain enough context for the server to understand it', 'The server stores every user session permanently', 'The API cannot use authentication', 'Resources do not have URIs'], 0, 'hard', 'REST is commonly described as stateless because each request should be understandable on its own.'),
  q('d6-6-6-q10', 'What is the best summary of REST API reasoning?', ['Match the URI to the resource, the HTTP method to the intended action, and the status code to the outcome', 'Only memorize GET', 'Ignore response codes', 'Treat REST as only a GUI feature'], 0, 'hard', 'That is the cleanest way to reason through a REST API question.'),
];

export default restApisBank;
