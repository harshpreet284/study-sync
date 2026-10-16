import mongoose from 'mongoose';

const learningProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Resource reference is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
        message: '{VALUE} is not a valid progress status',
      },
      default: 'NOT_STARTED',
    },
    progress: {
      type: Number,
      min: [0, 'Progress percentage cannot be less than 0'],
      max: [100, 'Progress percentage cannot exceed 100'],
      default: 0,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Prevent duplicate learning records for the same user and resource
learningProgressSchema.index({ user: 1, resource: 1 }, { unique: true });

// Optimize query patterns for user learning records by status
learningProgressSchema.index({ user: 1, status: 1 });

export const LearningProgress = mongoose.model('LearningProgress', learningProgressSchema);
