const sellerOrderService = require('../services/sellerOrderService');

class SellerOrderController {
    static async createOrder(req, res) {
        try {
            const orderData = req.body;
            const savedOrder = await sellerOrderService.createSellerOrder(orderData);
            
            res.status(201).json({
                success: true,
                data: savedOrder
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    static async getSellerOrders(req, res) {
        try {
            const filters = {
                sellerId: req.query.sellerId
            };

            const pagination = {
                page: req.query.page,
                limit: req.query.limit
            };

            const result = await sellerOrderService.getSellerOrders(filters, pagination);
            
            res.status(200).json({
                success: true,
                data: result.orders,
                pagination: result.pagination
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    static async getOrderById(req, res) {
        try {
            const order = await sellerOrderService.getSellerOrderById(req.params.id);
            
            res.status(200).json({
                success: true,
                data: order
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    }

    static async getSellerStats(req, res) {
        try {
            const stats = await sellerOrderService.getSellerOrderStats(
                req.params.sellerId,
                {
                    startDate: req.query.startDate,
                    endDate: req.query.endDate
                }
            );
            
            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    static async getSellerSalesData(req, res) {
        try {
            const sellerId = req.query.sellerId; // Assuming the authenticated user is the seller
            const { startDate, endDate } = req.query;
            
            const salesData = await sellerOrderService.getSellerSalesData(sellerId, startDate, endDate);
            
            res.json(salesData);
        } catch (error) {
            console.error('Error fetching seller sales data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
module.exports = SellerOrderController;