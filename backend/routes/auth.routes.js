// const express = require('express');
// const router = express.Router();
// const { signup, login } = require('../controllers/auth.controller');
// const { loginLimiter } = require('../middleware/rateLimit');


// router.post('/signup', signup);
// router.post('/login', loginLimiter, login);

// module.exports = router;
// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/auth.controller");

// POST /auth/signup
router.post("/signup", signup);

// POST /auth/login
router.post("/login", login);

module.exports = router;
