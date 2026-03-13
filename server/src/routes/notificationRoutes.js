const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const catchAsync = require("../utils/catchAsync");
const { sendNotifications } = require("../services/notificationScheduler");

// JSON file paths for storage (no database needed)
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const SETTINGS_FILE = path.join(DATA_DIR, "notification_settings.json");
const LOGS_FILE = path.join(DATA_DIR, "notification_logs.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Default settings
const DEFAULT_SETTINGS = {
  recipients: [],
  enabledTypes: { expiringSoon: true, weeklyCheck: true, expired: true },
  expiringDays: 30,
};

// Helper: read JSON file with defaults
const readJSON = (filePath, defaultValue) => {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
  return defaultValue;
};

// Helper: write JSON file
const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
};

// GET /api/v1/notifications/settings
router.get(
  "/settings",
  catchAsync(async (req, res) => {
    const settings = readJSON(SETTINGS_FILE, DEFAULT_SETTINGS);
    res.status(200).json({
      status: "success",
      data: settings,
    });
  }),
);

// PUT /api/v1/notifications/settings
router.put(
  "/settings",
  catchAsync(async (req, res) => {
    let settings = readJSON(SETTINGS_FILE, DEFAULT_SETTINGS);
    const { recipients, expiringDays, enabledTypes } = req.body;

    if (recipients !== undefined) settings.recipients = recipients;
    if (expiringDays !== undefined) settings.expiringDays = expiringDays;
    if (enabledTypes !== undefined) {
      settings.enabledTypes = { ...settings.enabledTypes, ...enabledTypes };
    }

    writeJSON(SETTINGS_FILE, settings);

    res.status(200).json({
      status: "success",
      data: settings,
    });
  }),
);

// POST /api/v1/notifications/test — Send test notification now
router.post(
  "/test",
  catchAsync(async (req, res) => {
    const { type } = req.body;
    const result = await sendNotifications(type || "all", true);
    res.status(200).json({
      status: "success",
      data: result,
    });
  }),
);

// POST /api/v1/notifications/test-minutes — Send test with certification expiring in X minutes
router.post(
  "/test-minutes",
  catchAsync(async (req, res) => {
    const { minutes } = req.body;
    const minutesVal = parseInt(minutes) || 5;
    
    // Get current settings
    const settings = readJSON(SETTINGS_FILE, DEFAULT_SETTINGS);
    
    // Check WhatsApp connection
    const { getStatus } = require("../services/whatsapp");
    if (getStatus() !== "open") {
      return res.status(200).json({
        status: "success",
        data: { error: "WhatsApp belum terhubung. Hubungkan dulu via QR code." },
      });
    }

    if (settings.recipients.length === 0) {
      return res.status(200).json({
        status: "success",
        data: { error: "Belum ada nomor penerima. Tambahkan di Pengaturan Notifikasi." },
      });
    }

    // Create a test certification that expires in X minutes
    const expDate = new Date(Date.now() + minutesVal * 60 * 1000);
    const testCert = {
      namaSertifikasi: `TEST - Sertifikasi Demo (${minutesVal} menit)`,
      nomorSertifikat: `TEST-${Date.now()}`,
      jenisSertifikasi: "Test",
      tanggalExp: expDate.toISOString(),
      sisaHari: 0, // Less than a day
    };

    // Build message
    let msg = `⚠️ *TEST NOTIFIKASI - ${minutesVal} MENIT*\n\n`;
    msg += `Sertifikasi test akan expired dalam ${minutesVal} menit:\n\n`;
    msg += `1. *${testCert.namaSertifikasi}* (${testCert.nomorSertifikat})\n`;
    msg += `   Jenis: ${testCert.jenisSertifikasi}\n`;
    msg += `   Expired: ${new Date(testCert.tanggalExp).toLocaleString("id-ID")}\n`;
    msg += `   Sisa: ${minutesVal} menit\n\n`;
    msg += `— _CertiTrackKTI (Test Mode)_`;

    // Send to all recipients
    const { sendMessage } = require("../services/whatsapp");
    const results = [];
    
    for (const phone of settings.recipients) {
      try {
        await sendMessage(phone, msg);
        addLog({ 
          type: "test_expiring_minutes", 
          recipient: phone, 
          message: msg, 
          status: "sent",
          metadata: { minutes: minutesVal }
        });
        results.push({ phone, status: "sent" });
      } catch (error) {
        addLog({ 
          type: "test_expiring_minutes", 
          recipient: phone, 
          message: msg, 
          status: "failed", 
          error: error.message 
        });
        results.push({ phone, status: "failed", error: error.message });
      }
    }

    res.status(200).json({
      status: "success",
      data: {
        sent: [{
          type: "test_expiring_minutes",
          count: 1,
          results: results,
        }],
        skipped: [],
        testCert: testCert,
      },
    });
  }),
);

// GET /api/v1/notifications/log — Recent logs
router.get(
  "/log",
  catchAsync(async (req, res) => {
    const logs = readJSON(LOGS_FILE, []);
    // Return latest 50, sorted newest first
    const sorted = logs
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);
    res.status(200).json({
      status: "success",
      results: sorted.length,
      data: sorted,
    });
  }),
);

// Export helpers for scheduler to use
router.readSettings = () => readJSON(SETTINGS_FILE, DEFAULT_SETTINGS);
router.addLog = (log) => {
  const logs = readJSON(LOGS_FILE, []);
  logs.push({
    ...log,
    _id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  });
  // Keep max 200 logs
  if (logs.length > 200) logs.splice(0, logs.length - 200);
  writeJSON(LOGS_FILE, logs);
};

module.exports = router;
