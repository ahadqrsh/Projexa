import mongoose from 'mongoose';
import { DIAGRAM_TYPE_LIST } from '../../../shared/constants/artifactTypes.js';
import { GENERATION_STATUS } from '../../../shared/constants/statuses.js';

const { Schema, model } = mongoose;

/**
 * Diagrams are separate from artifacts because they carry two concerns artifacts
 * do not: a source LANGUAGE (mermaid/graphviz) and a rendered BINARY on Cloudinary.
 *
 * `source` is always stored; `rendered` is produced lazily on export only, so we
 * never run headless Chromium for a diagram nobody downloads.
 */
const diagramSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    type: { type: String, enum: DIAGRAM_TYPE_LIST, required: true },
    engine: { type: String, enum: ['mermaid', 'graphviz'], default: 'mermaid' },

    title: { type: String, default: '' },
    source: { type: String, default: '' },

    rendered: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      format: { type: String, default: null },
      width: Number,
      height: Number,
    },

    status: {
      type: String,
      enum: Object.values(GENERATION_STATUS),
      default: GENERATION_STATUS.QUEUED,
    },
    version: { type: Number, default: 1 },
    isManuallyEdited: { type: Boolean, default: false },
    isStale: { type: Boolean, default: false },

    error: { message: String, occurredAt: Date },
    jobId: { type: String, index: true },
    generatedAt: Date,
  },
  { timestamps: true, toJSON: { transform: (_d, r) => { delete r.__v; return r; } } }
);

diagramSchema.index({ project: 1, type: 1 }, { unique: true });
diagramSchema.index({ project: 1, status: 1 });

export const Diagram = model('Diagram', diagramSchema);
export default Diagram;
