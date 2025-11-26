const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

let authenticate;
try {
  const auth = require('../middleware/auth');
  
  if (typeof auth === 'function') {
    authenticate = auth;
  } else if (auth.authenticate) {
    authenticate = auth.authenticate;
  } else {
    throw new Error("Auth middleware structure unknown");
  }
} catch (e) {
  console.error("CRITICAL: Could not load auth middleware. Dashboard will fail.", e.message);
  authenticate = (req, res, next) => res.status(500).json({ error: "Auth middleware missing" });
}

router.get('/stats', authenticate, dashboardController.getDashboardStats);

module.exports = router;