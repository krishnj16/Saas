// backend/workers/emitNotification.js
const pool = require('../utils/db');
const { createNotification } = require('../models/notifications');
const { TYPE, SEVERITY } = require('../constants/notifications');
const logger = require('../services/logger');

async function isMuted(site_id, severity) {
  const now = new Date().toISOString();
  const q = `
    SELECT 1 FROM admin_mutes
    WHERE (site_id = $1 OR site_id IS NULL)
      AND (severity = $2 OR severity IS NULL)
      AND (expires_at IS NULL OR expires_at > $3)
    LIMIT 1
  `;
  const { rows } = await pool.query(q, [site_id, severity, now]);
  return rows.length > 0;
}

async function getUserEffectiveSettings(user_id, site_id) {
  const q = `
    SELECT settings FROM user_site_notification_settings
    WHERE user_id = $1 AND site_id = $2
    UNION
    SELECT settings FROM user_notification_settings WHERE user_id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(q, [user_id, site_id]);
  return rows[0] ? rows[0].settings : {};
}

async function emitEventNotification({ site_id = null, user_id_list = [], type, severity, title, body, metadata = {} , sendEmailFn = null}) {
  if (await isMuted(site_id, severity)) {
    logger.info('muted notification', { site_id, severity });
    return;
  }

  for (const uid of user_id_list) {
    const settings = await getUserEffectiveSettings(uid, site_id);
    const inApp = (settings.in_app && settings.in_app[severity]) ?? true; 
    const emailOptIn = (settings.email && settings.email[severity]) ?? false; 

    if (inApp) {
      await createNotification({ user_id: uid, site_id, type, severity, title, body, metadata });
    }

    if (emailOptIn && typeof sendEmailFn === 'function') {
      try {
        await sendEmailFn(uid, { title, body, severity, metadata });
      } catch (e) {
        logger.error('email send failed for user', { userId: uid, error: e });
      }
    }
  }
}

module.exports = {
  emitEventNotification,
  isMuted,
};
