const request = require('supertest');
const app = require('../../index');
const db = require('../../services/db');

describe('Auth integration flow', () => {
 const user = {
  email: `auth_${Date.now()}@test.com`,
  password: 'StrongPass123',
};

  let cookies;
  let oldCookies;

  afterEach(async () => {
    await db('user_refresh_tokens').del();
    await db('users')
      .where('email', 'like', '%@test.com')
      .del();
  });

  afterAll(async () => {
    await db.destroy();
  });

  test('Signup creates user and sets cookies', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(user)
      .expect(201);

    expect(res.body.userId).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();

    cookies = res.headers['set-cookie'];
  });

  test('Protected route works with valid access token', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send(user);

    cookies = signup.headers['set-cookie'];

    const res = await request(app)
      .get('/api/users/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(res.body.user.id).toBeDefined();
  });

  test('Refresh rotates refresh token', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send(user);

    cookies = signup.headers['set-cookie'];
    oldCookies = cookies;

    const refresh = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookies)
      .expect(200);

    cookies = refresh.headers['set-cookie'];
  });

  test('Old refresh token cannot be reused', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send(user);

    cookies = signup.headers['set-cookie'];
    oldCookies = cookies;

    await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookies);

    await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', oldCookies)
      .expect(401);
  });

  test('Logout revokes refresh tokens', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send(user);

    cookies = signup.headers['set-cookie'];

    await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookies)
      .expect(200);

    await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookies)
      .expect(401);
  });
});
