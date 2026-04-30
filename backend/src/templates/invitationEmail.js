/**
 * HTML email template for Team Lead invitations.
 *
 * @param {object} options
 * @param {string} options.inviterName  - Name of the Admin who sent the invite
 * @param {string} options.teamName     - Name of the team
 * @param {string} options.orgName      - Name of the organization
 * @param {string} options.inviteUrl    - Full accept-invite URL with token
 * @returns {string} HTML string
 */
export const invitationEmailTemplate = ({ inviterName, teamName, orgName, inviteUrl }) => /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to CloudBurn</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f0f13; font-family: 'Inter', sans-serif; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 40px auto; padding: 0 16px; }

    .card {
      background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
      border: 1px solid rgba(6, 182, 212, 0.25);
      border-radius: 16px;
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #0891b2 0%, #6366f1 50%, #8b5cf6 100%);
      padding: 36px 40px;
      text-align: center;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
    }
    .logo-icon {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.2);
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .badge {
      display: inline-block;
      margin-top: 14px;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      padding: 5px 16px;
      border-radius: 20px;
      letter-spacing: 0.5px;
    }

    .body { padding: 40px; }

    .greeting { font-size: 24px; font-weight: 700; color: #f1f5f9; margin-bottom: 12px; }
    .text { font-size: 15px; line-height: 1.7; color: #94a3b8; margin-bottom: 16px; }

    .info-card {
      background: rgba(99,102,241,0.08);
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: 10px;
      padding: 16px 20px;
      margin: 20px 0 28px;
    }
    .info-row { display: flex; gap: 8px; font-size: 14px; color: #94a3b8; margin-bottom: 6px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { color: #64748b; min-width: 80px; }
    .info-value { color: #e2e8f0; font-weight: 500; }

    .expiry {
      display: inline-block;
      background: rgba(245,158,11,0.12);
      border: 1px solid rgba(245,158,11,0.3);
      color: #fbbf24;
      font-size: 13px;
      font-weight: 500;
      padding: 6px 14px;
      border-radius: 20px;
      margin-bottom: 28px;
    }

    .btn-wrap { text-align: center; margin: 28px 0; }
    .btn {
      display: inline-block;
      padding: 14px 40px;
      background: linear-gradient(135deg, #0891b2, #6366f1);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 600;
      border-radius: 10px;
      box-shadow: 0 4px 24px rgba(6,182,212,0.35);
    }

    .divider { border: none; border-top: 1px solid rgba(99,102,241,0.15); margin: 24px 0; }
    .fallback { font-size: 13px; color: #64748b; line-height: 1.6; }
    .fallback a { color: #818cf8; word-break: break-all; text-decoration: none; }

    .footer {
      background: rgba(0,0,0,0.3);
      padding: 20px 40px;
      text-align: center;
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">

      <div class="header">
        <div class="logo">
          <span class="logo-icon">🔥</span>
          CloudBurn
        </div>
        <div class="badge">Team Lead Invitation</div>
      </div>

      <div class="body">
        <p class="greeting">You've been invited! 🎉</p>
        <p class="text">
          <strong style="color:#a5b4fc;">${inviterName}</strong> has invited you to join
          <strong style="color:#67e8f9;">${orgName}</strong> on CloudBurn as the
          Team Lead for the <strong style="color:#a5b4fc;">${teamName}</strong> team.
        </p>

        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Organization</span>
            <span class="info-value">${orgName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Team</span>
            <span class="info-value">${teamName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Your Role</span>
            <span class="info-value">Team Lead</span>
          </div>
          <div class="info-row">
            <span class="info-label">Invited by</span>
            <span class="info-value">${inviterName}</span>
          </div>
        </div>

        <span class="expiry">⏳ Invitation expires in 12 hours</span>

        <div class="btn-wrap">
          <a href="${inviteUrl}" class="btn">Accept Invitation</a>
        </div>

        <p class="text">Clicking the button will take you to a page where you can create your account and get started.</p>

        <hr class="divider" />

        <p class="fallback">
          If the button doesn't work, copy and paste this link:<br />
          <a href="${inviteUrl}">${inviteUrl}</a>
        </p>

        <hr class="divider" />

        <p class="text" style="font-size:13px; color:#475569;">
          If you weren't expecting this invitation, you can safely ignore this email.
        </p>
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} CloudBurn. All rights reserved.
      </div>

    </div>
  </div>
</body>
</html>
`;
