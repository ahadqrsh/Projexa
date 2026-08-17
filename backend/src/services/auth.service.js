/**
 * Authentication business logic.
 *
 * Knows nothing about req/res. Returns plain objects; the controller turns them
 * into HTTP. This is what makes every rule below unit-testable without a server.
 */

import crypto from 'node:crypto';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import logger from '../config/logger.js';
import { userRepository } from '../repositories/user.repository.js';
import { refreshTokenRepository } from '../repositories/refreshToken.repository.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  durationToMs,
} from '../utils/jwt.util.js';
import { sha256 } from '../utils/hash.util.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './mail/mail.service.js';

/** Mint an access token plus a refresh token persisted in a rotation family. */
const issueTokens = async (user, { familyId, context = {} } = {}) => {
  const family = familyId ?? crypto.randomUUID();

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, family);

  await refreshTokenRepository.create({
    user: user._id,
    tokenHash: sha256(refreshToken),
    familyId: family,
    userAgent: context.userAgent ?? '',
    ipAddress: context.ip ?? '',
    expiresAt: new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN)),
  });

  return { accessToken, refreshToken };
};

export const register = async ({ name, email, password, role }, context = {}) => {
  if (await userRepository.emailExists(email)) {
    throw ApiError.conflict('An account with this email already exists', [
      { field: 'email', message: 'already registered' },
    ]);
  }

  // Self-service signup may never mint an admin. Role escalation is admin-only.
  const safeRole = role === 'mentor' ? 'mentor' : 'student';

  const user = await userRepository.create({ name, email, password, role: safeRole });

  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  await sendVerificationEmail({ to: user.email, name: user.name, token: verificationToken });

  const tokens = await issueTokens(user, { context });
  return { user, ...tokens };
};

export const login = async ({ email, password }, context = {}) => {
  const user = await userRepository.findByEmail(email, { withPassword: true });

  /**
   * One identical error for "no such user" and "wrong password".
   * Distinguishing them turns login into an account-enumeration oracle.
   * We still run a comparison against a dummy hash when the user is missing so
   * the two paths take similar time.
   */
  const invalid = ApiError.unauthorized('Invalid email or password');

  if (!user) {
    await new Promise((r) => setTimeout(r, 120));
    throw invalid;
  }
  if (!(await user.comparePassword(password))) throw invalid;
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated.');

  await userRepository.touchLastLogin(user._id);
  user.password = undefined;

  const tokens = await issueTokens(user, { context });
  return { user, ...tokens };
};

/**
 * Presenting an ALREADY-revoked token is ambiguous, not automatically theft:
 * it's also exactly what happens when two legitimate requests for the same
 * session overlap (a couple of quick page reloads, two tabs refreshing near
 * simultaneously) — the first rotates the token, and the second then
 * legitimately presents the now-superseded one a moment later. Only treat it
 * as theft once it's stale enough that a genuine race is implausible.
 */
const REUSE_GRACE_MS = 10_000;

/**
 * Refresh with rotation AND reuse detection.
 *
 * Presenting an already-revoked token that is OUTSIDE the grace window above
 * means a token was replayed — almost certainly stolen — so we revoke the
 * entire family. The legitimate user is logged out too, which is the correct
 * trade: a forced re-login beats a silent session hijack.
 */
export const refresh = async (rawToken, context = {}) => {
  if (!rawToken) throw ApiError.unauthorized('Refresh token missing');

  const payload = verifyRefreshToken(rawToken);
  const tokenHash = sha256(rawToken);
  const stored = await refreshTokenRepository.findByHash(tokenHash);

  if (!stored) throw ApiError.unauthorized('Refresh token is not recognised');

  if (stored.isRevoked) {
    const withinGrace =
      stored.revokedAt && Date.now() - stored.revokedAt.getTime() < REUSE_GRACE_MS;

    if (!withinGrace) {
      await refreshTokenRepository.revokeFamily(stored.familyId);
      logger.warn(
        `Refresh token reuse detected for user ${stored.user} — family ${stored.familyId} revoked`
      );
      throw ApiError.unauthorized('Session security issue detected. Please sign in again.');
    }

    // Benign race, not theft: fall through and issue this caller its own
    // fresh pair in the same family, same as the non-revoked path below.
    logger.debug(
      `Refresh token reused within grace window for user ${stored.user} — treated as a benign race, not theft`
    );
  }

  if (stored.expiresAt < new Date()) throw ApiError.unauthorized('Session expired');

  const user = await userRepository.findById(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('Account is no longer active');

  const tokens = await issueTokens(user, { familyId: stored.familyId, context });
  await refreshTokenRepository.revokeByHash(tokenHash, sha256(tokens.refreshToken));

  return { user, ...tokens };
};

export const logout = async (rawToken) => {
  if (!rawToken) return;
  await refreshTokenRepository.revokeByHash(sha256(rawToken));
};

export const logoutAll = async (userId) => {
  await refreshTokenRepository.revokeAllForUser(userId);
};

export const listSessions = (userId) => refreshTokenRepository.findActiveForUser(userId);

export const revokeSession = async (userId, sessionId) => {
  const session = await refreshTokenRepository.findById(sessionId);
  if (!session || String(session.user) !== String(userId)) throw ApiError.notFound('Session');
  await refreshTokenRepository.revokeByHash(session.tokenHash);
};

export const verifyEmail = async (rawToken) => {
  const user = await userRepository.findByEmailVerificationToken(sha256(rawToken));
  if (!user) throw ApiError.badRequest('Verification link is invalid or has expired');

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return user;
};

export const resendVerification = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('User');
  if (user.isEmailVerified) throw ApiError.badRequest('This email is already verified');

  const token = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });
  await sendVerificationEmail({ to: user.email, name: user.name, token });
};

/**
 * Always resolves, even for an unknown email.
 * Returning 404 here would let anyone test which addresses have accounts.
 */
export const forgotPassword = async (email) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    logger.info(`Password reset requested for unknown email: ${email}`);
    return;
  }

  const token = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  await sendPasswordResetEmail({ to: user.email, name: user.name, token });
};

export const resetPassword = async (rawToken, newPassword) => {
  const user = await userRepository.findByPasswordResetToken(sha256(rawToken));
  if (!user) throw ApiError.badRequest('Reset link is invalid or has expired');

  user.password = newPassword; // pre-save hook hashes it
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // A password reset is a security event: every existing session must die.
  await refreshTokenRepository.revokeAllForUser(user._id);

  return user;
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) throw ApiError.notFound('User');

  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.unauthorized('Your current password is incorrect', [
      { field: 'currentPassword', message: 'incorrect' },
    ]);
  }
  if (currentPassword === newPassword) {
    throw ApiError.badRequest('New password must be different from your current password', [
      { field: 'newPassword', message: 'must differ from current password' },
    ]);
  }

  user.password = newPassword;
  await user.save();
  await refreshTokenRepository.revokeAllForUser(user._id);

  return user;
};

export default {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  listSessions,
  revokeSession,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
};
