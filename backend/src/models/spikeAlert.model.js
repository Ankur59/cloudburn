import mongoose from 'mongoose';

// Created when current metric value > previous value * 1.5 (50% spike).
// One alert per (orgId + resourceId + metricName) spike event.

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
    resourceId: {
      type: String,
      required: true,
    },
    service: {
      type: String,
      required: true, // "EC2" | "RDS" | "S3"
    },
    metricName: {
      type: String,
      required: true, // "CPUUtilization" | "InstanceCount"
    },
    previousValue: { type: Number, required: true },
    currentValue:  { type: Number, required: true },
    // currentValue / previousValue — how many times larger
    multiplier:    { type: Number, required: true },
    message:       { type: String, required: true },
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
