// backend/index.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { env, port, corsOrigin } = require("./configs/env");
const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();



/** Core middlewares (order matters) */
app.use(helmet()); // security headers
app.use(cors({ origin: corsOrigin, credentials: true })); // allow frontend
app.use(express.json()); // parse JSON bodies

/** Routes */
app.use("/", routes);

/** 404 + Error handlers (must be after routes) */
app.use(notFound);
app.use(errorHandler);

/** Start server */
app.listen(port, () => {
  console.log(`Server running in ${env} mode on port ${port}`);
});
