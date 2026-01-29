// // backend/routes/auth.routes.js
// const express = require('express');
// const router = express.Router();
// const { signup, login, refresh } = require('../controllers/auth.controller');
// const { userRateLimiter } = require('../middleware/rateLimit');
// const { authenticate } = require('../middleware/auth');


// router.post('/signup', userRateLimiter, signup);
// router.post('/login', userRateLimiter, login);
// router.post('/refresh', userRateLimiter, refresh);
// router.post('/logout', authenticate, logout);

// module.exports = router;


const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');


const {
  signup,
  login,
  refresh,
  logout
} = require('../controllers/auth.controller');

const { authenticate } = require('../middleware/auth');
const { userRateLimiter } = require('../middleware/rateLimit');

// Public routes
router.post('/signup', userRateLimiter, signup);
router.post('/login', userRateLimiter, login);
router.post('/refresh', userRateLimiter, refresh);

// Protected route
//router.post('/logout', authenticate, logout);
router.get('/sessions', authenticate, authController.listSessions);
router.delete('/sessions/:id', authenticate, authController.revokeSession);

module.exports = router;
