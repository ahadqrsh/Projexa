import BaseRepository from './base.repository.js';
import { Artifact } from '../models/artifact.model.js';
import { GENERATION_STATUS } from '../../../shared/constants/statuses.js';

class ArtifactRepository extends BaseRepository {
  constructor() {
    super(Artifact);
  }

  findByProjectAndType(projectId, type) {
    return this.model.findOne({ project: projectId, type });
  }

  findAllForProject(projectId, { select } = {}) {
    return this.model.find({ project: projectId }).select(select).sort({ type: 1 }).lean();
  }

  /** Upsert so re-queuing a module never violates the unique (project, type) index. */
  upsertQueued(projectId, type, jobId) {
    return this.model.findOneAndUpdate(
      { project: projectId, type },
      {
        $set: { status: GENERATION_STATUS.QUEUED, jobId, error: undefined },
        $setOnInsert: { project: projectId, type, version: 1 },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  markStaleForProject(projectId) {
    return this.model.updateMany(
      { project: projectId, status: GENERATION_STATUS.COMPLETED },
      { $set: { isStale: true } }
    );
  }

  findByJobId(jobId) {
    return this.model.find({ jobId }).select('type status version generationMeta error').lean();
  }

  /**
   * Boot-time reconciliation: an in-process queue loses in-flight work on restart,
   * so anything still "generating" past the timeout is definitively dead.
   */
  sweepStuck(olderThan) {
    return this.model.updateMany(
      { status: GENERATION_STATUS.GENERATING, updatedAt: { $lt: olderThan } },
      {
        $set: {
          status: GENERATION_STATUS.FAILED,
          error: {
            message: 'Generation was interrupted by a server restart. Please retry.',
            code: 'INTERRUPTED',
            occurredAt: new Date(),
          },
        },
      }
    );
  }

  /** Cache lookup: same idea + same module + same prompt version = reusable output. */
  findCacheCandidate({ ideaHash: _ideaHash, type, promptVersion, projectIds }) {
    return this.model
      .findOne({
        project: { $in: projectIds },
        type,
        promptVersion,
        status: GENERATION_STATUS.COMPLETED,
        isStale: false,
      })
      .sort({ updatedAt: -1 })
      .lean();
  }
}

export const artifactRepository = new ArtifactRepository();
export default artifactRepository;
