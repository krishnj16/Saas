const express = require('express');
const router = express.Router();
const { query } = require('../configs/db');
const { authenticate } = require('../middleware/auth');
const { userRateLimiter } = require('../middleware/rateLimit');
require('dotenv').config();

let scanQueue = null;
try {
  ({ scanQueue } = require('../queues/scanQueue'));
  console.info('[websites] scanQueue loaded');
} catch (e) {
  console.warn('[websites] scanQueue not loaded:', e.message);
}

router.use(authenticate);

router.post('/', async (req, res) => {
  const { url, active } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });
  try {
    const values = [url, req.user.id, active !== undefined ? active : true];
    const sql = `INSERT INTO websites (url, owner_id, active)
                 VALUES ($1, $2, $3)
                 RETURNING id, url, owner_id, active, created_at, last_scan_at, deleted_at`;
    const { rows } = await query(sql, values);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /websites error:', err.stack || err);
    if ((err.detail || '').includes('already exists'))
      return res.status(409).json({ error: 'website already exists' });
    return res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/', async (req, res) => {
  try {
    const sql = `SELECT id, url, owner_id, active, created_at, last_scan_at
                 FROM websites
                 WHERE owner_id = $1 AND deleted_at IS NULL
                 ORDER BY created_at DESC`;
    const { rows } = await query(sql, [req.user.id]);
    return res.json(rows);
  } catch (err) {
    console.error('GET /websites error:', err.stack || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `SELECT id, url, owner_id, active, created_at, last_scan_at
                 FROM websites
                 WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL`;
    const { rows } = await query(sql, [id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Website not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('GET /websites/:id error:', err.stack || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { url, active, last_scan_at } = req.body;
  const fields = [];
  const values = [];
  let idx = 1;

  if (url !== undefined) { fields.push(`url = $${idx++}`); values.push(url); }
  if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active); }
  if (last_scan_at !== undefined) { fields.push(`last_scan_at = $${idx++}`); values.push(last_scan_at); }

  if (!fields.length) return res.status(400).json({ error: 'No updatable fields provided' });

  values.push(id, req.user.id);
  try {
    const sql = `
      UPDATE websites SET ${fields.join(', ')}
      WHERE id = $${idx++} AND owner_id = $${idx} AND deleted_at IS NULL
      RETURNING id, url, owner_id, active, created_at, last_scan_at, deleted_at`;
    const { rows } = await query(sql, values);
    if (!rows.length) return res.status(404).json({ error: 'Website not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('PUT /websites/:id error:', err.stack || err);
    if ((err.detail || '').includes('already exists'))
      return res.status(409).json({ error: 'website already exists' });
    return res.status(500).json({ error: 'Internal server error' });
  }
});
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.id;
  const policy = (process.env.WEBSITES_DELETE_POLICY || 'SOFT').toUpperCase();

  try {
    if (policy === 'HARD') {
      const { rows } = await query(
        `DELETE FROM websites WHERE id = $1 AND owner_id = $2 RETURNING id`,
        [id, ownerId]
      );
      if (!rows.length) return res.status(404).json({ error: 'Website not found' });
      return res.json({ success: true, deleted: rows[0].id });
    } else {
      const { rows } = await query(
        `UPDATE websites SET deleted_at = now()
         WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
         RETURNING id, deleted_at`,
        [id, ownerId]
      );
      if (!rows.length) {
        const { rows: check } = await query(
          `SELECT id, deleted_at FROM websites WHERE id = $1 AND owner_id = $2`,
          [id, ownerId]
        );
        if (check.length && check[0].deleted_at)
          return res.status(410).json({ error: 'Website already deleted' });
        return res.status(404).json({ error: 'Website not found' });
      }
      return res.json({ success: true, website: rows[0] });
    }
  } catch (err) {
    console.error('DELETE /websites/:id error:', err.stack || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
router.post('/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `UPDATE websites SET deleted_at = NULL
       WHERE id = $1 AND owner_id = $2 AND deleted_at IS NOT NULL
       RETURNING id, url, owner_id, active, created_at, last_scan_at, deleted_at`,
      [id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Website not found or not deleted' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('POST /websites/:id/restore error:', err.stack || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post(
  '/:id/scan',
  userRateLimiter({ windowMs: 60 * 60 * 1000, max: 10 }),
  async (req, res) => {
    const websiteId = req.params.id;
    const requestedBy = req.user ? req.user.id : 'anonymous';

    try {
      const { rows } = await query(
        'SELECT id FROM websites WHERE id = $1 AND deleted_at IS NULL',
        [websiteId]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Website not found' });

      if (!scanQueue || typeof scanQueue.add !== 'function') {
        console.warn('[SCAN] scanQueue unavailable - returning simulated 202');
        return res.status(202).json({
          ok: true,
          simulated: true,
          message: 'Scan queued deferred (queue unavailable)',
        });
      }

      try {
        const job = await scanQueue.add(
          'scan-website',
          { websiteId, requestedBy },
          { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
        );
        console.info(`[SCAN] Enqueued job ${job.id} for website ${websiteId}`);
        return res.status(202).json({ enqueued: true, jobId: job.id });
      } catch (qe) {
        console.error('[SCAN] queue.add() failed:', qe.stack || qe);
        return res.status(503).json({ error: 'scan_queue_error', detail: qe.message || 'queue error' });
      }
    } catch (err) {
      console.error('[SCAN] unexpected error:', err.stack || err);
      return res.status(500).json({ error: 'Could not process request', detail: err.message || 'unknown' });
    }
  }
);

module.exports = router;
