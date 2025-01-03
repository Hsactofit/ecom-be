const ReviewService = require("../services/ReviewService");

class ReviewController {
  // Add a review
  async addReview(req, res) {
    try {
      const {
        product,
        rating,
        title,
        comment,
        purchaseVerified,
        variant,
        images,
      } = req.body;
      const userId = req.user.id; // Assuming user ID is set by auth middleware

      // Assume 'seller' is passed in the body or derived from the product details
      const seller = req.body.seller; // Or fetch this from the product details if necessary

      // Create the review
      const review = await ReviewService.createReview({
        product,
        user: userId,
        seller,
        rating,
        title,
        comment,
        purchaseVerified,
        variant,
        images,
      });

      res.status(201).json({
        success: true,
        review,
        message: "Review added successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update a review
  async updateReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id; // Assuming user ID is set by auth middleware
      const updatedData = req.body;

      const review = await ReviewService.updateReview(
        reviewId,
        userId,
        updatedData
      );

      if (!review) {
        return res.status(404).json({
          success: false,
          message:
            "Review not found or user not authorized to update this review",
        });
      }

      res.json({
        success: true,
        review,
        message: "Review updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Delete a review
  async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id; // Assuming user ID is set by auth middleware

      const review = await ReviewService.deleteReview(reviewId, userId);

      if (!review) {
        return res.status(404).json({
          success: false,
          message:
            "Review not found or user not authorized to delete this review",
        });
      }

      res.json({
        success: true,
        message: "Review deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Approve a review (admin only)
  async approveReview(req, res) {
    try {
      const { reviewId } = req.params;

      const review = await ReviewService.updateReviewStatus(
        reviewId,
        "approved"
      );

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      res.json({
        success: true,
        review,
        message: "Review approved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error approving review",
        error: error.message,
      });
    }
  }

  // Reject a review (admin only)
  async rejectReview(req, res) {
    try {
      const { reviewId } = req.params;

      const review = await ReviewService.updateReviewStatus(
        reviewId,
        "rejected"
      );

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      res.json({
        success: true,
        review,
        message: "Review rejected successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error rejecting review",
        error: error.message,
      });
    }
  }

  // Get all reviews for a product
  async getReviewsForProduct(req, res) {
    try {
      const { productId } = req.params;
      const reviews = await ReviewService.getReviewsByProductId(productId);

      if (!reviews || reviews.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No reviews found for this product",
        });
      }

      res.json({
        success: true,
        reviews,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error retrieving reviews",
        error: error.message,
      });
    }
  }

  // Check if a user has reviewed a product
  async isReviewExists(req, res) {
    try {
      const { userId, productId, variantId } = req.params;
      const review = await ReviewService.isReviewExist(
        userId,
        productId,
        variantId
      );

      res.status(200).json({
        success: true,
        exists: review !== null,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error checking review existence",
        error: error.message,
      });
    }
  }

  // Add a reply to a review
  async addReply(req, res) {
    try {
      const { reviewId } = req.params;
      const { replyText } = req.body;
      const userId = req.user.id; // Assuming user ID is set by auth middleware

      // Validate the input
      if (!replyText) {
        return res.status(400).json({ message: "Reply text is required" });
      }

      // Add the reply to the review
      const reply = await ReviewService.addReplyToReview(
        reviewId,
        userId,
        replyText
      );

      res.status(201).json({
        success: true,
        reply,
        message: "Reply added successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error adding reply",
        error: error.message,
      });
    }
  }

  // Like a reply
  async likeReply(req, res) {
    try {
      const { reviewId, replyId } = req.params;
      const userId = req.user.id; // Assuming user ID is set by auth middleware

      // Like the reply
      const updatedReply = await ReviewService.likeReply(replyId, userId);

      if (!updatedReply) {
        return res.status(404).json({
          success: false,
          message: "Reply not found",
        });
      }

      res.status(200).json({
        success: true,
        updatedReply,
        message: "Reply liked successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error liking reply",
        error: error.message,
      });
    }
  }

  // Approve a reply (admin only)
  async approveReply(req, res) {
    try {
      const { reviewId, replyId } = req.params;

      const reply = await ReviewService.updateReplyStatus(replyId, "approved");

      if (!reply) {
        return res.status(404).json({
          success: false,
          message: "Reply not found",
        });
      }

      res.json({
        success: true,
        reply,
        message: "Reply approved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error approving reply",
        error: error.message,
      });
    }
  }

  // Reject a reply (admin only)
  async rejectReply(req, res) {
    try {
      const { reviewId, replyId } = req.params;

      const reply = await ReviewService.updateReplyStatus(replyId, "rejected");

      if (!reply) {
        return res.status(404).json({
          success: false,
          message: "Reply not found",
        });
      }

      res.json({
        success: true,
        reply,
        message: "Reply rejected successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error rejecting reply",
        error: error.message,
      });
    }
  }
}

module.exports = new ReviewController();
