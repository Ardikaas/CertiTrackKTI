const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");

const authRoutes = require("./authRoutes");
const whatsappRoutes = require("./whatsappRoutes");
const sertifikasiRoutes = require("./sertifikasiRoutes");
const notificationRoutes = require("./notificationRoutes");
const categoriesRoutes = require("./categoriesRoutes");

// Auth routes (public — no token required)
router.use("/auth", authRoutes);

// Protected routes
router.use("/whatsapp", protect, whatsappRoutes);
router.use("/sertifikasi", protect, sertifikasiRoutes);
router.use("/notifications", protect, notificationRoutes);
router.use("/categories", protect, categoriesRoutes);

router.get("/health", (req, res) => {
  res.status(200).json({ status: "success", message: "API is healthy" });
});

module.exports = router;
