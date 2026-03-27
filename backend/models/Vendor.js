const mongoose = require('mongoose');
const slugify = require('slugify');

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Stall name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    upiId: {
      type: String,
      required: [true, 'UPI ID is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    currentEventCode: {
      type: String,
      default: '',
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    inventory: [
      {
        name: { type: String, required: true },
        description: { type: String, default: '' },
        price: { type: Number, required: true },
        stock: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

vendorSchema.pre('save', async function () {
  if (this.isModified('name') || this.isNew) {
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    
    while (await mongoose.models.Vendor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = slug;
  }
});

module.exports = mongoose.model('Vendor', vendorSchema);
