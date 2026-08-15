import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Refresh token rotation with reuse detection.
 *
 * We store only the SHA-256 hash. Every refresh revokes the presented token and
 * issues a successor in the same `familyId`. If an ALREADY-REVOKED token is
 * presented, that means a token was replayed — almost certainly stolen — so the
 * entire family is revoked and the user must log in again.
 */
const refreshTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },

    userAgent: { type: String, default: '' },
    ipAddress: { type: String, default: '' },

    isRevoked: { type: Boolean, default: false },
    revokedAt: { type: Date },
    replacedByTokenHash: { type: String },

    expiresAt: { type: Date, required: true },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

refreshTokenSchema.index({ user: 1, isRevoked: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model('RefreshToken', refreshTokenSchema);
export default RefreshToken;
