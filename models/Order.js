const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: [1, 'Quantity cannot be less than 1']
                },
                price: {
                    type: Number,
                    required: true
                }
            }
        ],
        totalAmount: {
            type: Number,
            required: true
        },
        paymentMethod: {
            type: String,
            enum: ['Credit Card', 'Debit Card', 'PayPal', 'Cash on Delivery', 'Bank Transfer'],
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ['Paid', 'Unpaid', 'Refunded'],
            required: true
        },
        status: {
            type: String,
            enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
            default: 'Pending'
        },
        shippingAddress: {
            fullName: { type: String, required: true },
            phone: { type: String, required: true },
            streetAddress: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zipCode: { type: String, required: true },
            country: { type: String, required: true }
        },
        placedAt: {
            type: Date,
            default: Date.now
        },
        shippedAt: {
            type: Date,
            default: Date.now
        },
        deliveredAt: {
            type: Date
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
