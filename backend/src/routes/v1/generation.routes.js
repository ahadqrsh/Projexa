import { Router } from 'express';
import * as generationController from '../../controllers/generation.controller.js';
import { requireProjectAccess } from '../../middlewares/ownership.middleware.js';
import { enforceAiQuota } from '../../middlewares/quota.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { generationLimiter } from '../../config/rateLimiters.js';
import { generateValidator } from '../../validators/generation.validator.js';

/**
 * mergeParams: true — this router is mounted at /projects/:projectId/generate and
 * must be able to read :projectId from its parent.
 */
const router = Router({ mergeParams: true });

// Generation always mutates the project, so write access (owner/admin) is required.
router.use(requireProjectAccess({ writeAccess: true }));

router.post(
  '/',
  generationLimiter,
  validate(generateValidator),
  enforceAiQuota,
  generationController.startGeneration
);

router.post('/all', generationLimiter, enforceAiQuota, generationController.generateAll);

router.post('/:type/retry', generationLimiter, enforceAiQuota, generationController.retryModule);

// Status endpoints are cheap reads — deliberately outside the generation limiter,
// because polling must not consume the caller's generation budget.
router.get('/status/:jobId', generationController.getJobStatus);
router.get('/status/:jobId/stream', generationController.streamJobStatus);
router.delete('/status/:jobId', generationController.cancelJob);

export default router;
