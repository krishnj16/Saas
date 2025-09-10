require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { env, port, corsOrigin } = require("./configs/env");
const routes = require("./routes"); 
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", routes);

(function safeListRoutes(a) {
  if (!a || !a._router || !Array.isArray(a._router.stack)) {
    console.log("DEBUG: app._router not ready yet — no routes to list.");
    return;
  }

  console.log("=== REGISTERED ROUTES ===");
  a._router.stack.forEach(layer => {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(",");
      console.log(`${methods} ${layer.route.path}`);
      return;
    }

    if (layer.name === "router" && layer.handle && layer.handle.stack) {
      layer.handle.stack.forEach(r => {
        if (r.route && r.route.path) {
          const methods = Object.keys(r.route.methods).map(m => m.toUpperCase()).join(",");
          console.log(`${methods} ${r.route.path}`);
        }
      });
    }
  });
  console.log("=== END ROUTES ===");
})(app);


app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running in ${env} mode on port ${port}`);
});

