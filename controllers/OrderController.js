const orderService = require('../services/OrderService');
const { validateObjectId } = require('../utils/validation');

const orderController = {
    /**
     * Create order from cart
     */
    async createOrderFromCart(req, res) {
        const { userId, shippingAddress, paymentMethod } = req.body;

        if (!userId || !shippingAddress || !paymentMethod) {
            logError('createOrderFromCart', 'Missing required fields', { userId });
            return res.status(400).json({
                success: false,
                message: 'User ID, shippingAddress, and paymentMethod are required'
            });
        }

        try {
            const order = await orderService.createOrderFromCart(userId, shippingAddress, paymentMethod);
            res.status(201).json({
                success: true,
                data: order,
                message: 'Order created successfully from cart'
            });
        } catch (error) {
            logError('createOrderFromCart', error.message, { userId });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Create order for a single product
     */
    async createOrderForSingleProduct(req, res) {
        const { userId, productId, quantity, shippingAddress, paymentMethod } = req.body;

        if (!userId || !productId || !quantity || !shippingAddress || !paymentMethod) {
            logError('createOrderForSingleProduct', 'Missing required fields', { userId, productId });
            return res.status(400).json({
                success: false,
                message: 'User ID, productId, quantity, shippingAddress, and paymentMethod are required'
            });
        }

        try {
            const order = await orderService.createOrderForSingleProduct(
                userId,
                productId,
                quantity,
                shippingAddress,
                paymentMethod
            );
            res.status(201).json({
                success: true,
                data: order,
                message: 'Order created successfully for single product'
            });
        } catch (error) {
            logError('createOrderForSingleProduct', error.message, { userId, productId });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    async getOrderById(req, res) {
        const { orderId } = req.params;

        if (!validateObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format'
            });
        }

        try {
            const order = await orderService.getOrderById(orderId);
            res.status(200).json({
                success: true,
                data: order,
                message: 'Order retrieved successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve order',
                error: error.message
            });
        }
    },
    
    async getSellerOrders(req, res) {
        try {
            const sellerId = req.params.sellerId;
            
            // Input validation
            if (!sellerId) {
                return res.status(400).json({
                    success: false,
                    message: "Seller ID is required"
                });
            }

            // Get orders from service
            const result = await orderService.getSellerOrders(sellerId);

            return res.status(200).json({
                success: true,
                data: result,
                message: "Seller orders retrieved successfully"
            });

        } catch (error) {
            console.error("Error in getSellerOrders:", error);
            return res.status(500).json({
                success: false,
                message: "Error retrieving seller orders",
                error: error.message
            });
        }
    },
    async updateProductOrderStatus(req, res) {
        try {
            const { orderId, itemId } = req.params;
            const { status,sellerId } = req.body;

            // Validate input
            if (!orderId || !itemId || !status) {
                return res.status(400).json({
                    success: false,
                    message: "Order ID, Item ID and status are required"
                });
            }

            // Validate status enum
            const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status value"
                });
            }

            const updatedOrder = await orderService.updateProductOrderStatus(
                orderId,
                itemId,
                sellerId,
                status
            );
            console.log( updatedOrder);
            return res.status(200).json({
                success: true,
                message: "Product order status updated successfully"
            });

        } catch (error) {
            console.error("Error in updateProductOrderStatus:", error);
            return res.status(error.message.includes('not found' || 'not authorized') ? 404 : 500).json({
                success: false,
                message: error.message || "Error updating product order status"
            });
        }
    },

    async getUserOrders(req, res) {
        const { userId } = req.params;

        if (!validateObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        try {
            const orders = await orderService.getUserOrders(userId);
            res.status(200).json({
                success: true,
                data: orders,
                message: 'Orders retrieved successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve user orders',
                error: error.message
            });
        }
    },

    async cancelOrder(req, res) {
        const { orderId, userId } = req.body;

        if (!validateObjectId(orderId) || !validateObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID or user ID format'
            });
        }

        try {
            const order = await orderService.cancelOrder(orderId, userId);
            res.status(200).json({
                success: true,
                data: order,
                message: 'Order cancelled successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to cancel order',
                error: error.message
            });
        }
    }
};

module.exports = orderController;
