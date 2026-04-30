import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      lowercase: true,
      maxlength: [100, 'Team name cannot exceed 100 characters'],
    },
    budgetLimit: {
      type: Number,
      required: [true, 'Budget limit is required'],
      min: [0, 'Budget limit cannot be negative'],
    },
    // Percentage (0-100) at which an alert fires
    alertThreshold: {
      type: Number,
      required: [true, 'Alert threshold is required'],
      min: [0, 'Alert threshold cannot be less than 0'],
      max: [100, 'Alert threshold cannot exceed 100'],
      default:80
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index: one org will query its own teams frequently
teamSchema.index({ orgId: 1, name: 1 }, { unique: true });

const Team = mongoose.model('Team', teamSchema);
export default Team;
