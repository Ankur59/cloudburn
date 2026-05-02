export const spikeEmailTemplate = ({ service, previousCost, currentCost, multiplier, aiExplanation, dashboardUrl }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AWS Cost Spike Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; border-bottom: 2px solid #fee2e2; padding-bottom: 20px; margin-bottom: 20px; }
    h1 { color: #dc2626; margin: 0; font-size: 24px; }
    .metrics { display: flex; justify-content: space-between; margin: 20px 0; padding: 15px; background: #fef2f2; border-radius: 6px; }
    .metric { text-align: center; }
    .metric-label { font-size: 12px; color: #7f1d1d; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold; }
    .metric-value { font-size: 20px; font-weight: bold; color: #b91c1c; margin-top: 5px; }
    .explanation { background: #f3f4f6; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin-top: 20px; font-size: 14px; }
    .btn-container { text-align: center; margin: 30px 0 10px 0; }
    .btn { background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; }
    .btn:hover { background-color: #b91c1c; }
    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Critical AWS Cost Spike Detected</h1>
    </div>
    
    <p>Hello,</p>
    <p>CloudBurn has detected an unusual cost increase for <strong>${service}</strong> in your AWS account.</p>
    
    <div class="metrics">
      <div class="metric">
        <div class="metric-label">Previous Cost</div>
        <div class="metric-value">$${previousCost.toFixed(2)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Current Cost</div>
        <div class="metric-value">$${currentCost.toFixed(2)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Increase</div>
        <div class="metric-value">${multiplier.toFixed(1)}x</div>
      </div>
    </div>
    
    <h3>AI Analysis</h3>
    <div class="explanation">
      ${aiExplanation ? aiExplanation.replace(/\n/g, '<br/>') : 'Cost increased significantly over the last 24 hours.'}
    </div>
    
    <div class="btn-container">
      <a href="${dashboardUrl}" class="btn" style="color: white;">View Dashboard</a>
    </div>
    
    <div class="footer">
      <p>This is an automated alert from CloudBurn's anomaly detection system.</p>
    </div>
  </div>
</body>
</html>
`;
