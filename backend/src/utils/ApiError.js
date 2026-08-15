/**
 * The only error type services are allowed to throw.
 *
 * `isOperational` separates "expected failure we chose to signal" (404, 422, 403)
 * from "a bug" (TypeError, null deref). Operational errors are returned to the
 * client verbatim; everything else is logged and genericised to a 500 so internal
 * details never leak.
 */

import { HTTP } from '../config/constants.js';

class ApiError extends Error {
  constructor(statusCode, message, errors = [], options = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = options.isOperational ?? true;
    this.code = options.code;
    if (options.cause) this.cause = options.cause;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errors = []) {
    return new ApiError(HTTP.BAD_REQUEST, message, errors);
  }

  static unauthorized(message = 'Authentication required', errors = []) {
    return new ApiError(HTTP.UNAUTHORIZED, message, errors);
  }

  static forbidden(message = 'You do not have permission to perform this action', errors = []) {
    return new ApiError(HTTP.FORBIDDEN, message, errors);
  }

  static notFound(resource = 'Resource') {
    return new ApiError(HTTP.NOT_FOUND, `${resource} not found`);
  }

  static conflict(message = 'Resource already exists', errors = []) {
    return new ApiError(HTTP.CONFLICT, message, errors);
  }

  static unprocessable(message = 'Validation failed', errors = []) {
    return new ApiError(HTTP.UNPROCESSABLE_ENTITY, message, errors);
  }

  static tooManyRequests(message = 'Too many requests', errors = []) {
    return new ApiError(HTTP.TOO_MANY_REQUESTS, message, errors);
  }

  static internal(message = 'Something went wrong', options = {}) {
    return new ApiError(HTTP.INTERNAL_SERVER_ERROR, message, [], {
      isOperational: false,
      ...options,
    });
  }

  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new ApiError(HTTP.SERVICE_UNAVAILABLE, message);
  }
}

export default ApiError;
export { ApiError };
