require("dotenv").config();

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET must be set in .env — refusing to start");
  process.exit(1);
}

const app = require("./app");
const connectDB = require("./config/db");
const { startScheduler } = require("./services/notificationScheduler");
const logger = require("./utils/logger");

// Note: WhatsApp is NOT auto-initialized on server start
// It will be initialized when user visits the WhatsApp settings page

const PORT = process.env.PORT || 5000;

// Connect to DB first, then start scheduler and HTTP server.
// app.listen is inside the .then() to guarantee no requests arrive
// before MongoDB is ready (bufferCommands: false requires this).
let server;
connectDB()
  .then(() => startScheduler())
  .then(() => {
    server = app.listen(PORT, () => {
      logger.info(`Server started`, {
        port: PORT,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      });
    });
  })
  .catch((err) => {
    logger.error("Startup failed", { message: err.message });
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});
