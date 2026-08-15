import { body } from 'express-validator';
import { ROLE_LIST } from '../../../shared/constants/roles.js';

export const updateProfileValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 60 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('college').optional().trim().isLength({ max: 120 }),
  body('branch').optional().trim().isLength({ max: 80 }),
  body('graduationYear').optional().isInt({ min: 2000, max: 2100 }),
  body('skills').optional().isArray({ max: 20 }).withMessage('At most 20 skills'),
  body('skills.*').optional().isString().trim().isLength({ max: 40 }),
  body('github').optional({ values: 'falsy' }).isURL().withMessage('GitHub must be a valid URL'),
  body('linkedin').optional({ values: 'falsy' }).isURL().withMessage('LinkedIn must be a valid URL'),
];

export const updatePreferencesValidator = [
  body('theme').optional().isIn(['light', 'dark', 'system']),
  body('emailNotifications').optional().isBoolean(),
];

export const deleteAccountValidator = [
  body('password').isString().notEmpty().withMessage('Password confirmation is required'),
];

export const updateRoleValidator = [
  body('role').isIn(ROLE_LIST).withMessage(`Role must be one of: ${ROLE_LIST.join(', ')}`),
];

export const updateStatusValidator = [
  body('isActive').isBoolean().withMessage('isActive must be true or false'),
];

export const updateCreditsValidator = [
  body('limit').isInt({ min: 0, max: 100000 }).withMessage('limit must be between 0 and 100000'),
];
