const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');

router.get('/', async (req, res) => {
  const siteId = req.query.site_id;
  const q = `SELECT id, site_id, discovery_id, type, severity, evidence, confirmed, created_at FROM vulnerabilities ${siteId ? 'WHERE site_id = $1' : ''} ORDER BY created_at DESC LIMIT 200`;
  const r = siteId ? await pool.query(q, [siteId]) : await pool.query(q);
  res.json(r.rows);
});

router.post('/:id/confirm', async (req, res) => {
  const id = req.params.id;
  await pool.query('UPDATE vulnerabilities SET confirmed = true, updated_at = now() WHERE id = $1', [id]);
  res.json({ ok: true });
});

module.exports = router;
