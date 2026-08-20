import { body, param } from 'express-validator';
import { DIAGRAM_TYPE_LIST, diagramTypeFromSlug } from '../../../shared/constants/artifactTypes.js';

/** Routes use kebab-case (erd, uml-class); storage uses SCREAMING_SNAKE. */
export const diagramTypeParam = param('type')
  .customSanitizer((value) => diagramTypeFromSlug(value) ?? String(value).toUpperCase())
  .isIn(DIAGRAM_TYPE_LIST)
  .withMessage(`Unknown diagram type. Must be one of: ${DIAGRAM_TYPE_LIST.join(', ')}`);

export const updateDiagramValidator = [
  diagramTypeParam,
  body('source').exists().withMessage('source is required').isString().isLength({ min: 1 }),
  body('title').optional().isString().isLength({ max: 80 }),
];
