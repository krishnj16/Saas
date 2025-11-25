// tests/unit/notificationModel.unit.test.js

const {
  createTestUser,
  createTestSite,
  cleanup
} = require('../helpers/setupNotificationTest');

const {
  createNotification,
  getNotificationsForUser,
  markNotificationsRead,
  countUnread
} = require('../../models/notifications');

let userId, siteId;
let created = { users: [], sites: [], notifications: [] };

describe('notificationModel (unit)', () => {

  beforeAll(async () => {
    userId = await createTestUser();
    created.users.push(userId);

    siteId = await createTestSite(userId);
    created.sites.push(siteId);
  });

  afterAll(async () => {
    await cleanup(created);
  });

  test('createNotification inserts a notification', async () => {
    const notif = await createNotification({
      user_id: userId,
      site_id: siteId,
      type: 'info',
      severity: 'low',
      title: 'test-title',
      body: 'test-body',
      metadata: {}
    });

    expect(notif).toBeDefined();
    created.notifications.push(notif.id);
  });

  test('getNotificationsForUser returns list', async () => {
    const list = await getNotificationsForUser({ user_id: userId, page: 1, limit: 10 });
    expect(Array.isArray(list)).toBe(true);
  });

  test('markNotificationsRead marks as read', async () => {
    const notif = await createNotification({
      user_id: userId,
      site_id: siteId,
      type: 'info',
      severity: 'low',
      title: 'to-read',
      body: 'x',
      metadata: {}
    });

    created.notifications.push(notif.id);

    const marked = await markNotificationsRead([notif.id]);
    expect(marked).toContain(notif.id);
  });
});
