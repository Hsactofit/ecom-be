const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const ResellProduct = require("../models/ResellProduct");
const moment = require("moment");

// Helper function to calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0; // Avoid division by zero
  return ((current - previous) / previous) * 100;
};

// Get Stats for Cards
exports.getStats = async (req, res) => {
  try {
    const today = moment().startOf("day");
    const oneWeekAgo = moment().subtract(7, "days").startOf("day");

    // Total Customers (Current and Previous Week)
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const previousCustomers = await User.countDocuments({
      role: "customer",
      createdAt: { $lt: oneWeekAgo.toDate() },
    });

    // Total Orders (Current and Previous Week)
    const totalOrders = await Order.countDocuments();
    const ordersThisWeek = await Order.countDocuments({
      createdAt: { $gte: oneWeekAgo.toDate() },
    });
    const ordersLastWeek = await Order.countDocuments({
      createdAt: {
        $gte: moment(oneWeekAgo).subtract(7, "days").toDate(),
        $lt: oneWeekAgo.toDate(),
      },
    });

    // Total Sellers (Current and Previous Week)
    const totalSellers = await User.countDocuments({ role: "seller" });
    const sellersThisWeek = await User.countDocuments({
      role: "seller",
      createdAt: { $gte: oneWeekAgo.toDate() },
    });
    const sellersLastWeek = await User.countDocuments({
      role: "seller",
      createdAt: {
        $gte: moment(oneWeekAgo).subtract(7, "days").toDate(),
        $lt: oneWeekAgo.toDate(),
      },
    });

    // Total Resellers (Current and Previous Week)
    const totalResellers = await User.countDocuments({ role: "reseller" });
    const resellersThisWeek = await User.countDocuments({
      role: "reseller",
      createdAt: { $gte: oneWeekAgo.toDate() },
    });
    const resellersLastWeek = await User.countDocuments({
      role: "reseller",
      createdAt: {
        $gte: moment(oneWeekAgo).subtract(7, "days").toDate(),
        $lt: oneWeekAgo.toDate(),
      },
    });

    // Total Sales (This Week and Last Week)
    const salesThisWeek = await Order.aggregate([
      {
        $match: { createdAt: { $gte: oneWeekAgo.toDate() } },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
        },
      },
    ]);

    const salesLastWeek = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: moment(oneWeekAgo).subtract(7, "days").toDate(),
            $lt: oneWeekAgo.toDate(),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalSales = salesThisWeek[0]?.totalSales || 0;
    const previousSales = salesLastWeek[0]?.totalSales || 0;

    // Calculate Trends
    const customerChange = calculatePercentageChange(
      totalCustomers,
      previousCustomers
    );
    const orderChange = calculatePercentageChange(
      ordersThisWeek,
      ordersLastWeek
    );
    const salesChange = calculatePercentageChange(totalSales, previousSales);
    const sellerChange = calculatePercentageChange(
      sellersThisWeek,
      sellersLastWeek
    );
    const resellerChange = calculatePercentageChange(
      resellersThisWeek,
      resellersLastWeek
    );

    return res.status(200).json({
      stats: [
        {
          title: "Total Customers",
          value: totalCustomers.toLocaleString(),
          change: `${customerChange > 0 ? "+" : ""}${customerChange.toFixed(
            1
          )}%`,
          changeValue: `${totalCustomers - previousCustomers} this week`,
          trend: customerChange >= 0 ? "up" : "down",
        },
        {
          title: "Total Orders",
          value: totalOrders.toLocaleString(),
          change: `${orderChange > 0 ? "+" : ""}${orderChange.toFixed(1)}%`,
          changeValue: `${ordersThisWeek - ordersLastWeek} this week`,
          trend: orderChange >= 0 ? "up" : "down",
        },
        {
          title: "Total Sellers",
          value: totalSellers.toLocaleString(),
          change: `${sellerChange > 0 ? "+" : ""}${sellerChange.toFixed(1)}%`,
          changeValue: `${sellersThisWeek - sellersLastWeek} this week`,
          trend: sellerChange >= 0 ? "up" : "down",
        },
        {
          title: "Total Resellers",
          value: totalResellers.toLocaleString(),
          change: `${resellerChange > 0 ? "+" : ""}${resellerChange.toFixed(
            1
          )}%`,
          changeValue: `${resellersThisWeek - resellersLastWeek} this week`,
          trend: resellerChange >= 0 ? "up" : "down",
        },
        {
          title: "Total Sales",
          value: `$${totalSales.toLocaleString()}`,
          change: `${salesChange > 0 ? "+" : ""}${salesChange.toFixed(1)}%`,
          changeValue: `$${(totalSales - previousSales).toFixed(2)} this week`,
          trend: salesChange >= 0 ? "up" : "down",
        },
      ],
      details: {
        totalCustomers,
        previousCustomers,
        ordersThisWeek,
        ordersLastWeek,
        totalSellers,
        sellersThisWeek,
        sellersLastWeek,
        totalResellers,
        resellersThisWeek,
        resellersLastWeek,
        totalSales,
        previousSales,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
