const SellerOrder = require('../models/sellerOrders');
const Order = require('../models/Order');

const mongoose = require('mongoose');
const {logError } = require('../utils/logError');
class SellerOrderService {
    static async createSellerOrder(orderData) {
        try {
            let {
                orderGroupId,
                orderId,
                productId,
                sellerId,
                customerId,
                saleAmount,
                orderStatus,
                shippingDetails,
                placedAt
            } = orderData;
            orderId = mongoose.Types.ObjectId(orderId);
            productId = mongoose.Types.ObjectId(productId);
            sellerId = mongoose.Types.ObjectId(sellerId);
            customerId = mongoose.Types.ObjectId(customerId);
            
            const newSellerOrder = new SellerOrder({
                orderId,
                orderGroupId,
                productId,
                sellerId,
                customerId,
                saleAmount,
                orderStatus,
                shippingDetails
            });

            const savedSellerOrder = await newSellerOrder.save();
            return savedSellerOrder;
        } catch (error) {
            logError('createSellerOrder', error, { orderData });
            return null;
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
            
            // if (filters.orderStatus) {
            //     query.orderStatus = filters.orderStatus;
            // }

            // if (filters.startDate && filters.endDate) {
            //     query.createdAt = {
            //         $gte: new Date(filters.startDate),
            //         $lte: new Date(filters.endDate)
            //     };
            // }

            // Execute query with pagination
            const orders = await SellerOrder.find(query)
                .populate('orderId', 'orderNumber totalAmount') // Customize populated fields
                .populate('productId', 'title images category')
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
                .populate('orderGroupId', 'orderNumber totalAmount order_status shippingAddress ')
                .populate('productId', 'title category images')
                .populate('sellerId', 'name email')
                .populate('customerId', 'name email phone');

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

    static async getSellerSalesData(sellerId, startDate, endDate) {
        try {
            const salesData = await SellerOrder.aggregate([
                {
                    $match: {
                        sellerId: mongoose.Types.ObjectId(sellerId),
                        createdAt: {
                            $gte: new Date(startDate),
                            $lte: new Date(endDate)
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            day: { $dayOfMonth: "$createdAt" },
                            month: { $month: "$createdAt" },
                            year: { $year: "$createdAt" }
                        },
                        totalSales: { $sum: "$saleAmount" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: {
                        "_id.year": 1,
                        "_id.month": 1,
                        "_id.day": 1
                    }
                },
                {
                    $group: {
                        _id: {
                            month: "$_id.month",
                            year: "$_id.year"
                        },
                        dailySales: {
                            $push: {
                                day: "$_id.day",
                                totalSales: "$totalSales",
                                count: "$count"
                            }
                        },
                        monthlySales: { $sum: "$totalSales" },
                        monthlyCount: { $sum: "$count" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        month: "$_id.month",
                        year: "$_id.year",
                        dailySales: 1,
                        monthlySales: 1,
                        monthlyCount: 1,
                        monthlyGrowth: {
                            $cond: [
                                { $eq: ["$_id.month", 1] },
                                null,
                                {
                                    $subtract: [
                                        "$monthlySales",
                                        { $arrayElemAt: ["$previousMonthSales.monthlySales", 0] }
                                    ]
                                }
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        year: 1,
                        month: 1
                    }
                }
            ]);
            
            return salesData;
        } catch (error) {
            throw new Error('Error fetching seller sales data');
        }
    }

    static async updateProductSellerOrderStatus(sellerOrderId, newStatus) {
            try {
                // Find the order and ensure the product belongs to the seller
                const sellerOrder = await SellerOrder.findById(sellerOrderId);
                
                if(!sellerOrder)
                {
                    logError('updateProductOrderStatus', 'SellerOrder not found', { sellerOrderId, newStatus });
                    return null;
                }
                const order = await Order.findOne(
                                {
                                    _id: sellerOrder?.orderGroupId
                                }
                            ).populate('items.productId');
                console.log(order); // Optional: Can be removed or replaced with a logger
                
                if (!order) {
                    logError('updateProductOrderStatus', 'Order or item not found', { sellerOrderId, newStatus });
                    return null;
                }
        
                const result = order.items.map((item, index) => ({
                    index,
                    item
                })).find(result => result.item.productId._id.toString() === sellerOrder.productId.toString());
                console.log("res",result);
                
                const { index, item } = result;
                
                if (item.productId.seller.toString() !== sellerOrder.sellerId.toString()) {
                    logError('updateProductOrderStatus', 'Seller is not authorized to update this product status', { sellerOrderId, newStatus });
                    return null;
                }
        
                if (index === -1) {
                    logError('updateProductOrderStatus', 'Item not found in order', { sellerOrderId, newStatus });
                    return null;
                }
                console.log("index", index);
        
                // Create update object
                const updateObj = {
                    [`items.${index}.product_order_status`]: newStatus
                };
        
                // Add timestamps if needed
                if (newStatus === 'Shipped') {
                    updateObj[`items.${index}.shippedAt`] = new Date();
                    updateObj[`items.${index}.product_order_status`] = newStatus;
                    
                    sellerOrder.shippedAt = new Date();
                }
                if (newStatus === 'Delivered') {
                    updateObj[`items.${index}.deliveredAt`] = new Date();
                    updateObj[`items.${index}.product_order_status`] = newStatus;
                    sellerOrder.deliveredAt = new Date();
                }
                if (newStatus === 'Cancelled') {
                    updateObj[`items.${index}.cancelledAt`] = new Date();
                    updateObj[`items.${index}.product_order_status`] = newStatus;
                    sellerOrder.cancelledAt = new Date();
                }
                if (newStatus === 'Returned') {
                    updateObj[`items.${index}.returnedAt`] = new Date();
                    updateObj[`items.${index}.product_order_status`] = newStatus;
                    sellerOrder.returnedAt = new Date();
                }
        
                // Update the order
                const updatedOrder = await Order.findOneAndUpdate(
                    { _id: sellerOrder?.orderGroupId },
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
                console.log(`Order ${sellerOrderId} - Item ${sellerOrder.productId} status updated to ${newStatus}`);
                sellerOrder.orderStatus = newStatus;
                sellerOrder.save();
                return updatedOrder;
        
            } catch (error) {
                // Log error with relevant details
                logError('updateProductOrderStatus', error, { sellerOrderId, newStatus });
                return null;
            }
        }
    
}

module.exports = SellerOrderService;