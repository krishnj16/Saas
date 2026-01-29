const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/userRepository');

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await userRepo.getAll();
    const normalized = users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    }));
    res.json({ users: normalized });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await userRepo.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { email, password } = req.body;
    const fields = {};

    if (email) fields.email = email;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      fields.password_hash = hash;
    }

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }
    if (fields.role) delete fields.role;

    const updated = await userRepo.updateUser(userId, fields);
    if (!updated) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        createdAt: updated.createdAt
      }
    });
  } catch (err) {
    if (err && err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    next(err);
  }
};
exports.deleteUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    await userRepo.deleteUser(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
