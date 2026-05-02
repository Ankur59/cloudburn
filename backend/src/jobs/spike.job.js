import cron from 'node-cron';
import { detectSpikes } from '../services/spike.service.js';

// ── initSpikeJob ───────────────────────────────────────────────────────────────
// Schedules spike detection to run at the top of every hour.
// When spikes are found, emits a 'spike:detected' event to all socket.io clients.
//
// @param {import('socket.io').Server} io  — the socket.io Server instance

export const initSpikeJob = (io) => {
  // '0 * * * *' = at minute 0 of every hour
  cron.schedule('0 * * * *', async () => {
    console.log(`⏰ [${new Date().toISOString()}] Running spike detection...`);

    try {
      const spikes = await detectSpikes();

      if (spikes.length > 0) {
        spikes.forEach((spike) => {
          io.emit('spike:detected', spike);
          console.log(`📡 Emitted spike:detected for ${spike.service}`);
        });
      }
    } catch (err) {
      console.error('❌ Spike job failed:', err.message);
    }
  });

  console.log('✅ Spike detection cron scheduled (every hour)');
};
