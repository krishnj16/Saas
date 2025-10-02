const db = require('../configs/db');

async function findById(id) {
  const res = await db.query('SELECT * FROM "User" WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function findByEmail(email) {
  const res = await db.query('SELECT * FROM "User" WHERE email = $1', [email]);
  return res.rows[0] || null;
}

async function getAll() {
  const res = await db.query(
    'SELECT id, email, role, "createdAt" FROM "User" ORDER BY "createdAt" ASC'
  );
  return res.rows;
}

async function createUser({ id, email, password_hash, role = 'user' }) {
  const res = await db.query(
    `INSERT INTO "User" (id, email, password_hash, role, "createdAt")
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [id, email, password_hash, role]
  );
  return res.rows[0];
}

async function updateUser(id, fields = {}) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findById(id);

  const set = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
  const values = keys.map(k => fields[k]);
  values.push(id);

  const res = await db.query(
    `UPDATE "User" SET ${set} WHERE id = $${keys.length + 1} RETURNING *`,
    values
  );
  return res.rows[0];
}

async function deleteUser(id) {
  await db.query('DELETE FROM "User" WHERE id = $1', [id]);
  return true;
}

module.exports = { findById, findByEmail, getAll, createUser, updateUser, deleteUser };
