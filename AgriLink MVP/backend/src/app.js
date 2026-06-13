import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import config from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import listingsRoutes from './routes/listings.routes.js';
import offersRoutes from './routes/offers.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import storageRoutes from './routes/storage.routes.js';
import bookingsRoutes from './routes/bookings.routes.js';
import ratingsRoutes from './routes/ratings.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import matchingRoutes from './routes/matching.routes.js';
import requirementsRoutes from './routes/requirements.routes.js';
import reportsRoutes from './routes/reports.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:8080'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/requirements', requirementsRoutes);
app.use('/api/reports', reportsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(config.port, () => {
    console.log(`\n🌾 AgriLink API running on http://localhost:${config.port}`);
    console.log(`📡 API Base: http://localhost:${config.port}/api`);
    console.log(`🖥️  Frontend: http://localhost:${config.port}\n`);
  });
};

startServer();

export default app;
