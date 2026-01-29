jest.mock('../../middleware/csrfDoubleSubmit', () => {
  return jest.fn(() => (req, res, next) => next()); 
});

const request = require('supertest');
const app = require('../../index'); 
const db = require('../../services/db');

jest.setTimeout(180000);
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

describe('E2E: scan flow', () => {
  let agent;
  let userId;

  test('signup & login', async () => {
    const email = `e2e+${Date.now()}@example.com`;
    const pw = 'Password123!';
    await request(app).post('/api/auth/signup').send({ email, password: pw }).expect(201);
    
    agent = request.agent(app);
    const loginRes = await agent.post('/api/auth/login').send({ email, password: pw }).expect(200);
    
    userId = loginRes.body.userId || loginRes.body.id;
    expect(userId).toBeDefined();
  });

  let websiteId;
  test('create website & enqueue scan', async () => {
    const create = await agent
      .post('/api/websites')
      .send({ url: 'http://example.com' })
      .expect(201);
      
    websiteId = create.body.id;
    
    await agent
      .post(`/api/websites/${websiteId}/scan`)
      .expect(202);
  });

  test('wait for worker result & notification', async () => {
    const TIMEOUT = 90_000;
    const POLL = 2000;
    const start = Date.now();
    let found = false;
    while (Date.now() - start < TIMEOUT) {
      const rows = await db('notifications').where({ user_id: userId }).limit(1);
      if (rows.length) { found = true; break; }
      await sleep(POLL);
    }
    expect(found).toBe(true);
    const notif = await db('notifications').where({ user_id: userId }).first();
    expect(notif).toBeDefined();
  });
});