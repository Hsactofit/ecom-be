const SellerOrder = require('../models/sellerOrders');
class SellerOrderService {
    static async createSellerOrder(orderData) {
        try {
            const newOrder = new SellerOrder({
                orderId: orderData.orderId,
                productId: orderData.productId,
                sellerId: orderData.sellerId,
                saleAmount: orderData.saleAmount,
                orderStatus: orderData.orderStatus || 'pending',
                shippingDetails: orderData.shippingDetails || {}
            });

            const savedOrder = await newOrder.save();
            return savedOrder;
        } catch (error) {
            throw new Error(`Error creating seller order: ${error.message}`);
        }
    }

    static async getSellerOrders(filters = {}, pagination = {}) {
        try {
            const { page = 1, limit = 10 } = pagination;
            const skip = (page - 1) * limit;

            // Build query based on filters
            const query = {};
            
            if (filters.sellerId) {
                query.sellerId = filters.sellerId;
            }
            
            if (filters.orderStatus) {
                query.orderStatus = filters.orderStatus;
            }

            if (filters.startDate && filters.endDate) {
                query.createdAt = {
                    $gte: new Date(filters.startDate),
                    $lte: new Date(filters.endDate)
                };
            }

            // Execute query with pagination
            const orders = await SellerOrder.find(query)
                .populate('orderId', 'orderNumber totalAmount') // Customize populated fields
                .populate('productId', 'name price')
                .populate('sellerId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            // Get total count for pagination
            const total = await SellerOrder.countDocuments(query);

            return {
                orders,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw new Error(`Error fetching seller orders: ${error.message}`);
        }
    }

    static async getSellerOrderById(orderId) {
        try {
            const order = await SellerOrder.findById(orderId)
                .populate('orderId', 'orderNumber totalAmount')
                .populate('productId', 'name price')
                .populate('sellerId', 'name email');

            if (!order) {
                throw new Error('Order not found');
            }

            return order;
        } catch (error) {
            throw new Error(`Error fetching seller order: ${error.message}`);
        }
    }

    static async getSellerOrderStats(sellerId, dateRange = {}) {
        try {
            const query = { sellerId };

            if (dateRange.startDate && dateRange.endDate) {
                query.createdAt = {
                    $gte: new Date(dateRange.startDate),
                    $lte: new Date(dateRange.endDate)
                };
            }

            const stats = await SellerOrder.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalSales: { $sum: '$saleAmount' },
                        totalCommission: { 
                            $sum: { 
                                $multiply: [
                                    '$saleAmount', 
                                    { $divide: ['$commissionRate', 100] }
                                ]
                            }
                        },
                        averageOrderValue: { $avg: '$saleAmount' }
                    }
                }
            ]);

            return stats[0] || {
                totalOrders: 0,
                totalSales: 0,
                totalCommission: 0,
                averageOrderValue: 0
            };
        } catch (error) {
            throw new Error(`Error fetching seller stats: ${error.message}`);
        }
    }
    // services/sellerOrderService.js
    async getTotalSalesOfSeller(sellerId, filters = {}) {
    try {
        const matchStage = {
            sellerId: new mongoose.Types.ObjectId(sellerId),
            orderStatus: { $ne: 'cancelled' }  // Exclude cancelled orders
        };

        // Add date range filter if provided
        if (filters.startDate && filters.endDate) {
            matchStage.createdAt = {
                $gte: new Date(filters.startDate),
                $lte: new Date(filters.endDate)
            };
        }

        const salesData = await SellerOrder.aggregate([
            {
                $match: matchStage
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    totalSales: { $sum: "$saleAmount" },
                    totalOrders: { $sum: 1 },
                    averageOrderValue: { $avg: "$saleAmount" },
                    ordersByStatus: {
                        $push: {
                            status: "$orderStatus",
                            amount: "$saleAmount"
                        }
                    }
                }
            },
            {
                $sort: {
                    "_id.year": -1,
                    "_id.month": -1
                }
            },
            {
                $group: {
                    _id: null,
                    monthlySales: {
                        $push: {
                            year: "$_id.year",
                            month: "$_id.month",
                            totalSales: "$totalSales",
                            totalOrders: "$totalOrders",
                            totalCommission: "$totalCommission",
                            netEarnings: "$netEarnings",
                            averageOrderValue: "$averageOrderValue",
                            ordersByStatus: "$ordersByStatus"
                        }
                    },
                    totalSales: { $sum: "$totalSales" },
                    totalOrders: { $sum: "$totalOrders" },
                    totalCommission: { $sum: "$totalCommission" },
                    totalNetEarnings: { $sum: "$netEarnings" },
                    overallAverageOrderValue: { $avg: "$averageOrderValue" }
                }
            },
            {
                $project: {
                    _id: 0,
                    summary: {
                        totalSales: "$totalSales",
                        totalOrders: "$totalOrders",
                        totalCommission: "$totalCommission",
                        totalNetEarnings: "$totalNetEarnings",
                        averageOrderValue: "$overallAverageOrderValue"
                    },
                    monthlySales: 1
                }
            }
        ]);

        // If no sales data found, return default structure
        if (!salesData.length) {
            return {
                summary: {
                    totalSales: 0,
                    totalOrders: 0,
                    totalCommission: 0,
                    totalNetEarnings: 0,
                    averageOrderValue: 0
                },
                monthlySales: []
            };
        }

        return salesData[0];
    } catch (error) {
        throw new Error(`Error calculating total sales: ${error.message}`);
    }
    }
    
}

module.exports = SellerOrderService;