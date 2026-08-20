/**
 * Diagram business logic. Deliberately synchronous, unlike the 16-module
 * generation engine: a single Mermaid-source generation is a few seconds of
 * text output, well inside any request timeout, so there is no job queue,
 * no polling, no SSE — the HTTP response IS the result. That is the whole
 * simplification that makes this feature cheap to run and easy to deploy.
 */

import ApiError from '../utils/ApiError.js';
import { diagramRepository } from '../repositories/diagram.repository.js';
import { getDiagramGenerator } from './ai/generators/DiagramGenerator.js';
import { DIAGRAM_META } from './ai/prompts/diagrams/diagram.prompt.js';

export const listDiagrams = (projectId) => diagramRepository.findAllForProject(projectId);

export const getDiagram = async (projectId, type) => {
  const diagram = await diagramRepository.findByProjectAndType(projectId, type);
  if (!diagram) throw ApiError.notFound('Diagram');
  return diagram;
};

export const generateDiagram = async ({ project, user, type }) => {
  const generator = getDiagramGenerator(type);
  const result = await generator.run({ project, user });
  return result.diagram;
};

/** Manual edit: the user's own Mermaid source is authoritative from here on. */
export const updateDiagramSource = async ({ projectId, type, source, title }) => {
  if (!source || !source.trim()) throw ApiError.badRequest('Diagram source cannot be empty');

  const diagram = await diagramRepository.findByProjectAndType(projectId, type);
  if (!diagram) throw ApiError.notFound('Diagram');

  diagram.source = source;
  if (title !== undefined) diagram.title = title;
  diagram.isManuallyEdited = true;
  diagram.isStale = false;
  diagram.version += 1;
  await diagram.save();
  return diagram;
};

export const listDiagramTypes = () =>
  Object.entries(DIAGRAM_META).map(([type, meta]) => ({ type, label: meta.label }));

export default {
  listDiagrams,
  getDiagram,
  generateDiagram,
  updateDiagramSource,
  listDiagramTypes,
};
