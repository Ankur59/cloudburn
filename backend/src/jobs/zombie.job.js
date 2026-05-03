import cron from 'node-cron';
import { runZombieScanForOrg, getOrgsWithSnapshots } from '../services/zombie.service.js';

// Runs every 12 hours (at 00:00 and 12:00)
const SCHEDULE = '0 */12 * * *';

let initialized = false;

export const initZombieJob = (io) => {
  if (initialized) {
    console.warn('⚠️  Zombie scan cron already initialized — skipping duplicate registration');
    return;
  }
  initialized = true;

  cron.schedule(SCHEDULE, async () => {
    console.log(`\n🧟 [CRON] Zombie scan triggered at ${new Date().toISOString()}`);
    try {
      const orgIds = await getOrgsWithSnapshots();
      console.log(`🧟 [CRON] Scanning ${orgIds.length} organization(s)…`);

      for (const orgId of orgIds) {
        try {
          const { found, processed, newAlerts } = await runZombieScanForOrg(orgId);
          console.log(`  ✅ Org ${orgId}: ${found} zombie(s) detected, ${processed} processed`);

          // Emit real-time alerts if any new ones were found
          if (newAlerts && newAlerts.length > 0) {
            newAlerts.forEach(alert => {
              io.emit('alert:zombie', alert);
            });
            console.log(`  📡 Emitted ${newAlerts.length} zombie alerts via Socket.io`);
          }
        } catch (err) {
          console.error(`  ❌ Org ${orgId} scan failed:`, err.message);
        }
      }
    } catch (err) {
      console.error('💥 [CRON] Zombie scan error:', err.message);
    }
  });

  console.log('🧟 Zombie scan cron initialized — runs daily at midnight UTC');
};
