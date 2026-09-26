const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const dns = require('dns');

// Configure reliable DNS servers for Atlas SRV lookup
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Load environment variables from server/.env file
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration (allow requests from Next.js frontend)
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow during local development
      }
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Connect to MongoDB Atlas first
    await connectDB();

    // 2. Mount API Routes
    app.use('/api/bills', require('./routes/billRoutes'));
    app.use('/api/companies', require('./routes/companyRoutes'));
    app.use('/api/categories', require('./routes/categoryRoutes'));
    app.use('/api/users', require('./routes/userRoutes'));
    app.use('/api/settings', require('./routes/settingRoutes'));

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        serverTime: new Date().toISOString(),
        message: 'GLITCH Billing API is running smoothly',
      });
    });

    // Root welcome message
    app.get('/', (req, res) => {
      res.send('⚡ GLITCH Menswear Billing Backend API is Active ⚡');
    });

    // 404 Handler
    app.use((req, res, next) => {
      res.status(404).json({
        success: false,
        message: `API Route ${req.originalUrl} not found`,
      });
    });

    // Global Error Handler
    app.use((err, req, res, next) => {
      console.error('[Server Error]:', err.stack);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
      });
    });

    // 3. Start Express Listener
    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 GLITCH Backend Server running on http://localhost:${PORT}`);
      console.log(`⚡ Connected to MongoDB Atlas & Ready for Billing POS`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
