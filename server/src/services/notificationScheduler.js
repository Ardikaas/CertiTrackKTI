const cron = require("node-cron");
const mongoose = require("mongoose");
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
 */
const scheduleTestNotification = (minutes, type = "all") => {
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
 * Start the cron scheduler. Must be called after DB is connected.
 */
const startScheduler = async () => {
  if (mongoose.connection.readyState !== 1) {
    console.warn("⚠️  No MongoDB connection — notification scheduler disabled");
    return;
  }

  const settings = await getSettings();
  const rawTime = settings.scheduleTime || "08:00";
  const [rawHour, rawMinute] = rawTime.split(":");
  const h = parseInt(rawHour, 10);
  const m = parseInt(rawMinute, 10);
  const hour   = (!isNaN(h) && h >= 0 && h <= 23) ? h : 8;
  const minute = (!isNaN(m) && m >= 0 && m <= 59) ? m : 0;
  if (isNaN(h) || isNaN(m)) {
    console.warn(`⚠️  Invalid scheduleTime "${rawTime}" in DB — falling back to 08:00`);
  }
  const dailyCron  = `${minute} ${hour} * * *`;
  const weeklyCron = `${minute} ${hour} * * 1`;

  dailyTask = cron.schedule(dailyCron, async () => {
    const current = await getSettings();
    if (current.testMode) {
      console.log("⏸ Test mode ON — skipping daily notification");
      return;
    }
    console.log("⏰ Running daily notification check...");
    try { await sendNotifications("expiring_soon"); } catch (err) { console.error("❌ Daily expiring_soon failed:", err.message); }
    try { await sendNotifications("expired"); } catch (err) { console.error("❌ Daily expired failed:", err.message); }
  });

  weeklyTask = cron.schedule(weeklyCron, async () => {
    const current = await getSettings();
    if (current.testMode) {
      console.log("⏸ Test mode ON — skipping weekly notification");
      return;
    }
    console.log("⏰ Running weekly notification check...");
    try { await sendNotifications("weekly_check"); } catch (err) { console.error("❌ Weekly notification failed:", err.message); }
  });

  console.log(`📅 Notification scheduler started (daily ${hour}:${String(minute).padStart(2, "0")}, weekly Mon)`);
};

/**
 * Stop tasks and restart. Call only when scheduleTime changes.
 * Do NOT call when testMode changes — the guard reads DB on every tick.
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
