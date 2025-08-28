const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// If you installed zod, uncomment the next two lines and use the zod block
// const { z } = require("zod");
// const signupSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

const SALT_ROUNDS = 10;

exports.signup = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    // Basic validation (simple and clear). If using zod, replace this block with signupSchema.safeParse
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid or missing email" });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user (store hash, not the raw password)
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    return res.status(201).json({
      message: "Signup successful",
      user,
    });
  } catch (err) {
    // Prisma unique error safety (duplicate email race condition)
    if (err.code === "P2002" && err.meta?.target?.includes("email")) {
      return res.status(409).json({ error: "User already exists" });
    }
    next(err);
  }
};
