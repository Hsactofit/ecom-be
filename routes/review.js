const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authenticateToken, checkRole } = require("../middleware/auth");

// ======================= Public Routes =======================

// Get all reviews for a product (public route)
router.get("/product/:productId", reviewController.getReviewsForProduct);

// Check if a user has already reviewed a product (public route)
router.get("/:userId/check/:productId", reviewController.isReviewExists);

// ======================= Private Routes =======================

// Add a review for a product (private route, user must be authenticated)
router.post("/", authenticateToken, reviewController.addReview);

// Update a review (private route, user must be authenticated)
router.put("/:reviewId", authenticateToken, reviewController.updateReview);

// Delete a review (private route, user must be authenticated)
router.delete("/:reviewId", authenticateToken, reviewController.deleteReview);

// Mark review as approved (private route, admin must be authenticated)
router.put(
  "/:reviewId/approve",
  authenticateToken,
  checkRole("admin"),
  reviewController.approveReview
);

// Mark review as rejected (private route, admin must be authenticated)
router.put(
  "/:reviewId/reject",
  authenticateToken,
  checkRole("admin"),
  reviewController.rejectReview
);

// ======================= Likes Routes for Replies =======================

// Like a review
router.post("/:reviewId/like", authenticateToken, reviewController.likeReview);

// Dislike a review
router.post(
  "/:reviewId/dislike",
  authenticateToken,
  reviewController.dislikeReview
);

// Like a reply
router.post(
  "/:reviewId/reply/:replyId/like",
  authenticateToken,
  reviewController.likeReply
);

// Dislike a reply
router.post(
  "/:reviewId/reply/:replyId/dislike",
  authenticateToken,
  reviewController.dislikeReply
);

// ======================= New Routes for Replies =======================

// Add a reply to a review (private route, user must be authenticated)
router.post("/:reviewId/reply", authenticateToken, reviewController.addReply);

router.delete(
  "/:reviewId/reply/:replyId",
  authenticateToken,
  reviewController.deleteReply
);

// Like a reply (private route, user must be authenticated)

// ======================= Admin Routes =======================

// Mark reply as approved (admin only)
router.put(
  "/:reviewId/reply/:replyId/approve",
  authenticateToken,
  checkRole("admin"),
  reviewController.approveReply
);

// Mark reply as rejected (admin only)
router.put(
  "/:reviewId/reply/:replyId/reject",
  authenticateToken,
  checkRole("admin"),
  reviewController.rejectReply
);

module.exports = router;
