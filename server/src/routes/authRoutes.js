const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Seed default admin jika belum ada
const seedDefaultUser = async () => {
  if (fs.existsSync(USERS_FILE)) return;
  const hash = await bcrypt.hash("admin123", 12);
  const users = [
    {
      _id: crypto.randomUUID(),
      username: "admin",
      name: "Administrator",
      password: hash,
      role: "admin",
      createdAt: new Date().toISOString(),
    },
  ];
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
  console.log("✅ Default admin user created (username: admin, password: admin123)");
};
seedDefaultUser();

const readUsers = () => {
  try {
    if (fs.existsSync(USERS_FILE)) return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {}
  return [];
};

const writeUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
};

const signToken = (user) => {
  const secret = process.env.JWT_SECRET || "certitrack_secret_key_2024";
  return jwt.sign({ id: user._id, username: user.username, role: user.role }, secret, {
    expiresIn: "7d",
  });
};

// POST /api/v1/auth/register
router.post(
  "/register",
  catchAsync(async (req, res, next) => {
    const { username, name, password, confirmPassword } = req.body;

    if (!username || !name || !password) {
      return next(new AppError("Username, nama, dan password wajib diisi", 400));
    }
    if (password.length < 6) {
      return next(new AppError("Password minimal 6 karakter", 400));
    }
    if (password !== confirmPassword) {
      return next(new AppError("Password dan konfirmasi password tidak cocok", 400));
    }

    const users = readUsers();
    const exists = users.find((u) => u.username === username.trim().toLowerCase());
    if (exists) {
      return next(new AppError("Username sudah digunakan", 400));
    }

    const hash = await bcrypt.hash(password, 12);
    const newUser = {
      _id: crypto.randomUUID(),
      username: username.trim().toLowerCase(),
      name: name.trim(),
      password: hash,
      role: "admin",
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    writeUsers(users);

    const token = signToken(newUser);
    res.status(201).json({
      status: "success",
      token,
      data: {
        user: { id: newUser._id, username: newUser.username, name: newUser.name, role: newUser.role },
      },
    });
  })
);

// POST /api/v1/auth/login
router.post(
  "/login",
  catchAsync(async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return next(new AppError("Username dan password wajib diisi", 400));
    }

    const users = readUsers();
    const user = users.find((u) => u.username === username.trim().toLowerCase());
    if (!user) {
      return next(new AppError("Username atau password salah", 401));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new AppError("Username atau password salah", 401));
    }

    const token = signToken(user);

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: { id: user._id, username: user.username, name: user.name, role: user.role },
      },
    });
  })
);

// GET /api/v1/auth/me  (requires token)
router.get(
  "/me",
  catchAsync(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Token tidak ditemukan", 401));
    }
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "certitrack_secret_key_2024";
    try {
      const decoded = jwt.verify(token, secret);
      const users = readUsers();
      const user = users.find((u) => u._id === decoded.id);
      if (!user) return next(new AppError("User tidak ditemukan", 401));
      res.status(200).json({
        status: "success",
        data: { user: { id: user._id, username: user.username, name: user.name, role: user.role } },
      });
    } catch {
      return next(new AppError("Token tidak valid atau sudah kadaluarsa", 401));
    }
  })
);

module.exports = router;
