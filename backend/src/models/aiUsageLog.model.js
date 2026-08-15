import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Append-only audit trail for every AI call.
 *
 * Counters on the user answer "how much?"; only per-call rows answer "why?".
 * When a bill spikes or one module always fails, this is the collection that
 * tells you which module, which model, which user and which prompt version.
 */
const aiUsageLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    artifact: { type: Schema.Types.ObjectId, ref: 'Artifact' },

    module: { type: String, required: true },
    provider: { type: String, required: true },
    model: { type: String, required: true },
    promptVersion: { type: String },

    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    estimatedCostUsd: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },

    status: { type: String, enum: ['success', 'failed', 'cached'], required: true },
    attempts: { type: Number, default: 1 },
    errorMessage: { type: String },
    jobId: { type: String, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

aiUsageLogSchema.index({ user: 1, createdAt: -1 });
aiUsageLogSchema.index({ project: 1, createdAt: -1 });
aiUsageLogSchema.index({ createdAt: -1 });
aiUsageLogSchema.index({ status: 1, module: 1 });

export const AiUsageLog = model('AiUsageLog', aiUsageLogSchema);
export default AiUsageLog;
