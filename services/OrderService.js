const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductSearchService = require('../services/product/ProductSearchService');
const {logError} = require('../utils/logError');
const mongoose = require('mongoose');
const sellerOrderService = require('../services/sellerOrderService');
const ProductService = require('../services/product/ProductService');

const orderService = {
    /**
     * Create an order directly from cart items
     */
    async createOrderFromCart(userId, shippingAddress, paymentMethod) {
        try {
            // Fetch the active cart for the user
            const cart = await Cart.findOne({ userId, status: 'active' });
            console.log("mycart",cart);
            if (!cart || cart.items.length === 0) {
                logError('createOrderFromCart', 'Cart is empty', { userId });
                return null;
            }

            // Calculate total amount
            const totalAmount = cart.items.reduce((total, item) => {
                return total + item.productPrice * item.quantity;
            }, 0);
            console.log("mycart",cart, totalAmount);

            // Create the order
            const newOrder = new Order({
                userId,
                items: cart.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.productPrice,
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
            console.log("neworder", newOrder);
            // Save the order
            const savedOrder = await newOrder.save();

            // Manage seller Orders
            savedOrder.items.forEach(async (item) =>{
                const orderData={
                    orderId: savedOrder._id,
                    productId: item.productId,
                    sellerId:await ProductService.getSellerIdFromProductId(item.productId),
                    saleAmount: item.price * item.quantity,
                    orderStatus: item.product_order_status,
                    shippingDetails: savedOrder.shippingDetails || {}
                };
                console.log("orderData", orderData);
                await sellerOrderService.createSellerOrder(orderData);
            });

            // Clear the cart after placing the order
            cart.items = [];
            await cart.save();

            return savedOrder;
        } catch (error) {
            logError('createOrderFromCart', error, { userId, paymentMethod });
            return null;
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
                logError('createOrderForSingleProduct', 'Product not found', { userId, productId });
                return null;
            }

            if (quantity <= 0) {
                logError('createOrderForSingleProduct', 'Quantity must be greater than 0', { userId, productId, quantity });
                return null;
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
            return null;
        }
    },

    async updateProductOrderStatus(orderId, itemId, sellerId, newStatus) {
        try {
            // Find the order and ensure the product belongs to the seller
            const order = await Order.findOne(
                {
                    _id: orderId
                }
            ).populate('items.productId');
            
            console.log(order); // Optional: Can be removed or replaced with a logger
            
            if (!order) {
                logError('updateProductOrderStatus', 'Order or item not found', { orderId, itemId, sellerId, newStatus });
                return null;
            }
    
            const result = order.items.map((item, index) => ({
                index,
                item
            })).find(result => result.item.productId._id.toString() === itemId);
            
            const { index: itemIndex, item } = result;
            
            if (item.productId.seller.toString() !== sellerId) {
                logError('updateProductOrderStatus', 'Seller is not authorized to update this product status', { orderId, itemId, sellerId, newStatus });
                return null;
            }
    
            if (itemIndex === -1) {
                logError('updateProductOrderStatus', 'Item not found in order', { orderId, itemId, sellerId, newStatus });
                return null;
            }
    
            // Create update object
            const updateObj = {
                [`items.${itemIndex}.product_order_status`]: newStatus
            };
    
            // Add timestamps if needed
            if (newStatus === 'Shipped') {
                updateObj[`items.${itemIndex}.shippedAt`] = new Date();
            }
            if (newStatus === 'Delivered') {
                updateObj[`items.${itemIndex}.deliveredAt`] = new Date();
            }
            if (newStatus === 'Cancelled') {
                updateObj[`items.${itemIndex}.cancelledAt`] = new Date();
            }
            if (newStatus === 'Returned') {
                updateObj[`items.${itemIndex}.returnedAt`] = new Date();
            }
    
            // Update the order
            const updatedOrder = await Order.findOneAndUpdate(
                { _id: orderId },
                { $set: updateObj },
                { 
                    new: true,
                    runValidators: true
                }
            ).populate('items.productId');
    
            // Check if all items are delivered to update order status
            const allItemsDelivered = updatedOrder.items.every(
                item => item.product_order_status === 'Delivered'
            );
    
            if (allItemsDelivered) {
                updatedOrder.order_status = 'Completed';    
                await updatedOrder.save();
            }
    
            // Log the successful update
            console.log(`Order ${orderId} - Item ${itemId} status updated to ${newStatus}`);
            return updatedOrder;
    
        } catch (error) {
            // Log error with relevant details
            logError('updateProductOrderStatus', error, { orderId, itemId, sellerId, newStatus });
            return null;
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
                logError('getOrderById', 'Order not found', { orderId });
                return null;
            }
            
            return {
                ...order,
                items: productsWithDetails
            };
        } catch (error) {
            logError('getOrderById', error, { orderId });
            return null;
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
            return null;
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
                logError('cancelOrder', 'Order not found or already cancelled', { orderId, userId });
                return null;
            }
            return order;
        } catch (error) {
            logError('cancelOrder', error, { orderId, userId });
            return null;
        }
    }
};

module.exports = orderService;