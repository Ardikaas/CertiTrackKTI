const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// JSON file storage
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const SERTIFIKASI_FILE = path.join(DATA_DIR, "sertifikasi.json");

// Ensure directories
const uploadsDir = path.join(__dirname, "..", "..", "uploads");
const fotoDir = path.join(uploadsDir, "foto");
const dokumenDir = path.join(uploadsDir, "dokumen");
[DATA_DIR, uploadsDir, fotoDir, dokumenDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// JSON helpers
const readData = () => {
  try {
    if (fs.existsSync(SERTIFIKASI_FILE)) {
      return JSON.parse(fs.readFileSync(SERTIFIKASI_FILE, "utf8"));
    }
  } catch (err) {
    console.error("Error reading sertifikasi data:", err.message);
  }
  return [];
};

const writeData = (data) => {
  fs.writeFileSync(SERTIFIKASI_FILE, JSON.stringify(data, null, 2), "utf8");
};

// Calculate sisaHari (remaining days until expiry)
const calcSisaHari = (tanggalExp) => {
  const now = new Date();
  const exp = new Date(tanggalExp);
  return Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
};

// Enrich record with computed fields
const enrichRecord = (record) => ({
  ...record,
  sisaHari: calcSisaHari(record.tanggalExp),
});

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "fotoEquipment") cb(null, fotoDir);
    else if (file.fieldname === "dokumenSertifikat") cb(null, dokumenDir);
    else cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "fotoEquipment") {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new AppError("Foto harus berformat gambar (JPG, PNG)", 400), false);
  } else if (file.fieldname === "dokumenSertifikat") {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new AppError("Dokumen harus berformat PDF", 400), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadFields = upload.fields([
  { name: "fotoEquipment", maxCount: 1 },
  { name: "dokumenSertifikat", maxCount: 1 },
]);

// GET /api/v1/sertifikasi — List all
router.get(
  "/",
  catchAsync(async (req, res) => {
    const data = readData().map(enrichRecord);
    
    // Filter by user ID
    const userSertifikasi = data.filter((d) => d.userId === req.user.id);
    
    userSertifikasi.sort((a, b) => new Date(a.tanggalExp) - new Date(b.tanggalExp));
    res.status(200).json({
      status: "success",
      results: userSertifikasi.length,
      data: userSertifikasi,
    });
  }),
);

// POST /api/v1/sertifikasi — Create
router.post(
  "/",
  uploadFields,
  catchAsync(async (req, res) => {
    const data = readData();
    const body = { ...req.body };

    // Generate unique ID
    body._id = crypto.randomUUID();
    body.userId = req.user.id; // Assign to current user
    body.createdAt = new Date().toISOString();
    body.updatedAt = new Date().toISOString();

    if (req.files?.fotoEquipment?.[0]) {
      body.fotoEquipment = `/uploads/foto/${req.files.fotoEquipment[0].filename}`;
    }
    if (req.files?.dokumenSertifikat?.[0]) {
      body.dokumenSertifikat = `/uploads/dokumen/${req.files.dokumenSertifikat[0].filename}`;
    }

    data.push(body);
    writeData(data);

    res.status(201).json({
      status: "success",
      data: enrichRecord(body),
    });
  }),
);

// GET /api/v1/sertifikasi/:id — Get one
router.get(
  "/:id",
  catchAsync(async (req, res, next) => {
    const data = readData();
    const record = data.find((d) => d._id === req.params.id && d.userId === req.user.id);
    if (!record) {
      return next(new AppError("Sertifikasi tidak ditemukan", 404));
    }
    res.status(200).json({
      status: "success",
      data: enrichRecord(record),
    });
  }),
);

// PUT /api/v1/sertifikasi/:id — Update
router.put(
  "/:id",
  uploadFields,
  catchAsync(async (req, res, next) => {
    const data = readData();
    const index = data.findIndex((d) => d._id === req.params.id && d.userId === req.user.id);
    if (index === -1) {
      return next(new AppError("Sertifikasi tidak ditemukan atau tidak memiliki akses", 404));
    }

    const body = { ...req.body };
    body.updatedAt = new Date().toISOString();

    if (req.files?.fotoEquipment?.[0]) {
      body.fotoEquipment = `/uploads/foto/${req.files.fotoEquipment[0].filename}`;
    }
    if (req.files?.dokumenSertifikat?.[0]) {
      body.dokumenSertifikat = `/uploads/dokumen/${req.files.dokumenSertifikat[0].filename}`;
    }

    data[index] = { ...data[index], ...body };
    writeData(data);

    res.status(200).json({
      status: "success",
      data: enrichRecord(data[index]),
    });
  }),
);

// DELETE /api/v1/sertifikasi/:id — Delete
router.delete(
  "/:id",
  catchAsync(async (req, res, next) => {
    const data = readData();
    const index = data.findIndex((d) => d._id === req.params.id && d.userId === req.user.id);
    if (index === -1) {
      return next(new AppError("Sertifikasi tidak ditemukan atau tidak memiliki akses", 404));
    }

    const record = data[index];

    // Clean up uploaded files
    if (record.fotoEquipment) {
      const fotoPath = path.join(__dirname, "..", "..", record.fotoEquipment);
      if (fs.existsSync(fotoPath)) fs.unlinkSync(fotoPath);
    }
    if (record.dokumenSertifikat) {
      const docPath = path.join(
        __dirname,
        "..",
        "..",
        record.dokumenSertifikat,
      );
      if (fs.existsSync(docPath)) fs.unlinkSync(docPath);
    }

    data.splice(index, 1);
    writeData(data);

    res.status(200).json({
      status: "success",
      data: null,
    });
  }),
);

module.exports = router;
