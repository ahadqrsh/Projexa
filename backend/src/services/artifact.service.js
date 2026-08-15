import ApiError from '../utils/ApiError.js';
import { artifactRepository } from '../repositories/artifact.repository.js';
import { projectRepository } from '../repositories/project.repository.js';
import { GENERATION_STATUS } from '../../../shared/constants/statuses.js';

export const listArtifacts = (projectId, { fields } = {}) =>
  artifactRepository.findAllForProject(projectId, { select: fields });

export const getArtifact = async (projectId, type) => {
  const artifact = await artifactRepository.findByProjectAndType(projectId, type);
  if (!artifact) throw ApiError.notFound(`The ${type} module has not been generated yet`);
  return artifact;
};

/**
 * Manual edit.
 *
 * The AI output is a starting point, not a verdict — a student must be able to
 * correct it and keep their correction. `isManuallyEdited` lets the UI warn
 * before a regeneration would overwrite hand-written work, and the previous
 * version is archived so the edit is reversible.
 */
export const updateArtifact = async (projectId, type, content) => {
  const artifact = await getArtifact(projectId, type);

  artifact.archiveCurrentVersion();
  artifact.content = content;
  artifact.version += 1;
  artifact.isManuallyEdited = true;
  artifact.status = GENERATION_STATUS.COMPLETED;
  artifact.error = undefined;
  await artifact.save();

  return artifact;
};

export const deleteArtifact = async (projectId, type) => {
  const artifact = await getArtifact(projectId, type);
  await artifactRepository.deleteById(artifact._id);
  await projectRepository.updateById(projectId, { $pull: { generatedModules: type } });
};

export const listVersions = async (projectId, type) => {
  const artifact = await getArtifact(projectId, type);
  return {
    current: { version: artifact.version, generatedAt: artifact.generatedAt },
    previous: artifact.previousVersions.map((v) => ({
      version: v.version,
      generatedAt: v.generatedAt,
    })),
  };
};

export const restoreVersion = async (projectId, type, version) => {
  const artifact = await getArtifact(projectId, type);

  const target = artifact.previousVersions.find((v) => v.version === Number(version));
  if (!target) throw ApiError.notFound(`Version ${version} of ${type}`);

  // Archive what we are replacing, so restoring is itself reversible.
  artifact.archiveCurrentVersion();
  artifact.content = target.content;
  artifact.version += 1;
  artifact.isStale = false;
  await artifact.save();

  return artifact;
};

export default {
  listArtifacts,
  getArtifact,
  updateArtifact,
  deleteArtifact,
  listVersions,
  restoreVersion,
};
