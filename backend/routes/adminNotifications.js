const logger = require('../services/logger');
const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

router.post('/mute', async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'forbidden' });
    const { site_id = null, severity = null, expires_at = null, reason = null } = req.body;
    const q = `
      INSERT INTO admin_mutes (site_id, severity, reason, muted_by, expires_at)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    const params = [site_id, severity, reason, req.user.id, expires_at];
    const { rows } = await pool.query(q, params);
    res.json({ created: rows[0] });
  } catch (err) {
    logger.error('POST /admin/mute', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

router.get('/mutes', async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'forbidden' });
    const { rows } = await pool.query('SELECT * FROM admin_mutes ORDER BY created_at DESC LIMIT 500');
    res.json(rows);
  } catch (err) {
    logger.error('GET /admin/mutes', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
