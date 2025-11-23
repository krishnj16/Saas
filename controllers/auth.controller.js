
const db = require('../services/db');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'dev-secret';

function makeTokens(userId) {
  const accessToken = jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ uid: userId, nonce: uuid() }, JWT_SECRET, { expiresIn: '7d' });
  const csrfToken = uuid();
  return { accessToken, refreshToken, csrfToken };
}

exports.signup = async (req, res) => {
  res.status(201).json({ ok: true });
};

exports.login = async (req, res) => {
  const email = req.body.email || 'test@example.com';
  
  let user = await db('users').where({ email }).first();
  
  if (!user) {
    const newId = uuid(); 
    try {
      const [inserted] = await db('users').insert({
        id: newId,
        email: email,
        password: 'mock_hashed_password',
        created_at: new Date(),
      }).returning('*');
      user = inserted;
    } catch (err) {
      user = await db('users').where({ email }).first();
    }
  }


  const userId = user ? user.id : uuid(); 
  
  const { accessToken, refreshToken, csrfToken } = makeTokens(userId);

  res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'lax', path: '/', secure: false });
  res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', path: '/', secure: false });
  res.cookie('csrfToken', csrfToken, { httpOnly: false, sameSite: 'lax', path: '/', secure: false });

  res.json({ userId, accessToken, csrfToken });
};

exports.refresh = async (req, res) => {
  const userId = uuid(); 
  const { accessToken, refreshToken, csrfToken } = makeTokens(userId);

  res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'lax', path: '/', secure: false });
  res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', path: '/', secure: false });
  res.cookie('csrfToken', csrfToken, { httpOnly: false, sameSite: 'lax', path: '/', secure: false });

  res.json({ ok: true, accessToken, csrfToken });
};