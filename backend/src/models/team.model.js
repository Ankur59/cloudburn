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
    // Auto-generated from team name: lowercase, spaces → hyphens, no special chars
    // Used as an AWS resource tag — immutable after creation
    teamKey: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Unique team name per org
teamSchema.index({ orgId: 1, name: 1 }, { unique: true });

// Unique teamKey per org — used for AWS tagging
teamSchema.index({ orgId: 1, teamKey: 1 }, { unique: true });

const Team = mongoose.model('Team', teamSchema);
export default Team;
