/**
 * Assembles the upstream artifacts a generator declares in `dependsOn`.
 *
 * This is what makes the output coherent rather than 16 unrelated documents:
 * API_DESIGN is generated WITH the DATABASE_DESIGN output in its prompt, so the
 * endpoints actually match the collections. Without this the AI invents a fresh,
 * contradictory data model for every module.
 */

import { artifactRepository } from '../../repositories/artifact.repository.js';
import { GENERATION_STATUS } from '../../../../shared/constants/statuses.js';

/** Keep injected context bounded — a full upstream artifact can be huge. */
const MAX_CONTEXT_CHARS = 6000;

const truncate = (value) => {
  const json = JSON.stringify(value);
  if (json.length <= MAX_CONTEXT_CHARS) return value;
  return { truncated: true, preview: json.slice(0, MAX_CONTEXT_CHARS) };
};

export const buildContext = async (projectId, dependsOn = []) => {
  if (!dependsOn.length) return {};

  const artifacts = await artifactRepository.findMany(
    { project: projectId, type: { $in: dependsOn }, status: GENERATION_STATUS.COMPLETED },
    { select: 'type content', lean: true }
  );

  return artifacts.reduce((context, artifact) => {
    context[artifact.type] = truncate(artifact.content);
    return context;
  }, {});
};

/** Compact, prompt-safe view of the project idea itself. */
export const buildProjectContext = (project) => ({
  title: project.title,
  description: project.description,
  domain: project.domain,
  difficulty: project.difficulty,
  teamSize: project.teamSize,
  preferredTech: project.preferredTech,
  projectType: project.projectType,
  aiIntegrationRequired: project.aiIntegrationRequired,
  deadline: project.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : null,
});

export default { buildContext, buildProjectContext };
