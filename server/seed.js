const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const Setting = require('./models/Setting');
const Company = require('./models/Company');
const Category = require('./models/Category');
const Counter = require('./models/Counter');

const DEFAULT_SETTINGS_DATA = {
  key: 'glitch_main_bill_settings',
  topLeft: {
    brandName: 'GLITCH',
    tagline: 'GEN Z MENSWEAR',
    categories: 'STREETWEAR • OVERSIZED TEES • CARGOS • HOODIES • DENIMS',
    gstin: '',
    state: 'Gujarat',
    logoUrl: '/glitch-original.jpeg',
  },
  topRight: {
    invoiceTitle: 'RETAIL INVOICE',
    addressLine1: 'Shop No. 30, Glitch Clothing, Near Purnima hotel, Modasa',
    addressLine2: 'Post office Road, Modasa - 383315, Dist. Aravalli',
    phone1: '+91 77789 78723',
    phone2: '+91 94085 91917',
    phone3: '+91 98259 26615',
    email: 'glitch.menswear@gmail.com',
  },
  qrAndTerms: {
    socialLabel: 'FOLLOW US',
    socialHandle: '@glitch_clothing_co',
    socialUrl: 'https://www.instagram.com/glitch_clothing_co?stkn=N3V4d3dya3JvYXNu',
    paymentLabel: 'SCAN & PAY',
    upiId: 'glitch@okhdfcbank',
    payeeName: 'GLITCH MENSWEAR',
    terms1: '1. Goods once sold will not be taken back.',
    terms2: '2. Goods once sold will not be refunded.',
    terms3: "3. Subject to 'MODASA' Jurisdiction only.",
  },
  watermark: {
    enabled: true,
    opacity: 25,
    size: 240,
    imageUrl: '/glitch-original.jpeg',
  },
};

const DEFAULT_COMPANIES = [
  { name: 'GLITCH', code: 'GL', description: 'Official In-house Gen-Z Menswear Brand', order: 1 },
  { name: 'ZARA', code: 'ZR', order: 2 },
  { name: 'H&M', code: 'HM', order: 3 },
  { name: 'SNITCH', code: 'SN', order: 4 },
  { name: 'LEVIS', code: 'LV', order: 5 },
  { name: 'OFF-WHITE', code: 'OW', order: 6 },
  { name: 'BALENCIAGA', code: 'BL', order: 7 },
  { name: 'PUMA', code: 'PM', order: 8 },
  { name: 'NIKE', code: 'NK', order: 9 },
  { name: 'ADIDAS', code: 'AD', order: 10 },
  { name: 'POWERLOOK', code: 'PL', order: 11 },
  { name: 'THE SOULS', code: 'TS', order: 12 },
  { name: 'JACK & JONES', code: 'JJ', order: 13 },
  { name: 'US POLO', code: 'USP', order: 14 },
  { name: 'OVERSIZED CLUB', code: 'OC', order: 15 },
  { name: 'OTHER BRAND', code: 'OTH', order: 99 },
];

const DEFAULT_CATEGORIES = [
  { name: 'Shirt', code: 'SHR', order: 1 },
  { name: 'T-Shirt', code: 'TSH', order: 2 },
  { name: 'Oversized T-Shirt', code: 'OV-TSH', order: 3 },
  { name: 'Pant', code: 'PNT', order: 4 },
  { name: 'Jeans', code: 'JNS', order: 5 },
  { name: 'Cargo Pant', code: 'CRG', order: 6 },
  { name: 'Baggy Pant', code: 'BAG-PNT', order: 7 },
  { name: 'Parachute Cargo', code: 'PAR-CRG', order: 8 },
  { name: 'Hoodie', code: 'HOD', order: 9 },
  { name: 'Sweatshirt', code: 'SWT', order: 10 },
  { name: 'Jacket / Varsity', code: 'JKT', order: 11 },
  { name: 'Boxy Cropped Shirt', code: 'BOX-SHR', order: 12 },
  { name: 'Shorts', code: 'SHT', order: 13 },
  { name: 'Track Pant', code: 'TRK-PNT', order: 14 },
  { name: 'Kurta / Ethnic', code: 'KRT', order: 15 },
  { name: 'Dress / Combo', code: 'DRS', order: 16 },
  { name: 'Accessories', code: 'ACC', order: 17 },
];

async function seedDatabase() {
  try {
    console.log('[Seed]: Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'glitch_billing',
    });
    console.log('[Seed]: Connected successfully to MongoDB Atlas Database: glitch_billing');

    // 1. Seed or update Settings
    console.log('[Seed]: Saving current Bill Settings to Database...');
    await Setting.findOneAndUpdate(
      { key: 'glitch_main_bill_settings' },
      DEFAULT_SETTINGS_DATA,
      { upsert: true, new: true }
    );
    console.log('✓ Bill Settings saved to MongoDB Atlas.');

    // 2. Seed Companies
    console.log('[Seed]: Saving Company Brands to Database...');
    for (const comp of DEFAULT_COMPANIES) {
      await Company.findOneAndUpdate(
        { name: comp.name },
        comp,
        { upsert: true, new: true }
      );
    }
    const totalCompanies = await Company.countDocuments();
    console.log(`✓ ${totalCompanies} Companies verified/saved in MongoDB Atlas.`);

    // 3. Seed Categories
    console.log('[Seed]: Saving Categories to Database...');
    for (const cat of DEFAULT_CATEGORIES) {
      await Category.findOneAndUpdate(
        { name: cat.name },
        cat,
        { upsert: true, new: true }
      );
    }
    const totalCategories = await Category.countDocuments();
    console.log(`✓ ${totalCategories} Categories verified/saved in MongoDB Atlas.`);

    // 4. Seed Admin User
    const User = require('./models/User');
    const existingAdmin = await User.findOne({ email: 'admin@glitchclothing.com' });
    if (existingAdmin) {
      existingAdmin.password = 'Glitch@7778978723';
      existingAdmin.name = 'GLITCH Store Admin';
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('✓ Admin user updated with requested credentials.');
    } else {
      await User.create({
        name: 'GLITCH Store Admin',
        email: 'admin@glitchclothing.com',
        mobile: '+91 77789 78723',
        password: 'Glitch@7778978723',
        role: 'admin',
      });
      console.log('✓ Admin user created with requested credentials (admin@glitchclothing.com).');
    }

    // 5. Initialize Counter if not exists
    const counter = await Counter.findOne({ id: 'bill_number' });
    if (!counter) {
      await Counter.create({ id: 'bill_number', seq: 0, prefix: 'GL-' });
      console.log('✓ Bill Sequence Counter initialized (GL-00001).');
    }

    console.log('\n🎉 ALL SETTINGS, COMPANIES, CATEGORIES & ADMIN USER PERSISTED TO MONGODB ATLAS!\n');
  } catch (error) {
    console.error('[Seed Error]:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[Seed]: Disconnected from DB.');
  }
}

seedDatabase();
