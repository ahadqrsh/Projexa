import ApiError from '../utils/ApiError.js';
import { userRepository } from '../repositories/user.repository.js';
import { refreshTokenRepository } from '../repositories/refreshToken.repository.js';
import { getStorage } from './storage/storageFactory.js';
import { parsePagination, parseSort } from '../utils/pagination.util.js';

/** Whitelist. Never spread req.body into an update — that is how a user grants themselves admin. */
const EDITABLE_PROFILE_FIELDS = [
  'name',
  'bio',
  'college',
  'branch',
  'graduationYear',
  'skills',
  'github',
  'linkedin',
];

export const getProfile = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('User');
  return user;
};

export const updateProfile = async (userId, payload) => {
  const update = {};
  for (const field of EDITABLE_PROFILE_FIELDS) {
    if (payload[field] !== undefined) update[field] = payload[field];
  }
  const user = await userRepository.updateById(userId, update);
  if (!user) throw ApiError.notFound('User');
  return user;
};

export const updatePreferences = async (userId, preferences) => {
  const update = {};
  if (preferences.theme !== undefined) update['preferences.theme'] = preferences.theme;
  if (preferences.emailNotifications !== undefined) {
    update['preferences.emailNotifications'] = preferences.emailNotifications;
  }
  return userRepository.updateById(userId, update);
};

export const updateAvatar = async (userId, file) => {
  if (!file) throw ApiError.badRequest('No image file was provided');

  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('User');

  const storage = getStorage();
  const uploaded = await storage.upload(file.buffer, {
    folder: 'avatars',
    publicId: `user_${userId}`,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  // Destroy the previous asset only after the new one is safely stored.
  if (user.avatar?.publicId && user.avatar.publicId !== uploaded.publicId) {
    await storage.destroy(user.avatar.publicId);
  }

  user.avatar = { url: uploaded.url, publicId: uploaded.publicId };
  await user.save({ validateBeforeSave: false });
  return user;
};

export const removeAvatar = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('User');

  if (user.avatar?.publicId) await getStorage().destroy(user.avatar.publicId);
  user.avatar = { url: null, publicId: null };
  await user.save({ validateBeforeSave: false });
  return user;
};

export const deleteAccount = async (userId, password) => {
  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) throw ApiError.notFound('User');
  if (!(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Password is incorrect', [
      { field: 'password', message: 'incorrect' },
    ]);
  }

  if (user.avatar?.publicId) await getStorage().destroy(user.avatar.publicId);
  await refreshTokenRepository.revokeAllForUser(userId);
  await userRepository.deleteById(userId);
};

/* ── Admin ─────────────────────────────────────────────────────────────── */

export const listUsers = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }

  return userRepository.paginate(filter, {
    page,
    limit,
    skip,
    sort: parseSort(query.sort ?? '-createdAt'),
    select: '-password',
  });
};

export const updateUserRole = async (targetUserId, role, actingUserId) => {
  if (String(targetUserId) === String(actingUserId)) {
    // Prevents an admin locking every admin out of the platform.
    throw ApiError.badRequest('You cannot change your own role');
  }
  const user = await userRepository.updateById(targetUserId, { role });
  if (!user) throw ApiError.notFound('User');
  await refreshTokenRepository.revokeAllForUser(targetUserId); // force new claims
  return user;
};

export const updateUserStatus = async (targetUserId, isActive, actingUserId) => {
  if (String(targetUserId) === String(actingUserId)) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }
  const user = await userRepository.updateById(targetUserId, { isActive });
  if (!user) throw ApiError.notFound('User');
  if (!isActive) await refreshTokenRepository.revokeAllForUser(targetUserId);
  return user;
};

export const updateUserCredits = async (targetUserId, limit) => {
  const user = await userRepository.updateById(targetUserId, { 'aiCredits.limit': limit });
  if (!user) throw ApiError.notFound('User');
  return user;
};

export default {
  getProfile,
  updateProfile,
  updatePreferences,
  updateAvatar,
  removeAvatar,
  deleteAccount,
  listUsers,
  updateUserRole,
  updateUserStatus,
  updateUserCredits,
};
