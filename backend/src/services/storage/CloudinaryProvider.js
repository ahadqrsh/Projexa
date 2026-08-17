import { Readable } from 'node:stream';
import cloudinary from '../../config/cloudinary.js';
import env from '../../config/env.js';
import StorageProvider from './StorageProvider.js';
import ApiError from '../../utils/ApiError.js';
import logger from '../../config/logger.js';

class CloudinaryProvider extends StorageProvider {
  /**
   * Streams a buffer straight to Cloudinary.
   *
   * upload_stream (not upload) because we never write the file to disk — Render's
   * container filesystem is ephemeral, and a temp file that survives an upload
   * failure is a slow leak.
   */
  upload(buffer, { folder = '', publicId, resourceType = 'image', transformation } = {}) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: [env.CLOUDINARY_FOLDER, folder].filter(Boolean).join('/'),
          public_id: publicId,
          resource_type: resourceType,
          overwrite: true,
          transformation,
        },
        (error, result) => {
          if (error) {
            logger.error(`Cloudinary upload failed: ${error.message}`);
            // `cause` keeps Cloudinary's real reason (bad credentials, corrupt
            // image, rejected transformation, etc.) attached to the error object
            // for server-side logs/stack traces, without leaking it to the
            // client — the response body still gets the generic message below.
            return reject(
              ApiError.internal('File upload failed. Please try again.', { cause: error })
            );
          }
          return resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            sizeBytes: result.bytes,
          });
        }
      );

      Readable.from(buffer).pipe(stream);
    });
  }

  /**
   * Deleting the OLD asset is why every model stores `publicId` alongside `url`.
   * Without it, replacing an avatar ten times leaves ten orphaned files billing
   * against the free tier forever.
   */
  async destroy(publicId, { resourceType = 'image' } = {}) {
    if (!publicId) return { result: 'skipped' };
    try {
      return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
      // Never fail the user's request because cleanup of an old file failed.
      logger.warn(`Cloudinary destroy failed for ${publicId}: ${error.message}`);
      return { result: 'error' };
    }
  }
}

export default CloudinaryProvider;
export { CloudinaryProvider };
