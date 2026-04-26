/**
 * pathRegistry.js
 *
 * Central curriculum registry.
 * Internally the app still uses the path/module abstraction for
 * compatibility, while the data model now represents CCNA domains
 * and topics as the source of truth.
 */

import { CCNA_DOMAIN_BLUEPRINTS } from './curriculum/ccnaBlueprints.js';
import { SOURCE_LIBRARY, buildTopicSourceManifest, resolveSourceRefs } from './curriculum/sourceLibrary.js';
import { getSimulationCatalogEntry, getSimulationCatalogList } from './curriculum/simulationCatalog.js';
import { CONTENT_WORKFLOW_STEPS, ENGINEERING_WORKFLOW_STEPS } from './curriculum/workflow.js';

const DIFFICULTY_LEVEL = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

/**
 * Map implemented simulation IDs to standalone legacy routes.
 * Topics without a standalone implementation fall back to their
 * lesson-page simulation tab.
 */
export const SIMULATION_ROUTE_MAP = {
  'osi-tcpip': '/osi-tcpip',
  'ip-classes': '/ip-classes',
  'ipv4-header': '/ipv4-header',
  'ethernet-frame': '/ethernet-frame',
  'mac-table': '/mac-table',
  'arp-simulation': '/arp-simulation',
  'routing-table': '/routing-table',
  'ttl-simulation': '/ttl-simulation',
  'packet-journey': '/packet-journey',
  'subnet-practice': '/subnet-practice',
  'vlsm-design': '/vlsm-design',
  'subnet-calculator': '/subnet-calculator',
};

function buildTopicCompatibility(domain, topic) {
  const catalogEntry = getSimulationCatalogEntry(topic.simulationType);
  const { manifest, audit } = buildTopicSourceManifest(topic.sourceRefs, topic.sourceMappings);
  const inlineQuestions = Array.isArray(topic.quizQuestions) && topic.quizQuestions.length > 0
    ? topic.quizQuestions
    : null;
  const quizCount = Number.isInteger(topic.quizCount) && topic.quizCount > 0
    ? topic.quizCount
    : inlineQuestions?.length || null;
  const launchRoute = topic.simulationRouteId
    ? (SIMULATION_ROUTE_MAP[topic.simulationRouteId] || `/paths/${domain.id}/${topic.id}?tab=simulation`)
    : `/paths/${domain.id}/${topic.id}?tab=simulation`;

  return {
    ...topic,
    kind: 'topic',
    difficulty: DIFFICULTY_LEVEL[domain.difficulty] || 1,
    estimatedMinutes: topic.estimatedMinutes || Math.max(20, Math.round((domain.estimatedHours * 60) / domain.topics.length)),
    theory: topic.theory || null,
    description: topic.theoryOutline?.[0] || '',
    simulationCatalog: catalogEntry,
    simulation: topic.simulationLabel ? {
      id: topic.simulationRouteId || `${topic.id}-simulation`,
      label: topic.simulationLabel,
      type: topic.simulationType,
      launchRoute,
      implemented: Boolean(topic.simulationRouteId),
    } : null,
    quiz: {
      type: topic.quizType,
      bank: topic.quizBank || null,
      questions: inlineQuestions,
      count: quizCount,
      passingScore: topic.quizPassingScore || 70,
      status: topic.quizBank || inlineQuestions ? 'authored' : 'planned',
    },
    sourceManifest: manifest,
    sourceAudit: audit,
    authoringWorkflow: CONTENT_WORKFLOW_STEPS,
  };
}

function buildDomainCompatibility(domain) {
  const topics = domain.topics.map((topic) => buildTopicCompatibility(domain, topic));
  const sourceIds = new Set(topics.flatMap((topic) => topic.sourceRefs || []));
  const sourceManifest = [...sourceIds].map((sourceId) => SOURCE_LIBRARY[sourceId]).filter(Boolean);
  const sourceReadiness = topics.reduce((summary, topic) => {
    const audit = topic.sourceAudit || {};
    return {
      requiredTopics: summary.requiredTopics + 1,
      topicsWithManifest: summary.topicsWithManifest + ((audit.totalEntries || 0) > 0 ? 1 : 0),
      topicsReadyForAuthoring: summary.topicsReadyForAuthoring + (audit.readyForAuthoring ? 1 : 0),
      topicsInProgress: summary.topicsInProgress + (audit.status === 'in-progress' ? 1 : 0),
      topicsPending: summary.topicsPending + (audit.status === 'pending' ? 1 : 0),
      topicsWithOfficialUrlMapping: summary.topicsWithOfficialUrlMapping + (audit.hasOfficialUrl ? 1 : 0),
      topicsWithPdfPageMapping: summary.topicsWithPdfPageMapping + (audit.hasPdfPageMapping ? 1 : 0),
      totalEntries: summary.totalEntries + (audit.totalEntries || 0),
      mappedEntries: summary.mappedEntries + (audit.mappedEntries || 0),
      validatedEntries: summary.validatedEntries + (audit.validatedEntries || 0),
      pendingEntries: summary.pendingEntries + (audit.pendingEntries || 0),
    };
  }, {
    requiredTopics: 0,
    topicsWithManifest: 0,
    topicsReadyForAuthoring: 0,
    topicsInProgress: 0,
    topicsPending: 0,
    topicsWithOfficialUrlMapping: 0,
    topicsWithPdfPageMapping: 0,
    totalEntries: 0,
    mappedEntries: 0,
    validatedEntries: 0,
    pendingEntries: 0,
  });

  return {
    ...domain,
    description: domain.learningGoal,
    modules: topics,
    topics,
    topicCount: topics.length,
    sourceManifest,
    sourceReadiness: {
      ...sourceReadiness,
      phaseGate: sourceReadiness.topicsReadyForAuthoring === topics.length ? 'open' : 'locked',
    },
    finalExam: {
      ...domain.finalExam,
      bank: domain.finalExam.bank || null,
      status: domain.finalExam.bank ? 'authored' : 'planned',
      launchRoute: `/paths/${domain.id}`,
      authoringWorkflow: CONTENT_WORKFLOW_STEPS,
      sourceManifest: resolveSourceRefs(domain.finalExam.sourceRefs || []),
    },
  };
}

/**
 * All CCNA domains in display order, exposed through the legacy ALL_PATHS name
 * so the current UI can migrate gradually without a large refactor.
 */
export const ALL_PATHS = CCNA_DOMAIN_BLUEPRINTS.map(buildDomainCompatibility);
export const ALL_DOMAINS = ALL_PATHS;

export const CURRICULUM_WORKFLOW = {
  content: CONTENT_WORKFLOW_STEPS,
  engineering: ENGINEERING_WORKFLOW_STEPS,
};

export function getAllSimulations() {
  const simulations = [];

  for (const path of ALL_PATHS) {
    for (const mod of path.modules) {
      if (!mod.simulation) continue;
      simulations.push({
        id: mod.simulation.id,
        label: mod.simulation.label,
        moduleId: mod.id,
        moduleName: mod.title,
        pathId: path.id,
        pathName: path.title,
        pathColor: path.color,
        difficulty: mod.difficulty,
        icon: mod.icon,
        simulationType: mod.simulationType,
        implemented: Boolean(mod.simulation.implemented),
        launchRoute: mod.simulation.launchRoute,
      });
    }
  }

  return simulations;
}

export function getPathById(pathId) {
  return ALL_PATHS.find((path) => path.id === pathId) || null;
}

export function getDomainById(domainId) {
  return getPathById(domainId);
}

export function getModuleById(pathId, moduleId) {
  const path = getPathById(pathId);
  if (!path) return null;
  return path.modules.find((module) => module.id === moduleId) || null;
}

export function getTopicById(domainId, topicId) {
  return getModuleById(domainId, topicId);
}

export function findPathForModule(moduleId) {
  for (const path of ALL_PATHS) {
    const mod = path.modules.find((module) => module.id === moduleId);
    if (mod) return { path, module: mod };
  }
  return null;
}

export function getSimulationLaunchRoute(simulationId) {
  return SIMULATION_ROUTE_MAP[simulationId] || null;
}

export function getSourceById(sourceId) {
  return SOURCE_LIBRARY[sourceId] || null;
}

export function getSourceManifestForTopic(domainId, topicId) {
  const topic = getTopicById(domainId, topicId);
  return topic?.sourceManifest || [];
}

export function getSimulationCatalog() {
  return getSimulationCatalogList();
}

export function getCurriculumStats() {
  const topicCount = ALL_PATHS.reduce((sum, path) => sum + path.topicCount, 0);
  const simulationCount = getAllSimulations().length;
  return {
    domainCount: ALL_PATHS.length,
    topicCount,
    simulationCount,
    simulationEngineCount: getSimulationCatalogList().length,
  };
}
