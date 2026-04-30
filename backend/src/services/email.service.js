import { config } from '../config/config.js';
import { verificationEmailTemplate } from '../templates/verificationEmail.js';
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
