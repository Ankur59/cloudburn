/**
 * Seed resourceSnapshots with realistic fake data.
 *
 * Usage:
 *   node scripts/seedSnapshots.js               # all orgs
 *   node scripts/seedSnapshots.js --orgId <id>  # one org
 *
 * - Pulls real teams (teamId, teamKey, name) from DB
 * - Generates 7 days of hourly snapshots per resource
 * - EC2: CPUUtilization  (with 1 spike day for demo)
 * - S3:  NumberOfObjects (slowly growing)
 * - DynamoDB: ConsumedReadCapacityUnits + ConsumedWriteCapacityUnits
 * - Handles duplicate key errors silently (safe to re-run)
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// Explicitly load .env from the project root — works from any CWD
const __filename = fileURLToPath(import.meta.url);
const __rootDir  = path.resolve(path.dirname(__filename), '..');
const { config } = await import('dotenv');
config({ path: path.join(__rootDir, '.env') });

import mongoose from 'mongoose';
import Organization from '../src/models/organization.model.js';
import Team from '../src/models/team.model.js';
import ResourceSnapshot from '../src/models/resourceSnapshot.model.js';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const orgIdx = args.indexOf('--orgId');
const orgId  = orgIdx !== -1 ? args[orgIdx + 1] : null;

// ── Helpers ───────────────────────────────────────────────────────────────────
const rand   = (min, max) => +(Math.random() * (max - min) + min).toFixed(4);
const hr     = () => console.log('─'.repeat(60));

// Hourly timestamps going back 7 days
const HOURS = 7 * 24; // 168 datapoints per resource per metric
const hourTimestamps = () => {
  const ts = [];
  const now = new Date();
  for (let h = HOURS; h >= 0; h--) {
    const t = new Date(now);
    t.setMinutes(0, 0, 0);
    t.setHours(t.getHours() - h);
    ts.push(t);
  }
  return ts;
};

// ── Resource definitions per service ─────────────────────────────────────────
// These are demo IDs — look realistic but are seeded, not real AWS resources.
const EC2_INSTANCES = [
  'i-0fd5068e1516f8b6d', // real instance from your account
  'i-0a1b2c3d4e5f6a7b8',
  'i-0b2c3d4e5f6a7b8c9',
];

const S3_BUCKETS = [
  'cloudburn-assets-prod',
  'cloudburn-logs-archive',
  'cloudburn-backup-2026',
];

const DYNAMO_TABLES = [
  'cloudburn-sessions',
  'cloudburn-events',
];

// ── Value generators (realistic curves) ──────────────────────────────────────
// EC2 CPU: low baseline, spike on day 4 (h=90)
const ec2Cpu = (h) => {
  const isSpikeHour = h >= 85 && h <= 95; // spike window ~10 hours ago
  return isSpikeHour ? rand(65, 92) : rand(2, 28);
};

// S3 objects: slowly growing count (1000 → ~1200 over 7 days)
const s3Objects = (h) => Math.round(1000 + (HOURS - h) * 1.2 + rand(-3, 3));

// DynamoDB: fluctuates with business hours pattern
const ddbRead  = (h) => {
  const hourOfDay = (new Date().getHours() - Math.floor(h % 24) + 24) % 24;
  const base = hourOfDay >= 8 && hourOfDay <= 20 ? rand(40, 120) : rand(2, 20);
  return +base.toFixed(2);
};
const ddbWrite = (h) => +(ddbRead(h) * rand(0.3, 0.6)).toFixed(2);

// ── Seed one org ──────────────────────────────────────────────────────────────
const seedOrg = async (org) => {
  const orgId   = org._id;
  const region  = org.awsRegion || 'ap-south-1';
  const teams   = await Team.find({ orgId }).lean();

  if (!teams.length) {
    console.log(`  [org ${orgId}] No teams found — skipping`);
    return 0;
  }

  console.log(`\n  [org ${orgId}] Found ${teams.length} team(s):`);
  teams.forEach((t) => console.log(`    • ${t.name} (teamKey: ${t.teamKey}, id: ${t._id})`));

  const timestamps = hourTimestamps();
  const docs = [];

  // ── EC2 — distribute instances across teams ───────────────────────────────
  EC2_INSTANCES.forEach((instanceId, i) => {
    const team = teams[i % teams.length]; // round-robin team assignment
    timestamps.forEach((ts, h) => {
      docs.push({
        orgId,
        teamId:     team._id,
        resourceId: instanceId,
        service:    'EC2',
        metricName: 'CPUUtilization',
        value:      ec2Cpu(h),
        region,
        timestamp:  ts,
      });
    });
  });

  // ── S3 — first team owns buckets ─────────────────────────────────────────
  S3_BUCKETS.forEach((bucket, i) => {
    const team = teams[i % teams.length];
    timestamps.forEach((ts, h) => {
      docs.push({
        orgId,
        teamId:     team._id,
        resourceId: bucket,
        service:    'S3',
        metricName: 'NumberOfObjects',
        value:      s3Objects(h),
        region:     'us-east-1', // S3 metrics always in us-east-1
        timestamp:  ts,
      });
    });
  });

  // ── DynamoDB — last team owns tables ─────────────────────────────────────
  DYNAMO_TABLES.forEach((table, i) => {
    const team = teams[(teams.length - 1 - i + teams.length) % teams.length];
    timestamps.forEach((ts, h) => {
      docs.push(
        { orgId, teamId: team._id, resourceId: table, service: 'DynamoDB', metricName: 'ConsumedReadCapacityUnits',  value: ddbRead(h),  region, timestamp: ts },
        { orgId, teamId: team._id, resourceId: table, service: 'DynamoDB', metricName: 'ConsumedWriteCapacityUnits', value: ddbWrite(h), region, timestamp: ts }
      );
    });
  });

  // ── Bulk insert (ignore duplicate key errors) ─────────────────────────────
  let inserted = 0;
  const CHUNK  = 500; // insertMany in chunks to avoid payload limits
  for (let i = 0; i < docs.length; i += CHUNK) {
    const chunk = docs.slice(i, i + CHUNK);
    try {
      const result = await ResourceSnapshot.insertMany(chunk, { ordered: false });
      inserted += result.length;
    } catch (err) {
      // 11000 = duplicate key — safe to ignore (re-run)
      const dupes = (err.writeErrors || []).filter((e) => e.code === 11000).length;
      const nonDupe = (err.writeErrors || []).filter((e) => e.code !== 11000);
      inserted += chunk.length - (err.writeErrors?.length || 0);
      if (nonDupe.length) console.warn(`  [warn] ${nonDupe.length} non-dupe insert errors`);
      if (dupes)          console.log(`  [info] ${dupes} duplicate(s) skipped`);
    }
  }

  return inserted;
};

// ── Main ──────────────────────────────────────────────────────────────────────
const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) { console.error('❌  MONGO_URI not set'); process.exit(1); }

  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(mongoUri);
  console.log('✅  Connected\n');

  let orgs;
  if (orgId) {
    const org = await Organization.findById(orgId).lean();
    if (!org) { console.error('❌  Org not found'); process.exit(1); }
    orgs = [org];
  } else {
    orgs = await Organization.find({}).lean();
  }

  console.log(`🌱  Seeding ${orgs.length} org(s)…`);
  let totalInserted = 0;

  for (const org of orgs) {
    const inserted = await seedOrg(org);
    totalInserted += inserted;
    hr();
    console.log(`  ✅ org ${org._id} — ${inserted} snapshots inserted`);
  }

  hr();
  console.log(`\n🎉  Done — ${totalInserted} total snapshots inserted`);
  console.log(`    Services: EC2 (CPUUtilization) · S3 (NumberOfObjects) · DynamoDB (ReadCU + WriteCU)`);
  console.log(`    Coverage: 7 days · hourly · ${HOURS + 1} datapoints per resource-metric pair`);
  console.log(`    Note: EC2 CPUUtilization has a simulated spike window at ~85–95 hours ago\n`);
};

run()
  .catch((err) => { console.error('\n💥  Seed failed:', err.message); process.exit(1); })
  .finally(() => mongoose.disconnect());
