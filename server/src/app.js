const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const { errorHandler, notFound } = require("./middlewares/error");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const routes = require("./routes");

const app = express();

// Configure Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Terlalu banyak request dari IP ini, silakan coba lagi dalam 15 menit.",
});

// Middlewares
app.use(cors()); // Enable CORS
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // Set security HTTP headers
app.use("/api", limiter); // Apply rate limiter to /api
app.use(express.json({ limit: "10kb" })); // Parse JSON bodies config
app.use(express.urlencoded({ extended: true, limit: "10kb" })); // Parse URL-encoded bodies
app.use(mongoSanitize()); // Data sanitization against NoSQL query injection
app.use(xss()); // Data sanitization against XSS
app.use(hpp()); // Prevent parameter pollution

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // Request logging
}

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
