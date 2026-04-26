/**
 * sourceLibrary.js
 *
 * Canonical source registry plus topic-scoped source-manifest helpers.
 * Phase 2 P02 turns the former flat reference list into a structured
 * citation system with page-range handling, validation, and readiness
 * auditing while remaining compatible with the Phase 1 curriculum shell.
 */

const PENDING_PAGE_RANGE_LABEL = 'Pending page range';
const PENDING_LOCATION_LABEL = 'Topic-specific mapping required';

export const SOURCE_MANIFEST_RULES = [
  {
    id: 'official-url',
    title: 'Map a Cisco official primary source',
    description: 'Each topic must attach at least one topic-specific Cisco official URL before theory, quiz, or simulation authoring can proceed.',
  },
  {
    id: 'pdf-range',
    title: 'Attach explicit PDF page ranges',
    description: 'At least one supplied PDF must include an exact page range for the topic so theory and quiz claims can be traced back to source material.',
  },
  {
    id: 'coverage-notes',
    title: 'Keep source coverage notes visible',
    description: 'Every source entry must explain what part of the topic it supports so later phases can keep theory, simulations, and quizzes aligned.',
  },
];

export const SOURCE_LIBRARY = {
  'cisco-official-required': {
    sourceId: 'cisco-official-required',
    sourceType: 'cisco',
    title: 'Cisco Official Documentation',
    shortLabel: 'Cisco Official',
    authority: 'primary',
    requirement: 'required',
    locationType: 'placeholder',
    location: 'Topic-specific Cisco official URL required before theory, quiz, or simulation authoring.',
    coverageNotes: 'Primary authority for every topic. Replace this placeholder with a topic-specific Cisco official URL before publishing authored content.',
    lastVerified: null,
    status: 'required',
  },
  'ccna-study-notes-v13': {
    sourceId: 'ccna-study-notes-v13',
    sourceType: 'pdf',
    title: 'CCNA 200-301 Study Notes v1.3',
    shortLabel: 'Study Notes v1.3',
    authority: 'supporting',
    requirement: 'required',
    locationType: 'file',
    location: 'C:\\Users\\Admin\\Desktop\\CCNA FILES\\CCNA 200-301 Study notes v1.3 PDF\\CCNA 200-301 Study notes v1.3.pdf',
    coverageNotes: 'General CCNA study notes supplied by the user. Exact page ranges must be mapped per topic during content authoring.',
    lastVerified: '2026-03-28',
    status: 'available',
  },
  'jeremy-mcdowell-vol1': {
    sourceId: 'jeremy-mcdowell-vol1',
    sourceType: 'pdf',
    title: 'CCNA Exam - Jeremy McDowell',
    shortLabel: 'Jeremy Vol. 1',
    authority: 'supporting',
    requirement: 'optional',
    locationType: 'file',
    location: 'C:\\Users\\Admin\\Desktop\\CCNA FILES\\CCNA 200-301 Study notes v1.3 PDF\\CCNA_Exam_-_Jeremy_McDowell.pdf',
    coverageNotes: 'Supplemental PDF reference provided by the user. Exact page ranges are to be assigned per topic when the content pack is authored.',
    lastVerified: '2026-03-28',
    status: 'available',
  },
  'jeremy-mcdowell-vol2': {
    sourceId: 'jeremy-mcdowell-vol2',
    sourceType: 'pdf',
    title: 'CCNA Exam Volume 2 - Jeremy McDowell',
    shortLabel: 'Jeremy Vol. 2',
    authority: 'supporting',
    requirement: 'optional',
    locationType: 'file',
    location: 'C:\\Users\\Admin\\Desktop\\CCNA FILES\\CCNA 200-301 Study notes v1.3 PDF\\CCNA_Exam_Volume_2_-_Jeremy_McDowell.pdf',
    coverageNotes: 'Supplemental PDF reference provided by the user. Exact page ranges are to be assigned per topic when the content pack is authored.',
    lastVerified: '2026-03-28',
    status: 'available',
  },
};

export const DEFAULT_SOURCE_REFS = [
  'cisco-official-required',
  'ccna-study-notes-v13',
];

function clonePageRange(pageRange) {
  if (!pageRange) return null;
  return { ...pageRange };
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function looksLikeUrl(value) {
  return /^https?:\/\/\S+$/i.test(String(value || '').trim());
}

function deriveLocationType(location, fallbackType = 'text') {
  if (looksLikeUrl(location)) return 'url';
  return fallbackType;
}

function createPendingPageRange(label = PENDING_PAGE_RANGE_LABEL) {
  return {
    start: null,
    end: null,
    label,
    isMapped: false,
  };
}

export function normalizePageRange(pageRange) {
  if (!pageRange) {
    return createPendingPageRange();
  }

  if (typeof pageRange === 'string') {
    const matches = pageRange.match(/\d+/g) || [];
    if (matches.length === 0) {
      return createPendingPageRange(pageRange.trim() || PENDING_PAGE_RANGE_LABEL);
    }

    const start = Number.parseInt(matches[0], 10);
    const end = Number.parseInt(matches[1] || matches[0], 10);
    const normalizedStart = Math.min(start, end);
    const normalizedEnd = Math.max(start, end);
    return {
      start: normalizedStart,
      end: normalizedEnd,
      label: normalizedStart === normalizedEnd
        ? `p. ${normalizedStart}`
        : `pp. ${normalizedStart}-${normalizedEnd}`,
      isMapped: isPositiveInteger(normalizedStart) && isPositiveInteger(normalizedEnd),
    };
  }

  if (typeof pageRange === 'object') {
    const start = Number.isFinite(pageRange.start) ? Math.trunc(pageRange.start) : null;
    const rawEnd = Number.isFinite(pageRange.end) ? Math.trunc(pageRange.end) : start;
    const normalizedStart = isPositiveInteger(start) ? start : null;
    const normalizedEnd = isPositiveInteger(rawEnd) ? Math.max(rawEnd, normalizedStart || rawEnd) : normalizedStart;
    const isMapped = isPositiveInteger(normalizedStart) && isPositiveInteger(normalizedEnd) && normalizedEnd >= normalizedStart;
    return {
      start: normalizedStart,
      end: normalizedEnd,
      label: pageRange.label || (
        isMapped
          ? (normalizedStart === normalizedEnd ? `p. ${normalizedStart}` : `pp. ${normalizedStart}-${normalizedEnd}`)
          : PENDING_PAGE_RANGE_LABEL
      ),
      isMapped,
    };
  }

  return createPendingPageRange();
}

export function formatPageRange(pageRange) {
  const normalized = normalizePageRange(pageRange);
  return normalized.label || PENDING_PAGE_RANGE_LABEL;
}

function validateManifestEntry(entry) {
  const issues = [];
  const hasCoverageNotes = Boolean(String(entry.coverageNotes || '').trim());
  const hasUrlMapping = entry.sourceType === 'cisco' && entry.locationType === 'url' && looksLikeUrl(entry.location);
  const hasPageRange = entry.sourceType === 'pdf' ? Boolean(entry.pageRange?.isMapped) : false;
  const hasTopicScopedMapping = entry.sourceType === 'pdf' ? hasPageRange : hasUrlMapping;
  const isReadyReference = hasTopicScopedMapping && hasCoverageNotes;

  if (!hasCoverageNotes) {
    issues.push('Coverage notes missing.');
  }

  if (entry.sourceType === 'cisco' && !hasUrlMapping) {
    issues.push('Cisco official URL is still pending.');
  }

  if (entry.sourceType === 'pdf' && !hasPageRange) {
    issues.push('PDF page range is still pending.');
  }

  return {
    hasCoverageNotes,
    hasUrlMapping,
    hasPageRange,
    hasTopicScopedMapping,
    isReadyReference,
    issues,
  };
}

export function validateSourceManifest(manifest = []) {
  const issues = [];
  const entries = Array.isArray(manifest) ? manifest : [];
  const ciscoEntries = entries.filter((entry) => entry.sourceType === 'cisco');
  const pdfEntries = entries.filter((entry) => entry.sourceType === 'pdf');
  const mappedEntries = entries.filter((entry) => entry.validation?.hasTopicScopedMapping).length;
  const validatedEntries = entries.filter((entry) => entry.mappingStatus === 'validated').length;
  const hasOfficialUrl = ciscoEntries.some((entry) => entry.validation?.hasUrlMapping);
  const hasPdfPageMapping = pdfEntries.some((entry) => entry.validation?.hasPageRange);

  if (entries.length === 0) {
    issues.push('Topic source manifest is empty.');
  }

  if (ciscoEntries.length === 0) {
    issues.push('At least one Cisco official source entry is required.');
  }

  if (pdfEntries.length === 0) {
    issues.push('At least one PDF source entry is required.');
  }

  if (!hasOfficialUrl) {
    issues.push('Map a topic-specific Cisco official URL before authoring theory, simulations, or quizzes.');
  }

  if (!hasPdfPageMapping) {
    issues.push('Attach at least one explicit PDF page range before authoring topic content.');
  }

  for (const entry of entries) {
    for (const entryIssue of entry.validation?.issues || []) {
      const scopedIssue = `${entry.shortLabel || entry.sourceId}: ${entryIssue}`;
      if (!issues.includes(scopedIssue)) {
        issues.push(scopedIssue);
      }
    }
  }

  const readyForAuthoring = hasOfficialUrl && hasPdfPageMapping;
  const status = readyForAuthoring
    ? 'ready'
    : mappedEntries > 0 || validatedEntries > 0
      ? 'in-progress'
      : 'pending';

  return {
    totalEntries: entries.length,
    ciscoEntries: ciscoEntries.length,
    pdfEntries: pdfEntries.length,
    mappedEntries,
    validatedEntries,
    pendingEntries: Math.max(entries.length - mappedEntries, 0),
    entriesWithPageRange: pdfEntries.filter((entry) => entry.validation?.hasPageRange).length,
    hasOfficialUrl,
    hasPdfPageMapping,
    readyForAuthoring,
    phaseGate: readyForAuthoring ? 'open' : 'locked',
    status,
    issues,
  };
}

export function getSourceAuditPresentation(audit = {}) {
  const status = audit.status || 'pending';

  if (status === 'ready') {
    return {
      status,
      tone: 'ready',
      label: 'Sources Ready',
      shortLabel: 'Sources Ready',
      summary: `${audit.mappedEntries || 0}/${audit.totalEntries || 0} mapped`,
    };
  }

  if (status === 'in-progress') {
    return {
      status,
      tone: 'progress',
      label: 'Citation Mapping In Progress',
      shortLabel: 'Mapping In Progress',
      summary: `${audit.mappedEntries || 0}/${audit.totalEntries || 0} mapped`,
    };
  }

  return {
    status: 'pending',
    tone: 'pending',
    label: 'Citation Mapping Pending',
    shortLabel: 'Sources Pending',
    summary: 'Official URL and PDF range required',
  };
}

function createTopicManifestEntry(source, sourceMapping = {}) {
  const location = String(sourceMapping.location || source.location || '').trim() || PENDING_LOCATION_LABEL;
  const locationType = sourceMapping.locationType || deriveLocationType(location, source.locationType || 'text');
  const pageRange = source.sourceType === 'pdf'
    ? normalizePageRange(sourceMapping.pageRange)
    : null;

  const provisionalEntry = {
    entryId: `${source.sourceId}::topic`,
    sourceId: source.sourceId,
    sourceType: source.sourceType,
    title: source.title,
    shortLabel: sourceMapping.shortLabel || source.shortLabel || source.title,
    authority: source.authority || 'supporting',
    requirement: sourceMapping.requirement || source.requirement || 'required',
    locationType,
    location,
    coverageNotes: sourceMapping.coverageNotes || source.coverageNotes || '',
    citationLabel: sourceMapping.citationLabel || source.shortLabel || source.title,
    pageRange,
    lastVerified: sourceMapping.lastVerified || source.lastVerified || null,
  };

  const validation = validateManifestEntry(provisionalEntry);
  const derivedStatus = sourceMapping.status
    || (sourceMapping.validatedAt ? 'validated' : (validation.isReadyReference ? 'mapped' : 'pending'));

  return {
    ...provisionalEntry,
    mappingStatus: derivedStatus,
    validatedAt: sourceMapping.validatedAt || null,
    validation,
  };
}

export function buildTopicSourceManifest(sourceIds = [], sourceMappings = {}) {
  const manifest = sourceIds
    .map((sourceId) => {
      const source = SOURCE_LIBRARY[sourceId];
      if (!source) return null;
      return createTopicManifestEntry(source, sourceMappings[sourceId] || {});
    })
    .filter(Boolean);

  return {
    manifest,
    audit: validateSourceManifest(manifest),
  };
}

export function resolveSourceRefs(sourceIds = []) {
  return sourceIds
    .map((sourceId) => SOURCE_LIBRARY[sourceId])
    .filter(Boolean)
    .map((source) => ({
      ...source,
      pageRange: source.sourceType === 'pdf' ? clonePageRange(createPendingPageRange()) : null,
    }));
}
