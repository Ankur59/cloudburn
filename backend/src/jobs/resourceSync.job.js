import cron from 'node-cron';
import { runResourceSync } from '../services/resourceSync.service.js';

// Every hour (at minute 0)
const SCHEDULE = '0 * * * *';

// FIX: Guard flag — prevents the job being registered more than once
// (e.g. if initResourceSyncJob is accidentally called multiple times).
let initialized = false;

export const initResourceSyncJob = () => {
  if (initialized) {
    console.warn('⚠️  Resource sync cron already initialized — skipping duplicate registration');
    return;
  }
  initialized = true;

  cron.schedule(SCHEDULE, async () => {
    console.log(`\n⏰ [CRON] Resource sync triggered at ${new Date().toISOString()}`);
    try {
      await runResourceSync();
    } catch (err) {
      console.error('💥 [CRON] Resource sync error:', err.message);
    }
  });

  console.log('🕐 Resource sync cron initialized — runs every hour');
};
