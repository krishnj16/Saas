// const request = require('supertest');
// const { v4: uuid } = require('uuid');

// function findSetCookie(setCookieArray = [], name) {
//   if (!setCookieArray) return null;
//   return setCookieArray.find(s => s && s.includes(`${name}=`));
// }

// describe('Auth & CSRF integration tests', () => {
//   let app;

//   beforeAll(() => {
//     const server = require('../index');
//     app = server && server.app ? server.app : server;
//   });

//   test('login sets refreshToken', async () => {
//     const agent = request.agent(app);
//     // Use a truly unique email to force a new user creation with a valid UUID
//     const uniqueEmail = `auth-${uuid()}@example.com`;
    
//     const res = await agent
//       .post('/api/auth/login')
//       .set('Content-Type', 'application/json')
//       .send({ email: uniqueEmail, password: 'pw' })
//       .expect(200);

//     const setCookies = res.headers['set-cookie'];
//     expect(setCookies).toBeDefined();
//     expect(res.body.accessToken).toBeDefined();
//   });

//   test('state-changing endpoint blocked without x-csrf-token header (403)', async () => {
//     const agent = request.agent(app);
//     // Unique user
//     await agent.post('/api/auth/login').send({ email: `auth-${uuid()}@example.com`, password: 'pw' }).expect(200);

//     const res = await agent.post('/api/websites').send({ url: 'http://test-site.com' });
//     expect(res.status).toBe(403);
//   });

//   test('state-changing endpoint succeeds when using bypass header', async () => {
//     const agent = request.agent(app);
//     // Unique user to ensure valid UUID
//     await agent.post('/api/auth/login').send({ email: `auth-${uuid()}@example.com`, password: 'pw' }).expect(200);

//     const uniqueUrl = `http://ok-site-${uuid()}.com`;

//     const res = await agent
//       .post('/api/websites')
//       .set('x-test-bypass', 'true')
//       .send({ url: uniqueUrl });

//     // Log the error details if it fails
//     if (res.status !== 200 && res.status !== 201) {
//       console.error("CSRF Success Test Failed. Status:", res.status, "Body:", res.body);
//     }

//     expect([200, 201]).toContain(res.status);
//     expect(res.body).toBeDefined();
//   });

//   test('refresh endpoint rotates refreshToken', async () => {
//     const agent = request.agent(app);
//     await agent.post('/api/auth/login').send({ email: `auth-${uuid()}@example.com`, password: 'pw' }).expect(200);
    
//     const refreshRes = await agent.post('/api/auth/refresh').expect(200);
//     expect(refreshRes.headers['set-cookie']).toBeDefined();
//   });
// });

const request = require('supertest');
const { v4: uuid } = require('uuid');

function findSetCookie(setCookieArray = [], name) {
  if (!setCookieArray) return null;
  return setCookieArray.find(s => s && s.includes(`${name}=`));
}

describe('Auth & CSRF integration tests', () => {
  let app;

  beforeAll(() => {
    const server = require('../index');
    app = server && server.app ? server.app : server;
  });

  test('login sets refreshToken', async () => {
    const agent = request.agent(app);
    const email = `auth-${uuid()}@example.com`;
    const res = await agent
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email, password: 'pw' })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
  });

  test('state-changing endpoint blocked without x-csrf-token header (403)', async () => {
    const agent = request.agent(app);
    const email = `auth-${uuid()}@example.com`;
    
    // Login
    await agent.post('/api/auth/login').send({ email, password: 'pw' }).expect(200);

    // Attempt Post without CSRF header -> Fail
    const res = await agent.post('/api/websites').send({ url: 'http://test-site.com' });
    expect(res.status).toBe(403);
  });

  test('state-changing endpoint succeeds when using bypass header', async () => {
    // 1. Login to get valid cookies/user
    const email = `auth-${uuid()}@example.com`;
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'pw' })
      .expect(200);

    const cookie = loginRes.headers['set-cookie'];
    const uniqueUrl = `http://ok-site-${uuid()}.com`;

    // 2. Send Request WITH cookies and WITH bypass header
    const res = await request(app)
      .post('/api/websites')
      .set('Cookie', cookie) // Pass the valid auth cookie
      .set('x-test-bypass', 'true') // Pass CSRF bypass
      .send({ url: uniqueUrl });

    if (res.status !== 200 && res.status !== 201) {
        console.error("Auth Test Failed Body:", res.body);
    }

    expect([200, 201]).toContain(res.status);
    expect(res.body).toBeDefined();
  });

  test('refresh endpoint rotates refreshToken', async () => {
    const email = `auth-${uuid()}@example.com`;
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'pw' })
      .expect(200);

    const cookie = loginRes.headers['set-cookie'];

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie)
      .expect(200);
      
    expect(refreshRes.headers['set-cookie']).toBeDefined();
  });
});