import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../../../shared/constants/statuses.js';

const { Schema, model } = mongoose;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, maxlength: 160 },
    message: { type: String, required: true, maxlength: 500 },
    link: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },

    isRead: { type: Boolean, default: false },
    readAt: Date,

    expiresAt: { type: Date, default: () => new Date(Date.now() + 60 * 86_400_000) },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: { transform: (_d, r) => { delete r.__v; return r; } } }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notification = model('Notification', notificationSchema);
export default Notification;
