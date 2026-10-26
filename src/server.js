const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const brandRoutes = require('./routes/brandRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const adminRoutes = require('./routes/adminRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads and images folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', brand: 'TICKING Luxury Horology', timestamp: new Date() });
});

// Reseed endpoint for catalog updates (Admin only)
const { protect, admin } = require('./middleware/authMiddleware');
app.post('/api/reseed', protect, admin, async (req, res) => {
  try {
    const { seedData } = require('./utils/seeder');
    await seedData(false);
    res.json({ success: true, message: 'Database reseeded successfully with pure watch images' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payment', paymentRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas & start Express server
const startServer = async () => {
  try {
    await connectDB();

    // Initialize Store Settings in MongoDB Atlas
    const Settings = require('./models/Settings');
    await Settings.getSingleton();
    console.log('[Atlas] Store settings initialized in MongoDB Atlas');

    // Auto-seed if Product collection is empty in MongoDB Atlas
    const Product = require('./models/Product');
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('[Atlas] Initializing catalog collections in MongoDB Atlas...');
      const { seedData } = require('./utils/seeder');
      await seedData(false);
      console.log('[Atlas] Initial catalog seeding finished successfully');
    }

    const server = app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n[Server Error] Port ${PORT} is already in use by another process.`);
        console.error(`To free port ${PORT} on Windows, run:`);
        console.error(`  npx kill-port ${PORT}`);
        console.error(`Or stop any other running backend instances.\n`);
      } else {
        console.error('[Server Error]', err.message);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  console.error('[Process Notice] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process Notice] Uncaught Exception:', err.message);
});

startServer();
