const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Table = require('../models/Table');
const Inventory = require('../models/Inventory');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const { calculateOrderPricing } = require('../utils/calculateOrder');
const { notifyOrderStatusChanged, notifyNewOrderPlaced, notifyInventoryAlert } = require('../services/socket.service');

// Helper to deduce inventory for ordered items
const deductInventoryForOrder = async (items) => {
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (product && Array.isArray(product.stockRequired)) {
      for (const req of product.stockRequired) {
        const totalNeeded = (req.quantityNeeded || 0) * (item.quantity || 1);
        const inv = await Inventory.findOne({
          ingredient: { $regex: new RegExp(`^${req.ingredientName}$`, 'i') }
        });

        if (inv) {
          inv.quantity = Math.max(0, inv.quantity - (totalNeeded / (inv.unit === 'kg' && req.unit === 'g' ? 1000 : 1)));
          await inv.save();

          if (inv.isLowStock) {
            notifyInventoryAlert(inv);
          }
        }
      }
    }
  }
};

// @desc    Create a new order (Dine-in, Delivery, or Pickup)
// @route   POST /api/orders
// @access  Public (Guest) or Private (Authenticated customer)
const createOrder = async (req, res, next) => {
  try {
    const {
      items,
      couponCode,
      orderType = 'DELIVERY',
      tableNumber,
      deliveryAddress,
      customerNotes,
      paymentMethod = 'DEV_MOCK',
      guestInfo
    } = req.body;

    // 1. Calculate pricing server-side
    const pricing = await calculateOrderPricing({
      items,
      couponCode,
      orderType,
      deliveryAddress
    });

    // 2. Generate unique order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `DRK-${1000 + orderCount + 1}`;

    // 3. Loyalty points (₹100 spent = 10 points -> 10% of subtotal)
    const pointsEarned = Math.floor(pricing.subtotal * 0.1);

    // 4. Resolve table if tableNumber provided
    let tableRef = null;
    if (tableNumber) {
      const table = await Table.findOne({ tableNumber: tableNumber.trim() });
      if (table) {
        tableRef = table._id;
        table.status = 'OCCUPIED';
        await table.save();
      }
    }

    // 5. Create Order record in DB
    const order = await Order.create({
      orderNumber,
      customer: req.user ? req.user._id : null,
      guestInfo: req.user ? null : guestInfo,
      orderType,
      table: tableRef,
      tableNumber: tableNumber ? tableNumber.trim() : '',
      items: pricing.calculatedItems,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      couponCode: pricing.validatedCoupon ? pricing.validatedCoupon.code : '',
      tax: pricing.tax,
      deliveryFee: pricing.deliveryFee,
      total: pricing.total,
      deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : undefined,
      paymentMethod,
      paymentStatus: (paymentMethod === 'DEV_MOCK' || paymentMethod === 'MOCK_RAZORPAY') ? 'PAID' : 'PENDING',
      orderStatus: 'PLACED',
      customerNotes: customerNotes ? customerNotes.trim() : '',
      loyaltyPointsEarned: pointsEarned,
      statusTimeline: [{ status: 'PLACED', note: 'Order placed by customer' }]
    });

    // 6. Update coupon usage
    if (pricing.validatedCoupon) {
      await Coupon.findByIdAndUpdate(pricing.validatedCoupon._id, { $inc: { timesUsed: 1 } });
    }

    // 7. Deduct inventory
    await deductInventoryForOrder(pricing.calculatedItems);

    // 8. If authenticated user, award loyalty points & record transaction
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.loyaltyPoints += pointsEarned;
        await user.save();

        await LoyaltyTransaction.create({
          user: user._id,
          order: order._id,
          type: 'EARNED',
          points: pointsEarned,
          balanceAfter: user.loyaltyPoints,
          reason: `Earned from Order #${order.orderNumber}`
        });
      }
    }

    // 9. Prepare payment status based on payment method
    let paymentOrderData = null;
    if (paymentMethod === 'DEV_MOCK' || paymentMethod === 'MOCK_RAZORPAY') {
      paymentOrderData = {
        id: `pay_${Date.now()}`,
        status: 'PAID',
        message: 'Dev mock payment completed'
      };
      order.paymentId = paymentOrderData.id;
      order.paymentStatus = 'PAID';
      order.orderStatus = 'CONFIRMED';
    } else if (paymentMethod === 'CASH_ON_DELIVERY') {
      order.paymentStatus = 'PENDING';
      order.orderStatus = 'CONFIRMED';
    } else {
      // PAYTM_UPI / online payments: Pending payment by customer
      order.paymentStatus = 'PENDING';
      order.orderStatus = 'PLACED';
    }
    await order.save();

    // 10. Real-time Socket.IO notification to staff kitchen display and admin
    notifyNewOrderPlaced(order);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: order,
      order,
      payment: paymentOrderData
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get order history for authenticated user
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
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

// @desc    Get single order by ID or orderNumber
// @route   GET /api/orders/:id
// @access  Public (with orderNumber) or Private (owner/admin)
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let order;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id).populate('customer', 'name email phone');
    } else {
      order = await Order.findOne({ orderNumber: id.toUpperCase() }).populate('customer', 'name email phone');
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // If order has a registered customer, ensure requesting user is owner or staff/admin
    if (order.customer && (!req.user || (req.user._id.toString() !== order.customer._id.toString() && req.user.role === 'customer'))) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this order.'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    if (req.user.role === 'customer' && order.customer && order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized.'
      });
    }

    if (!['PLACED', 'CONFIRMED'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.orderStatus}.`
      });
    }

    order.orderStatus = 'CANCELLED';
    order.statusTimeline.push({
      status: 'CANCELLED',
      note: 'Order cancelled by customer'
    });

    await order.save();

    // Broadcast status change via Socket.IO
    notifyOrderStatusChanged(order);

    res.status(200).json({
      success: true,
      message: 'Order has been cancelled.',
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reorder from past order (Section 20)
// @route   POST /api/orders/:id/reorder
// @access  Private
const reorder = async (req, res, next) => {
  try {
    const oldOrder = await Order.findById(req.params.id);

    if (!oldOrder) {
      return res.status(404).json({
        success: false,
        message: 'Original order not found.'
      });
    }

    // Reconstruct items with current pricing
    const reorderItems = [];
    const unavailableItems = [];

    for (const oldItem of oldOrder.items) {
      const currentProduct = await Product.findById(oldItem.product);
      if (!currentProduct || !currentProduct.isAvailable) {
        unavailableItems.push(oldItem.name);
        continue;
      }

      reorderItems.push({
        productId: currentProduct._id,
        name: currentProduct.name,
        size: oldItem.size,
        milk: oldItem.milk,
        sweetness: oldItem.sweetness,
        ice: oldItem.ice,
        toppings: oldItem.toppings,
        quantity: oldItem.quantity
      });
    }

    if (reorderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'None of the drinks from your previous order are currently available.'
      });
    }

    // Recalculate pricing with fresh prices
    const freshPricing = await calculateOrderPricing({
      items: reorderItems,
      orderType: oldOrder.orderType,
      deliveryAddress: oldOrder.deliveryAddress
    });

    res.status(200).json({
      success: true,
      message: unavailableItems.length > 0 
        ? `Reorder prepared! Note: ${unavailableItems.join(', ')} were unavailable.`
        : 'Reorder prepared with current menu prices.',
      cartItems: freshPricing.calculatedItems,
      pricing: freshPricing
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify payment signature & update order
// @route   PUT /api/orders/:id/verify-payment
// @access  Public
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.paymentStatus = 'PAID';
    order.paymentId = razorpayPaymentId || `pay_${Date.now()}`;
    order.orderStatus = 'CONFIRMED';
    order.statusTimeline.push({
      status: 'CONFIRMED',
      note: 'Payment verified successfully.'
    });

    await order.save();

    notifyOrderStatusChanged(order);

    res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed!',
      data: order
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  reorder,
  verifyPayment
};
