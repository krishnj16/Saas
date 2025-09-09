const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});
router.get('/admin/stats', authenticate, authorizeRoles('admin'), async (req, res) => {
  res.json({ secret: 'only admin sees this' });
});

module.exports = router;
