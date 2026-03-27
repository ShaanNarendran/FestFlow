const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const { sendWhatsApp } = require('../utils/whatsapp');
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};


router.post('/', async (req, res) => {
  try {
    const { vendorSlug, items, customerPhone, upiTransactionId } = req.body;

    
    if (!upiTransactionId || upiTransactionId.trim().length < 4) {
      return res.status(400).json({ error: 'Please enter a valid UPI Transaction / Reference ID to confirm payment.' });
    }

    
    const vendor = await Vendor.findOne({ slug: vendorSlug });
    if (!vendor) return res.status(404).json({ error: 'Stall not found.' });
    if (!vendor.isLive) return res.status(400).json({ error: 'This stall is currently offline.' });

    
    for (const orderItem of items) {
      const inventoryItem = vendor.inventory.find(i => i.name === orderItem.name);
      if (!inventoryItem) {
        return res.status(400).json({ error: `Item "${orderItem.name}" no longer exists in menu.` });
      }
      if (inventoryItem.stock < orderItem.quantity) {
        return res.status(400).json({ error: `Insufficient stock for "${orderItem.name}". Only ${inventoryItem.stock} left.` });
      }
    }

    
    for (const orderItem of items) {
      const inventoryItem = vendor.inventory.find(i => i.name === orderItem.name);
      inventoryItem.stock -= orderItem.quantity;
    }

    
    vendor.markModified('inventory');
    await vendor.save();

    
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = new Order({
      vendorId: vendor._id,
      items,
      totalAmount,
      customerPhone,
      eventCode: vendor.currentEventCode,
      paymentConfirmed: true,
      upiTransactionId: upiTransactionId.trim(),
    });
    await order.save();

    res.status(201).json({
      message: 'Order placed successfully! 🎉',
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/active', authMiddleware, async (req, res) => {
  try {
    const vendorId = req.user.role === 'staff' ? req.user.vendorId : req.user.id;
    const orders = await Order.find({
      vendorId,
      status: { $in: ['Awaiting Verification', 'Confirmed', 'Preparing', 'Ready'] },
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      vendorId: req.user.id,
    }).sort({ createdAt: -1 });

    const completedOrders = orders.filter(
      (o) => o.status === 'Completed' || o.status === 'Ready' || o.status === 'Confirmed' || o.status === 'Preparing'
    );

    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

    
    const paymentBreakdown = { UPI: 0, Cash: 0 };
    const paymentCounts = { UPI: 0, Cash: 0 };
    completedOrders.forEach(o => {
      const method = o.paymentMethod || 'UPI';
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + o.totalAmount;
      paymentCounts[method] = (paymentCounts[method] || 0) + 1;
    });
    
    const statusBreakdown = {};
    orders.forEach(o => {
      statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
    });

    
    const hourlyDistribution = {};
    for (let h = 0; h < 24; h++) hourlyDistribution[h] = { orders: 0, revenue: 0 };
    orders.forEach(o => {
      const hour = new Date(o.createdAt).getHours();
      hourlyDistribution[hour].orders += 1;
      hourlyDistribution[hour].revenue += o.totalAmount;
    });

    
    const dailyTrend = {};
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    orders.forEach(o => {
      const date = new Date(o.createdAt);
      if (date >= fourteenDaysAgo) {
        const dayKey = date.toISOString().split('T')[0]; 
        if (!dailyTrend[dayKey]) dailyTrend[dayKey] = { orders: 0, revenue: 0 };
        dailyTrend[dayKey].orders += 1;
        dailyTrend[dayKey].revenue += o.totalAmount;
      }
    });

    res.json({
      totalRevenue,
      avgOrderValue,
      paymentBreakdown,
      paymentCounts,
      statusBreakdown,
      hourlyDistribution,
      dailyTrend,
      orders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Awaiting Verification', 'Confirmed', 'Preparing', 'Ready', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use: Awaiting Verification, Confirmed, Preparing, Ready, or Completed.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    
    if (order.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own orders.' });
    }

    order.status = status;
    await order.save();

    
    if (status === 'Confirmed') {
      sendWhatsApp(order.customerPhone, 'Payment verified! Your order is confirmed. ✅');
    }
    if (status === 'Preparing') {
      sendWhatsApp(order.customerPhone, 'Your order is now being prepared! 🍳');
    }
    if (status === 'Ready') {
      sendWhatsApp(order.customerPhone, 'Your order is ready for pickup! 🎉 Visit the stall to collect it.');
    }

    res.json({
      message: `Order status updated to "${status}".`,
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/staff-history', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      staffId: req.user.id,
    }).sort({ createdAt: -1 }).limit(50);
    
    const totalCash = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    res.json({ orders, totalCash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
