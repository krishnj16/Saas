const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/auth.controller');
const { loginLimiter } = require('../middleware/rateLimit');


router.post('/signup', signup);
router.post('/login', loginLimiter, login);

module.exports = router;
