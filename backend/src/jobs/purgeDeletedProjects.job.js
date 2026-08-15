/**
 * Hard-deletes projects that have been soft-deleted beyond the restore window,
 * along with everything that hangs off them.
 *
 * Without this, "soft delete" is just a growing pile of invisible documents.
 */

import { Project, Artifact, Diagram, Sprint, Task, Report, Comment } from '../models/index.js';
import { getStorage } from '../services/storage/storageFactory.js';
import env from '../config/env.js';
import logger from '../config/logger.js';

export const purgeDeletedProjects = async () => {
  const cutoff = new Date(Date.now() - env.PURGE_DELETED_AFTER_DAYS * 86_400_000);

  const expired = await Project.find({ isDeleted: true, deletedAt: { $lt: cutoff } })
    .setOptions({ includeDeleted: true })
    .select('_id coverImage')
    .lean();

  if (!expired.length) return 0;

  const ids = expired.map((p) => p._id);
  const storage = getStorage();

  // Remove cloud assets first — after the rows are gone we no longer know the publicIds.
  await Promise.all(
    expired.filter((p) => p.coverImage?.publicId).map((p) => storage.destroy(p.coverImage.publicId))
  );

  await Promise.all([
    Artifact.deleteMany({ project: { $in: ids } }),
    Diagram.deleteMany({ project: { $in: ids } }),
    Sprint.deleteMany({ project: { $in: ids } }),
    Task.deleteMany({ project: { $in: ids } }),
    Report.deleteMany({ project: { $in: ids } }),
    Comment.deleteMany({ project: { $in: ids } }),
  ]);

  await Project.deleteMany({ _id: { $in: ids } }).setOptions({ includeDeleted: true });

  logger.info(`Purged ${ids.length} project(s) past the ${env.PURGE_DELETED_AFTER_DAYS}-day window`);
  return ids.length;
};

export default purgeDeletedProjects;
