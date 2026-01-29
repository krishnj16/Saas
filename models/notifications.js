const pool = require('../utils/db'); 

async function createNotification({ user_id = null, site_id = null, type, severity, title, body, metadata = {} }) {
  const q = `
    INSERT INTO notifications (user_id, site_id, type, severity, title, body, metadata)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
  const params = [user_id, site_id, type, severity, title, body, metadata];
  const { rows } = await pool.query(q, params);
  return rows[0];
}

async function getNotificationsForUser({ user_id, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const q = `
    SELECT * FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const { rows } = await pool.query(q, [user_id, limit, offset]);
  return rows;
}

async function markNotificationsRead(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const placeholders = ids.map((_, i) => `$${i+1}`).join(',');
  const q = `UPDATE notifications SET is_read = true WHERE id IN (${placeholders}) RETURNING id`;
  const { rows } = await pool.query(q, ids);
  return rows.map(r => r.id);
}

async function countUnread(user_id) {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS unread FROM notifications WHERE user_id = $1 AND is_read = false`,
    [user_id]
  );
  return rows[0] ? rows[0].unread : 0;
}

module.exports = {
  createNotification,
  getNotificationsForUser,
  markNotificationsRead,
  countUnread,
};
