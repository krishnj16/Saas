// const bcrypt = require("bcrypt");
// const { prisma } = require("../configs/prisma"); 

// async function updateMe(req, res) {
//   try {
//     const userId = req.user.id;
//     const { email, password } = req.body;

//     const data = {};
//     if (email) data.email = email;

//     if (password) {
//       const saltRounds = 10;
//       data.passwordHash = await bcrypt.hash(password, saltRounds);
//     }

//     if (Object.keys(data).length === 0) {
//       return res.status(400).json({ message: "Nothing to update" });
//     }

//     const updated = await prisma.user.update({
//       where: { id: userId },
//       data,
//       select: { id: true, email: true, role: true, createdAt: true },
//     });

//     res.json({ user: updated });
//   } catch (err) {
//     console.error("updateMe error:", err);
//     if (err.code === "P2002" && err.meta?.target?.includes("email")) {
//       return res.status(400).json({ message: "Email already in use" });
//     }
//     res.status(500).json({ message: "Server error" });
//   }
// }

// async function getAllUsers(req, res) {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ message: "Forbidden: admin only" });
//     }

//     const users = await prisma.user.findMany({
//       select: { id: true, email: true, role: true, createdAt: true },
//       orderBy: { createdAt: "asc" },
//     });

//     res.json({ users });
//   } catch (err) {
//     console.error("getAllUsers error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// module.exports = { updateMe, getAllUsers };
// controllers/user.controller.js
const bcrypt = require("bcrypt");
const { prisma } = require("../configs/prisma");

// PATCH /users/me
async function updateMe(req, res) {
  try {
    const userId = req.user.id;
    const { email, password } = req.body;

    const data = {};
    if (email) data.email = email;

    if (password) {
      const saltRounds = 10;
      data.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true,role: true, createdAt: true },
    });

    return res.json({ user: updated });
  } catch (err) {
    console.error("updateMe error:", err);
    if (err.code === "P2002" && err.meta?.target?.includes("email")) {
      return res.status(400).json({ message: "Email already in use" });
    }
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /users or /users/all (admin only)
async function getAllUsers(req, res) {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: admin only" });
    }

    const users = await prisma.user.findMany({
      select: { id: true, email: true,role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    return res.json({ users });
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { updateMe, getAllUsers };
