const express = require("express");
const router = express.Router();
const cartController = require("../controllers/CartController");
const { authenticateToken, checkRole } = require("../middleware/auth");

// ======================= Public Routes =======================

// Check if a product variant is in the cart (public route)
router.get(
  "/:userId/check/:productId/:variantIndex",
  cartController.isProductInCart
);

// ======================= Private Routes =======================

// Get cart items for a user (private route, user must be authenticated)
router.get("/:userId", authenticateToken, cartController.getCart);

// Get specific cart items (private route, user must be authenticated)
router.get("/items/:userId", authenticateToken, cartController.getCartItems);

// Add item to cart (private route, user must be authenticated)
router.post("/",  cartController.addToCart);

// Update cart item (private route, user must be authenticated)
router.put("/update", authenticateToken, cartController.updateCartItem);

// Remove item from cart (private route, user must be authenticated)
router.delete("/", authenticateToken, cartController.removeFromCart);

// Clear cart (private route, user must be authenticated)
router.delete("/clear/:userId", authenticateToken, cartController.clearCart);

// Mark cart as completed (private route, user must be authenticated and have the correct role)
router.put(
  "/:userId/complete",
  authenticateToken,
  checkRole("customer"), // Only allow customers to mark cart as completed
  cartController.markCartCompleted
);

module.exports = router;
