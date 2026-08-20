import { Router } from 'express';
import * as projectController from '../../controllers/project.controller.js';
import * as exportController from '../../controllers/export.controller.js';
import { protect, optionalAuth } from '../../middlewares/auth.middleware.js';
import { mentorOrAdmin } from '../../middlewares/rbac.middleware.js';
import {
  requireProjectAccess,
  allowPublicProject,
} from '../../middlewares/ownership.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { uploadCover, handleUploadErrors } from '../../middlewares/upload.middleware.js';
import { uploadLimiter } from '../../config/rateLimiters.js';
import { mongoIdParam, paginationQuery } from '../../validators/common.validator.js';
import {
  createProjectValidator,
  updateProjectValidator,
  updateVisibilityValidator,
  updateStatusValidator,
  addMentorValidator,
  listProjectsValidator,
  exportProjectValidator,
} from '../../validators/project.validator.js';
import { exportLimiter } from '../../config/rateLimiters.js';

// Nested routers (generation, artifacts, diagrams) need access to :projectId from this router.
import generationRoutes from './generation.routes.js';
import artifactRoutes from './artifact.routes.js';
import diagramRoutes from './diagram.routes.js';

const router = Router();

/* ── Public ────────────────────────────────────────────────────────────── */
router.get('/public', validate(paginationQuery), projectController.listPublicProjects);
router.get('/slug/:slug', optionalAuth, allowPublicProject, projectController.getProjectBySlug);

/* ── Authenticated ─────────────────────────────────────────────────────── */
router.use(protect);

// Static paths MUST precede /:id, otherwise "stats" is parsed as an id.
router.get('/stats', projectController.getStats);
router.get('/bookmarks', validate(paginationQuery), projectController.listBookmarks);
router.get('/assigned', mentorOrAdmin, validate(paginationQuery), projectController.listAssigned);

router.post('/', validate(createProjectValidator), projectController.createProject);
router.get('/', validate([...paginationQuery, ...listProjectsValidator]), projectController.listProjects);

// Nested resources — mounted before /:id so they resolve first.
router.use('/:projectId/generate', generationRoutes);
router.use('/:projectId/artifacts', artifactRoutes);
router.use('/:projectId/diagrams', diagramRoutes);

router
  .route('/:id')
  .get(validate([mongoIdParam('id')]), requireProjectAccess(), projectController.getProject)
  .patch(
    validate([mongoIdParam('id'), ...updateProjectValidator]),
    requireProjectAccess({ writeAccess: true }),
    projectController.updateProject
  )
  .delete(
    validate([mongoIdParam('id')]),
    requireProjectAccess({ writeAccess: true }),
    projectController.deleteProject
  );

router.get(
  '/:id/export',
  exportLimiter,
  validate([mongoIdParam('id'), ...exportProjectValidator]),
  requireProjectAccess(),
  exportController.exportProject
);

router.get(
  '/:id/history',
  validate([mongoIdParam('id')]),
  requireProjectAccess(),
  projectController.getProjectHistory
);

router.post('/:id/restore', validate([mongoIdParam('id')]), projectController.restoreProject);

router.post(
  '/:id/duplicate',
  validate([mongoIdParam('id')]),
  requireProjectAccess(),
  projectController.duplicateProject
);

router.post('/:id/bookmark', validate([mongoIdParam('id')]), projectController.toggleBookmark);

router.patch(
  '/:id/cover',
  uploadLimiter,
  validate([mongoIdParam('id')]),
  requireProjectAccess({ writeAccess: true }),
  uploadCover,
  handleUploadErrors,
  projectController.updateCover
);

router.patch(
  '/:id/visibility',
  validate([mongoIdParam('id'), ...updateVisibilityValidator]),
  requireProjectAccess({ writeAccess: true }),
  projectController.updateVisibility
);

router.patch(
  '/:id/status',
  validate([mongoIdParam('id'), ...updateStatusValidator]),
  requireProjectAccess({ writeAccess: true }),
  projectController.updateStatus
);

router.post(
  '/:id/mentors',
  validate([mongoIdParam('id'), ...addMentorValidator]),
  requireProjectAccess({ writeAccess: true }),
  projectController.addMentor
);

router.delete(
  '/:id/mentors/:userId',
  validate([mongoIdParam('id'), mongoIdParam('userId')]),
  requireProjectAccess({ writeAccess: true }),
  projectController.removeMentor
);

export default router;
