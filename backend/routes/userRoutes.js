const express = require("express");
const { prisma } = require("../configs/prisma");
const router = express.Router();


router.get("/", async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});


router.post("/", async (req, res, next) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash: password, 
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    res.status(201).json({ user });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email already exists" });
    }
    next(err);
  }
});

module.exports = router;
