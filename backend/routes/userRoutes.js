const express = require("express");
const bcrypt = require('bcryptjs');

const { v4: uuidv4 } = require("uuid");
const userRepo = require("../repositories/userRepository");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { updateMe, getAllUsers } = require("../controllers/user.controller");

const router = express.Router();
router.get("/", authenticate, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const users = await userRepo.getAll();
    res.json({ users });
  } catch (err) {
    next(err);
  }
});
router.post("/", async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });

    const existing = await userRepo.findByEmail(email);
    if (existing) return res.status(409).json({ error: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await userRepo.createUser({
      id: uuidv4(),
      email,
      password_hash: passwordHash,
      role: role || "user",
    });

    res.status(201).json({
      user: { id: created.id, email: created.email, role: created.role, createdAt: created.createdAt }
    });
  } catch (err) {
    if (err && err.code === "23505") return res.status(409).json({ error: "Email already exists" });
    next(err);
  }
});
router.get("/me", authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
    },
  });
});

router.patch("/me", authenticate, updateMe);
router.get("/all", authenticate, authorizeRoles("admin"), getAllUsers);
router.get("/admin-only", authenticate, authorizeRoles("admin"), (req, res) => {
  res.json({ secret: "admin data" });
});

module.exports = router;
