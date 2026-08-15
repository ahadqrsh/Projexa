/**
 * CORS whitelist.
 *
 * `credentials: true` is mandatory — the refresh token lives in an httpOnly cookie,
 * and browsers will not send it cross-origin without this. That in turn forbids
 * `origin: '*'`, so we whitelist explicitly from CORS_ORIGINS.
 */

import env from './env.js';
import ApiError from '../utils/ApiError.js';
import { HTTP } from './constants.js';

const whitelist = new Set([...env.CORS_ORIGINS, env.CLIENT_URL].filter(Boolean));

export const corsOptions = {
  origin(origin, callback) {
    // Same-origin requests, curl and server-to-server calls send no Origin header.
    if (!origin) return callback(null, true);
    if (whitelist.has(origin)) return callback(null, true);
    return callback(new ApiError(HTTP.FORBIDDEN, `Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 86400,
};

export default corsOptions;
