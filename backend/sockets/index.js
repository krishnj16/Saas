require('dotenv').config();
const { Server } = require('socket.io');
const socketAuth = require('./socketAuth');

let io = null;

function initSockets(httpServer, options = {}) {
  if (io) return io; 
  io = new Server(httpServer, {
    cors: { origin: options.corsOrigin || '*' },
    ...options.socketOptions,
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    const u = socket.user;
    if (!u || !u.id) {
      socket.disconnect(true);
      return;
    }

    const room = `user:${u.id}`;
    socket.join(room);
    logger.info(`socket[${socket.id}] joined ${room}`);

    socket.on('join:website', (websiteId) => socket.join(`website:${websiteId}`));
    socket.on('disconnect', (r) => logger.info(`socket[${socket.id}] disconnected: ${r}`));
  });

  return io;
}

function getIo() {
  if (!io) throw new Error('Sockets not initialized. Call initSockets(server) first.');
  return io;
}

module.exports = { initSockets, getIo };
