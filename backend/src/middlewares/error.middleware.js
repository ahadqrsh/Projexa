/**
 * THE centralised error handler.
 *
 * Every error in the application — thrown, rejected, or produced by a library —
 * converges here and leaves as one envelope shape. Controllers therefore contain
 * no try/catch, and the client parses exactly one error format.
 *
 * The core distinction is `isOperational`:
 *   operational  → a failure we chose to signal (404/422/403). Message is safe to show.
 *   programmer   → a bug (TypeError, null deref). Logged in full, genericised to 500.
 *                  Never leak stack traces, driver messages, or query shapes to clients.
 */

import mongoose from 'mongoose';
import multer from 'multer';
import ApiError from '../utils/ApiError.js';
import { HTTP } from '../config/constants.js';
import env from '../config/env.js';
import logger from '../config/logger.js';

/** 404 for unmatched routes. Mounted after all routers, before this handler. */
export const notFound = (req, _res, next) => {
  next(new ApiError(HTTP.NOT_FOUND, `Route ${req.method} ${req.originalUrl} does not exist`));
};

/** Translate third-party error shapes into our ApiError vocabulary. */
const normalise = (err) => {
  if (err instanceof ApiError) return err;

  // Mongoose: malformed ObjectId
  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for "${err.path}"`, [
      { field: err.path, message: `"${err.value}" is not a valid ${err.kind}` },
    ]);
  }

  // Mongoose: schema validation
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiError.unprocessable('Validation failed', errors);
  }

  // MongoDB: duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
    const friendly =
      field === 'email'
        ? 'An account with this email already exists'
        : `A record with this ${field} already exists`;
    return ApiError.conflict(friendly, [{ field, message: 'must be unique' }]);
  }

  // Mongoose: document not found on an orFail()
  if (err instanceof mongoose.Error.DocumentNotFoundError) {
    return ApiError.notFound('Resource');
  }

  // JWT
  if (err.name === 'JsonWebTokenError') return ApiError.unauthorized('Invalid token');
  if (err.name === 'TokenExpiredError') return ApiError.unauthorized('Token has expired');

  // Multer
  if (err instanceof multer.MulterError) {
    return err.code === 'LIMIT_FILE_SIZE'
      ? new ApiError(HTTP.PAYLOAD_TOO_LARGE, 'File is too large')
      : ApiError.badRequest(`Upload failed: ${err.message}`);
  }

  // Body parser
  if (err.type === 'entity.parse.failed') {
    return ApiError.badRequest('Request body is not valid JSON');
  }
  if (err.type === 'entity.too.large') {
    return new ApiError(HTTP.PAYLOAD_TOO_LARGE, 'Request body is too large');
  }

  // MongoDB driver unreachable
  if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
    return ApiError.serviceUnavailable('Database is temporarily unavailable');
  }

  // Anything left is a bug.
  return new ApiError(
    err.statusCode ?? HTTP.INTERNAL_SERVER_ERROR,
    err.message ?? 'Something went wrong',
    [],
    { isOperational: false, cause: err }
  );
};

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity (4 args)
export const errorHandler = (err, req, res, _next) => {
  const error = normalise(err);

  const logMeta = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    statusCode: error.statusCode,
    userId: req.user?._id ? String(req.user._id) : undefined,
  };

  if (!error.isOperational || error.statusCode >= 500) {
    logger.error(error.message, { ...logMeta, stack: error.stack, cause: err?.message });
  } else if (error.statusCode >= 400) {
    logger.warn(`${error.statusCode} ${error.message}`, logMeta);
  }

  const clientMessage =
    !error.isOperational && env.isProduction
      ? 'Something went wrong on our end. Please try again.'
      : error.message;

  const body = {
    success: false,
    statusCode: error.statusCode,
    message: clientMessage,
    errors: error.errors ?? [],
    requestId: req.id,
  };

  if (!env.isProduction && error.stack) body.stack = error.stack;

  res.status(error.statusCode).json(body);
};

export default errorHandler;
