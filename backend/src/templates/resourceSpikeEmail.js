/**
 * Resource spike alert email template.
 * Minimal design — plain text feel, no heavy colors.
 */
export const resourceSpikeEmailTemplate = ({
  recipientName,
  service,
  resourceId,
  metricName,
  region,
  teamId,
  teamName,
  previousValue,
  currentValue,
  multiplier,
  detectedAt,
  dashboardUrl,
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Resource Spike Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #222; background: #fff; margin: 0; padding: 20px; }
    .wrap { max-width: 560px; margin: 0 auto; }
    h2 { font-size: 18px; margin: 0 0 4px 0; }
    .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    td { padding: 8px 10px; border: 1px solid #e0e0e0; font-size: 13px; }
    td:first-child { width: 40%; color: #555; font-weight: 500; background: #f7f7f7; }
    .values { display: flex; gap: 16px; margin: 16px 0; }
    .val-box { flex: 1; border: 1px solid #e0e0e0; padding: 10px 14px; border-radius: 4px; }
    .val-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; }
    .val-num { font-size: 20px; font-weight: 600; margin-top: 2px; }
    .val-num.spike { color: #c0392b; }
    hr { border: none; border-top: 1px solid #eee; margin: 20px 0; }
    .footer { font-size: 12px; color: #999; }
    a { color: #2563eb; }
  </style>
</head>
<body>
<div class="wrap">

  <h2>⚠️ Resource Spike Detected</h2>
  <p class="sub">CloudBurn detected an unusual metric increase on ${new Date(detectedAt).toUTCString()}</p>

  <table>
    <tr><td>Service</td><td>${service}</td></tr>
    <tr><td>Resource ID</td><td>${resourceId}</td></tr>
    <tr><td>Metric</td><td>${metricName}</td></tr>
    <tr><td>Region</td><td>${region}</td></tr>
    ${teamId ? `<tr><td>Team</td><td>${teamName || teamId}</td></tr>` : '<tr><td>Team</td><td>Untagged resource</td></tr>'}
  </table>

  <div class="values">
    <div class="val-box">
      <div class="val-label">2–3 hours ago</div>
      <div class="val-num">${previousValue}</div>
    </div>
    <div class="val-box">
      <div class="val-label">Current</div>
      <div class="val-num spike">${currentValue}</div>
    </div>
    <div class="val-box">
      <div class="val-label">Increase</div>
      <div class="val-num spike">${multiplier}×</div>
    </div>
  </div>

  <p>
    Hi ${recipientName}, this alert was triggered because <strong>${metricName}</strong>
    on <strong>${resourceId}</strong> increased by <strong>${multiplier}×</strong>
    compared to 2–3 hours ago. Please review the resource in your AWS console.
  </p>

  <p><a href="${dashboardUrl}">View CloudBurn Dashboard →</a></p>

  <hr>
  <p class="footer">
    Automated alert from CloudBurn. Detected at ${new Date(detectedAt).toUTCString()}.
  </p>

</div>
</body>
</html>
`;
