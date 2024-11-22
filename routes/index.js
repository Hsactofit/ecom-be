const express = require('express');
const router = express.Router();

// Import all route files
const authRoutes = require('./auth');
// const userRoutes = require('./user');
// const sellerRoutes = require('./seller');
// const adminRoutes = require('./admin');
// const paymentRoutes = require('./payment');
// const addressRoutes = require('./address');

// API versioning
const API_VERSION = '/api/v1';

// Mount routes
router.use(`${API_VERSION}/auth`, authRoutes);
// router.use(`${API_VERSION}/users`, userRoutes);
// router.use(`${API_VERSION}/sellers`, sellerRoutes);
// router.use(`${API_VERSION}/admin`, adminRoutes);
// router.use(`${API_VERSION}/payments`, paymentRoutes);
// router.use(`${API_VERSION}/address`, addressRoutes);

// Health check route
router.get(`${API_VERSION}/health`, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
router.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Resource not found'
    });
});

// Error handler
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = router;