/**
 * Seed ZombieResource collection with realistic mock data.
 *
 * Usage:
 *   node scripts/seedZombies.js               # all orgs
 *   node scripts/seedZombies.js --orgId <id>  # one org
 *
 * Safe to re-run — uses upsert on (orgId, resourceId).
 */

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __rootDir  = path.resolve(path.dirname(__filename), '..');
const { config } = await import('dotenv');
config({ path: path.join(__rootDir, '.env') });

import mongoose from 'mongoose';
import Organization from '../src/models/organization.model.js';
import Team from '../src/models/team.model.js';
import ZombieResource from '../src/models/zombieResource.model.js';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const orgIdx = args.indexOf('--orgId');
const orgId  = orgIdx !== -1 ? args[orgIdx + 1] : null;

// ── Mock resource templates ───────────────────────────────────────────────────
// Each entry is a template; orgId + teamId are injected at runtime.
const MOCK_ZOMBIES = [
  {
    provider: 'aws',
    service: 'EC2',
    resourceId: 'i-0a3f8c2d91e4b7c12',
    resourceName: 'prod-loadtest-server',
    region: 'us-east-1',
    idleDays: 63,
    estimatedMonthlyCost: 420,
    status: 'zombie',
    metrics: { CPUUtilization: 0.1, NetworkIn: 0, NetworkOut: 0 },
    aiSummary: 'This EC2 instance has had 0% CPU utilisation and zero network I/O for 63 days. It was provisioned for a load test that was cancelled, and is now entirely idle. Safe to terminate immediately — no other resources depend on it.',
    detectedAt: new Date(Date.now() - 63 * 86400000),
  },
  {
    provider: 'aws',
    service: 'RDS',
    resourceId: 'db-prod-analytics-legacy',
    resourceName: 'legacy-analytics-db',
    region: 'us-west-2',
    idleDays: 112,
    estimatedMonthlyCost: 1100,
    status: 'zombie',
    metrics: { DatabaseConnections: 0, CPUUtilization: 0.3 },
    aiSummary: 'This RDS instance was the database for the legacy analytics pipeline, which was migrated to BigQuery in January. No connections have been made since the migration date. The instance is consuming $1,100/mo with zero utilisation.',
    detectedAt: new Date(Date.now() - 112 * 86400000),
  },
  {
    provider: 'aws',
    service: 'S3',
    resourceId: 's3://cb-loadtest-artifacts-2024',
    resourceName: 'cb-loadtest-artifacts-2024',
    region: 'us-east-1',
    idleDays: 91,
    estimatedMonthlyCost: 87,
    status: 'marked',
    metrics: { NumberOfRequests: 0, BucketSizeBytes: 193000000 },
    aiSummary: 'This S3 bucket contains load test artifacts from Q4 2024. There have been zero read or write operations in 91 days. The bucket holds 180 GB of test result files that are unlikely to be needed again.',
    detectedAt: new Date(Date.now() - 91 * 86400000),
  },
  {
    provider: 'aws',
    service: 'EC2',
    resourceId: 'i-0d7e2f4a88b1c3d56',
    resourceName: 'staging-api-v1-deprecated',
    region: 'ap-southeast-1',
    idleDays: 8,
    estimatedMonthlyCost: 180,
    status: 'zombie',
    metrics: { CPUUtilization: 0.4, NetworkIn: 102, NetworkOut: 0 },
    aiSummary: 'This EC2 instance was recently provisioned but shows signs of being abandoned — it has never served any traffic and has had near-zero CPU utilisation since creation, apart from the initial boot sequence.',
    detectedAt: new Date(Date.now() - 8 * 86400000),
  },
  {
    provider: 'aws',
    service: 'DynamoDB',
    resourceId: 'cloudburn-sessions-legacy',
    resourceName: 'sessions-legacy-table',
    region: 'ap-south-1',
    idleDays: 45,
    estimatedMonthlyCost: 55,
    status: 'zombie',
    metrics: { ConsumedReadCapacityUnits: 0, ConsumedWriteCapacityUnits: 0 },
    aiSummary: 'This DynamoDB table was used by the v1 session management system, which was replaced 45 days ago. No read or write operations have been recorded since. The table still has provisioned capacity being billed.',
    detectedAt: new Date(Date.now() - 45 * 86400000),
  },
  {
    provider: 'aws',
    service: 'RDS',
    resourceId: 'db-staging-payments-v2',
    resourceName: 'staging-payments-v2',
    region: 'us-east-1',
    idleDays: 55,
    estimatedMonthlyCost: 890,
    status: 'cleaned',
    metrics: { DatabaseConnections: 0 },
    aiSummary: 'This RDS instance was used for staging the payments service v2 migration. The migration completed in March and this instance was subsequently terminated.',
    detectedAt: new Date(Date.now() - 55 * 86400000),
    resolvedAt: new Date(Date.now() - 5 * 86400000),
  },
  {
    provider: 'aws',
    service: 'EC2',
    resourceId: 'i-0c9b1a2e3f4d5c6b7',
    resourceName: 'ml-training-spot-orphan',
    region: 'us-east-2',
    idleDays: 22,
    estimatedMonthlyCost: 310,
    status: 'zombie',
    metrics: { CPUUtilization: 1.2, NetworkOut: 0 },
    aiSummary: 'This EC2 instance was part of a spot fleet for ML training jobs. The training pipeline was terminated but this instance was not cleaned up. CPU remains near-zero and no training processes are running.',
    detectedAt: new Date(Date.now() - 22 * 86400000),
  },
  {
    provider: 'aws',
    service: 'S3',
    resourceId: 's3://old-deployment-artifacts-2023',
    resourceName: 'old-deployment-artifacts-2023',
    region: 'us-east-1',
    idleDays: 180,
    estimatedMonthlyCost: 38,
    status: 'marked',
    metrics: { NumberOfRequests: 0, BucketSizeBytes: 45000000 },
    aiSummary: 'S3 bucket containing CI/CD deployment artifacts from 2023. Pipeline migrated to a new artifact registry in January 2024. Zero access in 180 days. Safe to archive or delete.',
    detectedAt: new Date(Date.now() - 180 * 86400000),
  },
];

// ── Seed one org ──────────────────────────────────────────────────────────────
const seedOrg = async (org) => {
  const teams = await Team.find({ orgId: org._id }).lean();
  const teamIds = teams.map(t => t._id);

  let upserted = 0;

  for (let i = 0; i < MOCK_ZOMBIES.length; i++) {
    const template = MOCK_ZOMBIES[i];
    const teamId   = teamIds.length ? teamIds[i % teamIds.length] : null;

    const { detectedAt, resolvedAt, ...rest } = template;

    await ZombieResource.findOneAndUpdate(
      { orgId: org._id, resourceId: template.resourceId },
      {
        $set: {
          ...rest,
          orgId: org._id,
          teamId,
          lastSeenAt: new Date(),
          ...(resolvedAt ? { resolvedAt } : {}),
        },
        $setOnInsert: {
          detectedAt: detectedAt || new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
    upserted++;
  }

  return upserted;
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

  console.log(`🧟  Seeding zombie resources for ${orgs.length} org(s)…\n`);
  let totalUpserted = 0;

  for (const org of orgs) {
    const count = await seedOrg(org);
    totalUpserted += count;
    console.log(`  ✅ org ${org._id} (${org.name || 'unnamed'}) — ${count} zombie(s) upserted`);
  }

  console.log(`\n🎉  Done — ${totalUpserted} total zombie resources seeded`);
  console.log(`    Services: EC2 · RDS · S3 · DynamoDB`);
  console.log(`    Statuses: zombie (active), marked (pending cleanup), cleaned`);
  console.log(`    Safe to re-run — uses upsert on (orgId, resourceId)\n`);
};

run()
  .catch((err) => { console.error('\n💥  Seed failed:', err.message); process.exit(1); })
  .finally(() => mongoose.disconnect());
