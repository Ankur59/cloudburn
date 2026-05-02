import mongoose from 'mongoose';

const costRecordSchema = new mongoose.Schema(
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
    teamName: {
      type: String,
      default: null,
    },
    // Normalized short name (EC2, S3, RDS …)
    service: {
      type: String,
      required: true,
    },
    // Original AWS service string
    rawService: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      default: 'aws',
    },
    // Populated when region is part of the CE query GroupBy
    region: {
      type: String,
      default: null,
    },
    // UnblendedCost — as required by the cron spec
    cost: {
      type: Number,
      required: true,
      default: 0,
    },
    usageAmount: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: 'USD',
    },
    // YYYY-MM-DD — matches TimePeriod.Start from AWS CE
    date: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Primary access pattern: org + date range queries
costRecordSchema.index({ orgId: 1, date: 1 });

// Team-based cost queries
costRecordSchema.index({ orgId: 1, teamId: 1, date: 1 });

// Service breakdown queries
costRecordSchema.index({ orgId: 1, service: 1, date: 1 });

// Frontend: service + team + date  (e.g. "EC2 costs for team X on a date range")
costRecordSchema.index({ orgId: 1, service: 1, teamId: 1, date: 1 });

const CostRecord = mongoose.model('CostRecord', costRecordSchema);
export default CostRecord;
