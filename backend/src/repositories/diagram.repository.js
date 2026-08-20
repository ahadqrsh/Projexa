import BaseRepository from './base.repository.js';
import { Diagram } from '../models/diagram.model.js';
import { GENERATION_STATUS } from '../../../shared/constants/statuses.js';

class DiagramRepository extends BaseRepository {
  constructor() {
    super(Diagram);
  }

  findByProjectAndType(projectId, type) {
    return this.model.findOne({ project: projectId, type });
  }

  findAllForProject(projectId, { select } = {}) {
    return this.model.find({ project: projectId }).select(select).sort({ type: 1 }).lean();
  }

  /** Upsert so re-generating a diagram never violates the unique (project, type) index. */
  upsertQueued(projectId, type) {
    return this.model.findOneAndUpdate(
      { project: projectId, type },
      {
        $set: { status: GENERATION_STATUS.GENERATING, error: undefined },
        $setOnInsert: { project: projectId, type, version: 1 },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  deleteAllForProject(projectId) {
    return this.model.deleteMany({ project: projectId });
  }
}

export const diagramRepository = new DiagramRepository();
export default diagramRepository;
