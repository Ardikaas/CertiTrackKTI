const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler, notFound } = require('./middlewares/error');
const routes = require('./routes');

const app = express();

// Middlewares
app.use(cors()); // Enable CORS
app.use(helmet()); // Set security HTTP headers
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Request logging
}

// API Routes
app.use('/api/v1', routes);

// Base route for health check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to CertiTrackKTI API',
  });
});

// Handle undefined routes
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
