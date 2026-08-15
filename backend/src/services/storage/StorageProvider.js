/**
 * Storage abstraction (Dependency Inversion).
 *
 * Services depend on THIS, never on the Cloudinary SDK. Swapping to S3 or local
 * disk means writing one new subclass — no service file changes.
 */
class StorageProvider {
  // eslint-disable-next-line no-unused-vars
  async upload(buffer, options = {}) {
    throw new Error('StorageProvider.upload() must be implemented by a subclass');
  }

  // eslint-disable-next-line no-unused-vars
  async destroy(publicId, options = {}) {
    throw new Error('StorageProvider.destroy() must be implemented by a subclass');
  }

  get name() {
    return this.constructor.name;
  }
}

export default StorageProvider;
export { StorageProvider };
