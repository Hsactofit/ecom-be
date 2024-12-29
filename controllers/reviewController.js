const Review = require("../models/Review");
const ReviewService = require("../services/ReviewService");

class ReviewController {
  // Add a review
  async addReview(req, res) {
    try {
      const { productId, rating, title, comment, sellerId } = req.body;
      const userId = req.user.id;

      // Pass only IDs to the service
      const review = await ReviewService.createReview({
        product: productId,
        user: userId,
        seller: sellerId,
        rating,
        title,
        comment,
      });

      res.status(201).json({
        success: true,
        review,
        message: "Review added successfully",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update a review
  async updateReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id;
      const updatedData = req.body;

      const review = await ReviewService.updateReview(
        reviewId,
        userId,
        updatedData
      );

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found or unauthorized",
        });
      }

      res.json({
        success: true,
        review,
        message: "Review updated successfully",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete a review
  async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id;

      const review = await ReviewService.deleteReview(reviewId, userId);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found or unauthorized",
        });
      }

      res.json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Like a review
  async likeReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id;

      const updatedReview = await ReviewService.likeReview(reviewId, userId);

      res.status(200).json({
        success: true,
        review: updatedReview,
        message: "Review liked successfully",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Dislike a review
  async dislikeReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id;

      const updatedReview = await ReviewService.dislikeReview(reviewId, userId);

      res.status(200).json({
        success: true,
        review: updatedReview,
        message: "Review disliked successfully",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Add a reply to a review
  async addReply(req, res) {
    try {
      const { reviewId } = req.params;
      const { replyText } = req.body;
      const userId = req.user.id;

      if (!replyText) {
        return res.status(400).json({ message: "Reply text is required" });
      }

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
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete a reply
  async deleteReply(req, res) {
    try {
      const { reviewId, replyId } = req.params;
      const userId = req.user.id;

      const updatedReview = await ReviewService.deleteReply(
        reviewId,
        replyId,
        userId
      );

      if (!updatedReview) {
        return res.status(404).json({
          success: false,
          message: "Reply not found or unauthorized",
        });
      }

      res.status(200).json({
        success: true,
        message: "Reply deleted successfully",
        review: updatedReview,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Like a reply
  async likeReply(req, res) {
    try {
      const { reviewId, replyId } = req.params;
      const userId = req.user.id;

      const updatedReply = await ReviewService.likeReply(
        reviewId,
        replyId,
        userId
      );

      res.status(200).json({
        success: true,
        reply: updatedReply,
        message: "Reply liked successfully",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Dislike a reply
  async dislikeReply(req, res) {
    try {
      const { reviewId, replyId } = req.params;
      const userId = req.user.id;

      const updatedReply = await ReviewService.dislikeReply(
        reviewId,
        replyId,
        userId
      );

      res.status(200).json({
        success: true,
        reply: updatedReply,
        message: "Reply disliked successfully",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
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
      const reviews = await Review.find({ product: productId })
        .populate("product", "name price description")
        .populate("user", "name email")
        .populate("seller", "name shopName")
        .populate({
          path: "replies.replyBy",
          select: "name email",
        });

      console.log(reviews);

      console.log(reviews);

      if (!reviews || reviews.length === 0) {
        return res.json({
          success: false,
          reviews: [],
          message: "No reviews found for this product",
        });
      }

      res.json({
        success: true,
        reviews,
      });
    } catch (error) {
      console.log(error.message);
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
  // async addReply(req, res) {
  //   try {
  //     const { reviewId } = req.params;
  //     const { replyText } = req.body;
  //     const userId = req.user.id; // Assuming user ID is set by auth middleware

  //     // Validate the input
  //     if (!replyText) {
  //       return res.status(400).json({ message: "Reply text is required" });
  //     }

  //     // Add the reply to the review
  //     const reply = await ReviewService.addReplyToReview(
  //       reviewId,
  //       userId,
  //       replyText
  //     );

  //     res.status(201).json({
  //       success: true,
  //       reply,
  //       message: "Reply added successfully",
  //     });
  //   } catch (error) {
  //     res.status(500).json({
  //       success: false,
  //       message: "Error adding reply",
  //       error: error.message,
  //     });
  //   }
  // }

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
