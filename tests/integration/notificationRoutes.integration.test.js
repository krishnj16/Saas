const express = require('express');
const supertest = require('supertest');
const pool = require('../../utils/db');
const { randomUUID } = require('crypto');

function requireRouteModule() {
  const tries = [
    '../../routes/notificationRoutes',
    '../../routes/notifications',
    '../../routes/notificationRoutes.js',
    '../../routes/notifications.js'
  ];
  for (const t of tries) {
    try {
      return require(t);
    } catch (e) {
      
    }
  }
  throw new Error('Cannot find notification routes. Tried: ' + tries.join(', '));
}

function requireNotificationModel() {
  const tries = [
    '../../models/notificationModel',
    '../../models/notifications',
    '../../models/notificationModel.js',
    '../../models/notifications.js'
  ];
  for (const t of tries) {
    try {
      return require(t);
    } catch (e) {
    }
  }
  throw new Error('Cannot find notification model. Tried: ' + tries.join(', '));
}

const notificationRoutes = requireRouteModule();
const { createNotification } = requireNotificationModel();

describe('notificationRoutes (integration)', () => {
  let testUserId;
  let app;
  let request;
  const createdNotificationIds = [];

  async function createTestUser() {
    const id = randomUUID();
    const email = `jest-route-${Date.now()}@example.com`;
    const role = 'test';
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
    app.use('/notifications', notificationRoutes);
    request = supertest(app);
  });

  afterAll(async () => {
    try {
      if (createdNotificationIds.length > 0) {
        await pool.query(`DELETE FROM notifications WHERE id = ANY($1::text[])`, [createdNotificationIds]);
      }
    } catch (e) {
      console.warn('Cleanup warning (integration):', e.message);
    }

    try {
      await pool.query(`DELETE FROM "User" WHERE id = $1`, [testUserId]);
    } catch (e) {
    }

    try {
      await pool.end();
    } catch (e) {
    }
  });

  test('GET /notifications returns items and unread count', async () => {
    const created = await createNotification({
      user_id: testUserId,
      type: 'vuln',
      severity: 'high',
      title: 'jest - route-get test',
      body: 'route test body',
    });
    createdNotificationIds.push(created.id);

    const res = await request.get('/notifications?page=1&limit=10').expect(200);
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body).toHaveProperty('unread');
  });

  test('POST /notifications/mark-read marks allowed notifications only', async () => {
    const notif = await createNotification({
      user_id: testUserId,
      type: 'info',
      severity: 'low',
      title: 'jest - route mark read test',
      body: 'mark me',
    });
    createdNotificationIds.push(notif.id);

    const payload = { ids: [notif.id] };
    const res = await request.post('/notifications/mark-read').send(payload).expect(200);

    expect(res.body).toHaveProperty('marked');
    expect(Array.isArray(res.body.marked)).toBe(true);
    expect(res.body.marked).toContain(notif.id);
    expect(res.body).toHaveProperty('count', res.body.marked.length);
  });
});
