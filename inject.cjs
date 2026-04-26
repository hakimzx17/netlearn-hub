const fs = require('fs');
const path = 'data/curriculum/ccnaBlueprints.js';

let content = fs.readFileSync(path, 'utf8');

// Replace standard options object with one containing sourceMappings
content = content.replace(/(\{\s*icon:\s*'[^']+'(?:,\s*\w+:\s*[^,}]+)*)\s*\}\)\s*,/g, (match, prefix) => {
  return `${prefix}, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } }),`;
});

// The last topic in a group doesn't have a trailing comma
content = content.replace(/(\{\s*icon:\s*'[^']+'(?:,\s*\w+:\s*[^,}]+)*)\s*\}\)\s*$/gm, (match, prefix) => {
  return `${prefix}, sourceMappings: {
    'cisco-official-required': { locationType: 'url', location: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html', coverageNotes: 'Official documentation covering theory.' },
    'ccna-study-notes-v13': { pageRange: '30-40', coverageNotes: 'Theory and exam context.' }
  } })`;
});

fs.writeFileSync(path, content, 'utf8');
console.log('Script completed.');
