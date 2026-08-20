import { Router } from 'express';
import * as diagramController from '../../controllers/diagram.controller.js';
import { requireProjectAccess } from '../../middlewares/ownership.middleware.js';
import { enforceAiQuota } from '../../middlewares/quota.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { generationLimiter } from '../../config/rateLimiters.js';
import { diagramTypeParam, updateDiagramValidator } from '../../validators/diagram.validator.js';

/** mergeParams: true — mounted at /projects/:projectId/diagrams. */
const router = Router({ mergeParams: true });

// Diagrams read the project like artifacts do — mentors and admins included.
router.use(requireProjectAccess());

router.get('/', diagramController.listDiagrams);

router.get('/:type', validate([diagramTypeParam]), diagramController.getDiagram);

/**
 * A single diagram is one short text generation, not a batch — this returns
 * the finished diagram directly (200) rather than a jobId to poll (202), see
 * diagram.controller.js. Same rate limiter and credit gate as the module
 * generation endpoints; a diagram costs the same one AI credit.
 */
router.post(
  '/:type/generate',
  generationLimiter,
  validate([diagramTypeParam]),
  requireProjectAccess({ writeAccess: true }),
  enforceAiQuota,
  diagramController.generateDiagram
);

router.patch(
  '/:type',
  validate(updateDiagramValidator),
  requireProjectAccess({ writeAccess: true }),
  diagramController.updateDiagram
);

export default router;
