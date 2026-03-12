const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DEFAULT_CATEGORIES = [
  "Sertifikasi Instalasi Listrik",
  "Sertifikasi Instalasi Penyalur Petir",
  "Sertifikasi Pesawat Tenaga Produksi",
  "Sertifikasi Pesawat Angkat Angkut",
  "Sertifikasi Lift",
  "Sertifikasi Bejana Tekan",
  "Sertifikasi Pemadam Kebakaran",
];

const readCategories = () => {
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      return JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf8"));
    }
  } catch (err) {
    console.error("Error reading categories:", err.message);
  }
  return [...DEFAULT_CATEGORIES];
};

const writeCategories = (data) => {
  fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(data, null, 2), "utf8");
};

// GET /api/v1/categories
router.get(
  "/",
  catchAsync(async (req, res) => {
    const categories = readCategories();
    res.status(200).json({ status: "success", data: categories });
  })
);

// POST /api/v1/categories
router.post(
  "/",
  catchAsync(async (req, res, next) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return next(new AppError("Nama kategori wajib diisi", 400));
    }
    const categories = readCategories();
    const trimmed = name.trim();
    if (categories.includes(trimmed)) {
      return next(new AppError("Kategori sudah ada", 400));
    }
    categories.push(trimmed);
    writeCategories(categories);
    res.status(201).json({ status: "success", data: categories });
  })
);

// DELETE /api/v1/categories/:name
router.delete(
  "/:name",
  catchAsync(async (req, res, next) => {
    const categories = readCategories();
    const name = decodeURIComponent(req.params.name);
    const index = categories.indexOf(name);
    if (index === -1) {
      return next(new AppError("Kategori tidak ditemukan", 404));
    }
    categories.splice(index, 1);
    writeCategories(categories);
    res.status(200).json({ status: "success", data: categories });
  })
);

module.exports = router;
