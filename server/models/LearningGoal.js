import mongoose from 'mongoose';

const learningGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    targetSkills: {
      type: [String],
      default: [],
    },
    currentLevel: {
      type: String,
      enum: {
        values: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
        message: '{VALUE} is not a valid skill level',
      },
      default: 'BEGINNER',
    },
    weeklyHours: {
      type: Number,
      min: [1, 'Weekly study hours must be at least 1'],
      default: 5,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'COMPLETED', 'ARCHIVED'],
        message: '{VALUE} is not a valid goal status',
      },
      default: 'ACTIVE',
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

// Index supporting user goal queries by status
learningGoalSchema.index({ user: 1, status: 1 });

export const LearningGoal = mongoose.model('LearningGoal', learningGoalSchema);
