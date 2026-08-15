import multer from 'multer';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { HTTP } from '../config/constants.js';

/**
 * memoryStorage ONLY.
 *
 * Render's filesystem is ephemeral and read-only in places; writing uploads to disk
 * would either vanish on redeploy or fill the container. Files stay as buffers and
 * are streamed straight to Cloudinary.
 */
const storage = multer.memoryStorage();

const imageFilter = (_req, file, cb) => {
  if (env.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
  return cb(
    new ApiError(
      HTTP.UNSUPPORTED_MEDIA_TYPE,
      `Unsupported file type "${file.mimetype}". Allowed: ${env.ALLOWED_IMAGE_TYPES.join(', ')}`
    )
  );
};

const build = (sizeMb) =>
  multer({ storage, fileFilter: imageFilter, limits: { fileSize: sizeMb * 1024 * 1024, files: 1 } });

export const uploadAvatar = build(env.MAX_AVATAR_SIZE_MB).single('avatar');
export const uploadCover = build(env.MAX_COVER_SIZE_MB).single('coverImage');

/** Translates Multer's own errors into our envelope; mounted right after the parsers. */
export const handleUploadErrors = (err, _req, _res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(HTTP.PAYLOAD_TOO_LARGE, 'File is too large.'));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(ApiError.badRequest(`Unexpected file field "${err.field}".`));
    }
    return next(ApiError.badRequest(`Upload failed: ${err.message}`));
  }
  return next(err);
};
