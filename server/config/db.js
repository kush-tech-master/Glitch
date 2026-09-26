const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Windows DNS resolution with MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback
}
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'glitch_billing',
      serverSelectionTimeoutMS: 20000,
    });
    console.log(`[MongoDB Connected]: ${conn.connection.host} / Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    console.warn(`Tip: If using MongoDB Atlas, make sure your IP address is whitelisted in Atlas Network Access (e.g., 0.0.0.0/0) and your username/password in .env are correct.`);
  }
};

module.exports = connectDB;
