export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

export function stripHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeColumns(columns = []) {
  return columns.map((column, index) => {
    if (typeof column === 'string') {
      return {
        key: `col-${index}`,
        label: column,
      };
    }

    return {
      key: column?.key || `col-${index}`,
      label: column?.label || column?.key || `Column ${index + 1}`,
    };
  });
}

function normalizeRows(rows = [], columns = []) {
  return rows.map((row, rowIndex) => {
    let cells = [];

    if (Array.isArray(row)) {
      cells = row.map((cell) => stripHtml(cell));
    } else if (row && typeof row === 'object') {
      cells = columns.map((column) => stripHtml(row[column.key] ?? ''));
    }

    return {
      id: `row-${rowIndex}`,
      cells,
    };
  }).filter((row) => row.cells.some(Boolean));
}

export function collectTableDatasets(topic) {
  const sections = Array.isArray(topic?.theory?.sections) ? topic.theory.sections : [];
  const datasets = [];

  sections.forEach((section, sectionIndex) => {
    const blocks = Array.isArray(section?.blocks) ? section.blocks : [];

    blocks.forEach((block, blockIndex) => {
      if (!['table', 'comparisonTable'].includes(block?.type)) return;

      const columns = normalizeColumns(block.columns || []);
      const rows = normalizeRows(block.rows || [], columns);
      if (columns.length < 2 || rows.length < 2) return;

      datasets.push({
        id: `${slugify(topic?.id || 'topic')}-${sectionIndex}-${blockIndex}`,
        title: block.title || section?.title || `Comparison ${datasets.length + 1}`,
        description: block.description || stripHtml(section?.content || ''),
        columns,
        rows,
      });
    });
  });

  return datasets;
}

export function collectDefinitionPairs(topic, maxPairs = 6) {
  const sections = Array.isArray(topic?.theory?.sections) ? topic.theory.sections : [];

  for (const section of sections) {
    const blocks = Array.isArray(section?.blocks) ? section.blocks : [];

    for (const block of blocks) {
      if (block?.type === 'keyTerms' && Array.isArray(block.terms) && block.terms.length >= 3) {
        return block.terms
          .map((entry, index) => {
            const term = typeof entry === 'string' ? entry : entry?.term;
            const definition = typeof entry === 'string' ? '' : entry?.definition;
            return {
              id: `${slugify(topic?.id || 'topic')}-term-${index}`,
              itemLabel: stripHtml(term),
              zoneLabel: stripHtml(definition),
            };
          })
          .filter((pair) => pair.itemLabel && pair.zoneLabel)
          .slice(0, maxPairs);
      }
    }
  }

  const datasets = collectTableDatasets(topic);
  const table = datasets.find((entry) => entry.rows.length >= 3) || datasets[0];
  if (!table) return [];

  return table.rows
    .slice(0, maxPairs)
    .map((row, index) => ({
      id: `${slugify(topic?.id || 'topic')}-pair-${index}`,
      itemLabel: row.cells[0],
      zoneLabel: row.cells.slice(1).filter(Boolean).join(' • '),
    }))
    .filter((pair) => pair.itemLabel && pair.zoneLabel);
}

export function collectTheorySteps(topic, maxSteps = 6) {
  const sections = Array.isArray(topic?.theory?.sections) ? topic.theory.sections : [];
  const steps = [];

  sections.forEach((section, sectionIndex) => {
    const blocks = Array.isArray(section?.blocks) ? section.blocks : [];

    blocks.forEach((block, blockIndex) => {
      if (Array.isArray(block?.items)) {
        block.items.forEach((item, itemIndex) => {
          const text = stripHtml(item);
          if (!text) return;
          steps.push({
            id: `${slugify(topic?.id || 'topic')}-item-${sectionIndex}-${blockIndex}-${itemIndex}`,
            title: block.title || section.title || `Checkpoint ${steps.length + 1}`,
            detail: text,
          });
        });
      }

      if (Array.isArray(block?.steps)) {
        block.steps.forEach((step, stepIndex) => {
          const title = stripHtml(step?.title || step?.label || `Step ${steps.length + 1}`);
          const detail = stripHtml(step?.description || step?.detail || step?.content || '');
          if (!title && !detail) return;
          steps.push({
            id: `${slugify(topic?.id || 'topic')}-step-${sectionIndex}-${blockIndex}-${stepIndex}`,
            title: title || `Step ${steps.length + 1}`,
            detail,
          });
        });
      }
    });

    if (steps.length < maxSteps) {
      const title = stripHtml(section?.title || `Checkpoint ${steps.length + 1}`);
      const detail = stripHtml(section?.content || '');
      if (title && detail) {
        steps.push({
          id: `${slugify(topic?.id || 'topic')}-section-${sectionIndex}`,
          title,
          detail,
        });
      }
    }
  });

  return steps
    .filter((step) => step.title || step.detail)
    .slice(0, maxSteps);
}

export function collectCommandCandidates(topic, maxCommands = 5) {
  const text = [
    topic?.title,
    topic?.description,
    ...(Array.isArray(topic?.theoryOutline) ? topic.theoryOutline : []),
    ...collectTheorySteps(topic, 12).map((step) => `${step.title} ${step.detail}`),
  ].map(stripHtml).join(' ').toLowerCase();

  const candidates = [];
  const add = (command, purpose, output = 'Command accepted. Expected state matches the checkpoint.') => {
    if (!candidates.some((entry) => entry.command === command)) {
      candidates.push({ command, purpose, output });
    }
  };

  if (text.includes('interface')) add('show interfaces status', 'Verify interface state, speed, duplex, and access/trunk role.', 'Port      Status       Vlan       Duplex  Speed\nGi0/1     connected    10         a-full  a-1000');
  if (text.includes('vlan')) add('show vlan brief', 'Confirm VLAN existence and access-port membership.', 'VLAN Name                             Status    Ports\n10   USERS                            active    Gi0/1');
  if (text.includes('trunk')) add('show interfaces trunk', 'Confirm trunk mode, native VLAN, and allowed VLANs.', 'Port      Mode         Encapsulation  Status        Native vlan\nGi0/24    on           802.1q         trunking      1');
  if (text.includes('routing table') || text.includes('route')) add('show ip route', 'Inspect selected routes, prefixes, and next hops.', 'Gateway of last resort is not set\nO 10.10.10.0/24 [110/2] via 192.0.2.2');
  if (text.includes('ospf')) add('show ip ospf neighbor', 'Verify OSPF neighbor state and adjacency health.', 'Neighbor ID     Pri   State           Dead Time   Address\n2.2.2.2           1    FULL/DR         00:00:33    10.0.0.2');
  if (text.includes('ipv6')) add('show ipv6 route', 'Inspect IPv6 route sources and next-hop reachability.', 'S   2001:DB8:10::/64 [1/0]\n     via FE80::2, GigabitEthernet0/0');
  if (text.includes('dhcp')) add('show ip dhcp snooping', 'Verify DHCP snooping trust state and operational VLANs.', 'Switch DHCP snooping is enabled\nDHCP snooping is configured on VLANs: 10');
  if (text.includes('arp')) add('show ip arp', 'Check address-to-MAC resolution state.', 'Protocol  Address       Age  Hardware Addr   Type  Interface\nInternet  192.0.2.10     2    aabb.cc00.0101  ARPA  Gi0/1');
  if (text.includes('security') || text.includes('port security')) add('show port-security interface gi0/1', 'Validate secure MAC limits and violation mode.', 'Port Security              : Enabled\nViolation Mode             : Shutdown\nMaximum MAC Addresses      : 1');

  if (candidates.length === 0) {
    add('show running-config', 'Inspect the active configuration for this checkpoint.', 'Building configuration...\nCurrent configuration matches the expected baseline.');
    add('show ip interface brief', 'Confirm interface addresses and line protocol state.', 'Interface              IP-Address      OK? Method Status                Protocol\nGi0/0                  192.0.2.1       YES manual up                    up');
  }

  return candidates.slice(0, maxCommands);
}
