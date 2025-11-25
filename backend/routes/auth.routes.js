// backend/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { signup, login, refresh } = require('../controllers/auth.controller');
const { userRateLimiter } = require('../middleware/rateLimit');

router.post('/signup', userRateLimiter, signup);
router.post('/login', userRateLimiter, login);
router.post('/refresh', userRateLimiter, refresh);

module.exports = router;
