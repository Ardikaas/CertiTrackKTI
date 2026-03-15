# WhatsApp Notification System — Production Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the WhatsApp notification system from JSON file storage to MongoDB, eliminate code duplication via a shared service layer, fix the scheduleTime save bug, and add two real test features plus a global Test Mode toggle.

**Architecture:** A new `notificationService.js` owns all MongoDB I/O (settings + logs). `notificationScheduler.js` and `notificationRoutes.js` import from it, eliminating duplication. Two existing Mongoose models are updated in-place. The frontend `WhatsApp.jsx` gains a Test Mode banner, updated test controls, and log badges.

**Tech Stack:** Node.js, Express 5, Mongoose 9, node-cron 4, React 19, Tailwind CSS. No test framework — verification via `curl` against the running dev server.

**Spec:** `docs/superpowers/specs/2026-03-15-whatsapp-notification-prod-design.md`

---

## Chunk 1: MongoDB Model Updates

### Task 1: Update `NotificationSetting.js`

**Files:**
- Modify: `server/src/models/NotificationSetting.js`

- [ ] **Step 1: Add `_singleton` and `testMode` fields to the schema**

Open `server/src/models/NotificationSetting.js`. The current schema has `recipients`, `expiringDays`, `scheduleTime`, `enabledTypes`. Add two fields:

```js
const notificationSettingSchema = new mongoose.Schema(
  {
    _singleton: { type: String, default: "default", unique: true },
    recipients: { type: [String], default: [] },
    expiringDays: { type: Number, default: 30 },
    scheduleTime: { type: String, default: "08:00" },
    enabledTypes: {
      expiringSoon: { type: Boolean, default: true },
      weeklyCheck:  { type: Boolean, default: true },
      expired:      { type: Boolean, default: true },
    },
    testMode: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("NotificationSetting", notificationSettingSchema);
```

- [ ] **Step 2: Verify the model loads without errors**

```bash
cd server && node -e "const m = require('./src/models/NotificationSetting'); console.log(m.schema.paths['_singleton'].options, m.schema.paths['testMode'].options)"
```

Expected output contains `{ type: [Function: String], default: 'default', unique: true }` and `{ type: [Function: Boolean], default: false }`.

- [ ] **Step 3: Commit**

```bash
git add server/src/models/NotificationSetting.js
git commit -m "feat: add _singleton and testMode fields to NotificationSetting schema"
```

---

### Task 2: Update `NotificationLog.js`

**Files:**
- Modify: `server/src/models/NotificationLog.js`

- [ ] **Step 1: Extend type enum and add metadata field**

Open `server/src/models/NotificationLog.js`. Replace the schema with:

```js
const notificationLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["expiring_soon", "weekly_check", "expired", "test_preview", "test_scheduled"],
      required: true,
    },
    recipient: { type: String, required: true },
    message:   { type: String, required: true },
    status:    { type: String, enum: ["sent", "failed"], required: true },
    error:     { type: String, default: null },
    metadata:  { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

// Index for efficient sorting by newest first
notificationLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("NotificationLog", notificationLogSchema);
```

- [ ] **Step 2: Verify the model loads without errors**

```bash
cd server && node -e "const m = require('./src/models/NotificationLog'); console.log(m.schema.path('type').enumValues, m.schema.paths['metadata'])"
```

Expected: enum array includes `"test_preview"` and `"test_scheduled"`, metadata path is defined.

- [ ] **Step 3: Commit**

```bash
git add server/src/models/NotificationLog.js
git commit -m "feat: extend NotificationLog enum with test types, add metadata field and createdAt index"
```

---

## Chunk 2: Notification Service

### Task 3: Create `notificationService.js`

**Files:**
- Create: `server/src/services/notificationService.js`

- [ ] **Step 1: Create the file with all four exported functions**

```js
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
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return settings;
};

/**
 * Validates and saves a partial settings update. Returns updated document.
 * Accepts: { recipients, expiringDays, enabledTypes, scheduleTime, testMode }
 */
const saveSettings = async (data) => {
  const update = {};

  if (data.recipients !== undefined)   update.recipients   = data.recipients;
  if (data.expiringDays !== undefined) update.expiringDays = data.expiringDays;
  if (data.testMode !== undefined)     update.testMode     = data.testMode;

  if (data.enabledTypes !== undefined) {
    // Merge nested object — use dot notation to avoid overwriting untouched keys
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
    { upsert: true, new: true, setDefaultsOnInsert: true },
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
```

- [ ] **Step 2: Verify the module loads without errors**

```bash
cd server && node -e "const s = require('./src/services/notificationService'); console.log(Object.keys(s))"
```

Expected: `[ 'getSettings', 'saveSettings', 'addLog', 'getLogs' ]`

- [ ] **Step 3: Commit**

```bash
git add server/src/services/notificationService.js
git commit -m "feat: add notificationService with MongoDB-backed getSettings, saveSettings, addLog, getLogs"
```

---

## Chunk 3: Scheduler Refactor

### Task 4: Refactor `notificationScheduler.js`

**Files:**
- Modify: `server/src/services/notificationScheduler.js`

This is the largest change. We are:
1. Removing all JSON file I/O (`readJSON`, `writeJSON`, `addLog`, `DEFAULT_SETTINGS`, `getSettings`)
2. Importing `getSettings`, `addLog` from `notificationService`
3. Making cron callbacks `async` with a `testMode` guard
4. Adding `logTypeOverride` param to `sendNotifications`
5. Adding `scheduleTestNotification`, `cancelScheduledTest`, `getScheduledTestMeta`

- [ ] **Step 1: Replace the entire file**

```js
const cron = require("node-cron");
const { sendMessage, getStatus } = require("./whatsapp");
const { getSettings, addLog } = require("./notificationService");
const Sertifikasi = require("../models/Sertifikasi");

/**
 * Format date to Indonesian locale string
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Get sertifikasi data from MongoDB with sisaHari calculated
 */
const getSertifikasiData = async () => {
  try {
    const certs = await Sertifikasi.find();
    return certs.map((cert) => ({
      ...cert.toObject(),
      sisaHari: Math.ceil(
        (new Date(cert.tanggalExp) - new Date()) / (1000 * 60 * 60 * 24),
      ),
    }));
  } catch (err) {
    console.error("Error fetching sertifikasi from DB:", err.message);
    return [];
  }
};

const buildExpiringSoonMessage = (certs, days) => {
  if (certs.length === 0) return null;
  let msg = `⚠️ *PERINGATAN SERTIFIKASI*\n\n`;
  msg += `Sertifikasi berikut akan expired dalam ${days} hari:\n\n`;
  certs.forEach((cert, i) => {
    msg += `${i + 1}. *${cert.namaSertifikasi}* (${cert.nomorSertifikat})\n`;
    msg += `   Jenis: ${cert.jenisSertifikasi}\n`;
    msg += `   Expired: ${formatDate(cert.tanggalExp)}\n`;
    msg += `   Sisa: ${cert.sisaHari} hari\n\n`;
  });
  msg += `— _CertiTrackKTI_`;
  return msg;
};

const buildExpiredMessage = (certs) => {
  if (certs.length === 0) return null;
  let msg = `🔴 *SERTIFIKASI EXPIRED*\n\n`;
  msg += `Sertifikasi berikut sudah expired:\n\n`;
  certs.forEach((cert, i) => {
    const daysOverdue = Math.abs(cert.sisaHari);
    msg += `${i + 1}. *${cert.namaSertifikasi}* (${cert.nomorSertifikat})\n`;
    msg += `   Jenis: ${cert.jenisSertifikasi}\n`;
    msg += `   Expired sejak: ${formatDate(cert.tanggalExp)}\n`;
    msg += `   Lewat: ${daysOverdue} hari\n\n`;
  });
  msg += `Segera perpanjang sertifikasi di atas.\n\n`;
  msg += `— _CertiTrackKTI_`;
  return msg;
};

const buildWeeklyMessage = (expiringSoon, expired, activeCount) => {
  let msg = `📋 *LAPORAN MINGGUAN SERTIFIKASI*\n\n`;
  msg += `📊 Ringkasan:\n`;
  msg += `• Aktif: ${activeCount} sertifikasi\n`;
  msg += `• Akan expired: ${expiringSoon.length} sertifikasi\n`;
  msg += `• Sudah expired: ${expired.length} sertifikasi\n\n`;
  if (expiringSoon.length > 0) {
    msg += `⚠️ *Akan Expired:*\n`;
    expiringSoon.forEach((cert, i) => {
      msg += `${i + 1}. ${cert.namaSertifikasi} — ${cert.sisaHari} hari lagi\n`;
    });
    msg += `\n`;
  }
  if (expired.length > 0) {
    msg += `🔴 *Sudah Expired:*\n`;
    expired.forEach((cert, i) => {
      msg += `${i + 1}. ${cert.namaSertifikasi} — ${Math.abs(cert.sisaHari)} hari lalu\n`;
    });
    msg += `\n`;
  }
  if (expiringSoon.length === 0 && expired.length === 0) {
    msg += `✅ Semua sertifikasi dalam kondisi baik!\n\n`;
  }
  msg += `— _CertiTrackKTI_`;
  return msg;
};

/**
 * Send a message to all recipients and log result
 */
const sendToRecipients = async (recipients, message, logType) => {
  const results = [];
  for (const phone of recipients) {
    try {
      await sendMessage(phone, message);
      await addLog({ type: logType, recipient: phone, message, status: "sent" });
      results.push({ phone, status: "sent" });
    } catch (error) {
      await addLog({ type: logType, recipient: phone, message, status: "failed", error: error.message });
      results.push({ phone, status: "failed", error: error.message });
    }
  }
  return results;
};

/**
 * Sample data for testing when DB is empty
 */
const SAMPLE_CERTS = [
  {
    namaSertifikasi: "Kalibrasi Pressure Gauge",
    nomorSertifikat: "KAL-2024-001",
    jenisSertifikasi: "Kalibrasi",
    tanggalExp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    sisaHari: 7,
  },
  {
    namaSertifikasi: "Sertifikat Lifting Equipment",
    nomorSertifikat: "SLE-2024-012",
    jenisSertifikasi: "K3",
    tanggalExp: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    sisaHari: 14,
  },
  {
    namaSertifikasi: "Inspeksi Crane Overhead",
    nomorSertifikat: "ICO-2023-089",
    jenisSertifikasi: "Inspeksi",
    tanggalExp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    sisaHari: -5,
  },
];

/**
 * Send notifications based on type.
 * @param {string} type - 'expiring_soon' | 'expired' | 'weekly_check' | 'all'
 * @param {boolean} isTest - if true, use sample data when DB is empty
 * @param {number|null} thresholdOverride - override expiringDays for this call only
 * @param {string|null} logTypeOverride - override the log type (e.g. 'test_preview', 'test_scheduled')
 */
const sendNotifications = async (type = "all", isTest = false, thresholdOverride = null, logTypeOverride = null) => {
  if (getStatus() !== "open") {
    return { error: "WhatsApp belum terhubung. Hubungkan dulu via QR code." };
  }

  const settings = await getSettings();

  if (settings.recipients.length === 0) {
    return { error: "Belum ada nomor penerima. Tambahkan di Pengaturan Notifikasi." };
  }

  const expiringDays = thresholdOverride !== null ? thresholdOverride : settings.expiringDays;

  let allCerts = await getSertifikasiData();
  if (allCerts.length === 0 && isTest) {
    console.log("📋 Using sample data for test notification");
    allCerts = SAMPLE_CERTS;
  }

  const results = { sent: [], skipped: [] };

  // Expiring soon
  if (type === "all" || type === "expiring_soon") {
    if (settings.enabledTypes.expiringSoon) {
      const expiring = allCerts.filter((c) => c.sisaHari > 0 && c.sisaHari <= expiringDays);
      const msg = buildExpiringSoonMessage(expiring, expiringDays);
      if (msg) {
        const logType = logTypeOverride || "expiring_soon";
        const res = await sendToRecipients(settings.recipients, msg, logType);
        results.sent.push({ type: logType, count: expiring.length, results: res });
      } else {
        results.skipped.push({ type: "expiring_soon", reason: "Tidak ada sertifikasi yang akan expired" });
      }
    } else {
      results.skipped.push({ type: "expiring_soon", reason: "Dinonaktifkan" });
    }
  }

  // Expired
  if (type === "all" || type === "expired") {
    if (settings.enabledTypes.expired) {
      const expired = allCerts.filter((c) => c.sisaHari <= 0);
      const msg = buildExpiredMessage(expired);
      if (msg) {
        const logType = logTypeOverride || "expired";
        const res = await sendToRecipients(settings.recipients, msg, logType);
        results.sent.push({ type: logType, count: expired.length, results: res });
      } else {
        results.skipped.push({ type: "expired", reason: "Tidak ada sertifikasi expired" });
      }
    } else {
      results.skipped.push({ type: "expired", reason: "Dinonaktifkan" });
    }
  }

  // Weekly check
  if (type === "all" || type === "weekly_check") {
    if (settings.enabledTypes.weeklyCheck) {
      const expiring = allCerts.filter((c) => c.sisaHari > 0 && c.sisaHari <= expiringDays);
      const expired  = allCerts.filter((c) => c.sisaHari <= 0);
      const activeCount = allCerts.filter((c) => c.sisaHari > expiringDays).length;
      const msg = buildWeeklyMessage(expiring, expired, activeCount);
      const logType = logTypeOverride || "weekly_check";
      const res = await sendToRecipients(settings.recipients, msg, logType);
      results.sent.push({ type: logType, results: res });
    } else {
      results.skipped.push({ type: "weekly_check", reason: "Dinonaktifkan" });
    }
  }

  return results;
};

// ─── Scheduled Test (one-shot setTimeout) ────────────────────────────────────

let scheduledTestTimeout = null;
let scheduledTestMeta = null;

/**
 * Schedule a one-shot test notification in `minutes` minutes.
 * Cancels any previously scheduled test.
 * Returns { scheduledFor: ISO string, minutes: N }
 */
const scheduleTestNotification = (minutes, type = "all") => {
  // Cancel existing
  if (scheduledTestTimeout) {
    clearTimeout(scheduledTestTimeout);
    scheduledTestTimeout = null;
    scheduledTestMeta = null;
  }

  const cappedMinutes = Math.min(Math.max(1, minutes), 60);
  const ms = cappedMinutes * 60 * 1000;
  const scheduledFor = new Date(Date.now() + ms).toISOString();

  scheduledTestTimeout = setTimeout(async () => {
    scheduledTestTimeout = null;
    scheduledTestMeta = null;
    console.log(`⏰ Scheduled test firing (type: ${type})`);
    try {
      await sendNotifications(type, false, null, "test_scheduled");
    } catch (err) {
      console.error("Scheduled test failed:", err.message);
    }
  }, ms);

  scheduledTestMeta = { scheduledFor, minutes: cappedMinutes };
  console.log(`📅 Test scheduled for ${scheduledFor} (${cappedMinutes}m)`);
  return scheduledTestMeta;
};

const cancelScheduledTest = () => {
  if (scheduledTestTimeout) {
    clearTimeout(scheduledTestTimeout);
    scheduledTestTimeout = null;
    scheduledTestMeta = null;
    return true;
  }
  return false;
};

const getScheduledTestMeta = () => scheduledTestMeta;

// ─── Cron Scheduler ──────────────────────────────────────────────────────────

let dailyTask = null;
let weeklyTask = null;

/**
 * Start the cron scheduler
 */
const startScheduler = async () => {
  const settings = await getSettings();
  const [hour, minute] = (settings.scheduleTime || "08:00").split(":");
  const dailyCron  = `${parseInt(minute)} ${parseInt(hour)} * * *`;
  const weeklyCron = `${parseInt(minute)} ${parseInt(hour)} * * 1`;

  // Daily check — MUST be async, MUST await getSettings for testMode guard
  dailyTask = cron.schedule(dailyCron, async () => {
    const current = await getSettings();
    if (current.testMode) {
      console.log("⏸ Test mode ON — skipping daily notification");
      return;
    }
    console.log("⏰ Running daily notification check...");
    try {
      await sendNotifications("expiring_soon");
    } catch (err) {
      console.error("❌ Daily expiring_soon failed:", err.message);
    }
    try {
      await sendNotifications("expired");
    } catch (err) {
      console.error("❌ Daily expired failed:", err.message);
    }
  });

  // Weekly check — every Monday
  weeklyTask = cron.schedule(weeklyCron, async () => {
    const current = await getSettings();
    if (current.testMode) {
      console.log("⏸ Test mode ON — skipping weekly notification");
      return;
    }
    console.log("⏰ Running weekly notification check...");
    try {
      await sendNotifications("weekly_check");
    } catch (err) {
      console.error("❌ Weekly notification failed:", err.message);
    }
  });

  console.log(`📅 Notification scheduler started (daily ${hour}:${minute.padStart(2, "0")}, weekly Mon)`);
};

/**
 * Stop existing tasks and restart the scheduler.
 * Call when scheduleTime changes. Do NOT call when only testMode changes.
 */
const restartScheduler = async () => {
  if (dailyTask)  dailyTask.stop();
  if (weeklyTask) weeklyTask.stop();
  dailyTask  = null;
  weeklyTask = null;
  await startScheduler();
};

module.exports = {
  sendNotifications,
  startScheduler,
  restartScheduler,
  scheduleTestNotification,
  cancelScheduledTest,
  getScheduledTestMeta,
};
```

- [ ] **Step 2: Verify the module loads without errors**

```bash
cd server && node -e "const s = require('./src/services/notificationScheduler'); console.log(Object.keys(s))"
```

Expected: `[ 'sendNotifications', 'startScheduler', 'restartScheduler', 'scheduleTestNotification', 'cancelScheduledTest', 'getScheduledTestMeta' ]`

- [ ] **Step 3: Fix `server.js` — await `startScheduler` after DB connects**

`startScheduler` is now `async` and calls `getSettings()` which needs MongoDB. The current `server.js` calls both `connectDB()` and `startScheduler()` synchronously (lines 15–18) with no ordering guarantee. Update `server.js` to sequence them properly.

Open `server/src/server.js` and replace lines 14–18:

```js
// Connect to Database, then start scheduler (scheduler needs DB)
connectDB().then(() => {
  startScheduler().catch((err) =>
    logger.error("Scheduler failed to start", { message: err.message }),
  );
});
```

> **Why `.then()` not top-level `await`:** `server.js` uses CommonJS (`require`), not ESM, so top-level `await` is not available. The `.then()` chain ensures `startScheduler` only runs after `connectDB` resolves, and the `.catch()` on `startScheduler` prevents an unhandled rejection from killing the process if the scheduler fails to initialise.

Check `server/src/config/db.js` — `connectDB` must return the Mongoose connection Promise. Open it and verify the function ends with `return mongoose.connect(...)` or equivalent. If it doesn't return a Promise, add `return` before `mongoose.connect(...)`.

- [ ] **Step 4: Commit both files together**

```bash
git add server/src/services/notificationScheduler.js server/src/server.js
git commit -m "refactor: migrate notificationScheduler to MongoDB, make startScheduler async, sequence after connectDB in server.js"
```

---

## Chunk 4: Routes Refactor

### Task 5: Refactor `notificationRoutes.js`

**Files:**
- Modify: `server/src/routes/notificationRoutes.js`

We are:
1. Removing all JSON file I/O (no more `fs`, `path`, `readJSON`, `writeJSON`, `addLog`, `DATA_DIR`)
2. Importing from `notificationService`
3. Fixing the `scheduleTime` save bug
4. Adding `/test-preview` and `/test-schedule` (DELETE too)
5. Removing `/test-minutes`

- [ ] **Step 1: Replace the entire file**

```js
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
```

- [ ] **Step 2: Start server and verify settings endpoint**

```bash
cd server && node src/server.js &
# Wait 3 seconds for server to start, then:
curl -s http://localhost:5000/api/v1/health
```

Expected: `{"status":"success",...}` (not an error)

- [ ] **Step 3: Verify settings GET returns testMode field**

You'll need a JWT token. Log in first:
```bash
curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<your-email>","password":"<your-password>"}' | grep -o '"token":"[^"]*"'
```

Then:
```bash
curl -s http://localhost:5000/api/v1/notifications/settings \
  -H "Authorization: Bearer <token>"
```

Expected response includes `"testMode":false` and `"scheduleTime":"08:00"`.

- [ ] **Step 4: Verify scheduleTime saves correctly (the bug fix)**

```bash
curl -s -X PUT http://localhost:5000/api/v1/notifications/settings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"scheduleTime":"09:30"}'
```

Expected: response includes `"scheduleTime":"09:30"`.

Restart server, then GET settings again — should still show `"09:30"` (not reverted to `"08:00"`).

- [ ] **Step 5: Verify invalid scheduleTime is rejected**

```bash
curl -s -X PUT http://localhost:5000/api/v1/notifications/settings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"scheduleTime":"25:99"}'
```

Expected: HTTP 400 with error message about HH:MM format.

- [ ] **Step 6: Stop dev server, commit**

```bash
kill %1  # stop background server
git add server/src/routes/notificationRoutes.js
git commit -m "refactor: migrate notificationRoutes to MongoDB, fix scheduleTime bug, add test-preview and test-schedule endpoints"
```

---

## Chunk 5: Frontend Update

### Task 6: Update `WhatsApp.jsx`

**Files:**
- Modify: `public/src/pages/WhatsApp.jsx`

Changes:
1. Add `testMode` and `scheduledTest` to state
2. Fetch and save `testMode` with settings
3. Add Test Mode banner + toggle below page header
4. Replace test-minutes footer controls with test-preview + test-schedule
5. Add log badge (`TEST` amber / `PROD` blue)
6. Add scheduled test countdown with cancel button

- [ ] **Step 1: Add new state variables**

Find the existing state declarations block (around line 79–99). Add after `const [qrCountdown, setQrCountdown] = useState(20);`:

```js
// Test mode
const [testMode, setTestMode] = useState(false);
// Scheduled test: { scheduledFor: ISO string, minutes: N } or null
const [scheduledTest, setScheduledTest] = useState(null);
// Countdown seconds remaining for scheduled test
const [schedCountdown, setSchedCountdown] = useState(0);
// Test preview threshold
const [previewThreshold, setPreviewThreshold] = useState(999);
const [testingPreview, setTestingPreview] = useState(false);
const [schedulingTest, setSchedulingTest] = useState(false);
```

- [ ] **Step 2: Update `fetchSettings` to read `testMode`**

Find `fetchSettings` (around line 137). Replace:

```js
const fetchSettings = useCallback(async () => {
  try {
    const res = await apiFetch(`${NOTIF_API}/settings`);
    const data = await res.json();
    if (data.status === "success" && data.data) setSettings(data.data);
  } catch {
    /* keep defaults */
  }
}, []);
```

With:

```js
const fetchSettings = useCallback(async () => {
  try {
    const res = await apiFetch(`${NOTIF_API}/settings`);
    const data = await res.json();
    if (data.status === "success" && data.data) {
      setSettings(data.data);
      setTestMode(data.data.testMode ?? false);
    }
  } catch {
    /* keep defaults */
  }
}, []);
```

- [ ] **Step 3: Add `toggleTestMode` handler**

Add after the closing `};` of `saveSettings` (after line 333 — the line immediately before `// Test notification`):

```js
// Toggle test mode — saves immediately, no unsaved changes state needed
const toggleTestMode = async () => {
  const newVal = !testMode;
  setTestMode(newVal);
  try {
    await apiFetch(`${NOTIF_API}/settings`, {
      method: "PUT",
      body: JSON.stringify({ testMode: newVal }),
    });
  } catch {
    setTestMode(!newVal); // revert on failure
  }
};
```

- [ ] **Step 4: Add `testPreview` handler**

Add after `toggleTestMode`:

```js
const testPreview = async () => {
  setTestingPreview(true);
  setTestResult(null);
  try {
    const res = await apiFetch(`${NOTIF_API}/test-preview`, {
      method: "POST",
      body: JSON.stringify({ type: "all", thresholdDays: previewThreshold }),
    });
    const data = await res.json();
    if (data.status === "success") {
      if (data.data.error) {
        setTestResult({ type: "error", text: data.data.error });
      } else {
        setTestResult({ type: "success", text: `Preview dikirim! (threshold: ${previewThreshold} hari)` });
        fetchLogs();
      }
    } else {
      setTestResult({ type: "error", text: data.message || "Gagal mengirim preview" });
    }
  } catch {
    setTestResult({ type: "error", text: "Gagal mengirim preview." });
  } finally {
    setTestingPreview(false);
    setTimeout(() => setTestResult(null), 4000);
  }
};
```

- [ ] **Step 5: Add `scheduleTest` and `cancelTest` handlers**

Add after `testPreview`:

```js
const scheduleTest = async () => {
  setSchedulingTest(true);
  setTestResult(null);
  try {
    const res = await apiFetch(`${NOTIF_API}/test-schedule`, {
      method: "POST",
      body: JSON.stringify({ minutes: testMinutes, type: "all" }),
    });
    const data = await res.json();
    if (data.status === "success") {
      setScheduledTest(data.data);
      const secs = Math.round((new Date(data.data.scheduledFor) - Date.now()) / 1000);
      setSchedCountdown(secs);
      setTestResult({ type: "success", text: `Test dijadwalkan dalam ${data.data.minutes} menit!` });
      setTimeout(() => setTestResult(null), 4000);
    } else {
      setTestResult({ type: "error", text: data.message || "Gagal menjadwalkan test" });
      setTimeout(() => setTestResult(null), 4000);
    }
  } catch {
    setTestResult({ type: "error", text: "Gagal menjadwalkan test." });
    setTimeout(() => setTestResult(null), 4000);
  } finally {
    setSchedulingTest(false);
  }
};

const cancelTest = async () => {
  try {
    await apiFetch(`${NOTIF_API}/test-schedule`, { method: "DELETE" });
  } catch { /* ignore */ }
  setScheduledTest(null);
  setSchedCountdown(0);
};
```

- [ ] **Step 6: Add countdown useEffect**

Add after the `qrCountdown` useEffect (around line 239):

```js
// Scheduled test countdown
useEffect(() => {
  if (!scheduledTest) return;
  if (schedCountdown <= 0) {
    setScheduledTest(null);
    fetchLogs();
    return;
  }
  const timer = setInterval(() => {
    setSchedCountdown((prev) => {
      if (prev <= 1) {
        clearInterval(timer);
        setScheduledTest(null);
        fetchLogs();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  return () => clearInterval(timer);
}, [scheduledTest, fetchLogs]); // re-run only when scheduledTest changes
```

- [ ] **Step 7: Add Test Mode banner below the header section**

Find the closing `</div>` of the header section (after the status badge div, around line 494). Add immediately after it:

```jsx
{/* Test Mode Banner */}
<div className={`flex items-center justify-between px-5 py-3 rounded-xl mb-6 border ${
  testMode
    ? "bg-amber-50 border-amber-200 text-amber-800"
    : "bg-emerald-50 border-emerald-200 text-emerald-800"
}`}>
  <div className="flex items-center gap-3">
    <span className="text-lg">{testMode ? "⚠️" : "✅"}</span>
    <div>
      <p className="font-extrabold text-sm">
        {testMode ? "Test Mode Aktif" : "Produksi"}
      </p>
      <p className="text-xs font-medium opacity-80">
        {testMode
          ? "Notifikasi terjadwal dijeda — hanya trigger manual yang aktif"
          : "Notifikasi berjalan otomatis sesuai jadwal"}
      </p>
    </div>
  </div>
  <button
    onClick={toggleTestMode}
    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
      testMode ? "bg-amber-400" : "bg-emerald-400"
    }`}
    title={testMode ? "Matikan Test Mode" : "Aktifkan Test Mode"}
  >
    <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
      testMode ? "translate-x-5" : "translate-x-0"
    }`} />
  </button>
</div>
```

- [ ] **Step 8: Update footer test controls**

Replace exactly this block (lines 917–964, from the `{/* Test with Minutes */}` comment through the closing `</button>` of "Uji Notifikasi"):

```jsx
                {/* Test with Minutes */}
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <span className="text-sm font-bold text-slate-600">
                    Test:
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={testMinutes}
                    onChange={(e) =>
                      setTestMinutes(parseInt(e.target.value) || 5)
                    }
                    className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-center text-primary focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-all shadow-inner"
                  />
                  <span className="text-sm font-bold text-slate-600">
                    menit
                  </span>
                  <button
                    onClick={testNotificationWithMinutes}
                    disabled={testingMinutesNotif || status !== "open"}
                    className="ml-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-bold hover:bg-amber-100 hover:border-amber-300 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Test dengan data yang akan expired dalam X menit"
                  >
                    {testingMinutesNotif ? (
                      <Loader
                        size={16}
                        className="animate-spin text-amber-600"
                      />
                    ) : (
                      <PlayCircle size={16} className="text-amber-600" />
                    )}
                    Kirim Test
                  </button>
                </div>

                <button
                  onClick={testNotification}
                  disabled={testingNotif || status !== "open"}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-100 hover:text-slate-900 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testingNotif ? (
                    <Loader size={18} className="animate-spin text-primary" />
                  ) : (
                    <PlayCircle size={18} className="text-emerald-500" />
                  )}
                  Uji Notifikasi
                </button>
```

Replace with:

```jsx
{/* Scheduled test countdown */}
{scheduledTest && (
  <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl shadow-sm text-amber-800 text-sm font-bold">
    <Loader size={14} className="animate-spin text-amber-500" />
    <span>
      {new Date(scheduledTest.scheduledFor).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
      {" "}({Math.floor(schedCountdown / 60)}m {schedCountdown % 60}s lagi)
    </span>
    <button onClick={cancelTest} className="ml-1 text-amber-500 hover:text-rose-600 transition-colors">
      <X size={14} strokeWidth={3} />
    </button>
  </div>
)}

{/* Test Preview */}
<div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
  <span className="text-sm font-bold text-slate-600">Preview:</span>
  <input
    type="number"
    min={1}
    max={9999}
    value={previewThreshold}
    onChange={(e) => setPreviewThreshold(parseInt(e.target.value) || 999)}
    className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-center text-primary focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-all shadow-inner"
  />
  <span className="text-sm font-bold text-slate-600">hari</span>
  <button
    onClick={testPreview}
    disabled={testingPreview || status !== "open"}
    className="ml-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 hover:border-indigo-300 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    title="Kirim notifikasi sekarang menggunakan data sertifikasi asli"
  >
    {testingPreview ? <Loader size={16} className="animate-spin text-indigo-600" /> : <PlayCircle size={16} className="text-indigo-600" />}
    Kirim Preview
  </button>
</div>

{/* Schedule Test */}
<div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
  <span className="text-sm font-bold text-slate-600">Jadwal:</span>
  <input
    type="number"
    min={1}
    max={60}
    value={testMinutes}
    onChange={(e) => setTestMinutes(parseInt(e.target.value) || 5)}
    className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-center text-primary focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-all shadow-inner"
  />
  <span className="text-sm font-bold text-slate-600">menit</span>
  <button
    onClick={scheduleTest}
    disabled={schedulingTest || status !== "open" || !!scheduledTest}
    className="ml-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-bold hover:bg-amber-100 hover:border-amber-300 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    title="Jadwalkan test untuk dijalankan dalam X menit"
  >
    {schedulingTest ? <Loader size={16} className="animate-spin text-amber-600" /> : <PlayCircle size={16} className="text-amber-600" />}
    Jadwalkan Test
  </button>
</div>

<button
  onClick={testNotification}
  disabled={testingNotif || status !== "open"}
  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-100 hover:text-slate-900 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {testingNotif ? <Loader size={18} className="animate-spin text-primary" /> : <PlayCircle size={18} className="text-emerald-500" />}
  Uji Notifikasi
</button>
```

- [ ] **Step 9: Update log card to show TEST/PROD badge**

Find the log card inner div (around line 657):
```jsx
<span className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
  {log.type.replace(/_/g, " ")}
</span>
```

Replace with:

```jsx
<span className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
  {log.type.replace(/_/g, " ")}
</span>
<span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
  ["test_preview", "test_scheduled"].includes(log.type)
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-blue-50 text-blue-700 border-blue-200"
}`}>
  {["test_preview", "test_scheduled"].includes(log.type) ? "TEST" : "PROD"}
</span>
```

- [ ] **Step 10: Verify frontend compiles**

```bash
cd public && npm run build
```

Expected: build completes with no errors (warnings about unused vars are acceptable).

- [ ] **Step 11: Commit**

```bash
git add public/src/pages/WhatsApp.jsx
git commit -m "feat: add test mode toggle, test-preview and test-schedule controls, log TEST/PROD badges to WhatsApp UI"
```

---

## Chunk 6: Cleanup

### Task 7: Remove JSON data files and dead imports

**Files:**
- Delete: `server/data/` directory (if exists)
- Check: `server/src/server.js` — `startScheduler` is now async, ensure it is awaited

- [ ] **Step 1: Confirm `server.js` fix was applied in Task 4**

```bash
grep -n "startScheduler\|connectDB" server/src/server.js
```

Expected: `connectDB().then(` on one line and `startScheduler()` nested inside the `.then()`. If Task 4 was completed correctly this is already done — skip to Step 2.

- [ ] **Step 2: Delete the data directory**

```bash
# Only if it exists
if [ -d "server/data" ]; then
  rm -rf server/data
  echo "Deleted server/data/"
fi
```

- [ ] **Step 3: Start server and do a full smoke test**

```bash
cd server && node src/server.js
```

Watch startup logs. Expected:
- `MongoDB connected`
- `📅 Notification scheduler started (daily HH:MM, weekly Mon)`
- No `Error reading` or `ENOENT` errors

- [ ] **Step 4: Final commit**

```bash
# Note: git add -A is intentional here to capture deleted data/ directory files
git add server/src/server.js
git add -A
git commit -m "chore: remove JSON data files, sequence startScheduler after connectDB"
```

---

## Verification Checklist

After all tasks are done, verify end-to-end:

- [ ] GET `/api/v1/notifications/settings` returns `testMode`, `scheduleTime`, all other fields
- [ ] PUT with `scheduleTime: "10:00"` → GET after server restart still shows `"10:00"` (bug fix confirmed)
- [ ] PUT with `scheduleTime: "99:99"` → HTTP 400
- [ ] PUT with `testMode: true` → banner in UI shows amber warning
- [ ] PUT with `testMode: false` → banner shows green production state
- [ ] POST `/test-preview` with `thresholdDays: 999` → WhatsApp receives message, log shows amber TEST badge
- [ ] POST `/test-schedule` with `minutes: 1` → countdown appears in UI, message arrives after 1 min
- [ ] DELETE `/test-schedule` → countdown disappears
- [ ] GET `/api/v1/notifications/log` → returns MongoDB documents with `metadata` field
- [ ] Server restart does not lose settings
