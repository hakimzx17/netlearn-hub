import { q } from './helpers.js';

const wirelessLanSecurityBank = [
  q('d2-2-14-q1', 'Which wireless security generation is considered obsolete and weak?', ['WPA3', 'WPA2', 'WEP', '802.1X'], 2, 'easy', 'WEP is the obsolete and weak early security model that should no longer be treated as acceptable protection.'),
  q('d2-2-14-q2', 'How should WPA be viewed in the evolution of wireless security?', ['As the strongest current model', 'As a transitional improvement over WEP', 'As a replacement for SSIDs', 'As a trunking protocol'], 1, 'easy', 'WPA improved on WEP but is still a transitional legacy step rather than the modern preferred baseline.'),
  q('d2-2-14-q3', 'What is the long-standing modern baseline security generation for many enterprise WLANs?', ['WPA2', 'WEP', 'Open authentication', 'TKIP only'], 0, 'easy', 'WPA2 has been the long-standing strong baseline before newer WPA3 deployments.'),
  q('d2-2-14-q4', 'Which generation represents the current stronger direction in wireless security?', ['WPA', 'WPA2', 'WPA3', 'WEP'], 2, 'easy', 'WPA3 is the newer, stronger generation that improves on prior models.'),
  q('d2-2-14-q5', 'What does PSK refer to in WLAN security?', ['A shared-secret authentication approach', 'A spanning-tree role', 'A trunking mode', 'A VLAN database revision'], 0, 'medium', 'PSK means pre-shared key authentication, which is common in simpler personal or small-environment deployments.'),
  q('d2-2-14-q6', 'Which authentication method is most associated with enterprise identity-based access control?', ['Native VLAN', '802.1X', 'PAgP', 'APIPA'], 1, 'medium', '802.1X is the enterprise-style identity-based authentication model used for stronger individual access control.'),
  q('d2-2-14-q7', 'What is SAE in the WPA3 context?', ['A stronger password-based authentication approach', 'A replacement for SSID naming', 'A wireless routing protocol', 'A VTP operating mode'], 0, 'medium', 'SAE improves password-based wireless security and is a key WPA3 personal-security concept.'),
  q('d2-2-14-q8', 'Which cipher suite should signal legacy or transitional security rather than the preferred modern direction?', ['GCMP', 'CCMP', 'TKIP', 'PMF'], 2, 'medium', 'TKIP is tied to older, weaker security and should not be confused with the stronger modern cipher direction.'),
  q('d2-2-14-q9', 'Which pair represents stronger modern protection technologies than legacy TKIP?', ['CCMP and GCMP', 'WEP and TKIP', 'CDP and LLDP', 'PAgP and LACP'], 0, 'medium', 'CCMP and GCMP are part of the stronger modern wireless protection direction compared with legacy TKIP.'),
  q('d2-2-14-q10', 'What does Protected Management Frames help protect?', ['Only wired switch uplinks', 'Management-frame behavior, not just user payload traffic', 'Only IPv6 routing advertisements', 'Only VTP advertisements'], 1, 'medium', 'Modern WLAN security includes protecting management behavior itself, not only encrypting user payload traffic.'),
];

export default wirelessLanSecurityBank;
