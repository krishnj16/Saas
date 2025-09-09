const jwt = require('jsonwebtoken');

<<<<<<< HEAD
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_a_real_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

function signToken(payload) {
=======
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

function generateToken(payload) {
>>>>>>> origin/main
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
<<<<<<< HEAD
  return jwt.verify(token, JWT_SECRET); 
}

module.exports = { signToken, verifyToken };
=======
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
>>>>>>> origin/main
