import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import env from '../config/env.js';
import { ROLE_LIST, ROLES } from '../../../shared/constants/roles.js';
import { createHashedToken, sha256 } from '../utils/hash.util.js';

const { Schema, model } = mongoose;

const assetSchema = new Schema(
  {
    url: { type: String, default: null },
    publicId: { type: String, default: null },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never leaks through a plain find()
    },
    role: { type: String, enum: ROLE_LIST, default: ROLES.STUDENT, index: true },

    avatar: { type: assetSchema, default: () => ({}) },
    bio: { type: String, maxlength: 500, default: '' },
    college: { type: String, maxlength: 120, default: '' },
    branch: { type: String, maxlength: 80, default: '' },
    graduationYear: { type: Number, min: 2000, max: 2100 },
    skills: {
      type: [String],
      default: [],
      validate: [(v) => v.length <= 20, 'You can list at most 20 skills'],
    },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },

    aiCredits: {
      used: { type: Number, default: 0, min: 0 },
      limit: { type: Number, default: () => env.DEFAULT_AI_CREDITS, min: 0 },
      resetAt: {
        type: Date,
        default: () => new Date(Date.now() + env.CREDIT_RESET_DAYS * 86_400_000),
      },
    },

    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },

    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },

    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      emailNotifications: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_doc, ret) => {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.passwordChangedAt;
      delete ret.__v;
      return ret;
    } },
    toObject: { virtuals: true },
  }
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ emailVerificationToken: 1 }, { sparse: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });

userSchema.virtual('initials').get(function initials() {
  return this.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
});

userSchema.virtual('creditsRemaining').get(function remaining() {
  return Math.max(this.aiCredits.limit - this.aiCredits.used, 0);
});

/**
 * Hashing lives in a pre-save hook rather than in the service so it CANNOT be
 * bypassed. Any code path that saves a user — seeds, admin tools, a future
 * import script — gets hashing for free.
 */
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, env.BCRYPT_SALT_ROUNDS);
  if (!this.isNew) {
    // Backdated 1s so a token issued in the same second is not falsely invalidated.
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** Any JWT issued before the last password change is treated as revoked. */
userSchema.methods.changedPasswordAfter = function changedPasswordAfter(jwtIssuedAtSeconds) {
  if (!this.passwordChangedAt) return false;
  return Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtIssuedAtSeconds;
};

userSchema.methods.createEmailVerificationToken = function createEmailVerificationToken() {
  const { raw, hashed } = createHashedToken();
  this.emailVerificationToken = hashed;
  this.emailVerificationExpires = new Date(
    Date.now() + env.EMAIL_VERIFICATION_EXPIRES_HOURS * 3_600_000
  );
  return raw;
};

userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const { raw, hashed } = createHashedToken();
  this.passwordResetToken = hashed;
  this.passwordResetExpires = new Date(
    Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * 60_000
  );
  return raw;
};

userSchema.methods.hasCreditsRemaining = function hasCreditsRemaining(cost = 1) {
  return this.aiCredits.used + cost <= this.aiCredits.limit;
};

userSchema.statics.hashToken = sha256;

export const User = model('User', userSchema);
export default User;
