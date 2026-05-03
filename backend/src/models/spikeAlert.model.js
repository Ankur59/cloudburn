import mongoose from 'mongoose';

// Created when current metric value > previous value * 1.5 (50% spike)
// OR when cost > previous day cost * 2 (100% cost spike).
// Handles both resource metric spikes and daily cost spikes.

const spikeAlertSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    // Resource metric spike specific fields
    resourceId: {
      type: String,
    },
    service: {
      type: String,
      required: true, // e.g., "EC2" | "RDS" | "S3" | "Total"
    },
    metricName: {
      type: String,
    },
    previousValue: { type: Number },
    currentValue:  { type: Number },
    message:       { type: String },

    // Cost spike specific fields
    date: {
      type: String, // "YYYY-MM-DD"
    },
    previousCost: { type: Number },
    currentCost:  { type: Number },
    aiExplanation: { type: String },

    // Shared fields
    multiplier:    { type: Number, required: true },
    alertType:     { type: String, default: 'SPIKE' },
    isRead:        { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Alert list per org, sorted by newest
spikeAlertSchema.index({ orgId: 1, createdAt: -1 });
// Team-scoped alert queries
spikeAlertSchema.index({ orgId: 1, teamId: 1, createdAt: -1 });

const SpikeAlert = mongoose.model('SpikeAlert', spikeAlertSchema);
export default SpikeAlert;
