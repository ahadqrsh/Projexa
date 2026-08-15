import mongoose from 'mongoose';
import { ARTIFACT_TYPE_LIST } from '../../../shared/constants/artifactTypes.js';
import { GENERATION_STATUS } from '../../../shared/constants/statuses.js';
import { MAX_ARTIFACT_VERSIONS } from '../config/constants.js';

const { Schema, model } = mongoose;

const artifactSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    type: { type: String, enum: ARTIFACT_TYPE_LIST, required: true },

    /**
     * Deliberately Mixed. The 16 artifact types have mutually exclusive shapes and
     * Mongoose cannot express "exactly one of these". Validation happens at the
     * application boundary via each generator's Zod outputSchema, which is stricter
     * than Mongoose would be and produces far better error messages.
     */
    content: { type: Schema.Types.Mixed, default: null },

    status: {
      type: String,
      enum: Object.values(GENERATION_STATUS),
      default: GENERATION_STATUS.QUEUED,
    },
    version: { type: Number, default: 1, min: 1 },
    previousVersions: {
      type: [
        new Schema(
          {
            version: Number,
            content: Schema.Types.Mixed,
            generatedAt: Date,
          },
          { _id: false }
        ),
      ],
      default: [],
    },

    isStale: { type: Boolean, default: false },
    isManuallyEdited: { type: Boolean, default: false },

    promptVersion: { type: String },
    model: { type: String },
    provider: { type: String },

    generationMeta: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      latencyMs: { type: Number, default: 0 },
      attempts: { type: Number, default: 0 },
    },

    error: {
      message: String,
      code: String,
      occurredAt: Date,
    },

    jobId: { type: String, index: true },
    generatedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { transform: (_d, ret) => { delete ret.__v; return ret; } },
  }
);

/** One live artifact per type per project — enforced by the database, not by hope. */
artifactSchema.index({ project: 1, type: 1 }, { unique: true });
artifactSchema.index({ project: 1, status: 1 });
artifactSchema.index({ status: 1, updatedAt: 1 }); // stuck-job reconciliation sweep

/** Push the current content into history, capped, then bump the version. */
artifactSchema.methods.archiveCurrentVersion = function archiveCurrentVersion() {
  if (!this.content) return;
  this.previousVersions.unshift({
    version: this.version,
    content: this.content,
    generatedAt: this.generatedAt ?? this.updatedAt,
  });
  this.previousVersions = this.previousVersions.slice(0, MAX_ARTIFACT_VERSIONS);
};

export const Artifact = model('Artifact', artifactSchema);
export default Artifact;
