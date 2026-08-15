import BaseRepository from './base.repository.js';
import { Project } from '../models/project.model.js';

class ProjectRepository extends BaseRepository {
  constructor() {
    super(Project);
  }

  findBySlug(slug) {
    return this.model.findOne({ slug });
  }

  /** Owner OR listed mentor — the access predicate used by the ownership middleware. */
  findAccessible(projectId, userId) {
    return this.model.findOne({
      _id: projectId,
      $or: [{ owner: userId }, { mentors: userId }],
    });
  }

  softDelete(projectId) {
    return this.model.findByIdAndUpdate(
      projectId,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
  }

  restore(projectId) {
    return this.model.findOneAndUpdate(
      { _id: projectId, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true, includeDeleted: true }
    );
  }

  toggleBookmark(projectId, userId, shouldBookmark) {
    const update = shouldBookmark
      ? { $addToSet: { bookmarkedBy: userId } }
      : { $pull: { bookmarkedBy: userId } };
    return this.model.findByIdAndUpdate(projectId, update, { new: true });
  }

  addGeneratedModule(projectId, artifactType) {
    return this.model.findByIdAndUpdate(
      projectId,
      { $addToSet: { generatedModules: artifactType }, lastGeneratedAt: new Date() },
      { new: true }
    );
  }

  incrementViewCount(projectId) {
    return this.model.updateOne({ _id: projectId }, { $inc: { viewCount: 1 } });
  }

  /** Dashboard counters in a single aggregation rather than six countDocuments calls. */
  async statsForOwner(ownerId) {
    const [result] = await this.model.aggregate([
      { $match: { owner: ownerId, isDeleted: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $in: ['$status', ['generating', 'ready', 'in_progress']] }, 1, 0] },
          },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          avgCompletion: { $avg: '$completionPercentage' },
          totalModules: { $sum: { $size: { $ifNull: ['$generatedModules', []] } } },
        },
      },
      { $project: { _id: 0 } },
    ]);

    return (
      result ?? { total: 0, active: 0, completed: 0, avgCompletion: 0, totalModules: 0 }
    );
  }
}

export const projectRepository = new ProjectRepository();
export default projectRepository;
