import BaseRepository from './base.repository.js';
import { RefreshToken } from '../models/refreshToken.model.js';

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super(RefreshToken);
  }

  findByHash(tokenHash) {
    return this.model.findOne({ tokenHash });
  }

  findActiveForUser(userId) {
    return this.model
      .find({ user: userId, isRevoked: false, expiresAt: { $gt: new Date() } })
      .select('familyId userAgent ipAddress createdAt lastUsedAt expiresAt')
      .sort({ createdAt: -1 })
      .lean();
  }

  revokeByHash(tokenHash, replacedByTokenHash = null) {
    return this.model.findOneAndUpdate(
      { tokenHash },
      { isRevoked: true, revokedAt: new Date(), replacedByTokenHash },
      { new: true }
    );
  }

  /** Reuse detected — burn the whole rotation chain. */
  revokeFamily(familyId) {
    return this.model.updateMany(
      { familyId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  }

  revokeAllForUser(userId) {
    return this.model.updateMany(
      { user: userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
export default refreshTokenRepository;
