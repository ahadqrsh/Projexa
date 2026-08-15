/**
 * Cloudinary SDK configuration.
 * Configured once at import; the CloudinaryProvider is the only consumer.
 */

import { v2 as cloudinary } from 'cloudinary';
import env from './env.js';
import logger from './logger.js';

if (env.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  logger.info('Cloudinary configured');
} else {
  logger.warn('Cloudinary credentials absent — uploads will use the local no-op provider');
}

export { cloudinary };
export default cloudinary;
