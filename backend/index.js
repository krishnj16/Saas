// backend/index.js
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

app.use("/", routes);
app.use(notFound);
app.use(errorHandler);


app.listen(port, () => {
  console.log(`Server running in ${env} mode on port ${port}`);
});
