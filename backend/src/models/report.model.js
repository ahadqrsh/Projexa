import mongoose from 'mongoose';
import env from '../config/env.js';
import { REPORT_STATUS } from '../../../shared/constants/statuses.js';

const { Schema, model } = mongoose;

const reportSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    format: { type: String, enum: ['pdf', 'docx'], required: true },
    sections: { type: [String], default: [] },

    options: {
      includeDiagrams: { type: Boolean, default: true },
      includeCoverPage: { type: Boolean, default: true },
      collegeName: String,
      studentNames: [String],
      guideName: String,
      submissionDate: Date,
    },

    file: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      sizeBytes: Number,
      pageCount: Number,
    },

    status: { type: String, enum: Object.values(REPORT_STATUS), default: REPORT_STATUS.QUEUED },
    error: { message: String, occurredAt: Date },
    downloadCount: { type: Number, default: 0 },

    /**
     * TTL. Exported PDFs are large and always regenerable from artifacts, so we let
     * Mongo expire them automatically instead of writing cleanup code.
     */
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + env.REPORT_TTL_DAYS * 86_400_000),
    },
  },
  { timestamps: true, toJSON: { transform: (_d, r) => { delete r.__v; return r; } } }
);

reportSchema.index({ project: 1, createdAt: -1 });
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Report = model('Report', reportSchema);
export default Report;
