const pool = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

async function create({ id = uuidv4(), url, owner_id, active = true }) {
  const q = `
    INSERT INTO websites (id, url, owner_id, active)
    VALUES ($1, $2, $3, $4)
    RETURNING id, url, owner_id, active, created_at, last_scan_at
  `;
  const { rows } = await pool.query(q, [id, url, owner_id, active]);
  return rows[0];
}

async function findByOwner(ownerId, limit = 100, offset = 0) {
  const q = `
    SELECT id, url, owner_id, active, created_at, last_scan_at
    FROM websites
    WHERE owner_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const { rows } = await pool.query(q, [ownerId, limit, offset]);
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT id, url, owner_id, active, created_at, last_scan_at FROM websites WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function update(id, patch) {
  const allowed = {};
  if (patch.url !== undefined) allowed.url = patch.url;
  if (patch.active !== undefined) allowed.active = patch.active;
  if (patch.last_scan_at !== undefined) allowed.last_scan_at = patch.last_scan_at;

  const keys = Object.keys(allowed);
  if (!keys.length) return findById(id);

  const setClauses = keys.map((k, i) => `${k} = $${i+2}`).join(', ');
  const values = [id, ...keys.map(k => allowed[k])];

  const q = `UPDATE websites SET ${setClauses} WHERE id = $1 RETURNING id, url, owner_id, active, created_at, last_scan_at`;
  const { rows } = await pool.query(q, values);
  return rows[0] || null;
}

async function remove(id) {
  await pool.query('DELETE FROM websites WHERE id = $1', [id]);
  return true;
}

module.exports = {
  create,
  findByOwner,
  findById,
  update,
  delete: remove,
};
