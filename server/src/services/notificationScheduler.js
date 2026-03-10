const cron = require("node-cron");
const path = require("path");
const fs = require("fs");
const { sendMessage, getStatus } = require("./whatsapp");

// JSON file paths (shared with notificationRoutes.js)
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const SETTINGS_FILE = path.join(DATA_DIR, "notification_settings.json");
const LOGS_FILE = path.join(DATA_DIR, "notification_logs.json");

// Ensure data directory
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DEFAULT_SETTINGS = {
  recipients: [],
  enabledTypes: { expiringSoon: true, weeklyCheck: true, expired: true },
  expiringDays: 30,
};

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

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
};

const getSettings = () => readJSON(SETTINGS_FILE, DEFAULT_SETTINGS);

const addLog = (log) => {
  const logs = readJSON(LOGS_FILE, []);
  logs.push({
    ...log,
    _id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  });
  if (logs.length > 200) logs.splice(0, logs.length - 200);
  writeJSON(LOGS_FILE, logs);
};

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

const SERTIFIKASI_FILE = path.join(DATA_DIR, "sertifikasi.json");

/**
 * Get sertifikasi data from JSON file
 */
const getSertifikasiData = () => {
  try {
    if (fs.existsSync(SERTIFIKASI_FILE)) {
      const data = JSON.parse(fs.readFileSync(SERTIFIKASI_FILE, "utf8"));
      // Compute sisaHari for each record
      return data.map((cert) => ({
        ...cert,
        sisaHari: Math.ceil(
          (new Date(cert.tanggalExp) - new Date()) / (1000 * 60 * 60 * 24),
        ),
      }));
    }
  } catch (err) {
    console.error("Error reading sertifikasi data:", err.message);
  }
  return [];
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
const sendToRecipients = async (recipients, message, type) => {
  const results = [];

  for (const phone of recipients) {
    try {
      await sendMessage(phone, message);
      addLog({ type, recipient: phone, message, status: "sent" });
      results.push({ phone, status: "sent" });
    } catch (error) {
      addLog({
        type,
        recipient: phone,
        message,
        status: "failed",
        error: error.message,
      });
      results.push({ phone, status: "failed", error: error.message });
    }
  }

  return results;
};

/**
 * Sample data for testing when DB is offline or empty
 */
const SAMPLE_CERTS = [
  {
    namaSertifikasi: "Kalibrasi Pressure Gauge",
    nomorSertifikat: "KAL-2024-001",
    jenisSertifikasi: "Kalibrasi",
    tanggalExp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
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
    tanggalExp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // expired 5 days ago
    sisaHari: -5,
  },
];

/**
 * Send notifications based on type
 * @param {string} type - 'expiring_soon' | 'expired' | 'weekly_check' | 'all'
 * @param {boolean} isTest - if true, use sample data when DB is empty
 */
const sendNotifications = async (type = "all", isTest = false) => {
  if (getStatus() !== "open") {
    return { error: "WhatsApp belum terhubung. Hubungkan dulu via QR code." };
  }

  const settings = getSettings();

  if (settings.recipients.length === 0) {
    return {
      error: "Belum ada nomor penerima. Tambahkan di Pengaturan Notifikasi.",
    };
  }

  let allCerts = await getSertifikasiData();

  // Use sample data for testing when no real data
  if (allCerts.length === 0 && isTest) {
    console.log("📋 Using sample data for test notification");
    allCerts = SAMPLE_CERTS;
  }

  const results = { sent: [], skipped: [] };

  // Expiring soon
  if (type === "all" || type === "expiring_soon") {
    if (settings.enabledTypes.expiringSoon) {
      const expiring = allCerts.filter(
        (c) => c.sisaHari > 0 && c.sisaHari <= settings.expiringDays,
      );
      const msg = buildExpiringSoonMessage(expiring, settings.expiringDays);
      if (msg) {
        const res = await sendToRecipients(
          settings.recipients,
          msg,
          "expiring_soon",
        );
        results.sent.push({
          type: "expiring_soon",
          count: expiring.length,
          results: res,
        });
      } else {
        results.skipped.push({
          type: "expiring_soon",
          reason: "Tidak ada sertifikasi yang akan expired",
        });
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
        const res = await sendToRecipients(settings.recipients, msg, "expired");
        results.sent.push({
          type: "expired",
          count: expired.length,
          results: res,
        });
      } else {
        results.skipped.push({
          type: "expired",
          reason: "Tidak ada sertifikasi expired",
        });
      }
    } else {
      results.skipped.push({ type: "expired", reason: "Dinonaktifkan" });
    }
  }

  // Weekly check
  if (type === "all" || type === "weekly_check") {
    if (settings.enabledTypes.weeklyCheck) {
      const expiring = allCerts.filter(
        (c) => c.sisaHari > 0 && c.sisaHari <= settings.expiringDays,
      );
      const expired = allCerts.filter((c) => c.sisaHari <= 0);
      const activeCount = allCerts.filter(
        (c) => c.sisaHari > settings.expiringDays,
      ).length;
      const msg = buildWeeklyMessage(expiring, expired, activeCount);
      const res = await sendToRecipients(
        settings.recipients,
        msg,
        "weekly_check",
      );
      results.sent.push({ type: "weekly_check", results: res });
    } else {
      results.skipped.push({ type: "weekly_check", reason: "Dinonaktifkan" });
    }
  }

  return results;
};

/**
 * Start the cron scheduler
 */
const startScheduler = () => {
  // Daily check at 08:00
  cron.schedule("0 8 * * *", async () => {
    console.log("⏰ Running daily notification check...");
    try {
      const result = await sendNotifications("expiring_soon");
      console.log("📋 Expiring soon check:", JSON.stringify(result, null, 2));
    } catch (err) {
      console.error("❌ Daily expiring_soon failed:", err.message);
    }
    try {
      const result = await sendNotifications("expired");
      console.log("📋 Expired check:", JSON.stringify(result, null, 2));
    } catch (err) {
      console.error("❌ Daily expired failed:", err.message);
    }
  });

  // Weekly check — every Monday at 08:00
  cron.schedule("0 8 * * 1", async () => {
    console.log("⏰ Running weekly notification check...");
    try {
      const result = await sendNotifications("weekly_check");
      console.log("📋 Weekly check:", JSON.stringify(result, null, 2));
    } catch (err) {
      console.error("❌ Weekly notification failed:", err.message);
    }
  });

  console.log(
    "📅 Notification scheduler started (daily 08:00, weekly Mon 08:00)",
  );
};

module.exports = {
  sendNotifications,
  startScheduler,
};
