import mongoose from 'mongoose';

const weekPlanSchema = new mongoose.Schema(
  {
    weekNumber: {
      type: Number,
      required: [true, 'Week number is required'],
      min: [1, 'Week number must be at least 1'],
    },
    focus: {
      type: String,
      required: [true, 'Weekly focus is required'],
      trim: true,
    },
    resources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource',
      },
    ],
    tasks: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const learningPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    goal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningGoal',
      required: [true, 'Goal reference is required'],
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    weeks: {
      type: [weekPlanSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON(doc, ret) {
      delete ret.__v;
      return ret;
    },
  }
);

// Index supporting user plan queries by goal
learningPlanSchema.index({ user: 1, goal: 1 });

export const LearningPlan = mongoose.model('LearningPlan', learningPlanSchema);
