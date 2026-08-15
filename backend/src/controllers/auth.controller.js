/**
 * Controllers are deliberately thin: read the request, call ONE service method,
 * shape the response. No branching business rules, no database calls, no try/catch.
 */

import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as authService from '../services/auth.service.js';
import env from '../config/env.js';
import { COOKIE_NAMES, HTTP } from '../config/constants.js';
import { durationToMs } from '../utils/jwt.util.js';

/**
 * Refresh-token cookie options.
 *
 * httpOnly  — JavaScript cannot read it, so XSS cannot steal the long-lived credential.
 * secure    — HTTPS only in production.
 * sameSite  — 'none' in production because Vercel (client) and Render (API) are
 *             different sites and the cookie must survive a cross-site request.
 *             'lax' locally, where both run on localhost.
 */
const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'lax',
  maxAge: durationToMs(env.JWT_REFRESH_EXPIRES_IN),
  path: '/api/v1/auth',
});

const requestContext = (req) => ({ userAgent: req.get('User-Agent') ?? '', ip: req.ip });

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(
    req.body,
    requestContext(req)
  );

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, refreshCookieOptions());
  res
    .status(HTTP.CREATED)
    .json(
      ApiResponse.created(
        { user, accessToken },
        'Account created. Check your email to verify your address.'
      )
    );
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(
    req.body,
    requestContext(req)
  );

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, refreshCookieOptions());
  res.status(HTTP.OK).json(ApiResponse.ok({ user, accessToken }, 'Signed in successfully'));
});

export const refresh = asyncHandler(async (req, res) => {
  const incoming = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] ?? req.body?.refreshToken;
  const { user, accessToken, refreshToken } = await authService.refresh(
    incoming,
    requestContext(req)
  );

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, refreshCookieOptions());
  res.status(HTTP.OK).json(ApiResponse.ok({ user, accessToken }, 'Session refreshed'));
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN]);
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { ...refreshCookieOptions(), maxAge: undefined });
  res.status(HTTP.NO_CONTENT).send();
});

export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user._id);
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { ...refreshCookieOptions(), maxAge: undefined });
  res.status(HTTP.NO_CONTENT).send();
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.params.token);
  res.status(HTTP.OK).json(ApiResponse.ok({ user }, 'Email verified successfully'));
});

export const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.user._id);
  res.status(HTTP.OK).json(ApiResponse.ok(null, 'Verification email sent'));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  // Identical response whether or not the account exists — no enumeration oracle.
  res
    .status(HTTP.OK)
    .json(
      ApiResponse.ok(null, 'If an account exists for that email, a reset link has been sent.')
    );
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  res
    .status(HTTP.OK)
    .json(ApiResponse.ok(null, 'Password reset successfully. Please sign in with your new password.'));
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user._id, req.body);
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { ...refreshCookieOptions(), maxAge: undefined });
  res
    .status(HTTP.OK)
    .json(ApiResponse.ok(null, 'Password changed. All other sessions have been signed out.'));
});

export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.listSessions(req.user._id);
  res.status(HTTP.OK).json(ApiResponse.ok({ sessions }, 'Active sessions fetched'));
});

export const revokeSession = asyncHandler(async (req, res) => {
  await authService.revokeSession(req.user._id, req.params.id);
  res.status(HTTP.NO_CONTENT).send();
});
