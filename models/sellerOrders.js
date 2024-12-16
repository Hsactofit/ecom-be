const mongoose = require('mongoose');

const sellerOrderSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Order'  // Assuming you have an Order model
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'  // Assuming you have a Product model
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Seller'  // Assuming you have a Seller model
    },
    saleAmount: {
        type: Number,
        required: true,
        min: 0
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    updatedAt: {
        type: Date,
        default: Date.now()
    }
});

// Indexes for better query performance
sellerOrderSchema.index({ sellerId: 1, createdAt: -1 });
sellerOrderSchema.index({ orderId: 1 });
sellerOrderSchema.index({ productId: 1 });

// Virtual for calculating commission amount
sellerOrderSchema.virtual('commissionAmount').get(function() {
    return (this.saleAmount * this.commissionRate) / 100;
});

// Pre-save middleware to calculate netAmount
sellerOrderSchema.pre('save', function(next) {
    if (this.saleAmount && this.commissionRate) {
        this.netAmount = this.saleAmount - ((this.saleAmount * this.commissionRate) / 100);
    }
    next();
});

const SellerOrder = mongoose.model('SellerOrder', sellerOrderSchema);

module.exports = SellerOrder;