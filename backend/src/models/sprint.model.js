import mongoose from 'mongoose';
import { SPRINT_STATUS } from '../../../shared/constants/statuses.js';

const { Schema, model } = mongoose;

const sprintSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    weekNumber: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    goal: { type: String, default: '', maxlength: 500 },
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: Object.values(SPRINT_STATUS),
      default: SPRINT_STATUS.NOT_STARTED,
    },
    order: { type: Number, default: 0 },
    isAiGenerated: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, r) => { delete r.__v; return r; } },
    toObject: { virtuals: true },
  }
);

sprintSchema.index({ project: 1, weekNumber: 1 }, { unique: true });
sprintSchema.index({ project: 1, status: 1 });

/** Reverse populate — sprints own no task ids, tasks point at their sprint. */
sprintSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'sprint',
  options: { sort: { order: 1 } },
});

export const Sprint = model('Sprint', sprintSchema);
export default Sprint;
