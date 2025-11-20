const pool = require('../../utils/db');
const { randomUUID } = require('crypto');

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

const {
  createNotification,
  getNotificationsForUser,
  markNotificationsRead,
  countUnread,
} = requireNotificationModel();

describe('notificationModel (unit)', () => {
  let testUserId;
  const createdNotificationIds = [];

  async function createTestUser() {
    const id = randomUUID();
    const email = `jest-notif-${Date.now()}@example.com`;
    const role = 'test'; 
    const password_hash = null;
    const q = `INSERT INTO "User" (id, email, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`;
    const { rows } = await pool.query(q, [id, email, role, password_hash]);
    return rows[0].id;
  }

  beforeAll(async () => {
    testUserId = await createTestUser();
  });

  afterAll(async () => {
    try {
      if (createdNotificationIds.length > 0) {
        await pool.query(`DELETE FROM notifications WHERE id = ANY($1::text[])`, [createdNotificationIds]);
      }
    } catch (e) {
      console.warn('Cleanup warning (notifications):', e.message);
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

  test('createNotification inserts a notification and returns it', async () => {
    const n = await createNotification({
      user_id: testUserId,
      site_id: null,
      type: 'vuln',
      severity: 'critical',
      title: 'jest - test critical vuln',
      body: 'details',
      metadata: { foo: 'bar' },
    });
    expect(n).toBeDefined();
    expect(n.id).toBeDefined();
    expect(n.user_id).toBe(testUserId);
    expect(n.title).toBe('jest - test critical vuln');
    createdNotificationIds.push(n.id);
  });

  test('getNotificationsForUser returns notifications and countUnread works', async () => {
    const list = await getNotificationsForUser({ user_id: testUserId, page: 1, limit: 10 });
    expect(Array.isArray(list)).toBe(true);
    const unread = await countUnread(testUserId);
    expect(typeof unread).toBe('number');
  });

  test('markNotificationsRead marks notifications as read', async () => {
    const n = await createNotification({
      user_id: testUserId,
      type: 'info',
      severity: 'low',
      title: 'jest - mark-read test',
      body: 'will be marked read',
    });
    createdNotificationIds.push(n.id);

    const beforeUnread = await countUnread(testUserId);
    const marked = await markNotificationsRead([n.id]);
    expect(Array.isArray(marked)).toBe(true);
    expect(marked).toContain(n.id);
    const afterUnread = await countUnread(testUserId);
    expect(afterUnread).toBeLessThanOrEqual(beforeUnread);
  });
});
