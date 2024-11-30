const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductSearchService = require('../services/product/ProductSearchService');
const {logError} = require('../utils/logError');
const mongoose = require('mongoose');

const orderService = {
    /**
     * Create an order directly from cart items
     */
    async createOrderFromCart(userId, shippingAddress, paymentMethod) {
        try {
            // Fetch the active cart for the user
            const cart = await Cart.findOne({ userId, status: 'active' })

            if (!cart || cart.items.length === 0) {
                throw new Error('Cart is empty');
            }

            // Calculate total amount
            const totalAmount = cart.items.reduce((total, item) => {
                return total + item.productId.price * item.quantity;
            }, 0);

            // Create the order
            const newOrder = new Order({
                userId,
                items: cart.items.map(item => ({
                    productId: item.productId._id,
                    quantity: item.quantity,
                    price: item.productId.price,
                    placedAt: Date.now(),
                    product_order_status: 'Processing'
                })),
                totalAmount,
                order_status: 'Pending',  // Changed from status to order_status
                shippingAddress: {
                    fullName: shippingAddress.fullName,
                    phone: shippingAddress.phone,
                    streetAddress: shippingAddress.streetAddress,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    zipCode: shippingAddress.zipCode,
                    country: shippingAddress.country
                }
            });

            // Save the order
            const savedOrder = await newOrder.save();

            // Clear the cart after placing the order
            cart.items = [];
            await cart.save();

            return savedOrder;
        } catch (error) {
            logError('createOrderFromCart', error, { userId, paymentMethod });
            throw new Error('Failed to create order from cart');
        }
    },

    /**
     * Create an order for a single product
     */
    async createOrderForSingleProduct(userId, productId, quantity, shippingAddress, paymentMethod) {
        try {
            // Fetch the product details
            const product = await Product.findById(productId);
            if (!product) {
                throw new Error('Product not found');
            }

            if (quantity <= 0) {
                throw new Error('Quantity must be greater than 0');
            }

            // Calculate total amount
            const totalAmount = product.price * quantity;

            // Create the order
            const newOrder = new Order({
                userId,
                items: [
                    {
                        productId: product._id,
                        quantity,
                        price: product.price,
                        placedAt: Date.now(),
                        product_order_status: 'Processing'
                    }
                ],
                totalAmount,
                order_status: 'Pending',  // Changed from status to order_status
                shippingAddress: {
                    fullName: shippingAddress.fullName,
                    phone: shippingAddress.phone,
                    streetAddress: shippingAddress.streetAddress,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    zipCode: shippingAddress.zipCode,
                    country: shippingAddress.country
                }
            });

            // Save the order
            const savedOrder = await newOrder.save();

            return savedOrder;
        } catch (error) {
            logError('createOrderForSingleProduct', error, { userId, productId, quantity });
            throw new Error('Failed to create order for single product');
        }
    },

    async getOrderById(orderId) {
        try {
            const order = await Order.findById(orderId);

            const productsWithDetails = await Promise.all(
                wishlist.items.map(async (item) => {
                    try {
                        const product = await ProductSearchService.getProductById(item.productId);
                        return {
                            ...item,
                            productDetails: product
                        };
                    } catch (error) {
                        console.log(`Failed to fetch product details for productId: ${item.productId}`, error);
                        // Return the item without details if product fetch fails
                        return {
                            ...item,
                            productDetails: null,
                            error: 'Product details unavailable'
                        };
                    }
                })
            );

            if (!order) {
                throw new Error('Order not found');
            }
            
            return {
                ...order,
                items: productsWithDetails
            };
        } catch (error) {
            logError('getOrderById', error, { orderId });
            throw new Error('Failed to retrieve order');
        }
    },

    async getUserOrders(userId) {
        try {
            console.log(userId);
            const orders = await Order.find({ userId })
                                .sort({ createdAt: -1 })
                                .populate('items.productId');
            console.log(orders[0].items);
            return orders;
        } catch (error) {
            logError('getUserOrders', error, { userId });
            throw new Error('Failed to retrieve user orders');
        }
    },
    async getSellerOrderSummary(orders) {
        return {
            totalOrders: orders.length,
            totalProductsSold: orders.reduce((acc, order) => 
                acc + order.items.reduce((sum, item) => sum + item.quantity, 0), 0),
            totalRevenue: orders.reduce((acc, order) => 
                acc + order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0), 0),
            statusBreakdown: orders.reduce((acc, order) => {
                order.items.forEach(item => {
                    acc[item.product_order_status] = (acc[item.product_order_status] || 0) + 1;
                });
                return acc;
            }, {})
        };
    },

    async getSellerOrders(sellerId) {
        const orders = await Order.aggregate([
            // Unwind the items array
            { $unwind: "$items" },
            
            // Lookup product details
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            
            // Unwind product details
            { $unwind: "$productDetails" },
            
            // Filter for specific seller
            {
                $match: {
                    "productDetails.seller": new mongoose.Types.ObjectId(sellerId)
                }
            },
            
            // Group back by order
            {
                $group: {
                    _id: "$_id",
                    userId: { $first: "$userId" },
                    totalAmount: { $first: "$totalAmount" },
                    order_status: { $first: "$order_status" },
                    shippingAddress: { $first: "$shippingAddress" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                    items: {
                        $push: {
                            _id: "$items._id",
                            productId: "$productDetails",
                            quantity: "$items.quantity",
                            price: "$items.price",
                            shippedAt: "$items.shippedAt",
                            deliveredAt: "$items.deliveredAt",
                            placedAt: "$items.placedAt",
                            product_order_status: "$items.product_order_status"
                        }
                    }
                }
            },
            
            // Sort by latest orders first
            { $sort: { createdAt: -1 } }
        ]);

        const summary = await this.getSellerOrderSummary(orders);

        return {
            summary,
            orders
        };
    },
    async cancelOrder(orderId, userId) {
        try {
            const order = await Order.findOneAndUpdate(
                { _id: orderId, userId },
                { status: 'Cancelled' },
                { new: true }
            );
            if (!order) {
                throw new Error('Order not found or already cancelled');
            }
            return order;
        } catch (error) {
            logError('cancelOrder', error, { orderId, userId });
            throw new Error('Failed to cancel order');
        }
    }
};

module.exports = orderService;
