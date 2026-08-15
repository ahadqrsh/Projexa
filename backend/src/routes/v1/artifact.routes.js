import { Router } from 'express';
import * as artifactController from '../../controllers/artifact.controller.js';
import { requireProjectAccess } from '../../middlewares/ownership.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  artifactTypeParam,
  updateArtifactValidator,
} from '../../validators/generation.validator.js';

const router = Router({ mergeParams: true });

// Reads allow mentors; writes are restricted per-route below.
router.get('/', requireProjectAccess(), artifactController.listArtifacts);

router.get(
  '/:type',
  validate([artifactTypeParam]),
  requireProjectAccess(),
  artifactController.getArtifact
);

router.get(
  '/:type/versions',
  validate([artifactTypeParam]),
  requireProjectAccess(),
  artifactController.listVersions
);

router.patch(
  '/:type',
  validate(updateArtifactValidator),
  requireProjectAccess({ writeAccess: true }),
  artifactController.updateArtifact
);

router.post(
  '/:type/restore/:version',
  validate([artifactTypeParam]),
  requireProjectAccess({ writeAccess: true }),
  artifactController.restoreVersion
);

router.delete(
  '/:type',
  validate([artifactTypeParam]),
  requireProjectAccess({ writeAccess: true }),
  artifactController.deleteArtifact
);

export default router;
