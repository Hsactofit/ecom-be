const express = require("express");
const router = express.Router();
const {
  productController,
  resellProductController,
  productSearchController,
} = require("../controllers/ProductController");
const { authenticateToken, checkRole } = require("../middleware/auth");

// ======================= Public Routes =======================

router.put('/seller/:productId/variants/:idx/stock', productController.updateProductStock);

router.get('/seller/:sellerId/products/stock', productController.getSellerProductsStockLevels);

router.get('/sellers/:sellerId/products', productController.getActiveSellerProducts);

// Product search (accessible to all)
router.get("/search", productSearchController.searchProducts);

// Get product by ID (accessible to all)
router.get("/:productId", productSearchController.getProductById);

// Get all products (accessible to all)
router.get("/", productController.getAllProducts);

// ======================= Private Routes =======================

// Protected routes for original products (only for sellers)
router.post(
  "/",
  authenticateToken,
  checkRole("seller"),
  productController.createProduct
);

router.put(
  "/:productId",
  authenticateToken,
  checkRole("seller"),
  productController.updateProduct
);

router.delete(
  "/:productId",
  authenticateToken,
  checkRole("seller"),
  productController.deleteProduct
);

// Protected routes for resell products (only for resellers)
router.post(
  "/resell",
  authenticateToken,
  checkRole("reseller"),
  resellProductController.createResellProduct
);

router.put(
  "/resell/:resellProductId",
  authenticateToken,
  checkRole("reseller"),
  resellProductController.updateResellProduct
);

router.delete(
  "/resell/:resellProductId",
  authenticateToken,
  checkRole("reseller"),
  resellProductController.deleteResellProduct
);

// Accept product (only for sellers)
router.patch( 
  "/:productId/accept",
  authenticateToken,
  checkRole("seller"),
  productController.acceptProduct
);

// Reject product (only for sellers)
router.patch(
  "/:productId/reject",
  authenticateToken,
  checkRole("seller"),
  productController.rejectProduct
);

module.exports = router;
