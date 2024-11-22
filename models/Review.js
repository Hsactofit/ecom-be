const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxLength: 100
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            maxLength: 1000
        },
        images: [{
            url: String,
            alt: String
        }],
        purchaseVerified: {
            type: Boolean,
            default: false
        },
        variant: {
            memorySize: {
                size: Number,
                unit: String
            }
        },
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    },
    {
        timestamps: true
    }
);

// Ensure one review per user per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Update product rating on review changes
ReviewSchema.post('save', async function() {
    const Product = mongoose.model('Product');
    await Product.updateProductRating(this.product);
});

module.exports = mongoose.model("Review", ReviewSchema);