import { Router } from 'express';
import * as userController from '../../controllers/user.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { adminOnly } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { uploadAvatar, handleUploadErrors } from '../../middlewares/upload.middleware.js';
import { uploadLimiter } from '../../config/rateLimiters.js';
import { mongoIdParam, paginationQuery } from '../../validators/common.validator.js';
import {
  updateProfileValidator,
  updatePreferencesValidator,
  deleteAccountValidator,
  updateRoleValidator,
  updateStatusValidator,
  updateCreditsValidator,
} from '../../validators/user.validator.js';

const router = Router();

router.use(protect);

// Self
router.get('/me', userController.getMe);
router.patch('/me', validate(updateProfileValidator), userController.updateMe);
router.patch(
  '/me/preferences',
  validate(updatePreferencesValidator),
  userController.updatePreferences
);
router.patch('/me/avatar', uploadLimiter, uploadAvatar, handleUploadErrors, userController.updateAvatar);
router.delete('/me/avatar', userController.removeAvatar);
router.delete('/me', validate(deleteAccountValidator), userController.deleteMe);

// Admin
router.get('/', adminOnly, validate(paginationQuery), userController.listUsers);
router.get('/:id', adminOnly, validate([mongoIdParam('id')]), userController.getUserById);
router.patch(
  '/:id/role',
  adminOnly,
  validate([mongoIdParam('id'), ...updateRoleValidator]),
  userController.updateUserRole
);
router.patch(
  '/:id/status',
  adminOnly,
  validate([mongoIdParam('id'), ...updateStatusValidator]),
  userController.updateUserStatus
);
router.patch(
  '/:id/credits',
  adminOnly,
  validate([mongoIdParam('id'), ...updateCreditsValidator]),
  userController.updateUserCredits
);

export default router;
