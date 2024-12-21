const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxLength: 1000,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ], // Array to track users who liked the review
    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ], // Array to track users who disliked the review
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    replies: [
      {
        replyBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        replyText: {
          type: String,
          required: true,
          trim: true,
          maxLength: 1000,
        },
        replyDate: {
          type: Date,
          default: Date.now,
        },
        likes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ], // Array to track users who liked the reply
        dislikes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ], // Array to track users who disliked the reply
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure one review per user per product
// ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// // Update product rating on review changes
// ReviewSchema.post("save", async function () {
//   const Product = mongoose.model("Product");
//   try {
//     // Calculate and update the product's average rating
//     const reviews = await mongoose.model("Review").find({ product: this.product });
//     const averageRating =
//       reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

//     await Product.findByIdAndUpdate(this.product, { averageRating });
//   } catch (error) {
//     console.error("Error updating product rating:", error);
//   }
// });

module.exports = mongoose.model("Review", ReviewSchema);
