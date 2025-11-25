

const pool = require('../../utils/db');
const { randomUUID } = require('crypto');

jest.mock('nodemailer', () => {
  const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'jest' });
  return {
    createTransport: jest.fn().mockReturnValue({ sendMail: sendMailMock }),
    __sendMailMock: sendMailMock 
  };
});

const nodemailer = require('nodemailer'); 
const emailService = require('../../services/email'); 

describe('email service (unit)', () => {
  let testUserId;
  const sendMailMock = nodemailer.__sendMailMock;

  beforeAll(async () => {
    const id = randomUUID();
    const email = `jest-email-${Date.now()}@example.com`;
    const role = 'test';
    const password_hash = null;
    const q = `INSERT INTO "User" (id, email, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`;
    const { rows } = await pool.query(q, [id, email, role, password_hash]);
    testUserId = rows[0].id;
  });

  afterAll(async () => {
    try { await pool.query(`DELETE FROM "User" WHERE id = $1`, [testUserId]); } catch (e) {}
    try { await pool.end(); } catch (e) {}
  });

  test('sendNotificationEmailToUser calls transporter.sendMail for existing user', async () => {
    const ok = await emailService.sendNotificationEmailToUser(testUserId, {
      title: 'jest email test',
      body: 'hello',
      severity: 'critical',
      metadata: { a: 1 }
    });

    expect(ok).toBe(true);
    expect(sendMailMock).toHaveBeenCalled();
    const calledArgs = sendMailMock.mock.calls[0][0];
    expect(calledArgs).toHaveProperty('to');
    expect(calledArgs).toHaveProperty('subject');
  });

  test('sendNotificationEmailToUser returns false for non-existent user', async () => {
    const missingUserId = randomUUID();

    const res = await emailService.sendNotificationEmailToUser(missingUserId, {
      title: 'no user',
      body: 'x',
      severity: 'low',
      metadata: {}
    });

    expect(res).toBe(false);
  });
});
