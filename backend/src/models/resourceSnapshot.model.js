import mongoose from 'mongoose';

// One row per (orgId + resourceId + metricName + timestamp).
// Designed to be flexible — EC2, RDS, S3 all share the same collection.

const resourceSnapshotSchema = new mongoose.Schema(
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
      required: true, // e.g. "i-0abc123def456789"
    },
    service: {
      type: String,
      required: true, // "EC2" | "RDS" | "S3"
    },
    metricName: {
      type: String,
      required: true, // "CPUUtilization" | "InstanceCount" etc.
    },
    value: {
      type: Number,
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Unique per (org, resource, metric, timestamp) — DB-level duplicate guard.
// If cron fires twice in the same 5-min CloudWatch bucket, the second insert
// is rejected instead of creating a duplicate document.
resourceSnapshotSchema.index(
  { orgId: 1, resourceId: 1, metricName: 1, timestamp: 1 },
  { unique: true }
);

// Team-scoped queries
resourceSnapshotSchema.index({ orgId: 1, teamId: 1, timestamp: -1 });

// TTL: auto-drop snapshots older than 7 days (keep DB lean)
resourceSnapshotSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

const ResourceSnapshot = mongoose.model('ResourceSnapshot', resourceSnapshotSchema);
export default ResourceSnapshot;
