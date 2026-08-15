/**
 * Single source of truth for every AI-generated module.
 *
 * Imported by: Mongoose schemas, express-validator chains, the GeneratorRegistry,
 * the report builder, and (in Phase 4+) the client's renderer registry and sidebar.
 *
 * Duplicating this list anywhere guarantees drift. Do not.
 */

export const ARTIFACT_TYPES = Object.freeze({
  OVERVIEW: 'OVERVIEW',
  FEATURES: 'FEATURES',
  SRS: 'SRS',
  DATABASE_DESIGN: 'DATABASE_DESIGN',
  API_DESIGN: 'API_DESIGN',
  FOLDER_STRUCTURE: 'FOLDER_STRUCTURE',
  UI_PLAN: 'UI_PLAN',
  SPRINT_PLAN: 'SPRINT_PLAN',
  DOCUMENTATION: 'DOCUMENTATION',
  VIVA_PREP: 'VIVA_PREP',
  COST_ESTIMATION: 'COST_ESTIMATION',
  RISK_ANALYSIS: 'RISK_ANALYSIS',
  TECH_STACK: 'TECH_STACK',
  ROADMAP: 'ROADMAP',
  GITHUB_GUIDE: 'GITHUB_GUIDE',
  DEPLOYMENT_GUIDE: 'DEPLOYMENT_GUIDE',
});

export const ARTIFACT_TYPE_LIST = Object.values(ARTIFACT_TYPES);

export const DIAGRAM_TYPES = Object.freeze({
  ERD: 'ERD',
  UML_USECASE: 'UML_USECASE',
  UML_CLASS: 'UML_CLASS',
  UML_SEQUENCE: 'UML_SEQUENCE',
  UML_ACTIVITY: 'UML_ACTIVITY',
});

export const DIAGRAM_TYPE_LIST = Object.values(DIAGRAM_TYPES);

/**
 * SDLC grouping — drives the workspace sidebar (Doc 05 section 5.2).
 */
export const ARTIFACT_GROUPS = Object.freeze({
  OVERVIEW: [ARTIFACT_TYPES.OVERVIEW, ARTIFACT_TYPES.FEATURES, ARTIFACT_TYPES.TECH_STACK],
  ANALYSIS: [ARTIFACT_TYPES.SRS, ARTIFACT_TYPES.RISK_ANALYSIS, ARTIFACT_TYPES.COST_ESTIMATION],
  DESIGN: [
    ARTIFACT_TYPES.DATABASE_DESIGN,
    ARTIFACT_TYPES.API_DESIGN,
    ARTIFACT_TYPES.FOLDER_STRUCTURE,
    ARTIFACT_TYPES.UI_PLAN,
  ],
  PLANNING: [ARTIFACT_TYPES.SPRINT_PLAN, ARTIFACT_TYPES.ROADMAP],
  DELIVERY: [
    ARTIFACT_TYPES.DOCUMENTATION,
    ARTIFACT_TYPES.GITHUB_GUIDE,
    ARTIFACT_TYPES.DEPLOYMENT_GUIDE,
  ],
  SUBMISSION: [ARTIFACT_TYPES.VIVA_PREP],
});

/** URL slug <-> enum. Routes use kebab-case; storage uses SCREAMING_SNAKE_CASE. */
export const artifactTypeFromSlug = (slug) =>
  ARTIFACT_TYPE_LIST.find((t) => t.toLowerCase().replace(/_/g, '-') === String(slug).toLowerCase());

export const artifactTypeToSlug = (type) => String(type).toLowerCase().replace(/_/g, '-');

export const diagramTypeFromSlug = (slug) =>
  DIAGRAM_TYPE_LIST.find((t) => t.toLowerCase().replace(/_/g, '-') === String(slug).toLowerCase());
