const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../services/db');
const { createTokensForUser, rotateRefreshToken } = require('../services/authService');
const logger = require('../services/logger');

const MAX_FAILED = parseInt(process.env.MAX_FAILED_ATTEMPTS || '5', 10);
const LOCK_MIN = parseInt(process.env.LOCKOUT_MINUTES || '15', 10);

function msFromExp(exp) {
  if (typeof exp === 'string' && exp.endsWith('m')) return parseInt(exp.slice(0, -1), 10) * 60 * 1000;
  return parseInt(exp, 10) || 15 * 60 * 1000;
}

const ACCESS_COOKIE = process.env.ACCESS_COOKIE_NAME || 'access_token';
const REFRESH_ID_COOKIE = process.env.REFRESH_ID_COOKIE || 'refresh_id';
const REFRESH_SECRET_COOKIE = process.env.REFRESH_SECRET_COOKIE || 'refresh_secret';

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'missing_credentials' });

    const user = await db('users').where({ email }).first();
    if (!user) return res.status(401).json({ error: 'invalid' });

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const wait = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({ error: `account_locked_wait_${wait}m` });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      const newCount = (user.failed_login_attempts || 0) + 1;
      const updates = { failed_login_attempts: newCount };
      if (newCount >= MAX_FAILED) {
        updates.locked_until = new Date(Date.now() + LOCK_MIN * 60 * 1000);
        updates.failed_login_attempts = 0;
      }
      await db('users').where({ id: user.id }).update(updates);
      return res.status(401).json({ error: 'invalid' });
    }

    await db('users').where({ id: user.id }).update({ failed_login_attempts: 0, locked_until: null });

    const { accessToken, refresh } = await createTokensForUser(user);

    const prod = process.env.NODE_ENV === 'production';
    const accessMaxAge = msFromExp(process.env.ACCESS_TOKEN_EXP || '15m');
    const refreshMaxAge = (process.env.REFRESH_TOKEN_EXP_DAYS ? parseInt(process.env.REFRESH_TOKEN_EXP_DAYS, 10) : 30) * 24 * 60 * 60 * 1000;

    res.cookie(ACCESS_COOKIE, accessToken, { httpOnly: true, secure: prod, sameSite: 'lax', maxAge: accessMaxAge });
    res.cookie(REFRESH_ID_COOKIE, refresh.id, { httpOnly: true, secure: prod, sameSite: 'lax', maxAge: refreshMaxAge });
    res.cookie(REFRESH_SECRET_COOKIE, refresh.secret, { httpOnly: true, secure: prod, sameSite: 'lax', maxAge: refreshMaxAge });

    return res.json({ ok: true });
  } catch (err) {
    logger.error('login_error', { err });
    return res.status(500).json({ error: 'server_error' });
  }
});

router.post('/auth/refresh', async (req, res) => {
  try {
    const tokenId = req.cookies[REFRESH_ID_COOKIE];
    const tokenSecret = req.cookies[REFRESH_SECRET_COOKIE];
    if (!tokenId || !tokenSecret) return res.status(401).json({ error: 'no_refresh' });

    const rotated = await rotateRefreshToken({ tokenId: parseInt(tokenId, 10), tokenSecret });

    const prod = process.env.NODE_ENV === 'production';
    const accessMaxAge = msFromExp(process.env.ACCESS_TOKEN_EXP || '15m');
    const refreshMaxAge = (process.env.REFRESH_TOKEN_EXP_DAYS ? parseInt(process.env.REFRESH_TOKEN_EXP_DAYS, 10) : 30) * 24 * 60 * 60 * 1000;

    res.cookie(ACCESS_COOKIE, rotated.accessToken, { httpOnly: true, secure: prod, sameSite: 'lax', maxAge: accessMaxAge });
    res.cookie(REFRESH_ID_COOKIE, rotated.refresh.id, { httpOnly: true, secure: prod, sameSite: 'lax', maxAge: refreshMaxAge });
    res.cookie(REFRESH_SECRET_COOKIE, rotated.refresh.secret, { httpOnly: true, secure: prod, sameSite: 'lax', maxAge: refreshMaxAge });

    return res.json({ ok: true });
  } catch (err) {
    logger.warn('refresh_failed', { err: err.message || err });
    return res.status(401).json({ error: 'invalid_refresh' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const tokenId = req.cookies[REFRESH_ID_COOKIE];
    if (tokenId) {
      await db('user_refresh_tokens').where({ id: tokenId }).update({ revoked: true, last_used_at: new Date() }).catch(()=>{});
    }
    res.clearCookie(ACCESS_COOKIE);
    res.clearCookie(REFRESH_ID_COOKIE);
    res.clearCookie(REFRESH_SECRET_COOKIE);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
