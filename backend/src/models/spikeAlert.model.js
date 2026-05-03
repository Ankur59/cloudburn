import mongoose from 'mongoose';

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
      required: true, // "EC2" | "RDS" | "S3" | "DynamoDB"
    },
    // For ZOMBIE alerts
    resourceId: {
      type: String,
      required: false,
    },
    metricName: {
      type: String,
      required: false, // "CPUUtilization" etc.
    },
    // Values
    previousValue: { type: Number, required: false }, // for ZOMBIE: old usage
    currentValue:  { type: Number, required: false }, // for ZOMBIE: new usage
    previousCost:  { type: Number, required: false }, // for SPIKE
    currentCost:   { type: Number, required: false }, // for SPIKE
    
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
