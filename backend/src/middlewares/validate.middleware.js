import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/**
 * Runs a validator chain and converts failures into a single 422 with a
 * field-keyed errors array — the exact shape the client's form layer expects.
 *
 * Validation happens ONLY here, at the boundary. Services assume valid input.
 */
export const validate = (chains = []) => [
  ...chains,
  (req, _res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const seen = new Set();
    const errors = result
      .array()
      .map((e) => ({ field: e.path ?? e.param ?? 'unknown', message: e.msg }))
      // One message per field: showing three errors under one input is noise.
      .filter((e) => (seen.has(e.field) ? false : seen.add(e.field)));

    return next(ApiError.unprocessable('Validation failed', errors));
  },
];

export default validate;
