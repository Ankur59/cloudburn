import { config } from '../config/config.js';
import { verificationEmailTemplate } from '../templates/verificationEmail.js';
import { invitationEmailTemplate } from '../templates/invitationEmail.js';
import AppError from '../utils/AppError.js';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// ── Core sender ───────────────────────────────────────────────────────────────
// Low-level function — reusable for any email type in the app.
//
//  @param {object} options
//  @param {string} options.to       - Recipient email address
//  @param {string} options.toName   - Recipient display name
//  @param {string} options.subject  - Email subject line
//  @param {string} options.html     - Full HTML body string

const sendEmail = async ({ to, toName, subject, html }) => {
  if (!config.BREVO_API_KEY) {
    console.warn('⚠️  BREVO_API_KEY not set — email sending skipped.');
    return;
  }

  const payload = {
    sender: { name: config.EMAIL_FROM_NAME, email: config.EMAIL_FROM },
    to:     [{ email: to, name: toName }],
    subject,
    htmlContent: html,
  };

  const response = await fetch(BREVO_API_URL, {
    method:  'POST',
    headers: {
      'accept':       'application/json',
      'api-key':      config.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new AppError(
      `Email delivery failed: ${error.message || response.statusText}`,
      502
    );
  }

  return response.json(); // { messageId: '...' }
};

// ── Specific email senders ────────────────────────────────────────────────────
// Add new email types here — each one composes sendEmail with a specific
// template and subject, keeping calling code clean.

/**
 * Sends the email-verification link to a newly registered user.
 *
 * @param {object} options
 * @param {string} options.to                   - Recipient email
 * @param {string} options.name                 - Recipient name
 * @param {string} options.emailVerificationToken - Raw (unhashed) token
 */
export const sendVerificationEmail = ({ to, name, emailVerificationToken }) => {
  const verificationUrl = `${config.CLIENT_URL}/verify-email?token=${emailVerificationToken}`;

  return sendEmail({
    to,
    toName:  name,
    subject: '✅ Verify your CloudBurn email',
    html:    verificationEmailTemplate({ name, verificationUrl }),
  });
};

/**
 * Sends a Team Lead invitation link to the invitee.
 *
 * @param {object} options
 * @param {string} options.to          - Invitee email
 * @param {string} options.inviterName - Admin's name
 * @param {string} options.teamName    - Team being joined
 * @param {string} options.orgName     - Organization name
 * @param {string} options.rawToken    - Raw (unhashed) invite token
 */
export const sendInvitationEmail = ({ to, inviterName, teamName, orgName, rawToken }) => {
  const inviteUrl = `${config.CLIENT_URL}/accept-invite?token=${rawToken}`;

  return sendEmail({
    to,
    toName:  to,
    subject: `🎉 You're invited to join ${orgName} on CloudBurn`,
    html:    invitationEmailTemplate({ inviterName, teamName, orgName, inviteUrl }),
  });
};

import { spikeEmailTemplate } from '../templates/spikeEmail.js';

/**
 * Sends a Cost Spike Alert email to organization members.
 */
export const sendSpikeAlertEmail = ({ to, toName, service, previousCost, currentCost, multiplier, aiExplanation }) => {
  const dashboardUrl = `${config.CLIENT_URL}/dashboard`;

  return sendEmail({
    to,
    toName: toName || to,
    subject: `🚨 CRITICAL: AWS Cost Spike on ${service}`,
    html: spikeEmailTemplate({ service, previousCost, currentCost, multiplier, aiExplanation, dashboardUrl }),
  });
};
