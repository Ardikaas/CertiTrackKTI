const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const pino = require("pino");

const AUTH_DIR = path.join(__dirname, "..", "..", "auth_info_baileys");

let sock = null;
let qrDataURL = null;
let connectionStatus = "disconnected"; // 'disconnected' | 'connecting' | 'open'
let retryCount = 0;
const MAX_RETRIES = 5;

const logger = pino({ level: "silent" });

/**
 * Initialize the WhatsApp socket connection
 * Uses Baileys v6.17.16 (latest stable) — fixes the 405 "client outdated" error
 */
const initWhatsApp = async () => {
  try {
    console.log("🟢 WhatsApp service initializing...");

    // Fetch latest WA version to prevent 405 errors
    let version;
    try {
      const { version: v, isLatest } = await fetchLatestBaileysVersion();
      version = v;
      console.log(`📋 WA version: ${v.join(".")} (latest: ${isLatest})`);
    } catch (err) {
      console.warn("⚠️  Could not fetch version, using Baileys default");
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    const socketConfig = {
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      browser: ["CertiTrackKTI", "Chrome", "1.0.0"],
      logger,
      printQRInTerminal: false,
      connectTimeoutMs: 60000,
      syncFullHistory: false,
    };

    if (version) {
      socketConfig.version = version;
    }

    sock = makeWASocket(socketConfig);

    // Handle connection updates
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        connectionStatus = "connecting";
        try {
          qrDataURL = await QRCode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: { dark: "#1e293b", light: "#ffffff" },
          });
          console.log("📱 QR Code generated — scan with WhatsApp");
        } catch (err) {
          console.error("Failed to generate QR code:", err.message);
        }
      }

      if (connection === "close") {
        qrDataURL = null;
        connectionStatus = "disconnected";

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(
          `⚠️  Connection closed (code: ${statusCode}). Reconnect: ${shouldReconnect}`,
        );

        if (shouldReconnect && retryCount < MAX_RETRIES) {
          retryCount++;
          const delay = Math.min(retryCount * 3000, 15000);
          console.log(
            `🔄 Reconnecting in ${delay / 1000}s (attempt ${retryCount}/${MAX_RETRIES})...`,
          );
          setTimeout(() => initWhatsApp(), delay);
        } else if (!shouldReconnect) {
          if (fs.existsSync(AUTH_DIR)) {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          }
          console.log("🔴 Logged out. Session cleared.");
          retryCount = 0;
        } else {
          console.log("🔴 Max retries reached.");
          retryCount = 0;
        }
      }

      if (connection === "open") {
        connectionStatus = "open";
        qrDataURL = null;
        retryCount = 0;
        console.log("✅ WhatsApp connected successfully!");
      }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", ({ messages, type }) => {
      if (type === "notify") {
        for (const msg of messages) {
          const sender = msg.key.remoteJid;
          const text =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            "";
          if (text) {
            console.log(`📩 Message from ${sender}: ${text}`);
          }
        }
      }
    });
  } catch (error) {
    console.error("Failed to initialize WhatsApp:", error.message);
    connectionStatus = "disconnected";

    if (retryCount < MAX_RETRIES) {
      retryCount++;
      const delay = retryCount * 3000;
      console.log(`🔄 Retrying in ${delay / 1000}s...`);
      setTimeout(() => initWhatsApp(), delay);
    }
  }
};

const getQR = () => qrDataURL;
const getStatus = () => connectionStatus;

const formatJID = (phone) => {
  let cleaned = phone.replace(/[\s\-\+\(\)]/g, "");
  if (cleaned.startsWith("0")) cleaned = "62" + cleaned.slice(1);
  return `${cleaned}@s.whatsapp.net`;
};

const sendMessage = async (phone, message) => {
  if (!sock || connectionStatus !== "open") {
    throw new Error("WhatsApp is not connected");
  }
  const jid = formatJID(phone);
  const result = await sock.sendMessage(jid, { text: message });
  console.log(`📤 Message sent to ${jid}`);
  return result;
};

const logout = async () => {
  try {
    if (sock) {
      await sock.logout();
      sock = null;
    }
  } catch (error) {
    console.error("Error during logout:", error.message);
  }

  if (fs.existsSync(AUTH_DIR)) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  }

  qrDataURL = null;
  connectionStatus = "disconnected";
  retryCount = 0;
  console.log("🔴 WhatsApp logged out and session cleared.");
};

module.exports = {
  initWhatsApp,
  getQR,
  getStatus,
  sendMessage,
  logout,
};
