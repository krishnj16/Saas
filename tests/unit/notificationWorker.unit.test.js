const pool = require('../../utils/db');
const { randomUUID } = require('crypto');

function requireWorker() {
  const tries = [
    '../../workers/notificationWorker',
    '../../workers/emitNotification',
    '../../workers/notificationWorker.js',
    '../../workers/emitNotification.js'
  ];
  for (const t of tries) {
    try {
      return require(t);
    } catch (e) {}
  }
  throw new Error('Cannot find notification worker. Tried: ' + tries.join(', '));
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
    } catch (e) {}
  }
  throw new Error('Cannot find notification model. Tried: ' + tries.join(', '));
}

const { emitEventNotification, isMuted } = requireWorker();
const { createNotification, getNotificationsForUser } = requireNotificationModel();

describe('notification worker (unit)', () => {
  let testUserId;
  let createdNotifIds = [];
  let createdMuteIds = [];

  async function createTestUser() {
    const id = randomUUID();
    const email = `jest-worker-${Date.now()}@example.com`;
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
      if (createdNotifIds.length > 0) {
        await pool.query(`DELETE FROM notifications WHERE id = ANY($1::text[])`, [createdNotifIds]);
      }
      if (createdMuteIds.length > 0) {
        await pool.query(`DELETE FROM admin_mutes WHERE id = ANY($1::bigint[])`, [createdMuteIds]);
      }
    } catch (e) {
     
    }
    try { await pool.query(`DELETE FROM "User" WHERE id = $1`, [testUserId]); } catch (e) {}
    try { await pool.end(); } catch (e) {}
  });

  test('emitEventNotification does not create notifications when site+severity muted', async () => {
    const { rows: muteRows } = await pool.query(
      `INSERT INTO admin_mutes (site_id,severity,reason,muted_by) VALUES ($1,$2,$3,$4) RETURNING id`,
      [5555, 'critical', 'jest mute', testUserId]
    );
    const muteId = muteRows[0].id;
    createdMuteIds.push(muteId);

    const muted = await isMuted(5555, 'critical');
    expect(muted).toBe(true);

    await emitEventNotification({
      site_id: 5555,
      user_id_list: [testUserId],
      type: 'vuln',
      severity: 'critical',
      title: 'should not appear',
      body: 'muted test',
      metadata: {},
      sendEmailFn: null
    });

    const list = await getNotificationsForUser({ user_id: testUserId, page: 1, limit: 50 });
    const found = list.find(n => n.title === 'should not appear');
    expect(found).toBeUndefined();
  });

  test('emitEventNotification creates notifications when not muted', async () => {
    const siteId = 6666;
    await emitEventNotification({
      site_id: siteId,
      user_id_list: [testUserId],
      type: 'vuln',
      severity: 'high',
      title: 'worker create test',
      body: 'should be created',
      metadata: {},
      sendEmailFn: null
    });

    const list = await getNotificationsForUser({ user_id: testUserId, page: 1, limit: 50 });
    const found = list.find(n => n.title === 'worker create test');
    expect(found).toBeDefined();
    if (found) createdNotifIds.push(found.id);
  });
});
