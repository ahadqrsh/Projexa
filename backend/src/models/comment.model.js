import mongoose from 'mongoose';
import { ARTIFACT_TYPE_LIST } from '../../../shared/constants/artifactTypes.js';

const { Schema, model } = mongoose;

const commentSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    /** Anchors a comment to one module tab, or GENERAL for project-level feedback. */
    artifactType: { type: String, enum: [...ARTIFACT_TYPE_LIST, 'GENERAL'], default: 'GENERAL' },

    body: { type: String, required: true, trim: true, minlength: 1, maxlength: 3000 },
    parentComment: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    isResolved: { type: Boolean, default: false },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { transform: (_d, r) => { delete r.__v; return r; } } }
);

commentSchema.index({ project: 1, artifactType: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });

export const Comment = model('Comment', commentSchema);
export default Comment;
