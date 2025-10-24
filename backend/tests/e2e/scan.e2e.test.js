const request = require('supertest');
const app = require('../../index'); 
const db = require('../../services/db');

jest.setTimeout(180000);
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

describe('E2E: scan flow', () => {
  let agent;
  test('signup & login', async () => {
    const email = `e2e+${Date.now()}@example.com`;
    const pw = 'Password123!';
    await request(app).post('/api/auth/signup').send({ email, password: pw }).expect(201);
    agent = request.agent(app);
    await agent.post('/api/login').send({ email, password: pw }).expect(200);
  });

  let websiteId;
  test('create website & enqueue scan', async () => {
    const create = await agent.post('/api/websites').send({ url: 'http://example.com' }).expect(201);
    websiteId = create.body.id;
    await agent.post(`/api/websites/${websiteId}/scan`).expect(202);
  });

  test('wait for worker result & notification', async () => {
    const TIMEOUT = 90_000;
    const POLL = 2000;
    const start = Date.now();
    let found = false;
    while (Date.now() - start < TIMEOUT) {
      const rows = await db('scan_outputs').where({ website_id: websiteId }).limit(1);
      if (rows.length) { found = true; break; }
      await sleep(POLL);
    }
    expect(found).toBe(true);
    const notif = await db('notifications').where({ website_id: websiteId }).first();
    expect(notif).toBeDefined();
  });
});
