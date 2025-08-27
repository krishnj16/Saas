// // backend/routes/index.js
const express = require("express");
const router = express.Router();

// simple health check
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// // module.exports = router;
// router.get("/health", (req, res) => {
//   throw new Error("Test error");
// });
module.exports = router;