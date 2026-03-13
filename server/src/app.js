const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const { errorHandler, notFound } = require("./middlewares/error");
const { requestLogger } = require("./middlewares/requestLogger");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const logger = require("./utils/logger");

const app = express();

// Configure Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 1000 : 100, // Higher limit for dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Terlalu banyak request dari IP ini, silakan coba lagi dalam 15 menit." },
  handler: (req, res, next, options) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
    });
    res.status(429).json(options.message);
  },
});

// Middlewares
app.use(cors()); // Enable CORS
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // Set security HTTP headers
app.use(requestLogger); // Custom request logging
app.use("/api", limiter); // Apply rate limiter to /api
app.use(express.json({ limit: "10kb" })); // Parse JSON bodies config
app.use(express.urlencoded({ extended: true, limit: "10kb" })); // Parse URL-encoded bodies

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// API Routes
app.use("/api/v1", routes);

// Base route for health check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to CertiTrackKTI API",
  });
});

// Handle undefined routes
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
