const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Table = require('../models/Table');
const { notifyOrderStatusChanged } = require('../services/socket.service');

// @desc    Get Admin Overview KPI metrics
// @route   GET /api/admin/overview
// @access  Private/Admin/Staff
const getAdminOverview = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      totalRevenueData,
      todayRevenueData,
      totalCustomers,
      pendingOrdersCount,
      lowStockItems,
      popularProducts
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'PAID', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      User.countDocuments({ role: 'customer' }),
      Order.countDocuments({ orderStatus: { $in: ['PLACED', 'CONFIRMED', 'PREPARING'] } }),
      Inventory.countDocuments({ $expr: { $lte: ['$quantity', '$minimumStock'] } }),
      Product.find({ isBestseller: true }).limit(5)
    ]);

    const totalRevenue = totalRevenueData[0]?.total || 0;
    const todayRevenue = todayRevenueData[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        todayOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        totalCustomers,
        pendingOrdersCount,
        lowStockItems,
        popularProducts
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all orders with filtering
// @route   GET /api/admin/orders
// @access  Private/Admin/Staff
const getAllOrders = async (req, res, next) => {
  try {
    const { status, orderType, search } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.orderStatus = status.toUpperCase();
    }

    if (orderType && orderType !== 'all') {
      query.orderType = orderType.toUpperCase();
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { tableNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('table', 'tableNumber section')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status (Kitchen & Staff workflow)
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin/Staff
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.orderStatus = status;
    order.statusTimeline.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status} by staff`
    });

    // If completed and was table order, free up table
    if (status === 'COMPLETED' && order.table) {
      await Table.findByIdAndUpdate(order.table, { status: 'AVAILABLE', currentOrder: null });
    }

    await order.save();

    // Broadcast status change immediately to customer and kitchen screens via Socket.IO
    notifyOrderStatusChanged(order);

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get active orders for Kitchen Display System (Section 26)
// @route   GET /api/admin/kitchen
// @access  Private/Admin/Staff
const getKitchenDisplayOrders = async (req, res, next) => {
  try {
    const activeOrders = await Order.find({
      orderStatus: { $in: ['PLACED', 'CONFIRMED', 'PREPARING', 'READY'] }
    })
      .populate('table', 'tableNumber section')
      .sort({ createdAt: 1 }); // Oldest first for kitchen urgency

    res.status(200).json({
      success: true,
      count: activeOrders.length,
      data: activeOrders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Analytics data
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res, next) => {
  try {
    // 7-day revenue trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const revenueByDay = await Order.aggregate([
      { $match: { paymentStatus: 'PAID', createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Popular categories
    const categoryStats = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        revenueByDay,
        categoryStats
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all customers
// @route   GET /api/admin/customers
// @access  Private/Admin/Staff
const getCustomers = async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('name email phone loyaltyPoints createdAt lastLogin')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Moderate review approval
// @route   PUT /api/admin/reviews/:id/approve
// @access  Private/Admin
const toggleReviewApproval = async (req, res, next) => {
  try {
    const { approved } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { approved: Boolean(approved) },
      { new: true }
    );
    res.status(200).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminOverview,
  getAllOrders,
  updateOrderStatus,
  getKitchenDisplayOrders,
  getAnalytics,
  getCustomers,
  toggleReviewApproval
};
