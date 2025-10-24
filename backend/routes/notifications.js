const express = require('express');
const router = express.Router();
const { getNotificationsForUser, markNotificationsRead, countUnread } = require('../models/notifications');
const pool = require('../utils/db');
router.get('/', async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Number(req.query.limit || 20));

    const items = await getNotificationsForUser({ user_id: userId, page, limit });
    const unread = await countUnread(userId);
    res.json({ page, limit, unread, items });
  } catch (err) {
    console.error('GET /notifications error', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

router.post('/mark-read', async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
    if (ids.length === 0) return res.status(400).json({ error: 'no_ids_provided' });

    const { rows } = await pool.query(
      `SELECT id FROM notifications WHERE id = ANY($1::bigint[]) AND (user_id = $2)`,
      [ids, userId]
    );
    const allowedIds = rows.map(r => r.id);
    if (allowedIds.length === 0) return res.status(403).json({ error: 'no_matching_notifications' });

    const marked = await markNotificationsRead(allowedIds);
    res.json({ marked, count: marked.length });
  } catch (err) {
    console.error('POST /notifications/mark-read error', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
