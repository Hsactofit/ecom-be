const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/WishListController");
const { authenticateToken, checkRole } = require("../middleware/auth");

// ======================= Public Routes =======================

// Check if a product is in the wishlist (public route)
router.get(
  "/:userId/check/:productId",
  wishlistController.checkProductInWishlist
);

// ======================= Private Routes =======================

// Get wishlist for a user (authenticated route)
router.get("/:userId", authenticateToken, wishlistController.getWishlist);

// Add a product to the wishlist (authenticated route)
router.post("/", authenticateToken, wishlistController.addToWishlist);

// Remove a product from the wishlist (authenticated route)
router.delete("/", authenticateToken, wishlistController.removeFromWishlist);

// Clear the user's wishlist (authenticated route)
router.delete("/:userId", authenticateToken, wishlistController.clearWishlist);

module.exports = router;
