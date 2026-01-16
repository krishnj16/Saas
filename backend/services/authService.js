// const crypto = require('crypto');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const db = require('./db'); 
// const logger = require('./logger');

// const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'please_set_access_secret';
// const ACCESS_EXP = process.env.ACCESS_TOKEN_EXP || '15m';
// const REFRESH_EXP_DAYS = parseInt(process.env.REFRESH_TOKEN_EXP_DAYS || '30', 10);

// function msFromDays(days) {
//   return days * 24 * 60 * 60 * 1000;
// }

// async function createTokensForUser(user) {
//   const accessToken = jwt.sign({ uid: user.id }, ACCESS_SECRET, { expiresIn: ACCESS_EXP });

//   const secret = crypto.randomBytes(48).toString('hex');
//   const hash = await bcrypt.hash(secret, 12);

//   const [row] = await db('user_refresh_tokens')
//     .insert({
//       user_id: user.id,
//       token_hash: hash,
//       issued_at: new Date(),
//       expires_at: new Date(Date.now() + msFromDays(REFRESH_EXP_DAYS)),
//       revoked: false
//     })
//     .returning(['id', 'expires_at']);

//   return {
//     accessToken,
//     refresh: { id: row.id, secret, expires_at: row.expires_at }
//   };
// }

// async function rotateRefreshToken({ tokenId, tokenSecret }) {
//   const row = await db('user_refresh_tokens').where({ id: tokenId }).andWhere('revoked', false).first();
//   if (!row) throw new Error('invalid_refresh');

//   const ok = await bcrypt.compare(tokenSecret, row.token_hash);
//   if (!ok) throw new Error('invalid_refresh');

//   await db('user_refresh_tokens').where({ id: row.id }).update({ revoked: true, last_used_at: new Date() });

//   const newSecret = crypto.randomBytes(48).toString('hex');
//   const newHash = await bcrypt.hash(newSecret, 12);
//   const [newRow] = await db('user_refresh_tokens')
//     .insert({
//       user_id: row.user_id,
//       token_hash: newHash,
//       issued_at: new Date(),
//       expires_at: new Date(Date.now() + msFromDays(REFRESH_EXP_DAYS)),
//       revoked: false
//     })
//     .returning(['id', 'expires_at']);

//   const newAccess = jwt.sign({ uid: row.user_id }, ACCESS_SECRET, { expiresIn: ACCESS_EXP });

//   return {
//     accessToken: newAccess,
//     refresh: { id: newRow.id, secret: newSecret, expires_at: newRow.expires_at }
//   };
// }
// module.exports = Object.assign(module.exports || {}, {
//   createTokensForUser,
//   rotateRefreshToken
// });

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const logger = require('./logger');

const ACCESS_SECRET =
  process.env.ACCESS_TOKEN_SECRET ||
  process.env.JWT_SECRET ||
  'dev-secret';

const ACCESS_EXP = process.env.ACCESS_TOKEN_EXP || '15m';
const REFRESH_EXP_DAYS = parseInt(process.env.REFRESH_TOKEN_EXP_DAYS || '30', 10);

function msFromDays(days) {
  return days * 24 * 60 * 60 * 1000;
}

function signAccessToken(userId) {
  return jwt.sign({ uid: userId }, ACCESS_SECRET, { expiresIn: ACCESS_EXP });
}

async function createTokensForUser(user) {
  const accessToken = signAccessToken(user.id);

  const secret = crypto.randomBytes(48).toString('hex');
  const hash = await bcrypt.hash(secret, 12);

  const [row] = await db('user_refresh_tokens')
    .insert({
      user_id: user.id,
      token_hash: hash,
      issued_at: new Date(),
      expires_at: new Date(Date.now() + msFromDays(REFRESH_EXP_DAYS)),
      revoked: false
    })
    .returning(['id', 'expires_at']);

  return {
    accessToken,
    refresh: { id: row.id, secret, expires_at: row.expires_at }
  };
}

async function rotateRefreshToken({ tokenId, tokenSecret }) {
  const row = await db('user_refresh_tokens')
    .where({ id: tokenId, revoked: false })
    .first();

  if (!row) throw new Error('invalid_refresh');
  if (new Date(row.expires_at) < new Date()) throw new Error('expired_refresh');

  const ok = await bcrypt.compare(tokenSecret, row.token_hash);
  if (!ok) throw new Error('invalid_refresh');

  await db('user_refresh_tokens')
    .where({ id: row.id })
    .update({ revoked: true, last_used_at: new Date() });

  const newSecret = crypto.randomBytes(48).toString('hex');
  const newHash = await bcrypt.hash(newSecret, 12);

  const [newRow] = await db('user_refresh_tokens')
    .insert({
      user_id: row.user_id,
      token_hash: newHash,
      issued_at: new Date(),
      expires_at: new Date(Date.now() + msFromDays(REFRESH_EXP_DAYS)),
      revoked: false
    })
    .returning(['id', 'expires_at']);

  return {
    accessToken: signAccessToken(row.user_id),
    refresh: { id: newRow.id, secret: newSecret, expires_at: newRow.expires_at }
  };
}

async function revokeAllRefreshTokens(userId) {
  await db('user_refresh_tokens')
    .where({ user_id: userId, revoked: false })
    .update({ revoked: true, last_used_at: new Date() });
}


async function listSessionsForUser(userId) {
  return db('user_refresh_tokens')
    .select('id', 'device_info', 'last_used_at', 'expires_at', 'issued_at')
    .where({ user_id: userId, revoked: false })
    .orderBy('last_used_at', 'desc');
}


async function revokeSessionById(userId, tokenId) {
  const updated = await db('user_refresh_tokens')
    .where({ id: tokenId, user_id: userId, revoked: false })
    .update({ revoked: true, last_used_at: new Date() });

  if (!updated) {
    throw new Error('session_not_found');
  }
}

module.exports = {
  createTokensForUser,
  rotateRefreshToken,
  revokeAllRefreshTokens,
  listSessionsForUser,
  revokeSessionById,

};

