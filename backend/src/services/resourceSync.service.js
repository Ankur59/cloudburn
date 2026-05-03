import Organization from '../models/organization.model.js';
import Team from '../models/team.model.js';
import User from '../models/user.model.js';
import ResourceSnapshot from '../models/resourceSnapshot.model.js';
import SpikeAlert from '../models/spikeAlert.model.js';
import { decrypt } from '../utils/encryption.js';
import { sendResourceSpikeAlert } from './email.service.js';
import {
  fetchEC2Instances, fetchEC2Metrics,
  fetchRDSInstances, fetchRDSMetrics,
  fetchS3Buckets,    fetchS3Metrics,
  fetchDynamoDBTables, fetchDynamoDBMetrics,
} from './cloudwatch.service.js';

const SPIKE_THRESHOLD = 1.5;  // 50% increase triggers an alert
const BATCH_SIZE      = 5;

// ── Build team tag → teamId map ───────────────────────────────────────────────
const buildTeamMap = (teams) => {
  const map = {};
  teams.forEach((t) => { map[t.teamKey] = t._id; });
  return map;
};

// ── Resolve teamId from tags using the "team" tag key ────────────────────────
const resolveTeamId = (tags, teamMap) =>
  tags?.team ? (teamMap[tags.team] ?? null) : null;

// ── Spike detection (2–3 hour window) ────────────────────────────────────────
// Compares current value against a snapshot from 2–3 hours ago.
// Using a time-window (not just "previous") avoids false positives from
// two consecutive readings within the same hour.
const detectSpike = async ({
  orgId, teamId, resourceId, service, metricName, currentValue, currentTimestamp,
}) => {
  const now         = new Date(currentTimestamp);
  const windowEnd   = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 h ago
  const windowStart = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 h ago

  const baseline = await ResourceSnapshot.findOne(
    { orgId, resourceId, metricName, timestamp: { $gte: windowStart, $lte: windowEnd } },
    { value: 1, timestamp: 1 },
    { sort: { timestamp: -1 } }
  ).lean();

  if (!baseline || baseline.value === 0) return null; // no baseline in window

  const multiplier = currentValue / baseline.value;
  if (multiplier < SPIKE_THRESHOLD) return null;

  const hoursAgo = ((now - new Date(baseline.timestamp)) / (60 * 60 * 1000)).toFixed(1);

  return {
    orgId,
    teamId,
    resourceId,
    service,
    metricName,
    previousValue: +baseline.value.toFixed(4),
    currentValue:  +currentValue.toFixed(4),
    multiplier:    +multiplier.toFixed(2),
    message: `${service} instance ${resourceId} ${metricName} increased from ${baseline.value.toFixed(2)} to ${currentValue.toFixed(2)} in the last ${hoursAgo} hours`,
    alertType: 'SPIKE',
  };
};

// ── Bulk upsert helper ────────────────────────────────────────────────────────
// Silently swallows duplicate key errors (code 11000) — the unique index
// on (orgId, resourceId, metricName, timestamp) guarantees no real duplicates.
const bulkInsertSnapshots = async (docs) => {
  if (!docs.length) return;
  try {
    await ResourceSnapshot.insertMany(docs, { ordered: false });
  } catch (err) {
    const isAllDupes = err.writeErrors?.every((e) => e.code === 11000);
    if (err.code !== 11000 && !isAllDupes) throw err;
    const dupes = (err.writeErrors || []).length;
    if (dupes) console.log(`  ℹ️  ${dupes} duplicate snapshot(s) skipped`);
  }
};

// ── Notify spike: email + DB save ─────────────────────────────────────────────
// Admin always gets notified. If alert.teamId is set, the team lead of that team
// also receives the email. Both are saved regardless of email outcome.
const notifySpike = async (alert, orgId) => {
  try {
    const [admin, teamLead] = await Promise.all([
      User.findOne({ orgId, role: 'Admin' }, 'email name').lean(),
      alert.teamId
        ? User.findOne({ orgId, teamId: alert.teamId, role: 'TeamLead' }, 'email name').lean()
        : null,
    ]);

    const recipients = [];
    if (admin) recipients.push({ email: admin.email, name: admin.name });
    if (teamLead && teamLead.email !== admin?.email) {
      recipients.push({ email: teamLead.email, name: teamLead.name });
    }

    if (recipients.length) {
      await sendResourceSpikeAlert({
        recipients,
        service:       alert.service,
        resourceId:    alert.resourceId,
        metricName:    alert.metricName,
        region:        alert.region,
        teamId:        alert.teamId?.toString() ?? null,
        teamName:      alert.teamName ?? null,
        previousValue: alert.previousValue,
        currentValue:  alert.currentValue,
        multiplier:    alert.multiplier,
        detectedAt:    new Date(),
      });
    }
  } catch (err) {
    console.error(`  [email] Spike notification error: ${err.message}`);
  }

  // Always save the alert to DB — even if email failed
  return SpikeAlert.create(alert);
};

// ── Process one service's metric results ──────────────────────────────────────
// Builds snapshot docs and runs spike detection in parallel.
const processMetrics = async ({ metrics, service, region, orgId, teamTagMap, teamMap }) => {
  const snapshotDocs = [];
  const alertDocs    = [];

  await Promise.all(metrics.map(async ({ resourceId, metricName, value, timestamp, tags }) => {
    const teamId = resolveTeamId(tags ?? teamTagMap?.[resourceId], teamMap);

    snapshotDocs.push({ orgId, teamId, resourceId, service, metricName, value, region, timestamp });

    const alert = await detectSpike({
      orgId, teamId, resourceId, service, metricName,
      currentValue: value, currentTimestamp: timestamp,
    });
    if (alert) alertDocs.push(alert);
  }));

  return { snapshotDocs, alertDocs };
};

// ── Sync one organisation ─────────────────────────────────────────────────────
export const syncOrgResources = async (org) => {
  const orgId = org._id;
  if (!org.awsAccessKey || !org.awsSecretKey || !org.awsRegion) return;

  const ak     = decrypt(org.awsAccessKey);
  const sk     = decrypt(org.awsSecretKey);
  const region = org.awsRegion;

  const teams   = await Team.find({ orgId }).lean();
  const teamMap = buildTeamMap(teams);

  const allSnapshots = [];
  const allAlerts    = [];
  const merge = ({ snapshotDocs, alertDocs }) => {
    allSnapshots.push(...snapshotDocs);
    allAlerts.push(...alertDocs);
  };

  // Each service is isolated — one auth failure never kills the others.
  // ── EC2 ───────────────────────────────────────────────────────────────────
  try {
    console.log(`  [org ${orgId}] EC2…`);
    const ec2Instances  = await fetchEC2Instances(ak, sk, region);
    const ec2TeamTagMap = {};
    ec2Instances.forEach((i) => { ec2TeamTagMap[i.instanceId] = i.tags; });
    const ec2Metrics = await fetchEC2Metrics(ak, sk, region, ec2Instances);
    merge(await processMetrics({
      metrics: ec2Metrics.map((m) => ({ ...m, tags: ec2TeamTagMap[m.resourceId] })),
      service: 'EC2', region, orgId, teamMap,
    }));
  } catch (err) { console.warn(`  [EC2] SKIPPED — ${err.message}`); }

  // ── RDS ───────────────────────────────────────────────────────────────────
  try {
    console.log(`  [org ${orgId}] RDS…`);
    const rdsInstances = await fetchRDSInstances(ak, sk, region);
    const rdsTagMap    = {};
    rdsInstances.forEach((i) => { rdsTagMap[i.instanceId] = i.tags; });
    const rdsMetrics = await fetchRDSMetrics(ak, sk, region, rdsInstances);
    merge(await processMetrics({
      metrics: rdsMetrics.map((m) => ({ ...m, tags: rdsTagMap[m.resourceId] })),
      service: 'RDS', region, orgId, teamMap,
    }));
  } catch (err) { console.warn(`  [RDS] SKIPPED — ${err.message}`); }

  // ── S3 ────────────────────────────────────────────────────────────────────
  try {
    console.log(`  [org ${orgId}] S3…`);
    const s3Buckets = await fetchS3Buckets(ak, sk, region);
    const s3Metrics = await fetchS3Metrics(ak, sk, s3Buckets);
    merge(await processMetrics({ metrics: s3Metrics, service: 'S3', region, orgId, teamMap }));
  } catch (err) { console.warn(`  [S3] SKIPPED — ${err.message}`); }

  // ── DynamoDB ──────────────────────────────────────────────────────────────
  try {
    console.log(`  [org ${orgId}] DynamoDB…`);
    const ddbTables  = await fetchDynamoDBTables(ak, sk, region);
    const ddbMetrics = await fetchDynamoDBMetrics(ak, sk, region, ddbTables);
    merge(await processMetrics({ metrics: ddbMetrics, service: 'DynamoDB', region, orgId, teamMap }));
  } catch (err) { console.warn(`  [DynamoDB] SKIPPED — ${err.message}`); }

  // ── Persist — always runs regardless of which services succeeded ───────────
  await bulkInsertSnapshots(allSnapshots);

  if (allAlerts.length) {
    // Save each alert to DB and send email notifications in parallel
    await Promise.all(allAlerts.map((alert) => notifySpike(alert, orgId)));
    console.log(`  ⚠️  org ${orgId} — ${allAlerts.length} spike alert(s) sent`);
  }

  return {
    orgId,
    metricsRecorded: allSnapshots.length,
    spikesDetected:  allAlerts.length,
  };
};


// ── Full sync — all connected orgs ────────────────────────────────────────────
export const runResourceSync = async () => {
  const orgs = await Organization
    .find({ awsAccessKey: { $exists: true, $ne: null } })
    .select('+awsAccessKey +awsSecretKey')
    .lean();

  console.log(`\n🔍 Resource sync started — ${orgs.length} org(s)`);
  const t = Date.now();

  for (let i = 0; i < orgs.length; i += BATCH_SIZE) {
    await Promise.all(
      orgs.slice(i, i + BATCH_SIZE).map((org) =>
        syncOrgResources(org)
          .then((s) => console.log(`  ✅ org ${s.orgId} — ${s.metricsRecorded} snapshots, ${s.spikesDetected} spikes`))
          .catch((err) => console.error(`  ❌ org ${org._id} — ${err.message}`))
      )
    );
  }

  console.log(`✅ Resource sync done in ${Date.now() - t}ms`);
};
