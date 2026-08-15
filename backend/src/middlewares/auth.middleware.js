import { verifyAccessToken } from '../utils/jwt.util.js';
import { userRepository } from '../repositories/user.repository.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const extractToken = (req) => {
  const header = req.get('Authorization') ?? '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
};

/**
 * Verifies the access token and attaches the live user document.
 *
 * We re-load the user on every request rather than trusting the token payload,
 * because a token minted 14 minutes ago may belong to an account that has since
 * been deactivated, deleted, or had its role changed. Trusting the payload would
 * leave a deactivated user fully operational until their token expired.
 */
export const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authentication required. Please sign in.');

  const payload = verifyAccessToken(token);

  const user = await userRepository.findById(payload.sub).select('+passwordChangedAt');
  if (!user) throw ApiError.unauthorized('The account for this token no longer exists.');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated.');
  if (user.changedPasswordAfter(payload.iat)) {
    throw ApiError.unauthorized('Password was changed recently. Please sign in again.');
  }

  req.user = user;
  req.tokenPayload = payload;
  return next();
});

/** Attaches req.user when a valid token is present, but never rejects. For public pages. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await userRepository.findById(payload.sub);
    if (user?.isActive) req.user = user;
  } catch {
    // Deliberately swallowed: an invalid token on a public route is simply anonymous.
  }
  return next();
});

export default protect;
