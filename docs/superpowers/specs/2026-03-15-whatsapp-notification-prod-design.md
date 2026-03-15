# WhatsApp Notification System — Production Refactor Design

**Date:** 2026-03-15
**Status:** Approved
**Scope:** Bug fixes, MongoDB migration, shared service layer, test mode features, global Test/Prod toggle UI

---

## 1. Problem Statement

The current notification system has several issues blocking production readiness:

1. **`scheduleTime` save bug** — PUT `/settings` checks for `scheduleTime` but never writes it to the JSON file, so every server restart reverts to `"08:00"`.
2. **Code duplication** — `readJSON`, `writeJSON`, `addLog`, `DEFAULT_SETTINGS` are copy-pasted identically in both `notificationRoutes.js` and `notificationScheduler.js`.
3. **JSON file storage** — `data/notification_settings.json` and `data/notification_logs.json` are lost on container restart, not queryable, and unsafe under concurrent access.
4. **`test-minutes` is misleading** — it sends a fake synthetic "TEST" message immediately using hardcoded data. It does not test the real notification flow, and `sisaHari` is hardcoded to `0`.
5. **No test/prod separation** — real cron can fire during demos or testing, and there is no visible system state indicator.

---

## 2. Goals

- Migrate settings and logs to MongoDB (no more JSON files on disk)
- Extract a shared `notificationService.js` that owns all data access
- Fix the `scheduleTime` persistence bug
- Replace fake `test-minutes` with two proper test features: instant preview and scheduled fire
- Add a global Test Mode toggle that pauses real cron when active
- Add clear UI indicators distinguishing test vs production state

---

## 3. Architecture

### File Structure (after refactor)

```
server/src/
├── models/
│   ├── NotificationSetting.js    (existing — add testMode + _singleton fields)
│   └── NotificationLog.js        (existing — extend type enum)
├── services/
│   ├── notificationService.js    (new — all DB I/O for settings + logs)
│   ├── notificationScheduler.js  (modified — imports from notificationService)
│   └── whatsapp.js               (unchanged)
└── routes/
    └── notificationRoutes.js     (modified — imports from notificationService, bug fixed)
```

> **Note on model file names:** Both model files already exist on disk with the names above. Use those exact names in all `require()` calls. Do NOT create `NotificationSettings.js` (plural) — it does not exist.

### Responsibility Split

| Layer | Responsibility |
|---|---|
| `NotificationSetting` model | Mongoose schema for settings document |
| `NotificationLog` model | Mongoose schema for log documents |
| `notificationService.js` | `getSettings()`, `saveSettings()`, `addLog()`, `getLogs()` |
| `notificationScheduler.js` | Cron logic, message builders, `sendNotifications()`, test mode guard, `cancelScheduledTest()` |
| `notificationRoutes.js` | HTTP handlers only — delegates to service and scheduler |

The `data/` directory and its JSON files are deleted after deploy.

---

## 4. Model Changes

### `NotificationSetting.js` — add two fields

The existing schema is missing `testMode` and the singleton sentinel. Add:

```js
_singleton: { type: String, default: "default", unique: true },
testMode:   { type: Boolean, default: false },
```

The `_singleton` field with `unique: true` ensures `findOneAndUpdate({ _singleton: "default" }, ..., { upsert: true })` never creates a second document.

**Full updated schema fields:**

```js
{
  _singleton:   { type: String, default: "default", unique: true },
  recipients:   { type: [String], default: [] },
  expiringDays: { type: Number, default: 30 },
  scheduleTime: { type: String, default: "08:00" },
  enabledTypes: {
    expiringSoon: { type: Boolean, default: true },
    weeklyCheck:  { type: Boolean, default: true },
    expired:      { type: Boolean, default: true },
  },
  testMode: { type: Boolean, default: false },
}
```

### `NotificationLog.js` — extend type enum

The existing enum `["expiring_soon", "weekly_check", "expired"]` must be extended:

```js
enum: ["expiring_soon", "weekly_check", "expired", "test_preview", "test_scheduled"]
```

Also add a `metadata` field (not in current schema):

```js
metadata: { type: mongoose.Schema.Types.Mixed, default: null }
```

---

## 5. `notificationService.js` API

```js
getSettings()
// Returns the settings document (upserts with defaults if none exists).
// Uses findOneAndUpdate({ _singleton: "default" }, {}, { upsert: true, new: true, setDefaultsOnInsert: true })

saveSettings(data)
// Accepts partial update object with any subset of:
//   { recipients, expiringDays, enabledTypes, scheduleTime, testMode }
// Validates scheduleTime format before saving (see section 6c).
// Returns the updated settings document.

addLog(logData)
// Inserts one NotificationLog document.
// logData shape: { type, recipient, message, status, error?, metadata? }

getLogs(limit = 50)
// Returns latest `limit` logs sorted by createdAt descending.
```

These four functions replace all `readJSON`/`writeJSON`/`addLog` usage in both files.

---

## 6. Bug Fixes

### 6a. `scheduleTime` not saved (notificationRoutes.js)

**Before:**
```js
const { recipients, expiringDays, enabledTypes } = req.body;
// scheduleTime never assigned to settings
writeJSON(SETTINGS_FILE, settings);
if (req.body.scheduleTime !== undefined) restartScheduler();
```

**After:**
```js
const { recipients, expiringDays, enabledTypes, scheduleTime, testMode } = req.body;
const updated = await saveSettings({ recipients, expiringDays, enabledTypes, scheduleTime, testMode });
// Only restart scheduler when scheduleTime actually changed — NOT when testMode changes
if (scheduleTime !== undefined) restartScheduler();
res.json({ status: "success", data: updated });
```

> **Important:** Do NOT call `restartScheduler()` when `testMode` changes. The test mode guard reads `testMode` from the DB on every cron tick, so it is already live without a restart.

### 6b. Remove `test-minutes` endpoint

The `/api/v1/notifications/test-minutes` endpoint is removed entirely. It is replaced by `/test-preview` and `/test-schedule` (see section 7).

### 6c. `scheduleTime` validation

Before saving, validate the format server-side in `saveSettings()`:

```js
if (scheduleTime !== undefined) {
  const parts = scheduleTime.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (parts.length !== 2 || isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    throw new AppError("scheduleTime must be HH:MM (00:00–23:59)", 400);
  }
}
```

---

## 7. New Test Features

### 7a. Instant Preview (`POST /api/v1/notifications/test-preview`)

Fires `sendNotifications()` immediately against real DB certs with an optional `thresholdDays` override.

**Request body:**
```json
{ "type": "all", "thresholdDays": 999 }
```

- `thresholdDays` overrides `settings.expiringDays` for this call only (not saved)
- Falls back to `SAMPLE_CERTS` only if DB returns zero certs
- Route handler calls `sendNotifications(type, false, thresholdDays, "test_preview")` — the fourth argument ensures logs use `type: "test_preview"` (amber TEST badge), not the real notification category
- Returns full results array (same shape as existing `/test`)
- Does NOT check `testMode` — explicitly manual, always runs

**Use case:** Client demo — set `thresholdDays: 999` to trigger notifications for all certs. Real data, real message, real delivery.

### 7b. Scheduled Fire (`POST /api/v1/notifications/test-schedule`)

Schedules a one-shot `setTimeout` that fires in exactly X minutes and runs the full `sendNotifications()` flow.

**Request body:**
```json
{ "minutes": 5, "type": "all" }
```

**Implementation — use `setTimeout`, NOT `node-cron`:**

`node-cron` uses wall-clock time (`HH MM * * *`) and has a day-boundary problem: if the computed target time has already passed today, the task fires tomorrow. `setTimeout` has no such issue.

```js
// In notificationScheduler.js — module-level
let scheduledTestTimeout = null;
let scheduledTestMeta = null;

const scheduleTestNotification = (minutes, type) => {
  // Cancel any existing scheduled test
  if (scheduledTestTimeout) {
    clearTimeout(scheduledTestTimeout);
    scheduledTestTimeout = null;
    scheduledTestMeta = null;
  }

  const ms = Math.min(minutes, 60) * 60 * 1000; // cap at 60 minutes
  const scheduledFor = new Date(Date.now() + ms).toISOString();

  scheduledTestTimeout = setTimeout(async () => {
    scheduledTestTimeout = null;
    scheduledTestMeta = null;
    try {
      await sendNotifications(type, false, null, "test_scheduled");
    } catch (err) {
      console.error("Scheduled test failed:", err.message);
    }
  }, ms);

  scheduledTestMeta = { scheduledFor, minutes };
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
```

Export `scheduleTestNotification`, `cancelScheduledTest`, `getScheduledTestMeta` from `notificationScheduler.js`.

**Route handler** calls `scheduleTestNotification(minutes, type)` and returns `{ scheduledFor, minutes }`.

**`sendNotifications()` signature change:**

Add a fourth parameter `logTypeOverride` so scheduled tests log as `"test_scheduled"`:

```js
const sendNotifications = async (type = "all", isTest = false, thresholdOverride = null, logTypeOverride = null) => {
```

When `logTypeOverride` is set, pass it to `addLog()` as the `type`.

**Container restart caveat:** The `setTimeout` lives in process memory. If the server restarts while a scheduled test is pending, the test is lost. This is acceptable for a test feature — document it in the UI ("O servidor deve permanecer ativo até o disparo").

### 7c. Cancelling a Scheduled Test (`DELETE /api/v1/notifications/test-schedule`)

```js
router.delete("/test-schedule", catchAsync(async (req, res) => {
  const cancelled = cancelScheduledTest();
  res.json({ status: "success", data: { cancelled } });
}));
```

---

## 8. Global Test Mode Toggle

### Backend — cron guard

The cron callbacks in `startScheduler()` must be `async` and must `await getSettings()`:

```js
// Daily task — MUST be async, MUST await
dailyTask = cron.schedule(dailyCron, async () => {
  const settings = await getSettings();   // ← await is mandatory
  if (settings.testMode) {
    console.log("⏸ Test mode ON — skipping scheduled notification");
    return;
  }
  // ... real notification logic
});
```

> **Why no restart on testMode change:** `getSettings()` is called fresh on every tick, so the guard reads the latest `testMode` value from MongoDB without needing a scheduler restart. Calling `restartScheduler()` on a `testMode` toggle is unnecessary and should be avoided.

### Frontend UI

**Status Banner** (below page header, always visible):

| `testMode` | Banner |
|---|---|
| `true` | Amber: `⚠️ Test Mode Aktif — Notifikasi terjadwal dijeda` |
| `false` | Green: `✅ Produksi — Notifikasi berjalan otomatis` |

Toggle switch in the banner row calls `PUT /settings` with `{ testMode: !current }` on change. Does NOT include `scheduleTime` in this call (to avoid accidentally restarting the scheduler).

**Log panel badge colours:**

| `type` value | Badge |
|---|---|
| `test_preview`, `test_scheduled` | Amber `TEST` badge |
| `expiring_soon`, `expired`, `weekly_check` | Blue `PROD` badge |

---

## 9. Updated API Surface

| Method | Path | Change |
|---|---|---|
| GET | `/api/v1/notifications/settings` | Returns `testMode` field |
| PUT | `/api/v1/notifications/settings` | Accepts + saves `scheduleTime`, `testMode` (bug fixed) |
| POST | `/api/v1/notifications/test` | Unchanged (kept for backward compat) |
| POST | `/api/v1/notifications/test-preview` | **New** — real data, custom threshold |
| POST | `/api/v1/notifications/test-schedule` | **New** — setTimeout-based, fires in X minutes |
| DELETE | `/api/v1/notifications/test-schedule` | **New** — cancel pending scheduled test |
| ~~POST~~ | ~~`/api/v1/notifications/test-minutes`~~ | **Removed** |
| GET | `/api/v1/notifications/log` | Now reads from MongoDB |

---

## 10. UI Changes (`WhatsApp.jsx`)

### Settings state additions
```js
testMode: false,           // from settings.testMode
scheduledTest: null,       // { scheduledFor, minutes } or null
```

### Header area
- Test Mode toggle switch + status banner rendered between page title and main panels

### Footer test controls (replaces current test-minutes row)

```
[ thresholdDays ] hari  [Kirim Preview]   [ minutes ] menit  [Jadwalkan Test]  [Uji Notifikasi]  [Simpan Konfigurasi]
```

- **Kirim Preview** → `POST /test-preview` with `{ type: "all", thresholdDays }`
- **Jadwalkan Test** → `POST /test-schedule` with `{ minutes }`, sets `scheduledTest` state
- While `scheduledTest !== null`, show label: `Terjadwal: HH:MM (Xs lagi)` with a live countdown
- Countdown uses `setInterval` in the component, ticking every second
- When countdown hits 0: clear `scheduledTest`, refresh logs
- An "×" button next to the countdown label calls `DELETE /test-schedule` and clears state

### Log panel
- Existing log card gets a badge: `TEST` (amber) or `PROD` (blue) based on `type`

---

## 11. `notificationScheduler.js` Exports (after refactor)

```js
module.exports = {
  sendNotifications,
  startScheduler,
  restartScheduler,
  scheduleTestNotification,   // new
  cancelScheduledTest,        // new
  getScheduledTestMeta,       // new
};
```

---

## 12. Migration Notes

- Delete `server/data/` directory after verifying MongoDB has data
- On first server start with empty DB, `getSettings()` upserts defaults — no manual seed needed
- Existing logs in JSON files are not migrated (acceptable — fresh log history)
- `NotificationSetting` collection: if the collection already exists from a previous version, the migration adds `_singleton` and `testMode` fields via `setDefaultsOnInsert`. Run a one-time manual update if needed:
  ```js
  db.notificationsettings.updateMany({}, { $set: { _singleton: "default", testMode: false } })
  ```

---

## 13. Out of Scope

- Multi-user settings (one settings doc per org is sufficient)
- WhatsApp message templates or rich media
- Notification history analytics / dashboard
- Read receipts or delivery confirmation beyond Baileys response
- Persisting scheduled test state across server restarts
