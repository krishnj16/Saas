require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = (socket, next) => {
  try {
    const token = socket.handshake?.auth?.token || socket.handshake?.query?.token;
    if (!token) return next(new Error('Authentication error: token missing'));

    const secret = process.env.JWT_SECRET;
    const payload = jwt.verify(token, secret);

    socket.user = {
      id: payload.user_id || payload.id,
      email: payload.email,
      name: payload.name,
    };
    return next();
  } catch (err) {
    console.error('socketAuth error:', err.message);
    return next(new Error('Authentication error'));
  }
};
