import { body, param } from 'express-validator';
import { ARTIFACT_TYPE_LIST, artifactTypeFromSlug } from '../../../shared/constants/artifactTypes.js';

export const generateValidator = [
  body('modules')
    .isArray({ min: 1, max: ARTIFACT_TYPE_LIST.length })
    .withMessage('Provide at least one module to generate'),
  body('modules.*')
    .isIn(ARTIFACT_TYPE_LIST)
    .withMessage(`Each module must be one of: ${ARTIFACT_TYPE_LIST.join(', ')}`),
  body('force').optional().isBoolean(),
];

/** Routes use kebab-case; storage uses SCREAMING_SNAKE. Normalise once, here. */
export const artifactTypeParam = param('type')
  .customSanitizer((value) => artifactTypeFromSlug(value) ?? String(value).toUpperCase())
  .isIn(ARTIFACT_TYPE_LIST)
  .withMessage('Unknown module type');

export const updateArtifactValidator = [
  artifactTypeParam,
  body('content').exists().withMessage('content is required').isObject(),
];
