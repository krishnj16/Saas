// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const helmet = require("helmet");
// const cookieParser = require("cookie-parser");
// const http = require("http");
// const { v4: uuidv4 } = require("uuid");

// // Safe logger
// let logger = console;
// try {
//   logger = require("./services/logger");
// } catch (e) {}

// const config = require("./services/config");
// const csrfDoubleSubmit = require("./middleware/csrfDoubleSubmit");

// // -------- SAFE REQUIRE --------
// function safeRequire(path) {
//   try {
//     const mod = require(path);
//     logger.info(`[index] loaded ${path}`);
//     return mod;
//   } catch (err) {
//     logger.warn(`[index] optional module failed: ${path} — ${err.message}`);
//     return null;
//   }
// }

// // -------- SAFE MOUNT --------
// function safeMount(app, basePath, routerObj) {
//   if (!routerObj) {
//     logger.info(`[index] skipping mount ${basePath} (missing router)`);
//     return;
//   }

//   if (typeof basePath !== "string" || !basePath.startsWith("/")) {
//     logger.error(`[index] unsafe basePath detected: ${basePath}`);
//     return;
//   }

//   const looksLikeRouter =
//     typeof routerObj === "function" ||
//     (routerObj && (routerObj.stack || routerObj.handle));

//   if (!looksLikeRouter) {
//     logger.error(
//       `[index] not an express router — refusing mount ${basePath}`
//     );
//     return;
//   }

//   try {
//     app.use(basePath, routerObj);
//     logger.info(`[index] mounted ${basePath}`);
//   } catch (err) {
//     logger.error(`[index] FAILED to mount ${basePath}: ${err.message}`);
//   }
// }

// // -------- IMPORT ROUTES --------
// const authRoutes = safeRequire("./routes/auth.routes");
// const websitesRouter = safeRequire("./routes/websites");
// const findingsRouter = safeRequire("./routes/findings");

// // Optional routes
// const discoveryRoutes = safeRequire("./routes/discovery");
// const malwareRoutes = safeRequire("./routes/malwareRoutes");
// const notifRouter = safeRequire("./routes/notifications");
// const sitesRouter = safeRequire("./routes/sites");

// const notFound = require("./middleware/notFound");
// const errorHandler = require("./middleware/errorHandler");

// // -------- CREATE APP --------
// const app = express();

// // Request ID
// app.use((req, res, next) => {
//   req.id = uuidv4();
//   res.setHeader("X-Request-ID", req.id);
//   next();
// });

// // Security
// app.use(
//   helmet({
//     contentSecurityPolicy: false,
//   })
// );

// // CORS
// app.use(
//   cors({
//     origin: config.CLIENT_ORIGIN || "http://localhost:5173",
//     credentials: true,
//   })
// );

// // Body
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// // Health routes BEFORE CSRF
// app.get("/health", (req, res) => res.json({ status: "ok" }));
// app.get("/__ping", (req, res) => res.json({ ok: true }));

// // CSRF
// app.use(csrfDoubleSubmit());

// // -------- MOUNT ROUTES SAFELY --------
// safeMount(app, "/api/auth", authRoutes);
// safeMount(app, "/api/websites", websitesRouter);
// safeMount(app, "/api/findings", findingsRouter);

// safeMount(app, "/api/discovery", discoveryRoutes);
// safeMount(app, "/api/malware", malwareRoutes);
// safeMount(app, "/api/notifications", notifRouter);
// safeMount(app, "/api/sites", sitesRouter);

// // API 404
// app.use("/api/*", (req, res) =>
//   res.status(404).json({ error: "API endpoint not found" })
// );

// // Error handlers
// app.use(notFound);
// app.use(errorHandler);

// const server = http.createServer(app);

// module.exports = app;
// module.exports.server = server;

// if (require.main === module && process.env.NODE_ENV !== "test") {
//   const PORT = process.env.PORT || 4000;
//   server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
// }
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const http = require("http");
const { v4: uuidv4 } = require("uuid");

// Safe logger
let logger = console;
try {
  logger = require("./services/logger");
} catch (e) {}

const config = require("./services/config");
const csrfDoubleSubmit = require("./middleware/csrfDoubleSubmit");

// -------- SAFE REQUIRE --------
function safeRequire(path) {
  try {
    const mod = require(path);
    logger.info(`[index] loaded ${path}`);
    return mod;
  } catch (err) {
    logger.warn(`[index] optional module failed: ${path} — ${err.message}`);
    return null;
  }
}

// -------- SAFE MOUNT --------
function safeMount(app, basePath, routerObj) {
  if (!routerObj) {
    logger.info(`[index] skipping mount ${basePath} (missing router)`);
    return;
  }

  if (typeof basePath !== "string" || !basePath.startsWith("/")) {
    logger.error(`[index] unsafe basePath detected: ${basePath}`);
    return;
  }

  const looksLikeRouter =
    typeof routerObj === "function" ||
    (routerObj && (routerObj.stack || routerObj.handle));

  if (!looksLikeRouter) {
    logger.error(
      `[index] not an express router — refusing mount ${basePath}`
    );
    return;
  }

  try {
    app.use(basePath, routerObj);
    logger.info(`[index] mounted ${basePath}`);
  } catch (err) {
    logger.error(`[index] FAILED to mount ${basePath}: ${err.message}`);
  }
}

// -------- IMPORT ROUTES --------
const authRoutes = safeRequire("./routes/auth.routes");
const websitesRouter = safeRequire("./routes/websites");
const findingsRouter = safeRequire("./routes/findings");

// Optional routes
const discoveryRoutes = safeRequire("./routes/discovery");
const malwareRoutes = safeRequire("./routes/malwareRoutes");
const notifRouter = safeRequire("./routes/notifications");
const sitesRouter = safeRequire("./routes/sites");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

// -------- CREATE APP --------
const app = express();

// Request ID
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader("X-Request-ID", req.id);
  next();
});

// Security
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: config.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health routes BEFORE CSRF
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/__ping", (req, res) => res.json({ ok: true }));

// CSRF
app.use(csrfDoubleSubmit());

// -------- MOUNT ROUTES SAFELY --------
safeMount(app, "/api/auth", authRoutes);
safeMount(app, "/api/websites", websitesRouter);
safeMount(app, "/api/findings", findingsRouter);

safeMount(app, "/api/discovery", discoveryRoutes);
safeMount(app, "/api/malware", malwareRoutes);
safeMount(app, "/api/notifications", notifRouter);
safeMount(app, "/api/sites", sitesRouter);

// API 404 - FIX APPLIED BELOW
// Using "/api" instead of "/api/*" because app.use matches prefixes automatically.
app.use("/api", (req, res) =>
  res.status(404).json({ error: "API endpoint not found" })
);

// Error handlers
app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

module.exports = app;
module.exports.server = server;

if (require.main === module && process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}