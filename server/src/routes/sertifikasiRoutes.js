const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const Sertifikasi = require("../models/Sertifikasi");

// Ensure directories
const uploadsDir = path.join(__dirname, "..", "..", "uploads");
const fotoDir = path.join(uploadsDir, "foto");
const dokumenDir = path.join(uploadsDir, "dokumen");
[fotoDir, dokumenDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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
    // Get all sertifikasi from MongoDB
    const sertifikasi = await Sertifikasi.find().sort({ tanggalExp: 1 });
    
    res.status(200).json({
      status: "success",
      results: sertifikasi.length,
      data: sertifikasi,
    });
  }),
);

// GET /api/v1/sertifikasi/stats — Get statistics for dashboard
router.get(
  "/stats",
  catchAsync(async (req, res) => {
    const allSertifikasi = await Sertifikasi.find();
    
    const total = allSertifikasi.length;
    const expired = allSertifikasi.filter(s => s.status === "expired").length;
    const expiringSoon = allSertifikasi.filter(s => s.status === "expiring_soon").length;
    const active = allSertifikasi.filter(s => s.status === "active").length;
    
    res.status(200).json({
      status: "success",
      data: {
        total,
        expired,
        expiringSoon,
        active,
      },
    });
  }),
);

// POST /api/v1/sertifikasi — Create
router.post(
  "/",
  uploadFields,
  catchAsync(async (req, res) => {
    const body = { ...req.body };

    if (req.files?.fotoEquipment?.[0]) {
      body.fotoEquipment = `/uploads/foto/${req.files.fotoEquipment[0].filename}`;
    }
    if (req.files?.dokumenSertifikat?.[0]) {
      body.dokumenSertifikat = `/uploads/dokumen/${req.files.dokumenSertifikat[0].filename}`;
    }

    const sertifikasi = await Sertifikasi.create(body);

    res.status(201).json({
      status: "success",
      data: sertifikasi,
    });
  }),
);

// GET /api/v1/sertifikasi/:id — Get one
router.get(
  "/:id",
  catchAsync(async (req, res, next) => {
    const sertifikasi = await Sertifikasi.findById(req.params.id);
    
    if (!sertifikasi) {
      return next(new AppError("Sertifikasi tidak ditemukan", 404));
    }
    
    res.status(200).json({
      status: "success",
      data: sertifikasi,
    });
  }),
);

// PUT /api/v1/sertifikasi/:id — Update
router.put(
  "/:id",
  uploadFields,
  catchAsync(async (req, res, next) => {
    const body = { ...req.body };

    if (req.files?.fotoEquipment?.[0]) {
      body.fotoEquipment = `/uploads/foto/${req.files.fotoEquipment[0].filename}`;
    }
    if (req.files?.dokumenSertifikat?.[0]) {
      body.dokumenSertifikat = `/uploads/dokumen/${req.files.dokumenSertifikat[0].filename}`;
    }

    const sertifikasi = await Sertifikasi.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true, runValidators: true }
    );
    
    if (!sertifikasi) {
      return next(new AppError("Sertifikasi tidak ditemukan", 404));
    }

    res.status(200).json({
      status: "success",
      data: sertifikasi,
    });
  }),
);

// DELETE /api/v1/sertifikasi/:id — Delete
router.delete(
  "/:id",
  catchAsync(async (req, res, next) => {
    const sertifikasi = await Sertifikasi.findById(req.params.id);
    
    if (!sertifikasi) {
      return next(new AppError("Sertifikasi tidak ditemukan", 404));
    }

    // Clean up uploaded files
    if (sertifikasi.fotoEquipment) {
      const fotoPath = path.join(__dirname, "..", "..", sertifikasi.fotoEquipment);
      if (fs.existsSync(fotoPath)) fs.unlinkSync(fotoPath);
    }
    if (sertifikasi.dokumenSertifikat) {
      const docPath = path.join(__dirname, "..", "..", sertifikasi.dokumenSertifikat);
      if (fs.existsSync(docPath)) fs.unlinkSync(docPath);
    }

    await Sertifikasi.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: "success",
      data: null,
    });
  }),
);

module.exports = router;
