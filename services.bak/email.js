const pool = require('../utils/db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendNotificationEmailToUser(user_id, { title, body, severity, metadata }) {
  const { rows } = await pool.query('SELECT email, id FROM "User" WHERE id = $1', [user_id]);
  if (!rows[0] || !rows[0].email) return false;
  const email = rows[0].email;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `[${severity.toUpperCase()}] ${title}`,
    text: `${body}\n\nDetails: ${JSON.stringify(metadata)}`,
  });

  return true;
}

module.exports = { sendNotificationEmailToUser };
