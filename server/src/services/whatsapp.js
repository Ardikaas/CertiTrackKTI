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
const logger = require("../utils/logger");

const AUTH_DIR = path.join(__dirname, "..", "..", "auth_info_baileys");

let sock = null;
let qrDataURL = null;
let connectionStatus = "disconnected"; // 'disconnected' | 'connecting' | 'open'
let retryCount = 0;
const MAX_RETRIES = 5;

const baileysLogger = pino({ level: "silent" });

/**
 * Initialize the WhatsApp socket connection
 * Uses Baileys v6.17.16 (latest stable) — fixes the 405 "client outdated" error
 */
const initWhatsApp = async () => {
  // Prevent re-initialization if already connected or connecting
  if (connectionStatus === "open" || connectionStatus === "connecting") {
    logger.info("WhatsApp already initialized or connecting", { connectionStatus });
    return;
  }

  try {
    logger.info("WhatsApp service initializing...");

    // Fetch latest WA version to prevent 405 errors
    let version;
    try {
      const { version: v, isLatest } = await fetchLatestBaileysVersion();
      version = v;
      logger.info(`WA version: ${v.join(".")} (latest: ${isLatest})`);
    } catch (err) {
      logger.warn("Could not fetch version, using Baileys default");
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    const socketConfig = {
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
      },
      browser: ["CertiTrackKTI", "Chrome", "1.0.0"],
      logger: baileysLogger,
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
          logger.info("QR Code generated — scan with WhatsApp");
        } catch (err) {
          logger.error("Failed to generate QR code:", { error: err.message });
        }
      }

      if (connection === "close") {
        qrDataURL = null;
        connectionStatus = "disconnected";

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        logger.warn(`Connection closed (code: ${statusCode}). Reconnect: ${shouldReconnect}`);

        if (shouldReconnect && retryCount < MAX_RETRIES) {
          retryCount++;
          const delay = Math.min(retryCount * 3000, 15000);
          logger.info(`Reconnecting in ${delay / 1000}s (attempt ${retryCount}/${MAX_RETRIES})...`);
          setTimeout(() => initWhatsApp(), delay);
        } else if (!shouldReconnect) {
          if (fs.existsSync(AUTH_DIR)) {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          }
          logger.info("Logged out. Session cleared.");
          retryCount = 0;
        } else {
          logger.error("Max retries reached.");
          retryCount = 0;
        }
      }

      if (connection === "open") {
        connectionStatus = "open";
        qrDataURL = null;
        retryCount = 0;
        logger.info("WhatsApp connected successfully!");
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
            logger.debug(`Message from ${sender}: ${text}`);
          }
        }
      }
    });
  } catch (error) {
    logger.error("Failed to initialize WhatsApp:", { error: error.message });
    connectionStatus = "disconnected";

    if (retryCount < MAX_RETRIES) {
      retryCount++;
      const delay = retryCount * 3000;
      logger.info(`Retrying in ${delay / 1000}s...`);
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
  logger.info(`Message sent to ${jid}`);
  return result;
};

const logout = async () => {
  try {
    if (sock) {
      await sock.logout();
      sock = null;
    }
  } catch (error) {
    logger.error("Error during logout:", { error: error.message });
  }

  if (fs.existsSync(AUTH_DIR)) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  }

  qrDataURL = null;
  connectionStatus = "disconnected";
  retryCount = 0;
  logger.info("WhatsApp logged out and session cleared.");
};

module.exports = {
  initWhatsApp,
  getQR,
  getStatus,
  sendMessage,
  logout,
};
