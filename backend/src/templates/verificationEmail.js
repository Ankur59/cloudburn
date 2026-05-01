/**
 * Generates the HTML body for the email-verification email.
 *
 * @param {object} options
 * @param {string} options.name             - Recipient's first / full name
 * @param {string} options.verificationUrl  - Full URL the user must visit
 * @returns {string} HTML string
 */
export const verificationEmailTemplate = ({
  name,
  verificationUrl,
}) => /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your CloudBurn email</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f0f13; font-family: 'Inter', sans-serif; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 40px auto; padding: 0 16px; }

    /* Card */
    .card {
      background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 16px;
      overflow: hidden;
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);
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
      letter-spacing: -0.5px;
    }
    .logo-icon {
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.2);
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    /* Body */
    .body { padding: 40px; }

    .greeting {
      font-size: 24px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 12px;
    }

    .text {
      font-size: 15px;
      line-height: 1.7;
      color: #94a3b8;
      margin-bottom: 16px;
    }

    /* CTA Button */
    .btn-wrap { text-align: center; margin: 32px 0; }
    .btn {
      display: inline-block;
      padding: 14px 36px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 600;
      border-radius: 10px;
      letter-spacing: 0.3px;
      box-shadow: 0 4px 24px rgba(99,102,241,0.4);
    }

    /* Expiry badge */
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

    /* Divider */
    .divider {
      border: none;
      border-top: 1px solid rgba(99,102,241,0.15);
      margin: 28px 0;
    }

    /* Fallback URL */
    .fallback { font-size: 13px; color: #64748b; line-height: 1.6; }
    .fallback a { color: #818cf8; word-break: break-all; text-decoration: none; }

    /* Footer */
    .footer {
      background: rgba(0,0,0,0.3);
      padding: 20px 40px;
      text-align: center;
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
    }
    .footer a { color: #6366f1; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">

      <!-- Header -->
      <div class="header">
        <div class="logo">
          <span class="logo-icon">🔥</span>
          CloudBurn
        </div>
      </div>

      <!-- Body -->
      <div class="body">
        <p class="greeting">Hey, ${name}! 👋</p>
        <p class="text">
          Welcome to <strong style="color:#a5b4fc;">CloudBurn</strong> — your multi-cloud cost intelligence platform.
          One quick step before you dive in: please verify your email address to activate your account.
        </p>

        <span class="expiry">⏳ Link expires in 24 hours</span>

        <div class="btn-wrap">
          <a href="${verificationUrl}" class="btn">Verify My Email</a>
        </div>

        <p class="text">
          If the button doesn't work, copy and paste the link below into your browser:
        </p>

        <hr class="divider" />

        <p class="fallback">
          <a href="${verificationUrl}">${verificationUrl}</a>
        </p>

        <hr class="divider" />

        <p class="text" style="font-size:13px; color:#475569;">
          If you didn't create a CloudBurn account, you can safely ignore this email —
          no action is needed and your information will not be used.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        © ${new Date().getFullYear()} CloudBurn. All rights reserved.<br />
        You're receiving this because someone signed up with this email address.
      </div>

    </div>
  </div>
</body>
</html>
`;
