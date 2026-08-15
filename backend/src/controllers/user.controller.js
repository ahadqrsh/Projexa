import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as userService from '../services/user.service.js';
import { HTTP } from '../config/constants.js';

export const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  res.status(HTTP.OK).json(ApiResponse.ok({ user }, 'Profile fetched successfully'));
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  res.status(HTTP.OK).json(ApiResponse.ok({ user }, 'Profile updated successfully'));
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const user = await userService.updatePreferences(req.user._id, req.body);
  res.status(HTTP.OK).json(ApiResponse.ok({ user }, 'Preferences updated'));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const user = await userService.updateAvatar(req.user._id, req.file);
  res.status(HTTP.OK).json(ApiResponse.ok({ user }, 'Avatar updated successfully'));
});

export const removeAvatar = asyncHandler(async (req, res) => {
  const user = await userService.removeAvatar(req.user._id);
  res.status(HTTP.OK).json(ApiResponse.ok({ user }, 'Avatar removed'));
});

export const deleteMe = asyncHandler(async (req, res) => {
  await userService.deleteAccount(req.user._id, req.body.password);
  res.status(HTTP.NO_CONTENT).send();
});

/* ── Admin ─────────────────────────────────────────────────────────────── */

export const listUsers = asyncHandler(async (req, res) => {
  const { items, meta } = await userService.listUsers(req.query);
  res.status(HTTP.OK).json(ApiResponse.ok({ users: items }, 'Users fetched successfully', meta));
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.params.id);
  res.status(HTTP.OK).json(ApiResponse.ok({ user }, 'User fetched successfully'));
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await userService.updateUserRole(req.params.id, req.body.role, req.user._id);
  res.status(HTTP.OK).json(ApiResponse.ok({ user }, 'Role updated successfully'));
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await userService.updateUserStatus(req.params.id, req.body.isActive, req.user._id);
  res.status(HTTP.OK).json(ApiResponse.ok({ user }, 'Account status updated'));
});

export const updateUserCredits = asyncHandler(async (req, res) => {
  const user = await userService.updateUserCredits(req.params.id, req.body.limit);
  res.status(HTTP.OK).json(ApiResponse.ok({ user }, 'Credit limit updated'));
});
