import cron from 'node-cron';
import { checkTeamBudgets } from '../services/teamBudget.service.js';

// Runs once a day at 01:00 AM
const SCHEDULE = '0 1 * * *';

let initialized = false;

export const initTeamBudgetJob = (io) => {
  if (initialized) return;
  initialized = true;

  cron.schedule(SCHEDULE, async () => {
    console.log(`\n💰 [CRON] Team budget check triggered at ${new Date().toISOString()}`);
    try {
      const alertCount = await checkTeamBudgets();
      
      if (alertCount > 0 && io) {
        // Optional: emit a general notification if many alerts were generated
        io.emit('alert:budget_summary', { count: alertCount, timestamp: new Date() });
      }
    } catch (err) {
      console.error('💥 [CRON] Team budget job error:', err.message);
    }
  });

  console.log('💰 Team budget monitoring cron initialized — runs daily at 01:00 AM');
};
