
const bcrypt = require('bcryptjs');

const { prisma } = require('../configs/prisma');
const tokenUtil = require('../utils/tokenUtil');

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;
const createToken =
  (tokenUtil && typeof tokenUtil.signToken === 'function' && tokenUtil.signToken) ||
  (tokenUtil && typeof tokenUtil.generateToken === 'function' && tokenUtil.generateToken) ||
  null;

if (!createToken) {
  console.error(
    'Token utility does not expose signToken or generateToken. tokenUtil:',
    tokenUtil
  );
}
const authError = (res) => res.status(401).json({ error: 'Invalid email or password' });

exports.signup = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid or missing email' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    return res.status(201).json({ message: 'Signup successful', user });
  } catch (err) {
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      return res.status(409).json({ error: 'User already exists' });
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid or missing email' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing password' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, role: true },
    });

    if (!user) return authError(res);

    if (!user.passwordHash) {
      console.error('Login failed: user has no passwordHash field', { user });
      return res.status(500).json({ error: 'Server misconfigured: missing password hash' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return authError(res);

    if (!createToken) {
      console.error('Token creation function is missing on tokenUtil:', tokenUtil);
      return res.status(500).json({ error: 'Token generation unavailable. See server logs.' });
    }

    const payload = { userId: user.id, role: user.role || 'user' };
    const token = createToken(payload);

    return res.status(200).json({
      token,
      user: { id: user.id, email: user.email, role: payload.role },
    });
  } catch (err) {
    next(err);
  }
};
