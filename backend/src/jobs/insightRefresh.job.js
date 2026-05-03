import cron from 'node-cron';
import BillingSnapshot from '../models/billingSnapshot.model.js';
import InsightCache from '../models/insightCache.model.js';
import { refreshInsightsForOrg } from '../services/insights.service.js';

// ── initInsightRefreshJob ──────────────────────────────────────────────────────
// Schedules a daily midnight job that:
//   1. Deletes all stale InsightCache documents (yesterday's date key)
//   2. Re-generates insights for every org that has a BillingSnapshot
//
// Cron: '0 0 * * *' = 00:00 every day (server local time)
// If server is running in UTC and you want IST midnight (18:30 UTC), use:
//   '30 18 * * *'

export const initInsightRefreshJob = () => {
  // Run at 00:00 server time every day
  cron.schedule('0 0 * * *', async () => {
    const nowISO = new Date().toISOString();
    console.log(`\n⏰ [${nowISO}] Midnight AI Insights refresh started...`);

    try {
      // ── Step 1: Delete ALL stale InsightCache docs ─────────────────────────
      const deleteResult = await InsightCache.deleteMany({});
      console.log(`🗑️  Deleted ${deleteResult.deletedCount} stale InsightCache document(s).`);

      // ── Step 2: Find all orgs that have billing data ────────────────────────
      const orgs = await BillingSnapshot.find({}, { orgId: 1 }).lean();

      if (orgs.length === 0) {
        console.log('ℹ️  No orgs with BillingSnapshot found — skipping insight generation.');
        return;
      }

      console.log(`🔄 Refreshing insights for ${orgs.length} org(s)...`);

      // ── Step 3: Regenerate for each org (sequential to avoid Groq rate limits)
      for (const { orgId } of orgs) {
        await refreshInsightsForOrg(orgId);
      }

      console.log(`✅ Midnight insight refresh complete — ${orgs.length} org(s) updated.\n`);
    } catch (err) {
      console.error('❌ Midnight insight refresh job failed:', err.message);
    }
  });

  console.log('✅ AI Insight refresh cron scheduled (daily at midnight)');
};
