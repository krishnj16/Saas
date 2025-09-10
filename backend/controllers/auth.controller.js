const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { prisma } = require("../configs/prisma");
const SECRET = process.env.JWT_SECRET || "change_this_secret";
async function signup(req, res, next) {
  try {
    const { email, password,} = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash, 
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" });

    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email already exists" });
    }
    next(err);
  }
}
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, role: true },
    });

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: { id: user.id, email: user.email,role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login };

