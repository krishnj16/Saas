const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../services/db');
const logger = require('../services/logger');
const crypto = require('crypto');

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'dev-secret';
const ACCESS_EXP = process.env.ACCESS_TOKEN_EXP || '15m';
const REFRESH_EXP_DAYS = parseInt(process.env.REFRESH_TOKEN_EXP_DAYS || '30', 10);

function msFromDays(days) {
  return days * 24 * 60 * 60 * 1000;
}

async function signup(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: 'missing_email_or_password' });

    const emailNorm = String(email).trim().toLowerCase();
    const existing = await db('users').where({ email: emailNorm }).first();
    if (existing) return res.status(409).json({ error: 'user_exists' });

    const hashed = await bcrypt.hash(String(password), 12);
    const now = new Date();
    const [user] = await db('users')
      .insert({ email: emailNorm, password: hashed, created_at: now })
      .returning(['id', 'email', 'created_at']);

    return res.status(201).json({ ok: true, user });
  } catch (err) {
    logger.error('signup_error', { err: err.stack || err });
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: 'missing_email_or_password' });

    const emailNorm = String(email).trim().toLowerCase();
    const user = await db('users').where({ email: emailNorm }).first();
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });

    const now = new Date();
    if (user.locked_until && new Date(user.locked_until) > now) {
      return res.status(423).json({ error: 'account_locked_wait', locked_until: user.locked_until });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const maxFailed = parseInt(process.env.MAX_FAILED_ATTEMPTS || '5', 10);
      const lockMinutes = parseInt(process.env.LOCKOUT_MINUTES || '15', 10);
      const newCount = (user.failed_login_attempts || 0) + 1;

      const updates = { failed_login_attempts: newCount };
      if (newCount >= maxFailed) {
        const lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
        updates.locked_until = lockUntil;
      }

      await db('users').where({ id: user.id }).update(updates);
      if (newCount >= maxFailed) {
        return res.status(423).json({ error: 'account_locked_wait', locked_until: updates.locked_until });
      }
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    await db('users').where({ id: user.id }).update({ failed_login_attempts: 0, locked_until: null });

    const accessToken = jwt.sign({ uid: user.id }, ACCESS_SECRET, {
      expiresIn: ACCESS_EXP,
    });

    const secret = crypto.randomBytes(48).toString('hex');
    const tokenHash = await bcrypt.hash(secret, 12);
    const [row] = await db('user_refresh_tokens')
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        issued_at: new Date(),
        expires_at: new Date(Date.now() + msFromDays(REFRESH_EXP_DAYS)),
        revoked: false,
      })
      .returning(['id', 'expires_at']);

    const prod = process.env.NODE_ENV === 'production';
    const accessMaxAge = 15 * 60 * 1000;
    const refreshMaxAge = msFromDays(REFRESH_EXP_DAYS);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: prod,
      sameSite: 'lax',
      path: '/',
      maxAge: accessMaxAge,
    });

    res.cookie('refresh_id', row.id, {
      httpOnly: true,
      secure: prod,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshMaxAge,
    });

    res.cookie('refresh_secret', secret, {
      httpOnly: true,
      secure: prod,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshMaxAge,
    });

    return res.json({ ok: true, access_expires_in: ACCESS_EXP });
  } catch (err) {
    logger.error('login_error', { err: err.stack || err });
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function refresh(req, res) {
  try {
    const { refresh_id, refresh_secret } = req.cookies || {};
    if (!refresh_id || !refresh_secret)
      return res.status(401).json({ error: 'no_refresh_cookie' });

    const old = await db('user_refresh_tokens')
      .where({ id: refresh_id, revoked: false })
      .first();
    if (!old) return res.status(401).json({ error: 'invalid_refresh' });

    const valid = await bcrypt.compare(refresh_secret, old.token_hash);
    if (!valid) return res.status(401).json({ error: 'invalid_refresh' });

    await db('user_refresh_tokens')
      .where({ id: old.id })
      .update({ revoked: true, last_used_at: new Date() });

    const newSecret = crypto.randomBytes(48).toString('hex');
    const newHash = await bcrypt.hash(newSecret, 12);
    const [row] = await db('user_refresh_tokens')
      .insert({
        user_id: old.user_id,
        token_hash: newHash,
        issued_at: new Date(),
        expires_at: new Date(Date.now() + msFromDays(REFRESH_EXP_DAYS)),
        revoked: false,
      })
      .returning(['id', 'expires_at']);

    const newAccess = jwt.sign({ uid: old.user_id }, ACCESS_SECRET, {
      expiresIn: ACCESS_EXP,
    });

    const prod = process.env.NODE_ENV === 'production';
    const accessMaxAge = 15 * 60 * 1000;
    const refreshMaxAge = msFromDays(REFRESH_EXP_DAYS);

    res.cookie('access_token', newAccess, {
      httpOnly: true,
      secure: prod,
      sameSite: 'lax',
      path: '/',
      maxAge: accessMaxAge,
    });

    res.cookie('refresh_id', row.id, {
      httpOnly: true,
      secure: prod,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshMaxAge,
    });

    res.cookie('refresh_secret', newSecret, {
      httpOnly: true,
      secure: prod,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshMaxAge,
    });

    return res.json({ ok: true });
  } catch (err) {
    logger.error('refresh_error', { err: err.stack || err });
    return res.status(500).json({ error: 'server_error' });
  }
}

module.exports = { signup, login, refresh };
