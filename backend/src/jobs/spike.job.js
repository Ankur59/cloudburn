import cron from 'node-cron';
import { detectSpikes } from '../services/spike.service.js';
import { sendSpikeAlertEmail } from '../services/email.service.js';
import User from '../models/user.model.js';

// ── initSpikeJob ───────────────────────────────────────────────────────────────
// Schedules spike detection to run at the top of every hour.
// When spikes are found, emits a 'spike:detected' event to all socket.io clients.
// Also sends an email to the Admin users of the affected organization.
//
// @param {import('socket.io').Server} io  — the socket.io Server instance

export const initSpikeJob = (io) => {
  // '0 * * * *' = at minute 0 of every hour
  cron.schedule('0 * * * *', async () => {
    console.log(`⏰ [${new Date().toISOString()}] Running spike detection...`);

    try {
      const spikes = await detectSpikes();

      if (spikes.length > 0) {
        for (const spike of spikes) {
          // Push notification via websockets
          io.emit('spike:detected', spike);
          console.log(`📡 Emitted spike:detected for ${spike.service}`);

          // Fetch Admin users for the organization to send email
          const admins = await User.find({ orgId: spike.orgId, role: 'Admin' });
          
          for (const admin of admins) {
            try {
              await sendSpikeAlertEmail({
                to: admin.email,
                toName: admin.name,
                service: spike.service,
                previousCost: spike.previousCost,
                currentCost: spike.currentCost,
                multiplier: spike.multiplier,
                aiExplanation: spike.aiExplanation,
              });
              console.log(`✉️ Sent spike alert email to ${admin.email}`);
            } catch (emailErr) {
              console.error(`❌ Failed to send spike email to ${admin.email}:`, emailErr.message);
            }
          }
        }
      }
    } catch (err) {
      console.error('❌ Spike job failed:', err.message);
    }
  });

  console.log('✅ Spike detection cron scheduled (every hour)');
};
