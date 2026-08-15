import { projectRepository } from '../repositories/project.repository.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLES } from '../../../shared/constants/roles.js';
import { PROJECT_VISIBILITY } from '../../../shared/constants/statuses.js';

/**
 * Loads :projectId and asserts the caller may touch it, then caches the document
 * on req.project so the controller and service do not re-query.
 *
 * `writeAccess: true` excludes mentors — mentors review and comment; they never
 * silently rewrite a student's submission, because the student must be able to
 * defend every word at viva.
 */
export const requireProjectAccess = ({ writeAccess = false } = {}) =>
  asyncHandler(async (req, _res, next) => {
    const projectId = req.params.projectId ?? req.params.id;
    const project = await projectRepository.findById(projectId);
    if (!project) throw ApiError.notFound('Project');

    const userId = String(req.user._id);
    const isOwner = String(project.owner) === userId;
    const isMentor = project.mentors.some((m) => String(m) === userId);
    const isAdmin = req.user.role === ROLES.ADMIN;

    const permitted = writeAccess ? isOwner || isAdmin : isOwner || isMentor || isAdmin;
    if (!permitted) {
      throw ApiError.forbidden(
        writeAccess
          ? 'Only the project owner can modify this project.'
          : 'You do not have access to this project.'
      );
    }

    req.project = project;
    req.projectAccess = { isOwner, isMentor, isAdmin };
    return next();
  });

/** Public/unlisted read path — used by share links where no session may exist. */
export const allowPublicProject = asyncHandler(async (req, _res, next) => {
  const project = await projectRepository.findBySlug(req.params.slug);
  if (!project) throw ApiError.notFound('Project');

  const isPublic = project.visibility !== PROJECT_VISIBILITY.PRIVATE;
  const userId = req.user ? String(req.user._id) : null;
  const isOwner = userId && String(project.owner) === userId;
  const isMentor = userId && project.mentors.some((m) => String(m) === userId);

  if (!isPublic && !isOwner && !isMentor) throw ApiError.notFound('Project');

  req.project = project;
  return next();
});
