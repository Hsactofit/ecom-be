const express = require("express");
const router = express.Router();

const orderRoutes = require("./order");
const authRoutes = require("./auth");
const productRoutes = require("./product");
const userRoutes = require("./user");
const cartRoutes = require("./cart");
const wishlistRoutes = require("./wishlist");
const negotiatedProductRoutes = require("./negotiatedProduct");
const reviewRoutes = require("./review");
const chatRoutes = require("./chat");

// API versioning
const API_VERSION = "/api/v1";

// Mount routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/users`, userRoutes);
router.use(`${API_VERSION}/products`, productRoutes);
router.use(`${API_VERSION}/cart`, cartRoutes);
router.use(`${API_VERSION}/chat`, chatRoutes );
router.use(`${API_VERSION}/wishlist`, wishlistRoutes);
router.use(`${API_VERSION}/order`, orderRoutes);
router.use(`${API_VERSION}/negotiated`, negotiatedProductRoutes);
router.use(`${API_VERSION}/review`, reviewRoutes);

// Health check route
router.get(`${API_VERSION}/health`, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Resource not found",
  });
});

// Error handler
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

module.exports = router;
