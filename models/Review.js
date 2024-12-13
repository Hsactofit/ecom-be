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
    images: [
      {
        url: String,
        alt: String,
      },
    ],
    purchaseVerified: {
      type: Boolean,
      default: false,
    },
    variant: {
      memorySize: {
        size: Number,
        unit: String,
      },
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // New replies field with likeCount
    replies: [
      {
        replyBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // The user replying (e.g., admin or seller)
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
        likeCount: {
          type: Number,
          default: 0, // Initialize like count to 0
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure one review per user per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Update product rating on review changes
ReviewSchema.post("save", async function () {
  const Product = mongoose.model("Product");
  try {
    // If a variant is involved, update the variant's average rating
    await Product.updateProductRating(this.product);
  } catch (error) {
    console.error("Error updating product rating:", error);
  }
});

module.exports = mongoose.model("Review", ReviewSchema);
