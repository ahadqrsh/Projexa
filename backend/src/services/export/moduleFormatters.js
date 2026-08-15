/**
 * artifactType -> (content) => Block[]
 *
 * Mirrors the frontend's features/artifacts/renderers/index.js on purpose —
 * same field knowledge, same one-formatter-per-type shape — but the output is
 * the format-agnostic IR from blocks.js instead of JSX, because this runs on
 * the server and feeds three different document builders.
 */
import { heading, paragraph, list, table, keyValue, spacer } from './blocks.js';

const titleCaseWord = (v = '') => String(v).replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatters = {
  OVERVIEW: (c) => [
    heading('Objective', 3), paragraph(c.objective),
    heading('Real-world problem', 3), paragraph(c.realWorldProblem),
    heading('Scope', 3), paragraph(c.scope),
    heading('Expected outcome', 3), paragraph(c.expectedOutcome),
    heading('Target users', 3), list(c.targetUsers),
    heading('Key benefits', 3), list(c.keyBenefits),
  ],

  FEATURES: (c) => c.roles?.flatMap((role) => [
    heading(role.role, 3),
    table(['Feature', 'Description', 'Priority'], role.features?.map((f) => [f.name, f.description, f.priority]) ?? []),
    spacer(),
  ]) ?? [],

  TECH_STACK: (c) => [
    table(['Layer', 'Choices'], [
      ['Frontend', c.frontend?.join(', ')],
      ['Backend', c.backend?.join(', ')],
      ['Database', c.database?.join(', ')],
      ['AI models', c.aiModels?.join(', ') || '—'],
      ['Deployment', c.deployment?.join(', ')],
      ['Authentication', c.authentication?.join(', ')],
    ]),
    heading('Rationale', 3), paragraph(c.rationale),
    heading('Alternatives considered', 3), list(c.alternativesConsidered),
  ],

  SRS: (c) => [
    heading('Functional requirements', 3),
    table(['ID', 'Title', 'Description', 'Priority'], c.functional?.map((r) => [r.id, r.title, r.description, r.priority]) ?? []),
    spacer(),
    heading('Non-functional requirements', 3),
    table(['Category', 'Requirement', 'Metric'], c.nonFunctional?.map((r) => [r.category, r.requirement, r.metric]) ?? []),
  ],

  DATABASE_DESIGN: (c) => [
    ...(c.collections?.flatMap((col) => [
      heading(col.name, 3),
      paragraph(col.purpose),
      table(['Field', 'Type', 'Required', 'Description'], col.fields?.map((f) => [f.name, f.type, f.required ? 'yes' : 'no', f.description]) ?? []),
      spacer(),
    ]) ?? []),
    heading('Relationships', 3),
    table(['From', 'To', 'Type', 'Description'], c.relationships?.map((r) => [r.from, r.to, r.type, r.description]) ?? []),
  ],

  API_DESIGN: (c) => c.groups?.flatMap((g) => [
    heading(g.resource, 3),
    table(['Method', 'Path', 'Auth', 'Description'], g.endpoints?.map((e) => [e.method, e.path, e.auth, e.description]) ?? []),
    spacer(),
  ]) ?? [],

  FOLDER_STRUCTURE: (c) => [
    heading('Frontend', 3), paragraph(`${c.frontend?.root}/`),
    list(c.frontend?.entries?.map((e) => `${e.path} — ${e.purpose}`)),
    heading('Backend', 3), paragraph(`${c.backend?.root}/`),
    list(c.backend?.entries?.map((e) => `${e.path} — ${e.purpose}`)),
    heading('Conventions', 3), list(c.conventions),
  ],

  ROADMAP: (c) => [
    paragraph(`${c.totalWeeks} week plan.`),
    ...(c.weeks?.flatMap((w) => [
      heading(`Week ${w.weekNumber} — ${w.title}`, 3),
      paragraph(w.goal),
      list(w.deliverables),
      table(['Task', 'Category', 'Hours'], w.tasks?.map((t) => [t.title, t.category, String(t.estimatedHours)]) ?? []),
      spacer(),
    ]) ?? []),
    heading('Milestones', 3),
    list(c.milestones?.map((m) => `Week ${m.weekNumber}: ${m.title}`)),
  ],

  VIVA_PREP: (c) => c.categories?.flatMap((cat) => [
    heading(titleCaseWord(cat.category), 3),
    ...(cat.questions?.flatMap((q) => [
      paragraph(`Q: ${q.question} (${q.difficulty})`),
      paragraph(`A: ${q.modelAnswer}`),
      spacer(),
    ]) ?? []),
  ]) ?? [],

  UI_PLAN: (c) => [
    heading('Screens', 3),
    table(['Screen', 'Purpose', 'Roles'], c.screens?.map((s) => [s.name, s.purpose, s.userRoles?.join(', ')]) ?? []),
    heading('Design system', 3),
    keyValue([['Typography', c.designSystem?.typography], ['Component library', c.designSystem?.componentLibrary]]),
    list(c.designSystem?.colorPalette),
    heading('User flows', 3),
    ...(c.userFlows?.flatMap((f) => [paragraph(f.name), list(f.steps, true), spacer()]) ?? []),
  ],

  SPRINT_PLAN: (c) => [
    paragraph(`${c.sprints?.length ?? 0} sprints, ${c.sprintLengthWeeks} week(s) each.`),
    ...(c.sprints?.flatMap((s) => [
      heading(`Sprint ${s.sprintNumber}`, 3),
      paragraph(s.goal),
      table(['Backlog item', 'Points', 'Feature'], s.backlog?.map((b) => [b.title, String(b.storyPoints), b.relatedFeature]) ?? []),
      spacer(),
    ]) ?? []),
  ],

  DOCUMENTATION: (c) => [
    heading(c.readme?.title, 3), paragraph(c.readme?.description),
    heading('Installation', 4), list(c.readme?.installationSteps, true),
    heading('Usage', 4), list(c.readme?.usageInstructions),
    ...(c.sections?.flatMap((s) => [heading(s.heading, 3), paragraph(s.content), spacer()]) ?? []),
  ],

  COST_ESTIMATION: (c) => [
    keyValue([
      ['Currency', c.currency],
      ['Total monthly', `${c.totalMonthlyCost} ${c.currency}`],
      ['Total one-time', `${c.totalOneTimeCost} ${c.currency}`],
    ]),
    table(['Item', 'Category', 'Cost', 'Cycle', 'Notes'], c.items?.map((i) => [i.name, i.category, String(i.estimatedCost), i.billingCycle, i.notes]) ?? []),
    heading('Free tier notes', 3), paragraph(c.freeTierNotes),
  ],

  RISK_ANALYSIS: (c) => [
    table(['Risk', 'Category', 'Likelihood', 'Impact', 'Mitigation'],
      c.risks?.map((r) => [r.title, r.category, r.likelihood, r.impact, r.mitigation]) ?? []),
  ],

  GITHUB_GUIDE: (c) => [
    heading('Branching strategy', 3), paragraph(c.branchingStrategy),
    table(['Branch', 'Purpose'], c.branches?.map((b) => [b.name, b.purpose]) ?? []),
    heading('Commit convention', 3), paragraph(c.commitConvention?.format),
    list(c.commitConvention?.examples),
    heading('Workflow', 3), list(c.workflowSteps, true),
    heading('PR guidelines', 3), list(c.prGuidelines),
  ],

  DEPLOYMENT_GUIDE: (c) => [
    ...(c.platforms?.flatMap((p) => [
      heading(`${titleCaseWord(p.component)} — ${p.platform}`, 3),
      list(p.steps, true),
      spacer(),
    ]) ?? []),
    heading('Environment variables', 3),
    table(['Key', 'Description', 'Example', 'Required'],
      c.environmentVariables?.map((v) => [v.key, v.description, v.example, v.required ? 'yes' : 'no']) ?? []),
    heading('CI/CD', 3), paragraph(c.cicdNotes),
  ],
};

export const toBlocks = (type, content) => {
  const build = formatters[type];
  if (!build || !content) return [paragraph('No renderer available for this module — raw JSON follows.'), paragraph(JSON.stringify(content))];
  try {
    return build(content).filter(Boolean);
  } catch {
    return [paragraph('This module could not be formatted — raw JSON follows.'), paragraph(JSON.stringify(content))];
  }
};

export default toBlocks;
