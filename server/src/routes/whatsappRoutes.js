const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const {
  getQR,
  getStatus,
  sendMessage,
  logout,
} = require("../services/whatsapp");

// GET /api/v1/whatsapp/status
router.get(
  "/status",
  catchAsync(async (req, res) => {
    const connectionStatus = getStatus();
    res.status(200).json({
      status: "success",
      data: { connectionStatus },
    });
  }),
);

// GET /api/v1/whatsapp/qr
router.get(
  "/qr",
  catchAsync(async (req, res) => {
    const connectionStatus = getStatus();

    if (connectionStatus === "open") {
      return res.status(200).json({
        status: "success",
        data: { qr: null, message: "Already connected" },
      });
    }

    const qr = getQR();
    if (!qr) {
      return res.status(200).json({
        status: "success",
        data: {
          qr: null,
          message: "QR code not yet available. Please wait...",
        },
      });
    }

    res.status(200).json({
      status: "success",
      data: { qr },
    });
  }),
);

// POST /api/v1/whatsapp/send
router.post(
  "/send",
  catchAsync(async (req, res, next) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return next(new AppError("Phone number and message are required", 400));
    }

    const result = await sendMessage(phone, message);

    res.status(200).json({
      status: "success",
      data: {
        message: "Message sent successfully",
        messageId: result?.key?.id || null,
      },
    });
  }),
);

// POST /api/v1/whatsapp/logout
router.post(
  "/logout",
  catchAsync(async (req, res) => {
    await logout();
    res.status(200).json({
      status: "success",
      data: { message: "Logged out successfully" },
    });
  }),
);

module.exports = router;
