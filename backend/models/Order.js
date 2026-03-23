const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 1 },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer WhatsApp number is required'],
    },
    eventCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['Awaiting Verification', 'Confirmed', 'Preparing', 'Ready', 'Completed'],
      default: 'Awaiting Verification',
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Cash'],
      default: 'UPI',
    },
    paymentConfirmed: {
      type: Boolean,
      default: false,
    },
    upiTransactionId: {
      type: String,
      default: '',
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
