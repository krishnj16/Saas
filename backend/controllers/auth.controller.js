const bcrypt = require('bcrypt');
const { prisma } = require('../configs/prisma');
const tokenUtil = require('../utils/tokenUtil');

console.log('DEBUG tokenUtil import ->', tokenUtil);

const generateToken = tokenUtil && typeof tokenUtil.generateToken === 'function'
  ? tokenUtil.generateToken
  : null;

const SALT_ROUNDS = 10;

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

    const authError = () => res.status(401).json({ error: 'Invalid email or password' });

    if (!user) return authError();

    if (!user.passwordHash) {
      console.error('Login failed: user has no passwordHash field', { user });
      return next(new Error('Server configuration error: missing password hash'));
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return authError();

    if (!generateToken) {
      console.error('FATAL: generateToken is not available on tokenUtil. Imported value:', tokenUtil);
      return res.status(500).json({ error: 'Token generation unavailable. See server logs.' });
    }

    const token = generateToken({ userId: user.id, role: user.role || null });

    return res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
};
