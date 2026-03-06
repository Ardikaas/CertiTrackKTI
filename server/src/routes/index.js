const express = require('express');
const router = express.Router();

// Import individual route files here
// const userRoutes = require('./userRoutes');

// Mount routes
// router.use('/users', userRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is healthy' });
});

module.exports = router;
