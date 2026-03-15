const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { getSettings, saveSettings, getLogs } = require("../services/notificationService");
const {
  sendNotifications,
  restartScheduler,
  scheduleTestNotification,
  cancelScheduledTest,
  getScheduledTestMeta,
} = require("../services/notificationScheduler");

// GET /api/v1/notifications/settings
router.get(
  "/settings",
  catchAsync(async (req, res) => {
    const settings = await getSettings();
    res.status(200).json({ status: "success", data: settings });
  }),
);

// PUT /api/v1/notifications/settings
router.put(
  "/settings",
  catchAsync(async (req, res) => {
    const { recipients, expiringDays, enabledTypes, scheduleTime, testMode } = req.body;

    // saveSettings validates scheduleTime format and throws AppError 400 if invalid
    const updated = await saveSettings({ recipients, expiringDays, enabledTypes, scheduleTime, testMode });

    // Restart scheduler only when scheduleTime changed — NOT on testMode change
    if (scheduleTime !== undefined) {
      await restartScheduler();
    }

    res.status(200).json({ status: "success", data: updated });
  }),
);

// POST /api/v1/notifications/test — backward-compatible instant test (uses sample data fallback)
router.post(
  "/test",
  catchAsync(async (req, res) => {
    const { type } = req.body;
    const result = await sendNotifications(type || "all", true);
    res.status(200).json({ status: "success", data: result });
  }),
);

// POST /api/v1/notifications/test-preview — real DB data, custom threshold
router.post(
  "/test-preview",
  catchAsync(async (req, res) => {
    const { type, thresholdDays } = req.body;
    const threshold = thresholdDays !== undefined ? parseInt(thresholdDays, 10) : null;

    if (threshold !== null && (isNaN(threshold) || threshold < 1)) {
      throw new AppError("thresholdDays must be a positive integer", 400);
    }

    // Pass "test_preview" as logTypeOverride so logs get amber TEST badge
    const result = await sendNotifications(type || "all", true, threshold, "test_preview");
    res.status(200).json({ status: "success", data: result });
  }),
);

// POST /api/v1/notifications/test-schedule — one-shot setTimeout in X minutes
router.post(
  "/test-schedule",
  catchAsync(async (req, res) => {
    const { minutes, type } = req.body;
    const minutesVal = parseInt(minutes, 10);

    if (isNaN(minutesVal) || minutesVal < 1 || minutesVal > 60) {
      throw new AppError("minutes must be between 1 and 60", 400);
    }

    const meta = scheduleTestNotification(minutesVal, type || "all");
    res.status(200).json({ status: "success", data: meta });
  }),
);

// DELETE /api/v1/notifications/test-schedule — cancel pending scheduled test
router.delete(
  "/test-schedule",
  catchAsync(async (req, res) => {
    const cancelled = cancelScheduledTest();
    res.status(200).json({ status: "success", data: { cancelled } });
  }),
);

// GET /api/v1/notifications/test-schedule — check if a test is scheduled
router.get(
  "/test-schedule",
  catchAsync(async (req, res) => {
    const meta = getScheduledTestMeta();
    res.status(200).json({ status: "success", data: meta });
  }),
);

// GET /api/v1/notifications/log — recent logs from MongoDB
router.get(
  "/log",
  catchAsync(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 50;
    const logs = await getLogs(limit);
    res.status(200).json({ status: "success", results: logs.length, data: logs });
  }),
);

module.exports = router;
