const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const nodemailer = require('nodemailer');

(async function main(){
  logger.info('DEBUG env:', {
    MAIL_HOST: process.env.MAIL_HOST,
    MAIL_PORT: process.env.MAIL_PORT,
    MAIL_USER: process.env.MAIL_USER ? '***set***' : '(unset)',
    EMAIL_ENABLED: process.env.EMAIL_ENABLED,
    IGNORE_TLS: process.env.IGNORE_TLS,
  });

  const force = (process.env.FORCE_EMAIL_TEST || '').toLowerCase() === 'true';
  if (!force && process.env.EMAIL_ENABLED && process.env.EMAIL_ENABLED.toLowerCase() !== 'true') {
    logger.info('EMAIL_ENABLED != true and FORCE_EMAIL_TEST not set — exiting (no SMTP attempt). Set EMAIL_ENABLED=true or FORCE_EMAIL_TEST=true to force.');
    return;
  }

  const host = process.env.MAIL_HOST || 'smtp.mailtrap.io';
  const port = Number(process.env.MAIL_PORT || 2525);

  const ignoreTLS = (process.env.IGNORE_TLS || '').toLowerCase() === 'true';

  logger.info(`Attempting to connect to SMTP ${host}:${port} (ignoreTLS=${ignoreTLS}) ...`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    auth: (process.env.MAIL_USER && process.env.MAIL_PASS) ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    ignoreTLS,           
    secure: false,       
  });

  try {
    await transporter.verify();
    logger.info('transporter verified');
    const res = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'test@example.com',
      to: process.env.TEST_USER_EMAIL || 'you@example.com',
      subject: 'SMTP test',
      text: `SMTP test from Saas backend (ignoreTLS=${ignoreTLS})`,
    });
    logger.info('Sent test email id:', res.messageId || res);
  } catch (err) {
    logger.error('transporter verify/send failed:', err && err.message ? err.message : err);
    process.exitCode = 1;
  }
})();
