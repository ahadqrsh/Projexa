/**
 * Frontend-local copy of the 5 diagram types, deliberately NOT imported from
 * `shared/` — Vercel's Root Directory for this app is `frontend`, so an
 * import reaching outside it (`../../../shared/...`) builds fine locally in
 * the monorepo checkout but 404s the module on Vercel, where only the
 * `frontend/` subtree is ever uploaded. Five constants duplicated here is a
 * far cheaper price than a deploy-only build failure.
 */
export const DIAGRAM_TYPE_LIST = ['ERD', 'UML_CLASS', 'UML_SEQUENCE', 'UML_USECASE', 'UML_ACTIVITY'];

export const DIAGRAM_LABELS = {
  ERD: 'ER Diagram',
  UML_CLASS: 'Class Diagram',
  UML_SEQUENCE: 'Sequence Diagram',
  UML_USECASE: 'Use Case Diagram',
  UML_ACTIVITY: 'Activity Diagram',
};

export const diagramLabel = (type) => DIAGRAM_LABELS[type] ?? type;

export default { DIAGRAM_TYPE_LIST, DIAGRAM_LABELS, diagramLabel };
