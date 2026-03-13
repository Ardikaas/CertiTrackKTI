require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { startScheduler } = require("./services/notificationScheduler");
const logger = require("./utils/logger");

// Connect to Database
connectDB();

// Start notification scheduler
startScheduler();

// Note: WhatsApp is NOT auto-initialized on server start
// It will be initialized when user visits the WhatsApp settings page

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server started`, {
    port: PORT,
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  server.close(() => {
    process.exit(1);
  });
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
