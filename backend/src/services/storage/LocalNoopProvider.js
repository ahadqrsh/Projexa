import StorageProvider from './StorageProvider.js';
import logger from '../../config/logger.js';

/**
 * Used when Cloudinary credentials are absent (fresh clone, CI, offline demo).
 *
 * Returns a deterministic placeholder URL so the whole upload code path stays
 * exercisable without credentials. This is why `npm run seed && npm run dev`
 * works on a machine that has never seen a Cloudinary account.
 */
class LocalNoopProvider extends StorageProvider {
  async upload(buffer, { folder = '', publicId } = {}) {
    const id = publicId ?? `local_${Date.now()}`;
    logger.warn(`Storage disabled — returning placeholder for "${folder}/${id}"`);
    return {
      url: `https://placehold.co/512x512/4F46E5/FFFFFF/png?text=${encodeURIComponent('APM')}`,
      publicId: `local/${folder}/${id}`,
      format: 'png',
      width: 512,
      height: 512,
      sizeBytes: buffer?.length ?? 0,
    };
  }

  async destroy() {
    return { result: 'ok' };
  }
}

export default LocalNoopProvider;
export { LocalNoopProvider };
