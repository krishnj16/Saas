// // tests/helpers/setupNotificationTest.js
// // FINAL VERSION - handles password, password_hash, role, owner_id/user_id

// const pool = require('../../utils/db');
// const { randomUUID } = require('crypto');

// async function getColumns(table) {
//   const q = `
//     SELECT column_name
//     FROM information_schema.columns
//     WHERE table_schema='public' AND table_name=$1
//   `;
//   const { rows } = await pool.query(q, [table]);
//   return rows.map(r => r.column_name);
// }

// async function findTable(candidates) {
//   for (const t of candidates) {
//     const cols = await getColumns(t);
//     if (cols.length > 0) return { table: t, cols };
//   }
//   return null;
// }

// // ---------------------------
// // CREATE USER
// // ---------------------------
// async function createTestUser() {
//   const found = await findTable(['users', 'User']);
//   if (!found) throw new Error('No users table exists');

//   const { table, cols } = found;

//   const id = randomUUID();
//   const email = `jest-${Date.now()}-${id.slice(0, 6)}@example.com`;

//   const insertCols = ['id', 'email'];
//   const values = [id, email];
//   const placeholders = ['$1', '$2'];
//   let i = 3;

//   // If table has NOT NULL password, insert dummy value
//   if (cols.includes('password')) {
//     insertCols.push('password');
//     values.push('test-password');
//     placeholders.push(`$${i++}`);
//   }

//   // Optional password_hash
//   if (cols.includes('password_hash')) {
//     insertCols.push('password_hash');
//     values.push(null);
//     placeholders.push(`$${i++}`);
//   }

//   // Optional role
//   if (cols.includes('role')) {
//     insertCols.push('role');
//     values.push('test');
//     placeholders.push(`$${i++}`);
//   }

//   const q = `
//     INSERT INTO ${table} (${insertCols.join(', ')})
//     VALUES (${placeholders.join(', ')})
//     RETURNING id
//   `;

//   const { rows } = await pool.query(q, values);
//   return rows[0].id;
// }

// // ---------------------------
// // CREATE WEBSITE
// // ---------------------------
// async function createTestSite(userId) {
//   const found = await findTable(['websites']);
//   if (!found) throw new Error('No websites table exists');
//   const { cols } = found;

//   const id = randomUUID();
//   const url = `http://${id.slice(0, 6)}.test`;

//   const ownerCol = cols.includes('owner_id')
//     ? 'owner_id'
//     : cols.includes('user_id')
//     ? 'user_id'
//     : null;

//   if (!ownerCol) {
//     throw new Error('websites table missing owner_id/user_id');
//   }

//   const insertCols = ['id', ownerCol, 'url'];
//   const placeholders = ['$1', '$2', '$3'];
//   const values = [id, userId, url];

//   let q;
//   if (cols.includes('created_at')) {
//     q = `
//       INSERT INTO websites (${insertCols.join(', ')}, created_at)
//       VALUES (${placeholders.join(', ')}, NOW())
//       RETURNING id
//     `;
//   } else {
//     q = `
//       INSERT INTO websites (${insertCols.join(', ')})
//       VALUES (${placeholders.join(', ')})
//       RETURNING id
//     `;
//   }

//   const { rows } = await pool.query(q, values);
//   return rows[0].id;
// }

// // ---------------------------
// // CLEANUP
// // ---------------------------
// async function cleanup(created = { users: [], sites: [], notifications: [] }) {
//   try {
//     if (created.notifications.length)
//       await pool.query(`DELETE FROM notifications WHERE id = ANY($1)`, [
//         created.notifications,
//       ]);
//   } catch {}

//   try {
//     if (created.sites.length)
//       await pool.query(`DELETE FROM websites WHERE id = ANY($1)`, [
//         created.sites,
//       ]);
//   } catch {}

//   try {
//     if (created.users.length) {
//       await pool.query(`DELETE FROM users WHERE id = ANY($1)`, [
//         created.users,
//       ]);
//       await pool.query(`DELETE FROM "User" WHERE id = ANY($1)`, [
//         created.users,
//       ]);
//     }
//   } catch {}
// }

// module.exports = {
//   createTestUser,
//   createTestSite,
//   cleanup,
// };
// const pool = require('../../services/db');
// const { v4: uuid } = require('uuid');

// async function tryQuery(q, params = []) {
//   try {
//     return await pool.query(q, params);
//   } catch (err) {
//     return null;
//   }
// }

// async function createTestUser({ emailPrefix = 'jest-helper' } = {}) {
//   const id = uuid();
//   const email = `${emailPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}@example.com`;
//   const password = 'hashedpassword123';

//   // Try lowercase 'users'
//   let q = `INSERT INTO users (id, email, role, password, created_at) VALUES ($1,$2,$3,$4, now()) RETURNING id`;
//   let res = await tryQuery(q, [id, email, 'user', password]);
  
//   // Fallback: try without role if column doesn't exist
//   if (!res) {
//     q = `INSERT INTO users (id, email, password, created_at) VALUES ($1,$2,$3, now()) RETURNING id`;
//     res = await tryQuery(q, [id, email, password]);
//   }
  
//   if (res && res.rows && res.rows[0]) return res.rows[0].id;
//   throw new Error('Could not insert test user.');
// }

// async function createTestSite(ownerId, { url = null } = {}) {
//   const siteId = uuid();
//   // Stronger randomness for URL
//   const finalUrl = url || `http://test-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.com`;

//   // Try 'owner_id' first
//   let q = `INSERT INTO websites (id, owner_id, url, created_at) VALUES ($1,$2,$3, now()) RETURNING id`;
//   let res = await tryQuery(q, [siteId, ownerId, finalUrl]);
//   if (res && res.rows && res.rows[0]) return res.rows[0].id;

//   throw new Error('Could not insert test site. Check FK constraints.');
// }

// async function cleanup(created = {}) {
//   const { notifications = [], websites = [], users = [] } = created;

//   if (notifications.length) {
//     // Handle both Int and UUID
//     try { await pool.query(`DELETE FROM notifications WHERE id = ANY($1::int[])`, [notifications]); } catch (e) {}
//     try { await pool.query(`DELETE FROM notifications WHERE id = ANY($1::uuid[])`, [notifications]); } catch (e) {}
//   }

//   if (websites.length) {
//     try { await pool.query(`DELETE FROM websites WHERE id = ANY($1::uuid[])`, [websites]); } catch (e) {}
//   }

//   if (users.length) {
//      try { await pool.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [users]); } catch (e) {}
//   }
// }

// module.exports = { createTestUser, createTestSite, cleanup };
const pool = require('../../services/db');
const { v4: uuid } = require('uuid');

async function tryQuery(q, params = []) {
  try {
    return await pool.query(q, params);
  } catch (err) {
    return null;
  }
}

async function createTestUser({ emailPrefix = 'jest-helper' } = {}) {
  const id = uuid();
  const email = `${emailPrefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  const password = 'hashedpassword123'; 

  // FIX: Use 'password' column (correct per schema)
  let q = `INSERT INTO users (id, email, role, password, created_at) VALUES ($1,$2,$3,$4, now()) RETURNING id`;
  let res = await tryQuery(q, [id, email, 'user', password]);
  
  if (!res) {
     q = `INSERT INTO users (id, email, password, created_at) VALUES ($1,$2,$3, now()) RETURNING id`;
     res = await tryQuery(q, [id, email, password]);
  }

  if (res && res.rows && res.rows[0]) return res.rows[0].id;
  throw new Error('Could not insert test user.');
}

async function createTestSite(ownerId, { url = null } = {}) {
  const siteId = uuid();
  const finalUrl = url || `http://test-${Date.now()}-${Math.random().toString(36).substring(7)}.com`;

  // FIX: Use 'owner_id'
  let q = `INSERT INTO websites (id, owner_id, url, created_at) VALUES ($1,$2,$3, now()) RETURNING id`;
  let res = await tryQuery(q, [siteId, ownerId, finalUrl]);
  
  if (res && res.rows && res.rows[0]) return res.rows[0].id;

  throw new Error('Could not insert test site.');
}

async function cleanup(created = {}) {
  const { notifications = [], websites = [], users = [] } = created;
  // Best effort cleanup
  if (notifications.length) try { await pool.query(`DELETE FROM notifications WHERE id = ANY($1::uuid[])`, [notifications]); } catch (e) {}
  if (websites.length) try { await pool.query(`DELETE FROM websites WHERE id = ANY($1::uuid[])`, [websites]); } catch (e) {}
  if (users.length) try { await pool.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [users]); } catch (e) {}
}

module.exports = { createTestUser, createTestSite, cleanup };