export const budgetEmailTemplate = ({ teamName, budgetLimit, currentSpend, percentUsed, aiExplanation, dashboardUrl }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Team Budget Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; border-bottom: 2px solid #ffedd5; padding-bottom: 20px; margin-bottom: 20px; }
    h1 { color: #f97316; margin: 0; font-size: 24px; }
    .metrics { display: flex; justify-content: space-between; margin: 20px 0; padding: 15px; background: #fff7ed; border-radius: 6px; }
    .metric { text-align: center; flex: 1; }
    .metric-label { font-size: 11px; color: #9a3412; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold; }
    .metric-value { font-size: 18px; font-weight: bold; color: #c2410c; margin-top: 5px; }
    .explanation { background: #f3f4f6; padding: 15px; border-radius: 6px; border-left: 4px solid #f97316; margin-top: 20px; font-size: 14px; }
    .btn-container { text-align: center; margin: 30px 0 10px 0; }
    .btn { background-color: #f97316; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; }
    .btn:hover { background-color: #ea580c; }
    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Team Budget Alert</h1>
    </div>
    
    <p>Hello,</p>
    <p>CloudBurn monitoring has detected that the team <strong>${teamName}</strong> has reached its monthly budget threshold.</p>
    
    <div class="metrics">
      <div class="metric">
        <div class="metric-label">Budget Limit</div>
        <div class="metric-value">$${budgetLimit.toLocaleString()}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Current Spend</div>
        <div class="metric-value">$${currentSpend.toLocaleString()}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Utilization</div>
        <div class="metric-value">${percentUsed}%</div>
      </div>
    </div>
    
    <h3>Action Recommended</h3>
    <div class="explanation">
      ${aiExplanation ? aiExplanation.replace(/\n/g, '<br/>') : 'Team spending is approaching or has exceeded the set budget limit. Please review the team resources and optimization insights.'}
    </div>
    
    <div class="btn-container">
      <a href="${dashboardUrl}" class="btn" style="color: white;">View Team Dashboard</a>
    </div>
    
    <div class="footer">
      <p>This is an automated alert from CloudBurn's Budget Management system.</p>
      <p>Ensure your AWS resources are tagged with <strong>Team: ${teamName.toLowerCase().replace(/\s+/g, '-')}</strong> for accurate tracking.</p>
    </div>
  </div>
</body>
</html>
`;
