const express = require("express");
const router = express.Router();
const negotiatedProductController = require("../controllers/NegotiatedProductController");
const { authenticateToken, checkRole } = require("../middleware/auth");

// Create a negotiated product (private route, user must be authenticated)
router.post(
  "/",
  authenticateToken,
  negotiatedProductController.createNegotiatedProduct
);

// Get negotiated products by seller (private route, user must be authenticated)
router.get(
  "/seller/:sellerId",
  authenticateToken,
  checkRole("seller"), // Only sellers should be able to view their negotiated products
  negotiatedProductController.getNegotiatedProductsBySeller
);

// Get a specific negotiated product (private route, user must be authenticated)
router.get(
  "/:id",
  authenticateToken,
  negotiatedProductController.getNegotiatedProduct
);

// Delete a negotiated product (private route, user must be authenticated and have the correct role)
router.delete(
  "/:id",
  authenticateToken,
  checkRole("seller"), // Only sellers should be able to delete their own negotiated products
  negotiatedProductController.deleteNegotiatedProduct
);

module.exports = router;
