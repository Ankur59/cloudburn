import mongoose from 'mongoose';
import ResourceSnapshot from '../models/resourceSnapshot.model.js';
import ZombieResource from '../models/zombieResource.model.js';
import SpikeAlert from '../models/spikeAlert.model.js';
import { generateZombieExplanation } from './ai.service.js';

// ── Per-service idle thresholds ───────────────────────────────────────────────
// A resource is considered zombie when its average metric falls below/at the
// threshold over the lookback window.
const THRESHOLDS = {
  EC2: {
    metric: 'CPUUtilization',
    maxAvg: 5,          // % CPU — below this = idle
    lookbackDays: 7,
  },
  RDS: {
    metric: 'DatabaseConnections',
    maxAvg: 0,          // zero connections = zombie
    lookbackDays: 3,
  },
  S3: {
    metric: 'NumberOfRequests',
    maxAvg: 0,          // zero requests = zombie
    lookbackDays: 7,
  },
  DynamoDB: {
    metric: 'ConsumedReadCapacityUnits',
    maxAvg: 0,
    lookbackDays: 7,
  },
};

// ── Core scan logic ───────────────────────────────────────────────────────────
/**
 * Scan one org's ResourceSnapshot data and upsert zombie resources.
 * Returns newly detected alerts for real-time notifications.
 */
export const runZombieScanForOrg = async (orgId) => {
  const detectedResourceIds = [];
  const newAlerts = [];
  let totalProcessed = 0;

  for (const [service, cfg] of Object.entries(THRESHOLDS)) {
    const since = new Date(Date.now() - cfg.lookbackDays * 24 * 60 * 60 * 1000);

    // ── One aggregation: avg metric per resource over the lookback window ─────
    const results = await ResourceSnapshot.aggregate([
      {
        $match: {
          orgId: typeof orgId === 'string' ? new mongoose.Types.ObjectId(orgId) : orgId,
          service,
          metricName: cfg.metric,
          timestamp: { $gte: since },
        },
      },
      {
        $group: {
          _id: {
            resourceId: '$resourceId',
            region:     '$region',
            teamId:     '$teamId',
          },
          avgValue:    { $avg: '$value' },
          minTimestamp:{ $min: '$timestamp' },
          maxTimestamp:{ $max: '$timestamp' },
          latestValue: { $last: '$value' },
          sampleCount: { $sum: 1 },
        },
      },
      { $match: { avgValue: { $lte: cfg.maxAvg } } },
    ]);

    for (const r of results) {
      const { resourceId, region, teamId } = r._id;
      const idleDays = Math.round(
        (Date.now() - r.minTimestamp.getTime()) / (1000 * 60 * 60 * 24)
      );

      detectedResourceIds.push(resourceId);

      // Check if this resource is ALREADY known as a zombie
      const existing = await ZombieResource.findOne({ orgId, resourceId });
      const isNewZombie = !existing || existing.status === 'resolved';

      const metrics = { [cfg.metric]: r.latestValue };
      let aiSummary = existing?.aiSummary || 'Analyzing idle patterns...';

      // ── Create Alert & AI Summary for NEW zombies ───────────────────────────
      if (isNewZombie) {
        aiSummary = await generateZombieExplanation({
          service,
          resourceId,
          metricName: cfg.metric,
          avgValue: r.avgValue,
          idleDays,
        });

        const alert = await SpikeAlert.findOneAndUpdate(
          { orgId, resourceId, alertType: 'ZOMBIE' },
          {
            $set: {
              service,
              metricName: cfg.metric,
              currentValue: +r.avgValue.toFixed(2),
              previousValue: 100, // Dummy baseline
              message: `${service} resource ${resourceId} detected as idle for ${idleDays} days.`,
              aiExplanation: aiSummary,
              isRead: false,
            },
          },
          { upsert: true, new: true }
        );
        newAlerts.push(alert);
        console.log(`🚨 [ZOMBIE ALERT] Created alert for ${resourceId} (${service})`);
      }

      await ZombieResource.findOneAndUpdate(
        { orgId, resourceId },
        {
          $set: {
            orgId,
            teamId:    teamId || null,
            provider:  'aws',
            service,
            resourceId,
            region,
            lastSeenAt: new Date(),
            idleDays,
            metrics,
            aiSummary,
            status: 'zombie', 
          },
          $setOnInsert: {
            detectedAt: new Date(),
            estimatedMonthlyCost: 0,
          },
        },
        { upsert: true }
      );

      totalProcessed++;
    }
  }

  // ── Resolve resources no longer detected as idle ──────────────────────────
  if (detectedResourceIds.length > 0) {
    const res = await ZombieResource.updateMany(
      { orgId, status: 'zombie', resourceId: { $nin: detectedResourceIds } },
      { $set: { status: 'resolved', resolvedAt: new Date() } }
    );
    if (res.modifiedCount > 0) {
      console.log(`✅ [ZOMBIE] Resolved ${res.modifiedCount} resource(s) for org ${orgId}`);
    }
  }

  return { found: detectedResourceIds.length, processed: totalProcessed, newAlerts };
};

// ── Get all distinct orgs that have snapshot data ────────────────────────────
export const getOrgsWithSnapshots = async () => {
  return ResourceSnapshot.distinct('orgId');
};

// ── List zombies for an org (paginated) ──────────────────────────────────────
export const listZombiesForOrg = async (orgId, { status, page = 1, limit = 50 } = {}) => {
  const filter = { orgId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [resources, total] = await Promise.all([
    ZombieResource.find(filter)
      .populate('teamId', 'name teamKey')
      .sort({ idleDays: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ZombieResource.countDocuments(filter),
  ]);

  return { resources, total, page, limit };
};

// ── Update a zombie's status ──────────────────────────────────────────────────
export const updateZombieStatus = async (id, orgId, status) => {
  const update = { status };
  if (status === 'cleaned') update.resolvedAt = new Date();
  return ZombieResource.findOneAndUpdate(
    { _id: id, orgId },
    { $set: update },
    { new: true }
  );
};
