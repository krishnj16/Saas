require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const http = require('http');
const Sentry = require('./services/sentry');
const logger = require('./services/logger');
require('./services/config');
const { initSockets } = require('./sockets');


const { env, port, corsOrigin } = require('./configs/env');

const discoveryRoutes = require('./routes/discovery');
const malwareRoutes = require('./routes/malwareRoutes');
const notifRouter = require('./routes/notifications');
const websitesRouter = require('./routes/websites');
const authRoutes = require('./routes/auth.routes');
const routes = require('./routes');

const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const app = express();
console.log('ENV JWT_SECRET (server) =', process.env.JWT_SECRET || '(not set)');

if (Sentry && Sentry.Handlers?.requestHandler) {
  app.use(Sentry.Handlers.requestHandler());
} else {
  console.log('[Sentry] Disabled or DSN missing.');
}
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
      },
    },
  })
);
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
app.disable('x-powered-by');

app.use(cors({ origin: corsOrigin || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/malware', malwareRoutes);
app.use('/api/notifications', notifRouter);
app.use('/api/websites', websitesRouter);  
app.use('/', routes);

app.post('/__test_body', (req, res) => {
  res.json({
    ok: true,
    body: req.body,
    headers: {
      authorization: req.headers.authorization || null,
      'content-type': req.headers['content-type'] || null,
    },
  });
});

(function safeListRoutes(a) {
  if (!a || !a._router || !Array.isArray(a._router.stack)) {
    console.log('DEBUG: app._router not ready yet — no routes to list.');
    return;
  }
  console.log(' REGISTERED ROUTES ');
  a._router.stack.forEach(layer => {
    if (layer.route?.path) {
      const methods = Object.keys(layer.route.methods)
        .map(m => m.toUpperCase())
        .join(',');
      console.log(`${methods} ${layer.route.path}`);
    } else if (layer.name === 'router' && layer.handle?.stack) {
      layer.handle.stack.forEach(r => {
        if (r.route?.path) {
          const methods = Object.keys(r.route.methods)
            .map(m => m.toUpperCase())
            .join(',');
          console.log(`${methods} ${r.route.path}`);
        }
      });
    }
  });
  console.log(' END ROUTES ');
})(app);

app.use(notFound);
if (Sentry && Sentry.Handlers?.errorHandler) {
  app.use(Sentry.Handlers.errorHandler());
}
app.use(errorHandler);

const httpServer = http.createServer(app);
let io = null;
try {
  if (typeof initSockets === 'function') {
    io = initSockets(httpServer, { corsOrigin: process.env.CLIENT_ORIGIN || '*' });
    logger.info('Socket.IO initialized via backend/sockets');
  } else {
    logger.warn('initSockets not a function - skipping sockets init');
  }
} catch (err) {
  logger.warn('Could not initialize sockets (./sockets):', err.message);
}

const PORT = port || process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  logger.info(`Server listening on ${PORT} (${env || process.env.NODE_ENV || 'unknown'} mode)`);
});

module.exports = { app, httpServer, io };
