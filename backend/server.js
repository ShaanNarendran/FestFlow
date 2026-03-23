const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug log for incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Inline auth middleware to save a file slot
// Enhanced auth middleware to handle staff
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

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  next();
};

const vendorOnly = (req, res, next) => {
  if (req.user?.role !== 'vendor') return res.status(403).json({ error: 'Access denied. Vendor only.' });
  next();
};

const staffOnly = (req, res, next) => {
  if (req.user?.role !== 'staff') return res.status(403).json({ error: 'Access denied. Staff only.' });
  next();
};

app.locals.authMiddleware = authMiddleware;

// Route imports
const vendorRoutes = require('./routes/vendorRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Mount routes
app.use('/api/vendors', vendorRoutes);
app.use('/api/orders', orderRoutes);

// --- INLINE ADMIN, STAFF & APPLICATION ROUTES ---
const Application = require('./models/Application');
const Vendor = require('./models/Vendor');
const Order = require('./models/Order');
const Staff = require('./models/Staff');
const bcrypt = require('bcryptjs');

// POST /api/vendors/staff (Vendor creates a cashier)
app.post('/api/vendors/staff', authMiddleware, vendorOnly, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    
    const existing = await Staff.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already taken' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const staff = new Staff({ 
      username, 
      password: hashedPassword, 
      vendorId: req.user.id 
    });
    await staff.save();
    res.status(201).json({ message: 'Staff created successfully', staff: { id: staff._id, username: staff.username } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/vendors/staff (Vendor views their staff)
app.get('/api/vendors/staff', authMiddleware, vendorOnly, async (req, res) => {
  try {
    const staff = await Staff.find({ vendorId: req.user.id }).select('-password');
    res.json(staff);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/staff/login
app.post('/api/staff/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const staff = await Staff.findOne({ username });
    if (!staff) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const vendor = await Vendor.findById(staff.vendorId);
    
    const token = jwt.sign({ id: staff._id, vendorId: staff.vendorId, role: 'staff' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, staff: { id: staff._id, username: staff.username, role: 'staff', vendor: { id: vendor._id, name: vendor.name, currentEventCode: vendor.currentEventCode } } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/orders/cash (Cashier logs a manual order)
app.post('/api/orders/cash', authMiddleware, staffOnly, async (req, res) => {
  try {
    const { items, totalAmount, customerPhone } = req.body;
    const vendor = await Vendor.findById(req.user.vendorId);

    // Stock validation & deduction (reusing logic from orderRoutes)
    for (const item of items) {
      const dbItem = vendor.inventory.find(i => i.name === item.name);
      if (!dbItem || dbItem.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
      }
      dbItem.stock -= item.quantity;
    }
    vendor.markModified('inventory');
    await vendor.save();

    const order = new Order({
      vendorId: req.user.vendorId,
      items,
      totalAmount,
      customerPhone,
      eventCode: vendor.currentEventCode,
      status: 'Preparing', // Cash orders skip verification, go straight to kitchen
      paymentMethod: 'Cash',
      paymentConfirmed: true,
      staffId: req.user.id
    });
    await order.save();
    res.status(201).json({ message: 'Cash order logged!', order });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/applications  (Vendor applies to an event)
app.post('/api/applications', authMiddleware, async (req, res) => {
  try {
    const { eventCode } = req.body;
    if (!eventCode) return res.status(400).json({ error: 'Event code is required.' });

    const existing = await Application.findOne({ vendorId: req.user.id, eventCode: eventCode.toUpperCase() });
    if (existing) return res.status(400).json({ error: 'You have already applied for this event.' });

    const application = new Application({ vendorId: req.user.id, eventCode: eventCode.toUpperCase() });
    await application.save();

    res.status(201).json({ message: `Application submitted!`, application });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/applications/my  (Vendor views their own applications)
app.get('/api/applications/my', authMiddleware, async (req, res) => {
  try {
    const applications = await Application.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/signup
app.post('/api/admin/signup', async (req, res) => {
  try {
    const { username, password, inviteCode } = req.body;
    // Basic protection: check for invite code if set in env
    if (process.env.ADMIN_INVITE_CODE && inviteCode !== process.env.ADMIN_INVITE_CODE) {
      return res.status(401).json({ error: 'Invalid admin invite code.' });
    }

    const Admin = require('./models/Admin');
    const existing = await Admin.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Admin username already exists.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = new Admin({
      username,
      password: hashedPassword,
      managedEventCodes: ['ALL']
    });
    await admin.save();

    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, admin: { id: admin._id, username: admin.username, managedEventCodes: admin.managedEventCodes } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const bcrypt = require('bcryptjs');
    const Admin = require('./models/Admin');

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ error: 'Invalid admin credentials.' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid admin credentials.' });

    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, admin: { id: admin._id, username: admin.username, managedEventCodes: admin.managedEventCodes } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/applications/:eventCode
app.get('/api/admin/applications/:eventCode', authMiddleware, adminOnly, async (req, res) => {
  try {
    const applications = await Application.find({ eventCode: req.params.eventCode.toUpperCase() }).populate('vendorId', '-password');
    res.json(applications);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/approve/:appId
app.put('/api/admin/approve/:appId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const application = await Application.findById(req.params.appId);
    if (!application) return res.status(404).json({ error: 'Application not found.' });
    application.status = status;
    await application.save();
    if (status === 'approved') await Vendor.findByIdAndUpdate(application.vendorId, { approvalStatus: 'approved' });
    res.json({ message: `Application ${status}.`, application });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/analytics/:eventCode - Aggregated Privacy-Focused Analytics
app.get('/api/admin/analytics/:eventCode', authMiddleware, adminOnly, async (req, res) => {
  try {
    const eventCode = req.params.eventCode.toUpperCase();
    
    // 1. Basic Aggregation (Totals)
    const stats = await Order.aggregate([
      { $match: { eventCode } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $count: {} },
          cashRevenue: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'Cash'] }, '$totalAmount', 0] } },
          upiRevenue: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'UPI'] }, '$totalAmount', 0] } }
        }
      }
    ]);

    const totals = stats[0] || { totalRevenue: 0, totalOrders: 0, cashRevenue: 0, upiRevenue: 0 };

    // 2. Vendor Distribution
    const vendorStats = await Order.aggregate([
      { $match: { eventCode } },
      {
        $group: {
          _id: '$vendorId',
          revenue: { $sum: '$totalAmount' },
          orders: { $count: {} }
        }
      },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $project: {
          name: '$vendor.name',
          revenue: 1,
          orders: 1
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // 3. Hourly Trend (Last 24 Hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hourlyStats = await Order.aggregate([
      { $match: { eventCode, createdAt: { $gte: oneDayAgo } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      eventCode,
      totals,
      vendorStats,
      hourlyStats
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/me
app.get('/api/admin/me', authMiddleware, adminOnly, async (req, res) => {
  try { 
    const Admin = require('./models/Admin');
    const admin = await Admin.findById(req.user.id).select('-password');
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    res.json(admin); 
  } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Health check
app.get('/', (req, res) => { res.json({ message: 'Stally API is running 🚀' }); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🟢 Server running on port ${PORT}`));
