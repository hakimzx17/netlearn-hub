export const CONFIG_LAB_SCENARIOS = {
  'network-access-2-15-wireless-lan-configuration': {
    title: 'WLC Configuration Walkthrough',
    tone: 'Campus controller rollout',
    summary: 'Build the WLAN in the right order so client-facing policy is mapped correctly before validation begins.',
    steps: [
      {
        id: 'wlc-step-1',
        title: 'Deployment sequence 01',
        prompt: 'Which action belongs first in a normal WLC build sequence?',
        prefix: '',
        suffix: '',
        slots: [
          {
            key: 'action',
            label: 'Step',
            correct: 'Define the controller interfaces',
            options: ['Define the controller interfaces', 'Apply security and QoS', 'Verify client association', 'Create the WLAN and map it to policy'],
          },
        ],
        successNote: 'Correct. Interface and connectivity assumptions are defined before the WLAN and policy layers are attached.',
      },
      {
        id: 'wlc-step-2',
        title: 'Deployment sequence 02',
        prompt: 'After interfaces exist, what is the next highest-priority action?',
        prefix: '',
        suffix: '',
        slots: [
          {
            key: 'action',
            label: 'Step',
            correct: 'Create the WLAN and map it to the intended client-facing network',
            options: ['Create the WLAN and map it to the intended client-facing network', 'Start packet captures', 'Disable all AP radios', 'Turn on controller LAG first'],
          },
        ],
        successNote: 'Right. The WLAN definition has to exist before security and service tuning can make sense.',
      },
      {
        id: 'wlc-step-3',
        title: 'Deployment sequence 03',
        prompt: 'Which action usually follows WLAN creation?',
        prefix: '',
        suffix: '',
        slots: [
          {
            key: 'action',
            label: 'Step',
            correct: 'Apply security and QoS policy',
            options: ['Apply security and QoS policy', 'Convert the WLAN into a routing protocol', 'Delete the management interface', 'Ignore client policy completely'],
          },
        ],
        successNote: 'Exactly. Security and QoS define the real service behavior that the SSID delivers.',
      },
      {
        id: 'wlc-step-4',
        title: 'Deployment sequence 04',
        prompt: 'What closes the configuration workflow?',
        prefix: '',
        suffix: '',
        slots: [
          {
            key: 'action',
            label: 'Step',
            correct: 'Verify AP and client behavior',
            options: ['Verify AP and client behavior', 'Reset every switchport', 'Move all traffic to Telnet', 'Rebuild the WLAN from scratch'],
          },
        ],
        successNote: 'Correct. Verification is the final gate that proves the WLAN is behaving as designed.',
      },
    ],
  },
  'ip-connectivity-3-4-ipv4-static-routing': {
    title: 'IPv4 Static Route Builder',
    tone: 'Branch edge router',
    summary: 'Assemble the minimal static-route commands for primary, default, and verification logic.',
    steps: [
      {
        id: 'ipv4-static-1',
        title: 'Primary route',
        prompt: 'Build the branch route to the remote LAN using a next hop.',
        prefix: 'ip route',
        suffix: '',
        slots: [
          { key: 'network', label: 'Destination', correct: '10.10.10.0', options: ['10.10.10.0', '0.0.0.0', '192.168.1.1', '255.255.255.0'] },
          { key: 'mask', label: 'Mask', correct: '255.255.255.0', options: ['255.255.255.0', '0.0.0.0', '10.10.10.0', '192.168.1.1'] },
          { key: 'nexthop', label: 'Next hop', correct: '192.168.1.1', options: ['192.168.1.1', '10.10.10.0', 'GigabitEthernet0/0', '255.255.255.0'] },
        ],
        successNote: 'Correct. Destination, subnet mask, and next hop form the core IPv4 static-route pattern.',
      },
      {
        id: 'ipv4-static-2',
        title: 'Default route',
        prompt: 'Build the catch-all path toward the upstream provider.',
        prefix: 'ip route',
        suffix: '',
        slots: [
          { key: 'network', label: 'Destination', correct: '0.0.0.0', options: ['0.0.0.0', '10.10.10.0', '255.255.255.0', '192.168.1.1'] },
          { key: 'mask', label: 'Mask', correct: '0.0.0.0', options: ['0.0.0.0', '255.255.255.0', '10.10.10.0', '192.168.1.1'] },
          { key: 'nexthop', label: 'Next hop', correct: '192.168.1.1', options: ['192.168.1.1', '0.0.0.0', 'Loopback0', '10.10.10.0'] },
        ],
        successNote: 'Correct. The default route is just the least specific static route in the table.',
      },
      {
        id: 'ipv4-static-3',
        title: 'Verification',
        prompt: 'Which command should you run first to confirm the route actually installed?',
        prefix: '',
        suffix: '',
        slots: [
          { key: 'command', label: 'Command', correct: 'show ip route', options: ['show ip route', 'show spanning-tree', 'show ip nat translations', 'show vlan brief'] },
        ],
        successNote: 'Exactly. Route-table verification comes before deeper troubleshooting.',
      },
    ],
  },
  'ip-connectivity-3-7-ospf-configuration': {
    title: 'OSPF Configuration Lab',
    tone: 'Area 0 rollout',
    summary: 'Assemble the minimal OSPF configuration steps for identity, network advertisement, and verification.',
    steps: [
      {
        id: 'ospf-config-1',
        title: 'Process start',
        prompt: 'Start the OSPF process with a simple process ID.',
        prefix: 'router ospf',
        suffix: '',
        slots: [
          { key: 'pid', label: 'Process ID', correct: '1', options: ['1', '0', '110', 'ospf'] },
        ],
        successNote: 'Correct. The process ID starts the local OSPF configuration context.',
      },
      {
        id: 'ospf-config-2',
        title: 'Router identity',
        prompt: 'Set a deterministic router identity for troubleshooting and adjacency output.',
        prefix: 'router-id',
        suffix: '',
        slots: [
          { key: 'rid', label: 'Router ID', correct: '1.1.1.1', options: ['1.1.1.1', '0.0.0.0', '224.0.0.5', '10.0.0.0'] },
        ],
        successNote: 'Correct. A clear router ID makes the OSPF topology easier to interpret.',
      },
      {
        id: 'ospf-config-3',
        title: 'Network statement',
        prompt: 'Advertise the /24 LAN into Area 0.',
        prefix: 'network',
        suffix: 'area',
        slots: [
          { key: 'network', label: 'Network', correct: '10.0.0.0', options: ['10.0.0.0', '0.0.0.0', '1.1.1.1', '224.0.0.6'] },
          { key: 'wildcard', label: 'Wildcard', correct: '0.0.0.255', options: ['0.0.0.255', '255.255.255.0', '0.0.0.0', '255.255.255.255'] },
          { key: 'area', label: 'Area', correct: '0', options: ['0', '1', '110', 'backbone'] },
        ],
        successNote: 'Right. The network, wildcard, and area tie the interface into the intended topology scope.',
      },
      {
        id: 'ospf-config-4',
        title: 'Verification',
        prompt: 'Which command is the best first check to prove the adjacency formed?',
        prefix: '',
        suffix: '',
        slots: [
          { key: 'command', label: 'Command', correct: 'show ip ospf neighbor', options: ['show ip ospf neighbor', 'show arp', 'show ip nat statistics', 'show mac address-table'] },
        ],
        successNote: 'Correct. Verify adjacency first before blaming SPF or route installation.',
      },
    ],
  },
  'ip-connectivity-3-10-ipv6-static-routing': {
    title: 'IPv6 Static Route Builder',
    tone: 'Dual-stack edge setup',
    summary: 'Build the minimal global and route statements needed for IPv6 static forwarding.',
    steps: [
      {
        id: 'ipv6-static-1',
        title: 'Global enablement',
        prompt: 'Which command must be enabled globally before IPv6 forwarding works?',
        prefix: '',
        suffix: '',
        slots: [
          { key: 'command', label: 'Command', correct: 'ipv6 unicast-routing', options: ['ipv6 unicast-routing', 'ipv6 nat enable', 'show ipv6 route', 'router ospfv3 1'] },
        ],
        successNote: 'Correct. IPv6 forwarding does not behave normally until unicast routing is enabled globally.',
      },
      {
        id: 'ipv6-static-2',
        title: 'Link-local route',
        prompt: 'Build a static route using a link-local next hop on GigabitEthernet0/0.',
        prefix: 'ipv6 route',
        suffix: '',
        slots: [
          { key: 'network', label: 'Prefix', correct: '2001:db8:10::/64', options: ['2001:db8:10::/64', 'fe80::1', 'GigabitEthernet0/0', '::/0'] },
          { key: 'interface', label: 'Interface', correct: 'GigabitEthernet0/0', options: ['GigabitEthernet0/0', 'Loopback0', '2001:db8:10::/64', 'fe80::1'] },
          { key: 'nextHop', label: 'Next hop', correct: 'fe80::1', options: ['fe80::1', '2001:db8:10::/64', '::/0', 'GigabitEthernet0/0'] },
        ],
        successNote: 'Correct. Link-local next hops require the exit interface because the address scope is only local to that segment.',
      },
      {
        id: 'ipv6-static-3',
        title: 'Verification',
        prompt: 'Which command shows whether the IPv6 route actually installed?',
        prefix: '',
        suffix: '',
        slots: [
          { key: 'command', label: 'Command', correct: 'show ipv6 route', options: ['show ipv6 route', 'show vlan brief', 'show ip nat translations', 'show ntp associations'] },
        ],
        successNote: 'Right. Confirm the route installs before moving on to live forwarding tests.',
      },
    ],
  },
  'ip-services-4-2-static-nat': {
    title: 'Static NAT Lab',
    tone: 'Published server edge',
    summary: 'Assemble the permanent one-to-one translation and the correct interface roles.',
    steps: [
      {
        id: 'static-nat-1',
        title: 'Translation statement',
        prompt: 'Build the one-to-one mapping for the inside server.',
        prefix: 'ip nat inside source static',
        suffix: '',
        slots: [
          { key: 'insideLocal', label: 'Inside local', correct: '192.168.10.10', options: ['192.168.10.10', '203.0.113.10', 'ip nat inside', 'show ip nat translations'] },
          { key: 'insideGlobal', label: 'Inside global', correct: '203.0.113.10', options: ['203.0.113.10', '192.168.10.10', 'ip nat outside', 'GigabitEthernet0/0'] },
        ],
        successNote: 'Correct. Static NAT is cleanest when you think one inside host, one stable public identity.',
      },
      {
        id: 'static-nat-2',
        title: 'Inside role',
        prompt: 'Which command belongs on the private-facing interface?',
        prefix: '',
        suffix: '',
        slots: [
          { key: 'command', label: 'Command', correct: 'ip nat inside', options: ['ip nat inside', 'ip nat outside', 'show ip route', 'router ospf 1'] },
        ],
        successNote: 'Correct. The private-facing interface is marked as NAT inside.',
      },
      {
        id: 'static-nat-3',
        title: 'Outside role',
        prompt: 'Which command belongs on the public-facing interface?',
        prefix: '',
        suffix: '',
        slots: [
          { key: 'command', label: 'Command', correct: 'ip nat outside', options: ['ip nat outside', 'ip nat inside', 'show mac address-table', 'ipv6 unicast-routing'] },
        ],
        successNote: 'Correct. The upstream-facing interface must be marked as NAT outside.',
      },
      {
        id: 'static-nat-4',
        title: 'Verification',
        prompt: 'Which command is the strongest first verification of translation state?',
        prefix: '',
        suffix: '',
        slots: [
          { key: 'command', label: 'Command', correct: 'show ip nat translations', options: ['show ip nat translations', 'show spanning-tree', 'show ip ospf neighbor', 'show cdp neighbors'] },
        ],
        successNote: 'Correct. The translation table is the clearest first proof that the mapping exists.',
      },
    ],
  },
  'ip-services-4-7-ssh-remote-access': {
    title: 'SSH Configuration Lab',
    tone: 'Management-plane hardening',
    summary: 'Build the minimum prerequisite sequence for secure remote management on a Cisco-style device.',
    steps: [
      {
        id: 'ssh-lab-1',
        title: 'Identity prerequisite',
        prompt: 'Set the hostname used in the key-generation workflow.',
        prefix: 'hostname',
        suffix: '',
        slots: [
          { key: 'hostname', label: 'Hostname', correct: 'BranchRTR', options: ['BranchRTR', 'lab.local', 'ssh', 'transport input ssh'] },
        ],
        successNote: 'Correct. Hostname is one of the basic SSH prerequisites.',
      },
      {
        id: 'ssh-lab-2',
        title: 'Domain prerequisite',
        prompt: 'Set the domain value used before generating keys.',
        prefix: 'ip domain-name',
        suffix: '',
        slots: [
          { key: 'domain', label: 'Domain', correct: 'lab.local', options: ['lab.local', 'BranchRTR', 'rsa', 'vty'] },
        ],
        successNote: 'Correct. Domain information is part of the normal SSH key-generation setup.',
      },
      {
        id: 'ssh-lab-3',
        title: 'Key generation',
        prompt: 'Which command creates the cryptographic keys needed for SSH?',
        prefix: '',
        suffix: '',
        slots: [
          { key: 'command', label: 'Command', correct: 'crypto key generate rsa', options: ['crypto key generate rsa', 'show ip route', 'ip nat inside', 'service timestamps log datetime'] },
        ],
        successNote: 'Correct. SSH depends on local cryptographic keys.',
      },
      {
        id: 'ssh-lab-4',
        title: 'VTY hardening',
        prompt: 'Which transport setting keeps VTY access on SSH only?',
        prefix: 'transport input',
        suffix: '',
        slots: [
          { key: 'transport', label: 'Transport', correct: 'ssh', options: ['ssh', 'telnet', 'all', 'udp'] },
        ],
        successNote: 'Correct. Limiting transport to SSH is the basic secure remote-access choice.',
      },
    ],
  },
  'security-fundamentals-5-7-advanced-acls': {
    title: 'ACL Configuration Lab',
    tone: 'Policy insertion workflow',
    summary: 'Build a named extended ACL and apply it with the correct interface direction.',
    steps: [
      {
        id: 'adv-acl-1',
        title: 'Create the ACL',
        prompt: 'Open the named extended ACL context.',
        prefix: 'ip access-list extended',
        suffix: '',
        slots: [
          { key: 'name', label: 'ACL name', correct: 'BLOCK_HTTP', options: ['BLOCK_HTTP', 'ALLOW_ALL', 'ACL_1', 'VLAN10'] },
        ],
        successNote: 'Correct. A named ACL makes the policy easier to read and maintain.',
      },
      {
        id: 'adv-acl-2',
        title: 'Deny line',
        prompt: 'Build the deny statement that blocks HTTP to the server from the source subnet.',
        prefix: 'deny tcp',
        suffix: 'eq',
        slots: [
          { key: 'src', label: 'Source', correct: '192.168.10.0 0.0.0.255', options: ['192.168.10.0 0.0.0.255', 'host 10.10.10.10', 'any', '80'] },
          { key: 'dst', label: 'Destination', correct: 'host 10.10.10.10', options: ['host 10.10.10.10', '192.168.10.0 0.0.0.255', 'any', 'BLOCK_HTTP'] },
          { key: 'port', label: 'Port', correct: '80', options: ['80', '443', '22', '161'] },
        ],
        successNote: 'Correct. The extended ACL line matches source, destination, protocol, and port with precision.',
      },
      {
        id: 'adv-acl-3',
        title: 'Permit remainder',
        prompt: 'Which line prevents the implicit deny from blocking everything else?',
        prefix: 'permit',
        suffix: '',
        slots: [
          { key: 'rest', label: 'Permit line', correct: 'ip any any', options: ['ip any any', 'tcp host 10.10.10.10 eq 80', 'deny ip any any', 'vty 0 4'] },
        ],
        successNote: 'Correct. Without an explicit permit here, the implicit deny would block the remaining traffic.',
      },
      {
        id: 'adv-acl-4',
        title: 'Apply direction',
        prompt: 'Which command applies the ACL inbound on the interface?',
        prefix: 'ip access-group',
        suffix: '',
        slots: [
          { key: 'acl', label: 'ACL', correct: 'BLOCK_HTTP', options: ['BLOCK_HTTP', 'ALLOW_ALL', '80', 'GigabitEthernet0/0'] },
          { key: 'direction', label: 'Direction', correct: 'in', options: ['in', 'out', 'passive', 'local'] },
        ],
        successNote: 'Correct. Applying the ACL in the right direction is just as important as writing the policy correctly.',
      },
    ],
  },
};

export function getConfigLabScenario(topicId) {
  return CONFIG_LAB_SCENARIOS[topicId] || null;
}
