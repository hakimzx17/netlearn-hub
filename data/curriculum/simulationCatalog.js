/**
 * simulationCatalog.js
 *
 * Shared simulation engine taxonomy for CCNA topic authoring.
 * Every topic must bind to one of these reusable engine families.
 */

export const SIMULATION_CATALOG = {
  'packet-animator': {
    id: 'packet-animator',
    label: 'Packet / Frame Animator',
    icon: 'PKT',
    description: 'Step-by-step packet or frame flow with header inspection and encapsulation state.',
  },
  'cli-sandbox': {
    id: 'cli-sandbox',
    label: 'CLI Sandbox',
    icon: 'CLI',
    description: 'Interactive command-line workflow with guided command validation.',
  },
  'topology-builder': {
    id: 'topology-builder',
    label: 'Topology Builder',
    icon: 'NET',
    description: 'Interactive topology assembly or topology reasoning with live structural feedback.',
  },
  'state-machine': {
    id: 'state-machine',
    label: 'Protocol State Machine',
    icon: 'TIME',
    description: 'Protocol lifecycle visualization with explicit states, transitions, and timing behavior.',
  },
  'calculator-tool': {
    id: 'calculator-tool',
    label: 'Calculator / Tool',
    icon: 'SUBNET',
    description: 'Interactive numeric tooling for subnetting, addressing, or protocol value calculations.',
  },
  'attack-defense': {
    id: 'attack-defense',
    label: 'Attack / Defense Scenario',
    icon: 'LOCK',
    description: 'Before/after security scenario that demonstrates an attack path and mitigation result.',
  },
  'comparison-viewer': {
    id: 'comparison-viewer',
    label: 'Comparison Visualizer',
    icon: 'TABLE',
    description: 'Side-by-side behavior, protocol, or architecture comparison with key deltas highlighted.',
  },
  'config-lab': {
    id: 'config-lab',
    label: 'Configuration Lab',
    icon: 'CONFIG',
    description: 'Guided multi-step configuration task with validation and expected-state checks.',
  },
  'diagram-builder': {
    id: 'diagram-builder',
    label: 'Table / Diagram Builder',
    icon: 'LEARN',
    description: 'Structured labeling or diagram-completion activity for concept reinforcement.',
  },
  'decision-simulator': {
    id: 'decision-simulator',
    label: 'Decision Simulator',
    icon: 'FOCUS',
    description: 'Predictive exercise where the learner reasons about forwarding, selection, or classification outcomes.',
  },
};

export function getSimulationCatalogEntry(typeId) {
  return SIMULATION_CATALOG[typeId] || null;
}

export function getSimulationCatalogList() {
  return Object.values(SIMULATION_CATALOG);
}
