
// const db = require('../services/db');
// const jwt = require('jsonwebtoken');
// const { v4: uuid } = require('uuid');

// const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'dev-secret';

// function makeTokens(userId) {
//   const accessToken = jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: '15m' });
//   const refreshToken = jwt.sign({ uid: userId, nonce: uuid() }, JWT_SECRET, { expiresIn: '7d' });
//   const csrfToken = uuid();
//   return { accessToken, refreshToken, csrfToken };
// }

// exports.signup = async (req, res) => {
//   res.status(201).json({ ok: true });
// };

// exports.login = async (req, res) => {
//   const email = req.body.email || 'test@example.com';
  
//   let user = await db('users').where({ email }).first();
  
//   if (!user) {
//     const newId = uuid(); 
//     try {
//       const [inserted] = await db('users').insert({
//         id: newId,
//         email: email,
//         password: 'mock_hashed_password',
//         created_at: new Date(),
//       }).returning('*');
//       user = inserted;
//     } catch (err) {
//       user = await db('users').where({ email }).first();
//     }
//   }


//   const userId = user ? user.id : uuid(); 
  
//   const { accessToken, refreshToken, csrfToken } = makeTokens(userId);

//   res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'lax', path: '/', secure: false });
//   res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', path: '/', secure: false });
//   res.cookie('csrfToken', csrfToken, { httpOnly: false, sameSite: 'lax', path: '/', secure: false });

//   res.json({ userId, accessToken, csrfToken });
// };

// exports.refresh = async (req, res) => {
//   const userId = uuid(); 
//   const { accessToken, refreshToken, csrfToken } = makeTokens(userId);

//   res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'lax', path: '/', secure: false });
//   res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', path: '/', secure: false });
//   res.cookie('csrfToken', csrfToken, { httpOnly: false, sameSite: 'lax', path: '/', secure: false });

//   res.json({ ok: true, accessToken, csrfToken });
// };


// const db = require('../services/db');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const { v4: uuid } = require('uuid');

// const JWT_SECRET =
//   process.env.ACCESS_TOKEN_SECRET ||
//   process.env.JWT_SECRET ||
//   'dev-secret';

// // --------------------
// // helpers
// // --------------------
// function makeTokens(userId) {
//   const accessToken = jwt.sign(
//     { uid: userId },
//     JWT_SECRET,
//     { expiresIn: '15m' }
//   );

//   const refreshToken = jwt.sign(
//     { uid: userId, nonce: uuid() },
//     JWT_SECRET,
//     { expiresIn: '7d' }
//   );

//   const csrfToken = uuid();
//   return { accessToken, refreshToken, csrfToken };
// }

// function setAuthCookies(res, { accessToken, refreshToken, csrfToken }) {
//   const isProd = process.env.NODE_ENV === 'production';

//   res.cookie('access_token', accessToken, {
//     httpOnly: true,
//     sameSite: 'strict',
//     secure: isProd,
//     path: '/',
//   });

//   res.cookie('refreshToken', refreshToken, {
//     httpOnly: true,
//     sameSite: 'strict',
//     secure: isProd,
//     path: '/',
//   });

//   res.cookie('csrfToken', csrfToken, {
//     httpOnly: false,
//     sameSite: 'strict',
//     secure: isProd,
//     path: '/',
//   });
// }

// // --------------------
// // signup
// // --------------------
// exports.signup = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ error: 'Email and password required' });
//     }

//     const existing = await db('users').where({ email }).first();
//     if (existing) {
//       return res.status(409).json({ error: 'User already exists' });
//     }

//     const passwordHash = await bcrypt.hash(password, 12);

//     const [user] = await db('users')
//       .insert({
//         id: uuid(),
//         email,
//         password: passwordHash,
//         created_at: new Date(),
//       })
//       .returning('*');

//     const tokens = makeTokens(user.id);
//     setAuthCookies(res, tokens);

//     res.status(201).json({
//       userId: user.id,
//       accessToken: tokens.accessToken,
//       csrfToken: tokens.csrfToken,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // --------------------
// // login
// // --------------------
// exports.login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ error: 'Email and password required' });
//     }

//     const user = await db('users').where({ email }).first();
//     if (!user) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     const valid = await bcrypt.compare(password, user.password);
//     if (!valid) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     const tokens = makeTokens(user.id);
//     setAuthCookies(res, tokens);

//     res.json({
//       userId: user.id,
//       accessToken: tokens.accessToken,
//       csrfToken: tokens.csrfToken,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // --------------------
// // refresh
// // --------------------
// exports.refresh = async (req, res, next) => {
//   try {
//     const token = req.cookies?.refreshToken;
//     if (!token) {
//       return res.status(401).json({ error: 'No refresh token' });
//     }

//     let payload;
//     try {
//       payload = jwt.verify(token, JWT_SECRET);
//     } catch {
//       return res.status(401).json({ error: 'Invalid refresh token' });
//     }

//     const tokens = makeTokens(payload.uid);
//     setAuthCookies(res, tokens);

//     res.json({
//       ok: true,
//       accessToken: tokens.accessToken,
//       csrfToken: tokens.csrfToken,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

const db = require('../services/db');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const authService = require('../services/authService');
const crypto = require('crypto');


function setAuthCookies(res, { accessToken, refresh }) {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProd,
    path: '/',
  });

  res.cookie('refresh_token', JSON.stringify(refresh), {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProd,
    path: '/',
  });

  // CSRF token (rotates with auth state)
  res.cookie('csrf_token', crypto.randomUUID(), {
    sameSite: 'strict',
    secure: isProd,
    path: '/',
  });
}


// ---------- SIGNUP ----------
exports.signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' });

    const existing = await db('users').where({ email }).first();
    if (existing) return res.status(409).json({ error: 'user_exists' });

    const hash = await bcrypt.hash(password, 12);
    const [user] = await db('users')
      .insert({ id: uuid(), email, password: hash, created_at: new Date() })
      .returning('*');

    const tokens = await authService.createTokensForUser(user);
    setAuthCookies(res, tokens);

    res.status(201).json({ userId: user.id });
  } catch (e) {
    next(e);
  }
};

// ---------- LOGIN ----------
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' });

    const user = await db('users').where({ email }).first();
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    const tokens = await authService.createTokensForUser(user);
    setAuthCookies(res, tokens);

    res.json({ userId: user.id });
  } catch (e) {
    next(e);
  }
};

// ---------- REFRESH ----------
exports.refresh = async (req, res, next) => {
  try {
    const raw = req.cookies?.refresh_token;
    if (!raw) {
      return res.status(401).json({ error: 'missing_refresh' });
    }

    let parsed;
    try {
      parsed = JSON.parse(decodeURIComponent(raw));
    } catch {
      return res.status(401).json({ error: 'invalid_refresh' });
    }

    if (!parsed.id || !parsed.secret) {
      return res.status(401).json({ error: 'invalid_refresh' });
    }

    let tokens;
    try {
      tokens = await authService.rotateRefreshToken({
        tokenId: parsed.id,
        tokenSecret: parsed.secret,
      });
    } catch (err) {
      if (err.message === 'invalid_refresh' || err.message === 'expired_refresh') {
        return res.status(401).json({ error: err.message });
      }
      throw err;
    }

    setAuthCookies(res, tokens);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};


// ---------- LOGOUT ----------
exports.logout = async (req, res, next) => {
  try {
    await authService.revokeAllRefreshTokens(req.user.id);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

// ---------- LIST SESSIONS ----------
exports.listSessions = async (req, res, next) => {
  try {
    const sessions = await authService.listSessionsForUser(req.user.id);
    res.json({ sessions });
  } catch (e) {
    next(e);
  }
};

// ---------- REVOKE SESSION ----------
exports.revokeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    await authService.revokeSessionById(req.user.id, id);
    res.json({ ok: true });
  } catch (e) {
    if (e.message === 'session_not_found') {
      return res.status(404).json({ error: 'session_not_found' });
    }
    next(e);
  }
};


