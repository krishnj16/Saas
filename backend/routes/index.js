const express = require("express");
const router = express.Router();
const authRoutes = require("./auth.routes");

router.use("/auth", authRoutes);

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const userRoutes = require("./userRoutes");
router.use("/users", userRoutes);

module.exports = router;
