import { body, param } from 'express-validator';

/**
 * Password policy.
 * Length is the dominant factor in resistance to offline cracking, so we require
 * 8+ with mixed character classes rather than an elaborate rule nobody can satisfy.
 */
const password = (field = 'password') =>
  body(field)
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain a number');

export const registerValidator = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  password('password'),
  body('role')
    .optional()
    .isIn(['student', 'mentor'])
    .withMessage('Role must be either student or mentor'),
];

export const loginValidator = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

export const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
];

export const resetPasswordValidator = [
  param('token').isString().isLength({ min: 32 }).withMessage('Invalid reset token'),
  password('password'),
];

export const changePasswordValidator = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  password('newPassword'),
];

export const verifyEmailValidator = [
  param('token').isString().isLength({ min: 32 }).withMessage('Invalid verification token'),
];
