/**
 * Manual cost-sync script
 *
 * Usage:
 *   node scripts/syncCosts.js                  # sync all connected orgs
 *   node scripts/syncCosts.js --orgId <id>      # sync one specific org
 *
 * The script connects to MongoDB, runs the same logic the cron uses,
 * prints a full report, then exits cleanly.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { runFullSync, syncOrgCosts } from '../src/services/costSync.service.js';
import Organization from '../src/models/organization.model.js';

// ── Parse CLI args ────────────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const orgIdx = args.indexOf('--orgId');
const orgId  = orgIdx !== -1 ? args[orgIdx + 1] : null;

// ── Helpers ───────────────────────────────────────────────────────────────────
const hr  = () => console.log('─'.repeat(60));
const fmt = (n) => (typeof n === 'number' ? n.toFixed(6) : n);

const printSummary = (result) => {
  const { summary, orgs } = result;

  hr();
  console.log('📊  SYNC SUMMARY');
  hr();
  console.log(`  Orgs total       : ${summary.orgsTotal}`);
  console.log(`  Orgs succeeded   : ${summary.orgsSucceeded}`);
  console.log(`  Orgs failed      : ${summary.orgsFailed}`);
  console.log(`  Records inserted : ${summary.totalRecords}`);
  console.log(`  Total cost (USD) : $${fmt(summary.totalCost)}`);
  console.log(`  Duration         : ${summary.durationMs}ms`);
  console.log(`  Started at       : ${summary.startedAt}`);
  console.log(`  Finished at      : ${summary.finishedAt}`);
  hr();

  console.log('\n📋  PER-ORG DETAILS');
  orgs.forEach((org, i) => {
    hr();
    console.log(`  [${i + 1}] Org ID   : ${org.orgId}`);
    console.log(`      Status  : ${org.status === 'ok' ? '✅ ok' : `❌ ${org.error}`}`);
    if (org.status === 'ok') {
      console.log(`      Days    : ${org.datesProcessed} (${org.dateRange?.start} → ${org.dateRange?.end})`);
      console.log(`      Records : ${org.recordsInserted}`);
      console.log(`      Cost    : $${fmt(org.totalCost)}`);
    }
  });
  hr();
};

// ── Main ──────────────────────────────────────────────────────────────────────
const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌  MONGO_URI is not set in .env');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(mongoUri);
  console.log('✅  MongoDB connected\n');

  let result;

  if (orgId) {
    console.log(`🎯  Syncing single org: ${orgId}`);
    const org = await Organization
      .findById(orgId)
      .select('+awsAccessKey +awsSecretKey')
      .lean();

    if (!org) {
      console.error('❌  Organization not found.');
      await mongoose.disconnect();
      process.exit(1);
    }

    if (!org.awsAccessKey) {
      console.error('❌  AWS credentials not configured for this org.');
      await mongoose.disconnect();
      process.exit(1);
    }

    const stats = await syncOrgCosts(org);
    result = {
      summary: {
        orgsTotal:     1,
        orgsSucceeded: 1,
        orgsFailed:    0,
        totalRecords:  stats.recordsInserted,
        totalCost:     stats.totalCost,
        durationMs:    0,
        startedAt:     new Date(),
        finishedAt:    new Date(),
      },
      orgs: [{ status: 'ok', ...stats }],
    };
  } else {
    console.log('🔄  Syncing all connected orgs…\n');
    result = await runFullSync();
  }

  printSummary(result);
};

run()
  .catch((err) => {
    console.error('\n💥  Script failed:', err.message);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
