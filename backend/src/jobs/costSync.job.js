import cron from 'node-cron';
import { runFullSync } from '../services/costSync.service.js';

// ── Cron schedule ─────────────────────────────────────────────────────────────
// "1 0 * * *"  →  runs at 00:01 every day (just after a day ends)
const SCHEDULE = '1 0 * * *';

export const initCronJobs = () => {
  cron.schedule(SCHEDULE, async () => {
    console.log(`\n⏰ [CRON] AWS cost sync triggered at ${new Date().toISOString()}`);
    try {
      await runFullSync();
    } catch (err) {
      console.error('💥 [CRON] Unhandled sync error:', err.message);
    }
  });

  console.log('🕐 Cron jobs initialized — AWS cost sync every 12 hours');
};
