const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require("uuid");

const { signToken } = require('../utils/tokenUtil');
const userRepo = require('../repositories/userRepository');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await userRepo.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken({ id: user.id });
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
};

exports.signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existing = await userRepo.findByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already used' });

    const hash = await bcrypt.hash(password, 10);
    const created = await userRepo.createUser({
      id: uuidv4(),
      email,
      password_hash: hash,
      role: 'user'
    });

    const token = signToken({ id: created.id });
    res.status(201).json({
      token,
      user: { id: created.id, email: created.email, role: created.role }
    });
  } catch (err) {
    next(err);
  }
};
