import mongoose from 'mongoose';
import { DOMAINS, DIFFICULTIES, PROJECT_TYPES } from '../../../shared/constants/domains.js';
import { PROJECT_STATUS, PROJECT_VISIBILITY } from '../../../shared/constants/statuses.js';
import { ARTIFACT_TYPE_LIST } from '../../../shared/constants/artifactTypes.js';
import { createSlug } from '../utils/slug.util.js';
import { computeIdeaHash } from '../utils/hash.util.js';

const { Schema, model } = mongoose;

const assetSchema = new Schema(
  { url: { type: String, default: null }, publicId: { type: String, default: null } },
  { _id: false }
);

const projectSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mentors: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    slug: { type: String, unique: true, index: true },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    domain: { type: String, enum: DOMAINS, required: true },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    teamSize: { type: Number, min: 1, max: 20, default: 1 },
    preferredTech: {
      type: [String],
      default: [],
      validate: [(v) => v.length <= 25, 'At most 25 technologies'],
    },
    deadline: { type: Date },
    aiIntegrationRequired: { type: Boolean, default: false },
    projectType: { type: String, enum: PROJECT_TYPES, default: 'web' },

    coverImage: { type: assetSchema, default: () => ({}) },
    tags: {
      type: [String],
      default: [],
      validate: [(v) => v.length <= 15, 'At most 15 tags'],
    },

    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.DRAFT,
    },
    visibility: {
      type: String,
      enum: Object.values(PROJECT_VISIBILITY),
      default: PROJECT_VISIBILITY.PRIVATE,
    },

    /** Fingerprint of the idea fields. Drives staleness detection AND the generation cache. */
    ideaHash: { type: String, index: true },

    /** Denormalised so the dashboard can render progress without loading every artifact. */
    generatedModules: [{ type: String, enum: ARTIFACT_TYPE_LIST }],
    completionPercentage: { type: Number, min: 0, max: 100, default: 0 },

    bookmarkedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    viewCount: { type: Number, default: 0 },
    lastGeneratedAt: { type: Date },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, ret) => { delete ret.__v; return ret; } },
    toObject: { virtuals: true },
  }
);

projectSchema.index({ owner: 1, isDeleted: 1, createdAt: -1 });
projectSchema.index({ visibility: 1, isDeleted: 1, viewCount: -1 });
projectSchema.index({ mentors: 1 });
projectSchema.index({ title: 'text', description: 'text', tags: 'text' });

projectSchema.virtual('moduleCount').get(function moduleCount() {
  return this.generatedModules?.length ?? 0;
});

projectSchema.virtual('totalModules').get(() => ARTIFACT_TYPE_LIST.length);

projectSchema.pre('validate', function assignSlug(next) {
  if (!this.slug && this.title) this.slug = createSlug(this.title);
  next();
});

/** Recompute the idea fingerprint whenever any contributing field changes. */
projectSchema.pre('save', function refreshIdeaHash(next) {
  this.ideaHash = computeIdeaHash(this.toObject());
  next();
});

/**
 * Global soft-delete filter. Every find automatically excludes deleted projects
 * unless a query explicitly opts in with `.setOptions({ includeDeleted: true })`.
 * Putting this in the model means no service can forget it.
 */
projectSchema.pre(/^find/, function excludeDeleted(next) {
  if (this.getOptions().includeDeleted) return next();
  const filter = this.getFilter();
  if (!('isDeleted' in filter)) this.where({ isDeleted: false });
  return next();
});

export const Project = model('Project', projectSchema);
export default Project;
