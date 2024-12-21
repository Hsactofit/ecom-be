const Review = require("../models/Review");
const Product = require("../models/Product");
const { logError } = require("../utils/logError");

class ReviewService {
  // Add a new review
  async createReview(data) {
    console.log("Validation data:", data);
    if (!data.product || !data.user || !data.rating) {
      throw new Error("Product ID, user ID, and rating are required");
    }

    // Validate if the product ID exists
    const productExists = await Product.findById(data.product);
    if (!productExists) {
      throw new Error("Invalid product ID");
    }

    const review = new Review({
      product: data.product, // Store product ID only
      user: data.user, // User ID
      seller: data.seller, // Seller ID
      rating: data.rating,
      title: data.title,
      comment: data.comment,
    });
    // const review = await Review.create({
    //   product: data.product, // Store product ID only
    //   user: data.user, // User ID
    //   seller: data.seller, // Seller ID
    //   rating: data.rating,
    //   title: data.title,
    //   comment: data.comment,
    // });
    // console.log(review);

    await review.save();
    return review;
  }

  // Update an existing review
  async updateReview(reviewId, userId, updatedData) {
    try {
      if (!reviewId || !userId) {
        throw new Error("Review ID and User ID are required");
      }

      console.log("[ReviewService updateReview Started]:", {
        reviewId,
        userId,
        updatedData,
        timestamp: new Date().toISOString(),
      });

      // Find the review and ensure the user is the owner or an admin
      const review = await Review.findOne({ _id: reviewId, user: userId });
      if (!review) {
        throw new Error("Review not found or user not authorized to update");
      }

      // Update review fields
      Object.assign(review, updatedData);
      await review.save();

      console.log("[ReviewService updateReview Success]:", {
        reviewId,
        userId,
        updatedData,
        timestamp: new Date().toISOString(),
      });

      return review;
    } catch (error) {
      logError("updateReview", error, { reviewId, userId, updatedData });
      throw error;
    }
  }

  // Delete a review
  async deleteReview(reviewId, userId) {
    try {
      if (!reviewId || !userId) {
        throw new Error("Review ID and User ID are required");
      }

      console.log("[ReviewService deleteReview Started]:", {
        reviewId,
        userId,
        timestamp: new Date().toISOString(),
      });

      // Find and delete the review
      const review = await Review.findOneAndDelete({
        _id: reviewId,
        user: userId,
      });
      if (!review) {
        throw new Error("Review not found or user not authorized to delete");
      }

      console.log("[ReviewService deleteReview Success]:", {
        reviewId,
        userId,
        timestamp: new Date().toISOString(),
      });

      return review;
    } catch (error) {
      logError("deleteReview", error, { reviewId, userId });
      throw error;
    }
  }

  // Approve a review (admin only)
  async updateReviewStatus(reviewId, status) {
    try {
      if (!reviewId || !status) {
        throw new Error("Review ID and status are required");
      }

      console.log("[ReviewService updateReviewStatus Started]:", {
        reviewId,
        status,
        timestamp: new Date().toISOString(),
      });

      // Find the review and update its status
      const review = await Review.findByIdAndUpdate(
        reviewId,
        { status },
        { new: true }
      );

      if (!review) {
        throw new Error("Review not found");
      }

      console.log("[ReviewService updateReviewStatus Success]:", {
        reviewId,
        status,
        timestamp: new Date().toISOString(),
      });

      return review;
    } catch (error) {
      logError("updateReviewStatus", error, { reviewId, status });
      throw error;
    }
  }

  // Get all reviews for a product
  async getReviewsByProductId(productId) {
    try {
      if (!productId) {
        throw new Error("Product ID is required");
      }

      console.log("[ReviewService getReviewsByProductId Started]:", {
        productId,
        timestamp: new Date().toISOString(),
      });

      // Find all reviews for the product
      const reviews = await Review.find({ product: productId }).populate(
        "user",
        "username email"
      );

      console.log("[ReviewService getReviewsByProductId Success]:", {
        productId,
        count: reviews.length,
        timestamp: new Date().toISOString(),
      });

      return reviews;
    } catch (error) {
      logError("getReviewsByProductId", error, { productId });
      throw error;
    }
  }

  // Check if a user has reviewed a specific product variant
  async isReviewExist(userId, productId, variantId) {
    try {
      if (!userId || !productId || !variantId) {
        throw new Error("User ID, Product ID, and Variant ID are required");
      }

      console.log("[ReviewService isReviewExist Started]:", {
        userId,
        productId,
        variantId,
        timestamp: new Date().toISOString(),
      });

      // Check if a review exists for the given user and product variant
      const review = await Review.findOne({
        user: userId,
        product: productId,
        "variant._id": variantId, // Ensure that the variant ID matches
      });

      console.log("[ReviewService isReviewExist Success]:", {
        userId,
        productId,
        variantId,
        exists: review !== null,
        timestamp: new Date().toISOString(),
      });

      return review;
    } catch (error) {
      logError("isReviewExist", error, { userId, productId, variantId });
      throw error;
    }
  }

  // Add a reply to a review
  async addReplyToReview(reviewId, userId, replyText) {
    try {
      if (!reviewId || !userId || !replyText) {
        throw new Error("Review ID, User ID, and reply text are required");
      }

      console.log("[ReviewService addReplyToReview Started]:", {
        reviewId,
        userId,
        replyText,
        timestamp: new Date().toISOString(),
      });

      // Find the review and add the reply
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error("Review not found");
      }

      review.replies.push({ replyBy: userId, replyText });

      await review.save();

      console.log("[ReviewService addReplyToReview Success]:", {
        reviewId,
        replyText,
        timestamp: new Date().toISOString(),
      });

      return review.replies[review.replies.length - 1]; // Return the new reply
    } catch (error) {
      logError("addReplyToReview", error, { reviewId, userId, replyText });
      throw error;
    }
  }

  // Delete a reply
  async deleteReply(reviewId, replyId, userId) {
    try {
      const review = await Review.findById(reviewId);

      if (!review) {
        throw new Error("Review not found");
      }

      const replyIndex = review.replies.findIndex(
        (reply) => reply._id.toString() === replyId
      );

      if (
        replyIndex === -1 ||
        review.replies[replyIndex].replyBy.toString() !== userId
      ) {
        throw new Error("Reply not found or unauthorized");
      }

      review.replies.splice(replyIndex, 1); // Remove the reply
      await review.save();

      return review;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Like a review
  async likeReview(reviewId, userId) {
    const review = await Review.findById(reviewId);
    if (!review) throw new Error("Review not found");

    // Prevent multiple likes by the same user
    if (review.likes.includes(userId)) {
      review.likes.pull(userId);
    } else {
      review.likes.push(userId);
      review.dislikes.pull(userId); // Remove dislike if present
    }

    await review.save();
    return review;
  }

  // Dislike a review
  async dislikeReview(reviewId, userId) {
    const review = await Review.findById(reviewId);
    if (!review) throw new Error("Review not found");

    // Prevent multiple dislikes by the same user
    if (review.dislikes.includes(userId)) {
      review.dislikes.pull(userId);
    } else {
      review.dislikes.push(userId);
      review.likes.pull(userId); // Remove like if present
    }

    await review.save();
    return review;
  }

  // Like a reply
  async likeReply(reviewId, replyId, userId) {
    const review = await Review.findById(reviewId);
    if (!review) throw new Error("Review not found");

    const reply = review.replies.id(replyId);
    if (!reply) throw new Error("Reply not found");

    // Prevent multiple likes by the same user
    if (reply.likes.includes(userId)) {
      reply.likes.pull(userId);
    } else {
      reply.likes.push(userId);
      reply.dislikes.pull(userId); // Remove dislike if present
    }

    await review.save();
    return reply;
  }

  // Dislike a reply
  async dislikeReply(reviewId, replyId, userId) {
    const review = await Review.findById(reviewId);
    if (!review) throw new Error("Review not found");

    const reply = review.replies.id(replyId);
    if (!reply) throw new Error("Reply not found");

    // Prevent multiple dislikes by the same user
    if (reply.dislikes.includes(userId)) {
      reply.dislikes.pull(userId);
    } else {
      reply.dislikes.push(userId);
      reply.likes.pull(userId); // Remove like if present
    }

    await review.save();
    return reply;
  }

  // Approve or Reject a reply
  async updateReplyStatus(replyId, status) {
    try {
      if (!replyId || !status) {
        throw new Error("Reply ID and status are required");
      }

      console.log("[ReviewService updateReplyStatus Started]:", {
        replyId,
        status,
        timestamp: new Date().toISOString(),
      });

      // Find the review and update the reply status
      const review = await Review.findOne({ "replies._id": replyId });
      if (!review) {
        throw new Error("Reply not found");
      }

      const reply = review.replies.id(replyId);
      reply.status = status;
      await review.save();

      console.log("[ReviewService updateReplyStatus Success]:", {
        replyId,
        status,
        timestamp: new Date().toISOString(),
      });

      return reply;
    } catch (error) {
      logError("updateReplyStatus", error, { replyId, status });
      throw error;
    }
  }
}

module.exports = new ReviewService();
