
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { prisma } = require('../configs/prisma'); 
const { signToken } = require('../utils/tokenUtil');

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email & password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash); 
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const payload = { userId: user.id, role: user.role || 'user' };

    const token = signToken(payload);
    res.json({ token, user: { id: user.id, email: user.email, role: payload.role } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
