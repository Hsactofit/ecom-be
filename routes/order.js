const express = require("express");
const router = express.Router();
const orderController = require("../controllers/OrderController");
const { authenticateToken, checkRole } = require("../middleware/auth");

// Create order from cart (private route, user must be authenticated)
router.post(
  "/from-cart",
  authenticateToken,
  orderController.createOrderFromCart
);

// Create order for a single product (private route, user must be authenticated)
router.post(
  "/single-product",
  authenticateToken,
  orderController.createOrderForSingleProduct
);

// Get order by ID (private route, user must be authenticated)
router.get("/:orderId", authenticateToken, orderController.getOrderById);

// Get all orders for a user (private route, user must be authenticated)
router.get("/user/:userId", authenticateToken, orderController.getUserOrders);

// Get all orders for a seller (private route, user must be authenticated and role must be seller)
router.get(
  "/seller/:sellerId",
  authenticateToken,
  checkRole("seller"), // Only sellers can view their orders
  orderController.getSellerOrders
);

// Update product order status (private route, user must be authenticated and seller role)
router.put(
  "/:orderId/items/:itemId/status",
  authenticateToken,
  checkRole("seller"), // Only sellers should be able to update order status
  orderController.updateProductOrderStatus
);

// Cancel an order (private route, user must be authenticated)
router.patch("/cancel", authenticateToken, orderController.cancelOrder);

module.exports = router;
