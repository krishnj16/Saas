const express = require("express");
const bcrypt = require("bcrypt");
const { prisma } = require("../configs/prisma");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { updateMe, getAllUsers } = require("../controllers/user.controller");
const router = express.Router();


router.get("/", authenticate, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});


router.post("/", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json({ user });
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Email already exists" });
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

