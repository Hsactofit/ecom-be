const mongoose = require('mongoose');

const productOrderSchema = new mongoose.Schema(
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
        },
        shippedAt: {
            type: Date,
            default: Date.now
        },
        deliveredAt: {
            type: Date
        },
        placedAt: {
            type: Date,
            default: Date.now
        },
        product_order_status: {
            type: String,
            enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
            default: 'Pending'
        }
    }
);

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        items: [
            {type:productOrderSchema}
        ],
        totalAmount: {
            type: Number,
            required: true
        },
        order_status: {
            type: String,
            enum: ['Pending', 'Completed'],
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
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
