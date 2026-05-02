/**
 * Manual resource sync script (CloudWatch + spike detection)
 *
 * Usage:
 *   node scripts/syncResources.js                  # sync all connected orgs
 *   node scripts/syncResources.js --orgId <id>      # sync one specific org
 *
 * Connects to MongoDB, runs the same logic the 5-min cron runs,
 * prints a detailed report, then exits cleanly.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { runResourceSync, syncOrgResources } from '../src/services/resourceSync.service.js';
import Organization from '../src/models/organization.model.js';
import ResourceSnapshot from '../src/models/resourceSnapshot.model.js';
import SpikeAlert from '../src/models/spikeAlert.model.js';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const orgIdx = args.indexOf('--orgId');
const orgId  = orgIdx !== -1 ? args[orgIdx + 1] : null;

// ── Helpers ───────────────────────────────────────────────────────────────────
const hr  = () => console.log('─'.repeat(60));
const pad = (label, val) => console.log(`  ${label.padEnd(22)}: ${val}`);

const printSnapshots = async (orgIds) => {
  const snapshots = await ResourceSnapshot.find({ orgId: { $in: orgIds } })
    .sort({ timestamp: -1 })
    .limit(30)
    .lean();

  if (!snapshots.length) {
    console.log('\n  (no snapshots in DB yet)');
    return;
  }

  console.log('\n📸  LATEST SNAPSHOTS (up to 30)');
  hr();
  console.log(
    '  Instance ID'.padEnd(24) +
    'Metric'.padEnd(22) +
    'Value'.padEnd(12) +
    'Team'.padEnd(20) +
    'Timestamp'
  );
  hr();

  for (const s of snapshots) {
    console.log(
      `  ${s.resourceId.padEnd(22)}  ` +
      `${s.metricName.padEnd(20)}  ` +
      `${String(s.value).padEnd(10)}  ` +
      `${(s.teamId ? String(s.teamId) : 'untagged').padEnd(18)}  ` +
      `${new Date(s.timestamp).toISOString()}`
    );
  }
};

const printAlerts = async (orgIds) => {
  const alerts = await SpikeAlert.find({ orgId: { $in: orgIds } })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  if (!alerts.length) {
    console.log('\n  (no spike alerts)');
    return;
  }

  console.log('\n⚠️   SPIKE ALERTS (latest 10)');
  hr();
  for (const a of alerts) {
    console.log(`  🔴 ${a.message}`);
    console.log(`     Type: ${a.alertType} | Resource: ${a.resourceId} | ${a.createdAt?.toISOString()}`);
  }
};

// ── Main ──────────────────────────────────────────────────────────────────────
const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) { console.error('❌  MONGO_URI not set'); process.exit(1); }

  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(mongoUri);
  console.log('✅  Connected\n');

  const syncedOrgIds = [];

  if (orgId) {
    console.log(`🎯  Syncing single org: ${orgId}`);
    const org = await Organization.findById(orgId).select('+awsAccessKey +awsSecretKey').lean();
    if (!org)            { console.error('❌  Org not found');              process.exit(1); }
    if (!org.awsAccessKey) { console.error('❌  AWS not connected for this org'); process.exit(1); }

    const stats = await syncOrgResources(org);
    syncedOrgIds.push(org._id);

    hr();
    console.log('📊  SYNC RESULT');
    hr();
    pad('Org ID',             stats.orgId);
    pad('Instances found',    stats.instances);
    pad('Metrics recorded',   stats.metricsRecorded);
    pad('Spikes detected',    stats.spikesDetected);
    hr();
  } else {
    console.log('🔄  Syncing all connected orgs…\n');
    await runResourceSync();

    const orgs = await Organization.find({ awsAccessKey: { $exists: true, $ne: null } }).lean();
    orgs.forEach((o) => syncedOrgIds.push(o._id));
  }

  await printSnapshots(syncedOrgIds);
  await printAlerts(syncedOrgIds);
  hr();
};

run()
  .catch((err) => { console.error('\n💥  Script failed:', err.message); process.exit(1); })
  .finally(() => mongoose.disconnect());
