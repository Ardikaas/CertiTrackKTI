const express = require("express");
const router = express.Router();

// Import individual route files here
// const userRoutes = require('./userRoutes');
const whatsappRoutes = require("./whatsappRoutes");
const sertifikasiRoutes = require("./sertifikasiRoutes");
const notificationRoutes = require("./notificationRoutes");

// Mount routes
// router.use('/users', userRoutes);
router.use("/whatsapp", whatsappRoutes);
router.use("/sertifikasi", sertifikasiRoutes);
router.use("/notifications", notificationRoutes);

router.get("/health", (req, res) => {
  res.status(200).json({ status: "success", message: "API is healthy" });
});

module.exports = router;
