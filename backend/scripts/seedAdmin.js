require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await Admin.findOne({ username: 'superadmin' });
  if (existing) {
    console.log('Super Admin already exists. Skipping seed.');
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('superadmin123', salt);

  const admin = new Admin({
    username: 'superadmin',
    password: hashedPassword,
    managedEventCodes: ['ALL'],
  });

  await admin.save();
  console.log('Super Admin seeded successfully!');
  console.log('Username: superadmin');
  console.log('Password: admin123');
  console.log('Managed Events: CEG26');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
