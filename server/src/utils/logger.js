const path = require("path");
const fs = require("fs");

const LOG_DIR = path.join(__dirname, "..", "logs");

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Get current timestamp in ISO format
 */
const getTimestamp = () => new Date().toISOString();

/**
 * Format log entry
 */
const formatLog = (level, message, meta = {}) => {
  return {
    timestamp: getTimestamp(),
    level,
    message,
    ...meta,
  };
};

/**
 * Write log to file
 */
const writeToFile = (filename, data) => {
  const logPath = path.join(LOG_DIR, filename);
  const logLine = JSON.stringify(data) + "\n";
  
  fs.appendFile(logPath, logLine, (err) => {
    if (err) console.error("Failed to write log:", err);
  });
};

/**
 * Console output with colors
 */
const consoleOutput = (level, message, meta = {}) => {
  const timestamp = getTimestamp();
  const colors = {
    error: "\x1b[31m", // Red
    warn: "\x1b[33m",  // Yellow
    info: "\x1b[36m",  // Cyan
    debug: "\x1b[35m", // Magenta
    reset: "\x1b[0m",
  };

  const color = colors[level] || colors.info;
  const levelUpper = level.toUpperCase().padEnd(5);
  
  console.log(`${color}[${timestamp}] ${levelUpper}:${colors.reset} ${message}`);
  
  if (Object.keys(meta).length > 0) {
    console.log("  Meta:", meta);
  }
};

/**
 * Logger object with different log levels
 */
const logger = {
  error: (message, meta = {}) => {
    const logData = formatLog("error", message, meta);
    consoleOutput("error", message, meta);
    writeToFile("error.log", logData);
    writeToFile("combined.log", logData);
  },

  warn: (message, meta = {}) => {
    const logData = formatLog("warn", message, meta);
    consoleOutput("warn", message, meta);
    writeToFile("combined.log", logData);
  },

  info: (message, meta = {}) => {
    const logData = formatLog("info", message, meta);
    consoleOutput("info", message, meta);
    writeToFile("combined.log", logData);
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === "development") {
      const logData = formatLog("debug", message, meta);
      consoleOutput("debug", message, meta);
    }
  },

  request: (req, res, duration) => {
    const meta = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    };

    const logData = formatLog("info", "HTTP Request", meta);
    consoleOutput("info", `${meta.method} ${meta.url} ${meta.statusCode} - ${meta.duration}`, meta);
    writeToFile("requests.log", logData);
    writeToFile("combined.log", logData);
  },

  errorRequest: (err, req, res) => {
    const meta = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
      statusCode: res.statusCode,
      error: {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
    };

    const logData = formatLog("error", "Request Error", meta);
    consoleOutput("error", `${meta.method} ${meta.url} - ${err.message}`, meta);
    writeToFile("error.log", logData);
    writeToFile("combined.log", logData);
  },
};

module.exports = logger;
