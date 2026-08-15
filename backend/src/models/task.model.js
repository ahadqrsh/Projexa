import mongoose from 'mongoose';
import { TASK_STATUS, TASK_CATEGORY, TASK_PRIORITY } from '../../../shared/constants/statuses.js';

const { Schema, model } = mongoose;

const taskSchema = new Schema(
  {
    /** Denormalised from sprint so project-wide task queries need no join. */
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    sprint: { type: Schema.Types.ObjectId, ref: 'Sprint', required: true, index: true },

    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 200 },
    description: { type: String, default: '', maxlength: 2000 },
    category: { type: String, enum: TASK_CATEGORY, default: 'backend' },
    status: { type: String, enum: Object.values(TASK_STATUS), default: TASK_STATUS.TODO },
    priority: { type: String, enum: TASK_PRIORITY, default: 'medium' },

    estimatedHours: { type: Number, min: 0, max: 200, default: 0 },
    actualHours: { type: Number, min: 0, default: 0 },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    order: { type: Number, default: 0 },
    dueDate: Date,
    completedAt: Date,
    isAiGenerated: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { transform: (_d, r) => { delete r.__v; return r; } } }
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ sprint: 1, order: 1 });
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ project: 1, dueDate: 1 });

/** Keep completedAt honest without asking every call site to remember. */
taskSchema.pre('save', function stampCompletion(next) {
  if (this.isModified('status')) {
    this.completedAt = this.status === TASK_STATUS.DONE ? new Date() : undefined;
  }
  next();
});

export const Task = model('Task', taskSchema);
export default Task;
