const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');

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
router.post('/signup', async (req, res) => {
  try {
    const { name, upiId, password } = req.body;

    
    const existing = await Vendor.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ error: 'A stall with this name already exists.' });
    }

    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const vendor = new Vendor({
      name,
      upiId,
      password: hashedPassword,
    });

    await vendor.save();

    
    const token = jwt.sign(
      { id: vendor._id, role: 'vendor' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Signup successful! You are in Draft Mode.',
      token,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        slug: vendor.slug,
        upiId: vendor.upiId,
        approvalStatus: vendor.approvalStatus,
        isLive: vendor.isLive,
        inventory: vendor.inventory,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    const vendor = await Vendor.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (!vendor) {
      return res.status(400).json({ error: 'Invalid stall name or password.' });
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid stall name or password.' });
    }

    const token = jwt.sign(
      { id: vendor._id, role: 'vendor' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        slug: vendor.slug,
        upiId: vendor.upiId,
        approvalStatus: vendor.approvalStatus,
        isLive: vendor.isLive,
        inventory: vendor.inventory,
        currentEventCode: vendor.currentEventCode,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/menu', authMiddleware, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });

    vendor.inventory = req.body.inventory; 
    await vendor.save();

    res.json({
      message: 'Menu updated successfully.',
      inventory: vendor.inventory,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/live', authMiddleware, async (req, res) => {
  try {
    const { eventCode, goLive } = req.body;
    const vendor = await Vendor.findById(req.user.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });

    if (vendor.approvalStatus !== 'approved') {
      return res.status(403).json({ error: 'You must be approved before going live.' });
    }

    if (goLive) {
      
      const Application = require('../models/Application');
      const app = await Application.findOne({
        vendorId: vendor._id,
        eventCode: eventCode.toUpperCase(),
        status: 'approved',
      });

      if (!app) {
        return res.status(403).json({
          error: 'No approved application found for this event code. Apply and get approved first.',
        });
      }

      vendor.currentEventCode = eventCode.toUpperCase();
      vendor.isLive = true;
    } else {
      vendor.isLive = false;
      vendor.currentEventCode = '';
    }

    await vendor.save();
    res.json({
      message: goLive ? 'You are now LIVE!' : 'Stall is now OFFLINE.',
      isLive: vendor.isLive,
      currentEventCode: vendor.currentEventCode,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user.id).select('-password');
    if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/store/:slug', async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ slug: req.params.slug }).select('-password');
    if (!vendor) return res.status(404).json({ error: 'Stall not found.' });

    res.json({
      name: vendor.name,
      slug: vendor.slug,
      upiId: vendor.upiId,
      isLive: vendor.isLive,
      currentEventCode: vendor.currentEventCode,
      inventory: vendor.inventory, 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).select('-password');
    if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
