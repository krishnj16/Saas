const express = require('express');
const supertest = require('supertest');
const pool = require('../../utils/db');
const { randomUUID } = require('crypto');

function requireAdminRoutes() {
  const tries = [
    '../../routes/notificationAdminRoutes',
    '../../routes/adminNotifications',
    '../../routes/notificationAdminRoutes.js',
    '../../routes/adminNotifications.js'
  ];
  for (const t of tries) {
    try {
      return require(t);
    } catch (e) {
      
    }
  }
  throw new Error('Cannot find admin notification routes. Tried: ' + tries.join(', '));
}

const adminRoutes = requireAdminRoutes();

describe('notification admin routes (integration)', () => {
  let testUserId;
  let app;
  let request;
  const createdMuteIds = [];

  async function createTestUser() {
    const id = randomUUID();
    const email = `jest-admin-${Date.now()}@example.com`;
    const role = 'admin';
    const password_hash = null;
    const q = `INSERT INTO "User" (id, email, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`;
    const { rows } = await pool.query(q, [id, email, role, password_hash]);
    return rows[0].id;
  }

  beforeAll(async () => {
    testUserId = await createTestUser();

    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.user = { id: testUserId, isAdmin: true };
      next();
    });

    app.use('/admin', adminRoutes);
    request = supertest(app);
  });

  afterAll(async () => {
    try {
      if (createdMuteIds.length > 0) {
        await pool.query(`DELETE FROM admin_mutes WHERE id = ANY($1::bigint[])`, [createdMuteIds]);
      }
    } catch (e) {
      logger.warn('Cleanup warning (admin):', e.message);
    }

    try {
      await pool.query(`DELETE FROM "User" WHERE id = $1`, [testUserId]);
    } catch (e) {
    }

    try { await pool.end(); } catch (e) {}
  });

  test('POST /admin/mute creates a mute row', async () => {
    const payload = {
      site_id: 9999,
      severity: 'low',
      reason: 'jest test mute',
      expires_at: null
    };

    const res = await request.post('/admin/mute').send(payload).expect(200);
    expect(res.body).toHaveProperty('created');
    const created = res.body.created;
    expect(created).toHaveProperty('id');
    createdMuteIds.push(created.id);
    expect(created.site_id === 9999 || created.site_id === '9999').toBeTruthy();
    expect(created.severity).toBe('low');
  });

  test('GET /admin/mutes returns a list containing the created mute', async () => {
    const res = await request.get('/admin/mutes').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find(m => createdMuteIds.includes(m.id));
    expect(found || res.body.length).toBeTruthy();
  });
});
