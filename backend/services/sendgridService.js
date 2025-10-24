require('dotenv').config();
const fetch = require('node-fetch');

async function sendEmail({ to, subject, html, from }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error('SENDGRID_API_KEY not configured');

  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: {
      email: from || process.env.MAIL_FROM || 'no-reply@example.com',
      name: 'SaaS Security',
    },
    subject,
    content: [{ type: 'text/html', value: html }],
  };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    timeout: 15000,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendGrid failed: ${res.status} ${body}`);
  }
  return true;
}

module.exports = { sendEmail };
