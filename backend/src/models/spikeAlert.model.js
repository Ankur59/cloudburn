import mongoose from 'mongoose';

// Created when current metric value > previous value * 1.5 (50% spike)
// OR when cost > previous day cost * 2 (100% cost spike).
// Handles both resource metric spikes and daily cost spikes.
// Alert types: 
// - SPIKE: Current cost > previous cost * 2
// - ZOMBIE: Resource usage dropped below threshold (idle)

const alertSchema = new mongoose.Schema(
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
    alertType: {
      type: String,
      enum: ['SPIKE', 'ZOMBIE'],
      default: 'SPIKE',
    },
    // For SPIKE: "YYYY-MM-DD"
    date: {
      type: String,
      required: false,
    },
    service: {
      type: String,
      required: true, // e.g., "EC2" | "RDS" | "S3" | "Total"
    },
    // Resource/Metric specific fields (used for ZOMBIE and metric spikes)
    resourceId: {
      type: String,
      required: false,
    },
    metricName: {
      type: String,
      required: false, // "CPUUtilization" etc.
    },
    // Values
    previousValue: { type: Number, required: false },
    currentValue:  { type: Number, required: false },
    previousCost:  { type: Number, required: false },
    currentCost:   { type: Number, required: false },
    
    multiplier:    { type: Number, required: false },
    message:       { type: String, required: false },
    aiExplanation: { type: String, required: false },
    isRead:        { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Alert list per org, sorted by newest
alertSchema.index({ orgId: 1, createdAt: -1 });
// For SPIKE uniqueness
alertSchema.index({ orgId: 1, date: 1, service: 1, alertType: 1 }, { unique: true, partialFilterExpression: { alertType: 'SPIKE' } });
// For ZOMBIE uniqueness (one per resource per day roughly, or just use resourceId)
alertSchema.index({ orgId: 1, resourceId: 1, alertType: 1 }, { unique: true, partialFilterExpression: { alertType: 'ZOMBIE' } });

const SpikeAlert = mongoose.model('SpikeAlert', alertSchema);
export default SpikeAlert;
