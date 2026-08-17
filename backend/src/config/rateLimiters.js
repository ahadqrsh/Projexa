/**
 * Named rate limiters (Doc 04 section 1.5).
 *
 * Authenticated requests are keyed by user id rather than IP: a whole college
 * behind one NAT gateway would otherwise share a single bucket and lock each
 * other out.
 */

import rateLimit from 'express-rate-limit';
import env from './env.js';
import { HTTP } from './constants.js';

const minutes = (n) => n * 60 * 1000;

const keyByUserOrIp = (req) => req.user?.id ?? req.ip;

const handler = (message) => (req, res) => {
  res.status(HTTP.TOO_MANY_REQUESTS).json({
    success: false,
    statusCode: HTTP.TOO_MANY_REQUESTS,
    message,
    errors: [],
    requestId: req.id,
  });
};

const base = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.isTest, // limiters would make the integration suite flaky
};

// Cheap, idempotent, UI-driven reads whose call frequency the client controls,
// not the user — a generation job is polled every 2s for however long it runs.
// generationLimiter already deliberately excludes this route (see
// generation.routes.js); apiLimiter needs to make the same exception, or the
// app-wide 300-requests-per-15-minutes budget gets consumed by polling alone
// within a couple of minutes of one generation run, well before a real abuse
// pattern would ever trip it.
const isPollingRoute = (req) => /\/generate\/status\//.test(req.originalUrl ?? req.url ?? '');

export const apiLimiter = rateLimit({
  ...base,
  skip: (req) => env.isTest || isPollingRoute(req),
  windowMs: minutes(env.RATE_LIMIT_WINDOW_MINUTES),
  max: env.RATE_LIMIT_MAX_REQUESTS,
  keyGenerator: keyByUserOrIp,
  handler: handler('Too many requests. Please slow down and try again shortly.'),
});

export const authLimiter = rateLimit({
  ...base,
  // In production this is real brute-force protection. In local development
  // it just punishes the developer: a handful of typo'd passwords or a burst
  // of manual testing during one session reliably exhausts 10 attempts / 15
  // minutes, and the in-memory counter doesn't know the difference between
  // "attacker" and "student debugging their own login form" — so relax it
  // outside production rather than making every dev iterate around a 429.
  skip: () => env.isTest || !env.isProduction,
  windowMs: minutes(15),
  max: env.AUTH_RATE_LIMIT_MAX,
  skipSuccessfulRequests: true, // only failed attempts count — protects against brute force
  handler: handler('Too many authentication attempts. Try again in 15 minutes.'),
});

export const generationLimiter = rateLimit({
  ...base,
  windowMs: minutes(60),
  max: env.GENERATION_RATE_LIMIT_MAX,
  keyGenerator: keyByUserOrIp,
  handler: handler('Generation rate limit reached. Try again within the hour.'),
});

export const exportLimiter = rateLimit({
  ...base,
  windowMs: minutes(60),
  max: env.EXPORT_RATE_LIMIT_MAX,
  keyGenerator: keyByUserOrIp,
  handler: handler('Export rate limit reached. Try again within the hour.'),
});

export const uploadLimiter = rateLimit({
  ...base,
  windowMs: minutes(60),
  max: 30,
  keyGenerator: keyByUserOrIp,
  handler: handler('Upload rate limit reached. Try again within the hour.'),
});
