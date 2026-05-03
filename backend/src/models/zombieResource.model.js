import mongoose from 'mongoose';

// ── ZombieResource ────────────────────────────────────────────────────────────
// One doc per (orgId + resourceId). Upserted on each scan — not duplicated.
// Represents a cloud resource detected as idle/zombie.

const zombieResourceSchema = new mongoose.Schema(
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

    // ── Cloud details ─────────────────────────────────────────────────────────
    provider: {
      type: String,
      required: true,
      enum: ['aws', 'gcp', 'azure'],
      lowercase: true,
    },
    service: {
      type: String,
      required: true, // EC2 | RDS | S3 | DynamoDB | etc.
    },
    resourceId: {
      type: String,
      required: true, // e.g. "i-0abc123def456789"
    },
    resourceName: {
      type: String,
      default: null,
    },
    region: {
      type: String,
      required: true,
    },

    // ── Detection metadata ────────────────────────────────────────────────────
    detectedAt: {
      type: Date,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    idleDays: {
      type: Number,
      default: 0,
    },

    // ── Status lifecycle: zombie → marked → cleaned | resolved ────────────────
    status: {
      type: String,
      enum: ['zombie', 'marked', 'cleaned', 'resolved'],
      default: 'zombie',
    },

    // ── Cost ─────────────────────────────────────────────────────────────────
    estimatedMonthlyCost: {
      type: Number,
      default: 0,
    },

    // ── Latest metric snapshot values that triggered detection ────────────────
    // e.g. { CPUUtilization: 0.2, NetworkIn: 0 }
    metrics: {
      type: Map,
      of: Number,
      default: {},
    },

    // ── Optional AI explanation ───────────────────────────────────────────────
    aiSummary: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// One zombie record per (org + resource) — upsert-safe
zombieResourceSchema.index({ orgId: 1, resourceId: 1 }, { unique: true });

// For list queries: filter by org + status
zombieResourceSchema.index({ orgId: 1, status: 1 });

// For team-scoped queries
zombieResourceSchema.index({ orgId: 1, teamId: 1, status: 1 });

const ZombieResource = mongoose.model('ZombieResource', zombieResourceSchema);
export default ZombieResource;
