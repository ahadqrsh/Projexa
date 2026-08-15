import BaseRepository from './base.repository.js';
import { User } from '../models/user.model.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  findByEmail(email, { withPassword = false } = {}) {
    const query = this.model.findOne({ email: String(email).toLowerCase().trim() });
    return withPassword ? query.select('+password') : query;
  }

  emailExists(email) {
    return this.model.exists({ email: String(email).toLowerCase().trim() });
  }

  /** Hashed-token lookups: the raw token never touches the database. */
  findByEmailVerificationToken(hashedToken) {
    return this.model
      .findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: new Date() },
      })
      .select('+emailVerificationToken +emailVerificationExpires');
  }

  findByPasswordResetToken(hashedToken) {
    return this.model
      .findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: new Date() } })
      .select('+passwordResetToken +passwordResetExpires +password');
  }

  findByIdWithPassword(id) {
    return this.model.findById(id).select('+password');
  }

  /** Atomic credit increment — avoids the read-modify-write race under concurrent generations. */
  incrementCredits(userId, amount = 1) {
    return this.model.findByIdAndUpdate(
      userId,
      { $inc: { 'aiCredits.used': amount } },
      { new: true }
    );
  }

  resetCreditsIfDue(userId) {
    return this.model.findOneAndUpdate(
      { _id: userId, 'aiCredits.resetAt': { $lte: new Date() } },
      [
        {
          $set: {
            'aiCredits.used': 0,
            'aiCredits.resetAt': {
              $dateAdd: { startDate: '$$NOW', unit: 'day', amount: 30 },
            },
          },
        },
      ],
      { new: true }
    );
  }

  touchLastLogin(userId) {
    return this.model.findByIdAndUpdate(userId, { lastLoginAt: new Date() }, { new: false });
  }
}

export const userRepository = new UserRepository();
export default userRepository;
