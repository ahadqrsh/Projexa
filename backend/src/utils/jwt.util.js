/**
 * JWT signing and verification.
 *
 * Access and refresh tokens use DIFFERENT secrets (enforced in config/env.js) and
 * carry a `type` claim that is checked on verification. Without both controls, an
 * access token could be presented at the refresh endpoint and silently upgraded
 * from a 15-minute credential to a 7-day one.
 */

import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import env from '../config/env.js';
import ApiError from './ApiError.js';

const TOKEN_TYPES = { ACCESS: 'access', REFRESH: 'refresh' };

export const signAccessToken = (user) =>
  jwt.sign(
    { sub: String(user._id), role: user.role, email: user.email, type: TOKEN_TYPES.ACCESS },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN, issuer: 'apm-api' }
  );

/**
 * `jti` matters more than it looks: without it, this payload is just
 * { sub, familyId, type } plus jsonwebtoken's automatic `iat` — which only
 * has SECOND granularity. Two refresh calls for the same session within the
 * same wall-clock second (trivial to trigger with a couple of quick page
 * reloads) then sign to the exact same JWT string, hash to the exact same
 * value, and the second INSERT hits RefreshToken's unique tokenHash index
 * and throws a 409. A random jti makes every issued token unique regardless
 * of timing, which is what actually fixes that 409 rather than just hiding it.
 */
export const signRefreshToken = (user, familyId) =>
  jwt.sign(
    { sub: String(user._id), familyId, jti: crypto.randomUUID(), type: TOKEN_TYPES.REFRESH },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN, issuer: 'apm-api' }
  );

const verify = (token, secret, expectedType) => {
  let payload;
  try {
    payload = jwt.verify(token, secret, { issuer: 'apm-api' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token has expired', [{ field: 'token', message: 'expired' }]);
    }
    throw ApiError.unauthorized('Invalid token', [{ field: 'token', message: 'invalid' }]);
  }
  if (payload.type !== expectedType) {
    throw ApiError.unauthorized(`Expected a ${expectedType} token`);
  }
  return payload;
};

export const verifyAccessToken = (token) => verify(token, env.JWT_ACCESS_SECRET, TOKEN_TYPES.ACCESS);
export const verifyRefreshToken = (token) =>
  verify(token, env.JWT_REFRESH_SECRET, TOKEN_TYPES.REFRESH);

/** Decode without verifying — only for reading metadata off an already-rejected token. */
export const decodeToken = (token) => jwt.decode(token);

/** "7d" | "15m" | "3600" -> milliseconds. Used to set cookie maxAge from the same source of truth. */
export const durationToMs = (duration) => {
  const match = /^(\d+)([smhd])?$/.exec(String(duration).trim());
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = match[2] ?? 's';
  const factor = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return value * factor;
};

export { TOKEN_TYPES };
