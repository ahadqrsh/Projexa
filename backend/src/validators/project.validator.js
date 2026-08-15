import { body, query } from 'express-validator';
import { DOMAINS, DIFFICULTIES, PROJECT_TYPES } from '../../../shared/constants/domains.js';
import { PROJECT_STATUS, PROJECT_VISIBILITY } from '../../../shared/constants/statuses.js';
import { ARTIFACT_TYPE_LIST } from '../../../shared/constants/artifactTypes.js';

export const createProjectValidator = [
  body('title').trim().isLength({ min: 5, max: 120 }).withMessage('Title must be 5–120 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be 20–2000 characters — the AI needs detail to work with'),
  body('domain').isIn(DOMAINS).withMessage(`Domain must be one of: ${DOMAINS.join(', ')}`),
  body('difficulty')
    .isIn(DIFFICULTIES)
    .withMessage(`Difficulty must be one of: ${DIFFICULTIES.join(', ')}`),
  body('teamSize').optional().isInt({ min: 1, max: 20 }).withMessage('Team size must be 1–20'),
  body('preferredTech').optional().isArray({ max: 25 }),
  body('preferredTech.*').optional().isString().trim().isLength({ max: 40 }),
  body('deadline')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Deadline must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) throw new Error('Deadline must be in the future');
      return true;
    }),
  body('aiIntegrationRequired').optional().isBoolean(),
  body('projectType').optional().isIn(PROJECT_TYPES),
  body('tags').optional().isArray({ max: 15 }),
  body('tags.*').optional().isString().trim().isLength({ max: 30 }),
];

/** Update: same rules, all optional. Deadline may be in the past on an existing project. */
export const updateProjectValidator = [
  body('title').optional().trim().isLength({ min: 5, max: 120 }),
  body('description').optional().trim().isLength({ min: 20, max: 2000 }),
  body('domain').optional().isIn(DOMAINS),
  body('difficulty').optional().isIn(DIFFICULTIES),
  body('teamSize').optional().isInt({ min: 1, max: 20 }),
  body('preferredTech').optional().isArray({ max: 25 }),
  body('deadline').optional({ values: 'falsy' }).isISO8601(),
  body('aiIntegrationRequired').optional().isBoolean(),
  body('projectType').optional().isIn(PROJECT_TYPES),
  body('tags').optional().isArray({ max: 15 }),
];

export const updateVisibilityValidator = [
  body('visibility')
    .isIn(Object.values(PROJECT_VISIBILITY))
    .withMessage('Visibility must be private, unlisted or public'),
];

export const updateStatusValidator = [
  body('status').isIn(Object.values(PROJECT_STATUS)).withMessage('Invalid project status'),
];

export const addMentorValidator = [
  body('email').trim().isEmail().withMessage('Provide a valid mentor email').normalizeEmail(),
];

export const exportProjectValidator = [
  query('format').optional().isIn(['pdf', 'docx', 'md']).withMessage('format must be pdf, docx or md'),
  query('modules')
    .optional()
    .custom((value) => {
      const types = String(value).split(',').map((s) => s.trim().toUpperCase());
      const invalid = types.filter((t) => !ARTIFACT_TYPE_LIST.includes(t));
      if (invalid.length) throw new Error(`Unknown module type(s): ${invalid.join(', ')}`);
      return true;
    }),
];

export const listProjectsValidator = [
  query('status').optional().isIn(Object.values(PROJECT_STATUS)),
  query('domain').optional().isIn(DOMAINS),
  query('difficulty').optional().isIn(DIFFICULTIES),
];
