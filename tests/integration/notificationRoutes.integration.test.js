// tests/integration/notificationRoutes.integration.test.js

const express = require('express');
const request = require('supertest');

const {
  createTestUser,
  createTestSite,
  cleanup
} = require('../helpers/setupNotificationTest');

const notificationRoutes = require('../../routes/notifications');
const { createNotification } = require('../../models/notifications');

let userId, siteId;
let created = { users: [], sites: [], notifications: [] };

describe('notificationRoutes (integration)', () => {

  let app;

  beforeAll(async () => {
    userId = await createTestUser();
    created.users.push(userId);

    siteId = await createTestSite(userId);
    created.sites.push(siteId);

    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: userId, isAdmin: true };
      next();
    });
    app.use('/notifications', notificationRoutes);
  });

  afterAll(async () => {
    await cleanup(created);
  });

  test('GET /notifications returns items', async () => {
    const notif = await createNotification({
      user_id: userId,
      site_id: siteId,
      type: 'info',
      severity: 'low',
      title: 'route-title',
      body: 'route-body'
    });

    created.notifications.push(notif.id);

    const res = await request(app).get('/notifications').expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
  });

});
