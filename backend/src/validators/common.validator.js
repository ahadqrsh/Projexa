import { param, query } from 'express-validator';

export const mongoIdParam = (name = 'id') =>
  param(name).isMongoId().withMessage(`${name} must be a valid id`);

export const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
  query('sort').optional().isString().trim(),
  query('search').optional().isString().trim().isLength({ max: 120 }),
];
