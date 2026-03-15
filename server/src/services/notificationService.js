const NotificationSetting = require("../models/NotificationSetting");
const NotificationLog = require("../models/NotificationLog");
const AppError = require("../utils/AppError");

/**
 * Returns the single settings document. Creates with defaults if none exists.
 */
const getSettings = async () => {
  const settings = await NotificationSetting.findOneAndUpdate(
    { _singleton: "default" },
    {},
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  return settings;
};

/**
 * Validates and saves a partial settings update. Returns updated document.
 * Accepts: { recipients, expiringDays, enabledTypes, scheduleTime, testMode }
 */
const PHONE_RE = /^(\+?62|0)\d{8,13}$/;

const saveSettings = async (data) => {
  const update = {};

  if (data.recipients !== undefined) {
    const invalid = data.recipients.filter((r) => !PHONE_RE.test(r.replace(/[\s\-()]/g, "")));
    if (invalid.length > 0) {
      throw new AppError(
        `Nomor tidak valid: ${invalid.join(", ")}. Gunakan format 08xxx, 628xxx, atau +628xxx`,
        400,
      );
    }
    update.recipients = data.recipients;
  }
  if (data.expiringDays !== undefined) update.expiringDays = data.expiringDays;
  if (data.testMode !== undefined)     update.testMode     = data.testMode;

  if (data.enabledTypes !== undefined) {
    const current = await getSettings();
    update["enabledTypes.expiringSoon"] = data.enabledTypes.expiringSoon ?? current.enabledTypes.expiringSoon;
    update["enabledTypes.weeklyCheck"]  = data.enabledTypes.weeklyCheck  ?? current.enabledTypes.weeklyCheck;
    update["enabledTypes.expired"]      = data.enabledTypes.expired      ?? current.enabledTypes.expired;
  }

  if (data.scheduleTime !== undefined) {
    const parts = data.scheduleTime.split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (parts.length !== 2 || isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      throw new AppError("scheduleTime must be HH:MM (00:00–23:59)", 400);
    }
    update.scheduleTime = data.scheduleTime;
  }

  const updated = await NotificationSetting.findOneAndUpdate(
    { _singleton: "default" },
    { $set: update },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  return updated;
};

/**
 * Inserts one notification log entry.
 * logData: { type, recipient, message, status, error?, metadata? }
 */
const addLog = async (logData) => {
  const log = new NotificationLog(logData);
  await log.save();
  return log;
};

/**
 * Returns the latest `limit` log entries sorted newest first.
 */
const getLogs = async (limit = 50) => {
  return NotificationLog.find().sort({ createdAt: -1 }).limit(limit);
};

module.exports = { getSettings, saveSettings, addLog, getLogs };
