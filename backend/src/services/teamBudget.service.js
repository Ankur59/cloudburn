import Team from '../models/team.model.js';
import Organization from '../models/organization.model.js';
import SpikeAlert from '../models/spikeAlert.model.js';
import { getCostByTeam } from './aws/cost.service.js';
import { fmt, startOfMonth, today } from './aws/utils.service.js';
import { sendBudgetAlertEmail } from './email.service.js';

/**
 * Checks all teams in all organizations for budget threshold breaches.
 * Runs daily. Creates 'BUDGET' alerts when spending exceeds thresholds.
 */
export const checkTeamBudgets = async () => {
  console.log(`\n📅 [${new Date().toISOString()}] Running team budget threshold checks...`);
  
  const orgs = await Organization.find({ awsAccessKey: { $ne: null } }).select('+awsAccessKey +awsSecretKey');
  
  let totalAlerts = 0;

  for (const org of orgs) {
    try {
      const teams = await Team.find({ orgId: org._id });
      if (teams.length === 0) continue;

      // Get current month's cost grouped by Team tag
      // Passing startOfMonth() to ensure we track from the 1st of the current month
      const costs = await getCostByTeam(org.awsAccessKey, org.awsSecretKey, startOfMonth(), today());
      
      for (const team of teams) {
        const teamCostData = costs.find(c => c.team.toLowerCase() === team.teamKey.toLowerCase());
        const currentSpend = teamCostData ? teamCostData.cost : 0;
        
        // Always update the currentSpend in the Team model for easy frontend display
        await Team.findByIdAndUpdate(team._id, { currentSpend: +currentSpend.toFixed(2) });

        if (team.budgetLimit <= 0) continue;

        const percentUsed = (currentSpend / team.budgetLimit) * 100;
        
        if (percentUsed >= team.alertThreshold) {
          const todayStr = fmt(new Date());
          
          // 1) Upsert alert to prevent duplicates for the same day
          await SpikeAlert.findOneAndUpdate(
            { 
              orgId: org._id, 
              teamId: team._id, 
              date: todayStr, 
              alertType: 'BUDGET' 
            },
            {
              $set: {
                service: 'All Services',
                currentCost: +currentSpend.toFixed(2),
                previousCost: team.budgetLimit,
                multiplier: +percentUsed.toFixed(2),
                message: `Team "${team.name}" has reached ${percentUsed.toFixed(1)}% of its monthly budget ($${currentSpend.toFixed(2)} / $${team.budgetLimit}).`,
                aiExplanation: `Budget threshold reached for team ${team.name}. Threshold: ${team.alertThreshold}%. Current usage: ${percentUsed.toFixed(1)}%. Recommend reviewing resource tags and team spending patterns.`,
                isRead: false
              }
            },
            { upsert: true }
          );

          // 2) Send Email Alert to Organization contact
          sendBudgetAlertEmail({
            to: org.email,
            toName: org.name,
            teamName: team.name,
            budgetLimit: team.budgetLimit,
            currentSpend: +currentSpend.toFixed(2),
            percentUsed: +percentUsed.toFixed(1),
            aiExplanation: `Your team "${team.name}" has hit its alert threshold. Current spend is $${currentSpend.toFixed(2)} which is ${percentUsed.toFixed(1)}% of the $${team.budgetLimit} budget.`
          }).catch(err => console.error(`  [email] Budget alert failed for ${team.name}:`, err.message));
          
          totalAlerts++;
          console.log(`🚨 [BUDGET] Alert created & Email sent for Team: ${team.name} (${percentUsed.toFixed(1)}%)`);
        }
      }
    } catch (err) {
      console.error(`❌ Failed to check budgets for org ${org._id}:`, err.message);
    }
  }

  console.log(`✅ Team budget check complete. ${totalAlerts} alert(s) generated.`);
  return totalAlerts;
};
