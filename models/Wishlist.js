const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                }
            }
        ],
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {timestamps: true}
);


const Wishlist = mongoose.model("Wishlist", wishlistSchema);

wishlistSchema.statics.isProductInWishlist = async function(userId, productId) {
    const count = await this.countDocuments({
        userId,
        'items.productId': productId
    });
    return count > 0;
};

module.exports = Wishlist;
