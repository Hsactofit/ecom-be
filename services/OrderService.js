const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductSearchService = require('../services/product/ProductSearchService');
const {logError} = require('../utils/logError');

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
                    price: item.productId.price
                })),
                totalAmount,
                paymentMethod,
                shippingAddress,
                status:"Pending",
                placedAt: Date.now()
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
                        price: product.price
                    }
                ],
                totalAmount,
                paymentMethod,
                shippingAddress,
                status:"Pending",
                placedAt: Date.now()
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
            const orders = await Order.find({ userId }).sort({ createdAt: -1 })
            return orders;
        } catch (error) {
            logError('getUserOrders', error, { userId });
            throw new Error('Failed to retrieve user orders');
        }
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
