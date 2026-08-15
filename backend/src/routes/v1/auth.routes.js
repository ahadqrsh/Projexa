/**
 * Routes bind URLs to a middleware chain and a controller. Nothing else.
 * If you find yourself writing an `if` in this file, it belongs in a service.
 */

import { Router } from 'express';
import * as authController from '../../controllers/auth.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authLimiter } from '../../config/rateLimiters.js';
import { mongoIdParam } from '../../validators/common.validator.js';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  verifyEmailValidator,
} from '../../validators/auth.validator.js';

const router = Router();

// Public — rate limited against brute force and enumeration
router.post('/register', authLimiter, validate(registerValidator), authController.register);
router.post('/login', authLimiter, validate(loginValidator), authController.login);
router.post('/refresh-token', authController.refresh);
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordValidator),
  authController.forgotPassword
);
router.post(
  '/reset-password/:token',
  authLimiter,
  validate(resetPasswordValidator),
  authController.resetPassword
);
router.post('/verify-email/:token', validate(verifyEmailValidator), authController.verifyEmail);

// Authenticated
router.use(protect);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.post('/resend-verification', authController.resendVerification);
router.post('/change-password', validate(changePasswordValidator), authController.changePassword);
router.get('/sessions', authController.listSessions);
router.delete('/sessions/:id', validate([mongoIdParam('id')]), authController.revokeSession);

export default router;
