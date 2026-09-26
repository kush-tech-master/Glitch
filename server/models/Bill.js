const mongoose = require('mongoose');
const crypto = require('crypto');

const billItemSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Item code is required'],
    trim: true,
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    default: 'GLITCH',
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    default: 'T-Shirt',
  },
  size: {
    type: String,
    default: 'L',
    trim: true,
  },
  qty: {
    type: Number,
    required: true,
    default: 1,
    min: [1, 'Quantity cannot be less than 1'],
  },
  rate: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Rate cannot be negative'],
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Amount cannot be negative'],
  },
});

const billSchema = new mongoose.Schema(
  {
    billNo: {
      type: String,
      required: [true, 'Bill number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    billDate: {
      type: String,
      required: true,
      default: () => new Date().toISOString().split('T')[0],
    },
    customer: {
      name: {
        type: String,
        trim: true,
        default: 'Walk-in Customer',
      },
      mobile: {
        type: String,
        trim: true,
        required: [true, 'Customer mobile number is required'],
      },
      city: {
        type: String,
        trim: true,
        default: 'Modasa',
      },
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Online', 'Split'],
      default: 'Cash',
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING', 'CANCELLED'],
      default: 'PAID',
    },
    items: {
      type: [billItemSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A bill must have at least one product item',
      },
    },
    totalQty: {
      type: Number,
      default: 0,
    },
    grossSubTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    shareToken: {
      type: String,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },
  },
  {
    timestamps: true,
  }
);

// Auto compute total quantity and ensure shareToken before saving
billSchema.pre('save', function () {
  if (this.items && this.items.length > 0) {
    this.totalQty = this.items.reduce((sum, item) => sum + (item.qty || 1), 0);
  }
  if (!this.shareToken) {
    this.shareToken = crypto.randomBytes(16).toString('hex');
  }
});

module.exports = mongoose.model('Bill', billSchema);
