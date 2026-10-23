import mongoose from 'mongoose';

const urlRegex = /^https?:\/\/.+/i;

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      required: [true, 'Module order is required'],
    },
  },
  { _id: false }
);

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Resource description is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: {
        values: ['COURSE', 'VIDEO', 'ARTICLE', 'DOCUMENTATION', 'TUTORIAL', 'BOOK'],
        message: '{VALUE} is not a valid resource type',
      },
    },
    platform: {
      type: String,
      trim: true,
      default: '',
    },
    url: {
      type: String,
      required: [true, 'Resource URL is required'],
      trim: true,
      match: [urlRegex, 'Resource URL must be a valid HTTP or HTTPS URL'],
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    difficulty: {
      type: String,
      enum: {
        values: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
        message: '{VALUE} is not a valid difficulty level',
      },
      default: 'BEGINNER',
    },
    estimatedDuration: {
      type: Number,
      min: [0, 'Estimated duration cannot be negative'],
      default: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    modules: {
      type: [moduleSchema],
      default: [],
    },
    // Preserved display fields for frontend catalog compatibility
    thumbnail: {
      type: String,
      trim: true,
      default: '',
    },
    instructor: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0,
    },
    // Deterministic source identifier for seed migration idempotency
    sourceId: {
      type: Number,
      unique: true,
      sparse: true,
      index: true,
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

// Indexes supporting search and filtering query patterns
resourceSchema.index({ category: 1, difficulty: 1 });
resourceSchema.index({ skills: 1 });

export const Resource = mongoose.model('Resource', resourceSchema);
