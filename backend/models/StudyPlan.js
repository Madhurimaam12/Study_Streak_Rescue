const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    estimatedMinutes: {
      type: Number,
      required: true,
      default: 30,
      min: [5, 'Task duration must be at least 5 minutes'],
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    scheduledDate: {
      type: String, // 'YYYY-MM-DD'
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    timeSpentMinutes: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const RescueLogSchema = new mongoose.Schema(
  {
    rescuedAt: {
      type: Date,
      default: Date.now,
    },
    tasksRescheduledCount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: 'Plan rebalanced and distributed evenly.',
    },
    previousDeadline: {
      type: Date,
    },
    newDeadline: {
      type: Date,
    },
  },
  { _id: false }
);

const StudyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a plan title'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Please specify the subject or course'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    originalDeadline: {
      type: Date,
      required: false,
    },
    targetCatchUpDeadline: {
      type: Date,
      required: [true, 'Please provide a target catch-up deadline'],
    },
    dailyAvailableMinutes: {
      type: Number,
      default: 120, // 2 hours
      min: 15,
    },
    weekdayAvailableMinutes: {
      type: Number,
      default: 120,
    },
    weekendAvailableMinutes: {
      type: Number,
      default: 240,
    },
    status: {
      type: String,
      enum: ['active', 'rescued', 'completed'],
      default: 'active',
    },
    tasks: [TaskSchema],
    rescueHistory: [RescueLogSchema],
  },
  {
    timestamps: true,
  }
);

// Virtual for overall completion percentage
StudyPlanSchema.virtual('progress').get(function () {
  if (!this.tasks || this.tasks.length === 0) return 0;
  const completed = this.tasks.filter((t) => t.status === 'completed').length;
  return Math.round((completed / this.tasks.length) * 100);
});

StudyPlanSchema.set('toJSON', { virtuals: true });
StudyPlanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('StudyPlan', StudyPlanSchema);
