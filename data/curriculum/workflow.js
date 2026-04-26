/**
 * workflow.js
 *
 * Shared architecture workflow for Phase 1 curriculum implementation.
 */

export const CONTENT_WORKFLOW_STEPS = [
  'Create the topic source manifest from Cisco official references and the supplied PDFs.',
  'Write deep-dive theory only from cited facts.',
  'Define simulation behavior from the same validated facts.',
  'Generate the quiz only from the validated theory and simulation states.',
  'Register the topic in its domain and bind it to one reusable simulation engine family.',
  'Validate citations, unlock rules, and assessment balance before marking the topic authored.',
];

export const ENGINEERING_WORKFLOW_STEPS = [
  'Normalize the curriculum registry into six full CCNA domains.',
  'Add source-manifest support and content templates.',
  'Finish the reusable simulation engine families.',
  'Populate Domain 1 completely, then Domain 2, then Domain 3, then Domains 4 to 6.',
  'Add each domain final only after that domain topic set is complete.',
  'Build the 120-question practice exam after the topic and domain-final banks are ready.',
];
