import cron from 'node-cron';
import Organization from '../models/organization.model.js';
import { refreshBillingSnapshotForOrg } from '../services/billingSnapshot.service.js';

// ── initBillingSnapshotJob ──────────────────────────────────────────────────────
// Runs at 8:00 PM (20:00) IST every day to sync Billing Snapshots for all orgs
// cron.schedule('0 20 * * *') -> 20:00 PM
export const initBillingSnapshotJob = () => {
  cron.schedule('0 20 * * *', async () => {
    const nowISO = new Date().toISOString();
    console.log(`\n⏰ [${nowISO}] 8:00 PM Billing Snapshot sync started...`);

    try {
      const orgs = await Organization
        .find({ awsAccessKey: { $exists: true, $ne: null } })
        .select('_id')
        .lean();

      if (orgs.length === 0) {
        console.log('ℹ️  No connected orgs found — skipping billing snapshot sync.');
        return;
      }

      console.log(`🔄 Refreshing billing snapshot for ${orgs.length} org(s)...`);

      for (const org of orgs) {
        try {
          await refreshBillingSnapshotForOrg(org._id);
          console.log(`  ✅ Successfully refreshed org ${org._id}`);
        } catch (err) {
          console.error(`  ❌ Failed to refresh org ${org._id}:`, err.message);
        }
      }

      console.log(`✅ 8:00 PM Billing Snapshot sync complete.\n`);
    } catch (err) {
      console.error('❌ Billing Snapshot sync job failed:', err.message);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('✅ Billing Snapshot cron scheduled (daily at 8:00 PM IST)');
};
