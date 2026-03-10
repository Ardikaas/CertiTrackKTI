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
