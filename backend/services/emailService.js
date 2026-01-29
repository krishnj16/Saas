require('dotenv').config();
const nodemailer = require('nodemailer');

function emailsEnabled() {
  return (process.env.EMAIL_ENABLED || '').toLowerCase() === 'true';
}
function isIgnoreTls() {
  return (process.env.IGNORE_TLS || '').toLowerCase() === 'true';
}
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function tryWithRetries(fn, attempts = 2, baseDelay = 500) {
  let lastErr;
  for (let i = 0; i <= attempts; i++) {
    try { return await fn(); }
    catch (err) {
      lastErr = err;
      if (i < attempts) {
        const delay = baseDelay * Math.pow(2, i);
        logger.warn(`[emailService] attempt ${i+1} failed, retrying in ${delay}ms:`, err && err.message ? err.message : err);
        await sleep(delay);
      }
    }
  }
  throw lastErr;
}

async function sendCriticalVulnEmail({ to, userName, scan_task_id, website_url, vulnSummary }) {
  if (!emailsEnabled()) {
    logger.info('[emailService] EMAIL_ENABLED != true — skipping sendCriticalVulnEmail', { to, scan_task_id });
    return { ok: true, skipped: true };
  }

  const html = `
    <p>Hi ${userName || 'User'},</p>
    <p><strong>A critical vulnerability was found</strong> on <em>${website_url}</em>.</p>
    <ul>
      <li>Scan ID: ${scan_task_id}</li>
      <li>Critical: ${vulnSummary?.counts?.critical ?? 1}</li>
      <li>High: ${vulnSummary?.counts?.high ?? 0}</li>
    </ul>
    <p><strong>Vulnerability:</strong> ${vulnSummary?.vuln_title || vulnSummary?.text || 'Unknown'}</p>
    <p><a href="${process.env.APP_BASE_URL || 'http://localhost:4000'}/reports/${scan_task_id}">View full report</a></p>
    <p>-- SaaS Security</p>
  `;

  if (process.env.SENDGRID_API_KEY) {
    try {
      const sendGrid = require('./sendgridService');
      await sendGrid.sendEmail({
        to,
        subject: `Critical vulnerability: ${website_url}`,
        html,
        from: process.env.MAIL_FROM,
      });
      logger.info('[emailService] Sent email via SendGrid API');
      return { ok: true, via: 'sendgrid' };
    } catch (err) {
      logger.warn('[emailService] SendGrid failed, falling back to SMTP:', err && err.message ? err.message : err);
    }
  }

  const host = process.env.MAIL_HOST;
  const port = Number(process.env.MAIL_PORT || 587);
  const user = process.env.MAIL_USER || '';
  const pass = process.env.MAIL_PASS || '';

  if (!host) {
    const msg = '[emailService] MAIL_HOST not configured and no SendGrid API key — cannot send email';
    logger.warn(msg);
    throw new Error(msg);
  }

  const transportOptions = {
    host,
    port,
    secure: false, 
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: Number(process.env.MAIL_CONN_TIMEOUT || 30000),
    greetingTimeout: Number(process.env.MAIL_GREETING_TIMEOUT || 10000),
    socketTimeout: Number(process.env.MAIL_SOCKET_TIMEOUT || 30000),
    tls: { rejectUnauthorized: false },
  };

  if (isIgnoreTls()) transportOptions.ignoreTLS = true;

  const transporter = nodemailer.createTransport(transportOptions);

  await tryWithRetries(() => transporter.verify(), 2, 500);

  const info = await tryWithRetries(() => transporter.sendMail({
    from: process.env.MAIL_FROM || 'SaaS Security <no-reply@example.com>',
    to,
    subject: `Critical vulnerability: ${website_url}`,
    html,
  }), 2, 500);

  logger.info('[emailService] Sent via SMTP', info && info.messageId ? info.messageId : info);
  return { ok: true, via: 'smtp' };
}

module.exports = { sendCriticalVulnEmail };
