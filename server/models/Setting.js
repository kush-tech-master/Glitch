const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'glitch_main_bill_settings',
    },
    topLeft: {
      brandName: { type: String, default: 'GLITCH' },
      tagline: { type: String, default: 'GEN Z MENSWEAR' },
      categories: { type: String, default: 'STREETWEAR • OVERSIZED TEES • CARGOS • HOODIES • DENIMS' },
      gstin: { type: String, default: '' },
      state: { type: String, default: 'Gujarat' },
      logoUrl: { type: String, default: '/glitch-original.jpeg' },
    },
    topRight: {
      invoiceTitle: { type: String, default: 'RETAIL INVOICE' },
      addressLine1: { type: String, default: 'Shop No. 30, Glitch Clothing, Near Purnima hotel, Modasa' },
      addressLine2: { type: String, default: 'Post office Road, Modasa - 383315, Dist. Aravalli' },
      phone1: { type: String, default: '+91 77789 78723' },
      phone2: { type: String, default: '+91 94085 91917' },
      phone3: { type: String, default: '+91 98259 26615' },
      email: { type: String, default: 'glitch.menswear@gmail.com' },
    },
    qrAndTerms: {
      socialLabel: { type: String, default: 'FOLLOW US' },
      socialHandle: { type: String, default: '@glitch_clothing_co' },
      socialUrl: { type: String, default: 'https://www.instagram.com/glitch_clothing_co?stkn=N3V4d3dya3JvYXNu' },
      paymentLabel: { type: String, default: 'SCAN & PAY' },
      upiId: { type: String, default: 'glitch@okhdfcbank' },
      payeeName: { type: String, default: 'GLITCH MENSWEAR' },
      terms1: { type: String, default: '1. Goods once sold will not be taken back.' },
      terms2: { type: String, default: '2. Goods once sold will not be refunded.' },
      terms3: { type: String, default: "3. Subject to 'MODASA' Jurisdiction only." },
    },
    watermark: {
      enabled: { type: Boolean, default: true },
      opacity: { type: Number, default: 25 },
      size: { type: Number, default: 240 },
      imageUrl: { type: String, default: '/glitch-original.jpeg' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', settingSchema);
