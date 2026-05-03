/**
 * Seed SpikeAlert collection with realistic mock data.
 *
 * Usage:
 *   node scripts/seedSpikeAlerts.js               # all orgs
 *   node scripts/seedSpikeAlerts.js --orgId <id>  # one org
 *
 * Safe to re-run — uses upsert on (orgId, date, service).
 */

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __rootDir  = path.resolve(path.dirname(__filename), '..');
const { config } = await import('dotenv');
config({ path: path.join(__rootDir, '.env') });

import mongoose from 'mongoose';
import Organization from '../src/models/organization.model.js';
import SpikeAlert from '../src/models/spikeAlert.model.js';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const orgIdx = args.indexOf('--orgId');
const orgId  = orgIdx !== -1 ? args[orgIdx + 1] : null;

// ── Mock Alert Data Templates ────────────────────────────────────────────────
const MOCK_ALERTS = [
  {
    alertType: 'SPIKE',
    service: 'EC2',
    multiplier: 4.2,
    previousCost: 120.50,
    currentCost: 506.10,
    aiExplanation: 'A fleet of m5.4xlarge instances was auto-scaled due to a misconfigured scale-out policy. Recommend reviewing the CloudWatch alarms and scaling thresholds.',
    daysAgo: 1
  },
  {
    alertType: 'ZOMBIE',
    service: 'RDS',
    resourceId: 'db-prod-replica-02',
    metricName: 'DatabaseConnections',
    currentValue: 0,
    previousValue: 100,
    message: 'RDS resource db-prod-replica-02 detected as idle for 14 days.',
    aiExplanation: 'This RDS instance has had zero connections for two weeks. It was likely provisioned for a seasonal marketing campaign that has since ended. Terminating it would save approximately $85/month with no impact on production traffic.',
    daysAgo: 2
  },
  {
    alertType: 'SPIKE',
    service: 'S3',
    multiplier: 3.5,
    previousCost: 12.00,
    currentCost: 42.00,
    aiExplanation: 'Unexpected egress costs detected. New deployment is fetching large assets from S3 on every request instead of using CloudFront CDN.',
    daysAgo: 3
  },
  {
    alertType: 'ZOMBIE',
    service: 'EC2',
    resourceId: 'i-0987654321fedcba',
    metricName: 'CPUUtilization',
    currentValue: 0.5,
    previousValue: 100,
    message: 'EC2 resource i-0987654321fedcba detected as idle for 21 days.',
    aiExplanation: 'The average CPU utilization is below 1%. This instance appears to be a forgotten development sandbox. Termination is recommended after verifying no critical local data is stored.',
    daysAgo: 5
  },
  {
    alertType: 'SPIKE',
    service: 'Lambda',
    multiplier: 5.1,
    previousCost: 8.50,
    currentCost: 43.35,
    aiExplanation: 'Retry loop bug in v2.4.1 deployment causing functions to re-execute failed jobs infinitely. Each failed invocation retries 50 times.',
    daysAgo: 0
  }
];

// ── Seed one org ──────────────────────────────────────────────────────────────
const seedOrg = async (org) => {
  let upserted = 0;
  const now = new Date();

  for (const template of MOCK_ALERTS) {
    const dateObj = new Date(now);
    dateObj.setDate(now.getDate() - template.daysAgo);
    const dateStr = dateObj.toISOString().split('T')[0];

    const findQuery = { 
      orgId: org._id, 
      alertType: template.alertType 
    };
    
    if (template.alertType === 'SPIKE') {
      findQuery.date = dateStr;
      findQuery.service = template.service;
    } else {
      findQuery.resourceId = template.resourceId;
    }

    await SpikeAlert.findOneAndUpdate(
      findQuery,
      {
        $set: {
          ...template,
          orgId: org._id,
          date: template.alertType === 'SPIKE' ? dateStr : undefined,
          isRead: template.daysAgo > 1,
        },
      },
      { upsert: true, new: true }
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

  console.log(`🚨  Seeding spike alerts for ${orgs.length} org(s)…\n`);
  let totalUpserted = 0;

  for (const org of orgs) {
    const count = await seedOrg(org);
    totalUpserted += count;
    console.log(`  ✅ org ${org._id} (${org.name || 'unnamed'}) — ${count} alerts upserted`);
  }

  console.log(`\n🎉  Done — ${totalUpserted} total spike alerts seeded`);
};

run()
  .catch((err) => { console.error('\n💥  Seed failed:', err.message); process.exit(1); })
  .finally(() => mongoose.disconnect());
