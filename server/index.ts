import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { initDatabase } from '../src/db/database.ts';

// Import API routes
import authRoutes from './routes/auth.ts';
import userRoutes from './routes/users.ts';
import companyRoutes from './routes/companies.ts';
import tripRoutes from './routes/trips.ts';
import investmentRoutes from './routes/investments.ts';
import walletRoutes from './routes/wallets.ts';
import transactionRoutes from './routes/transactions.ts';
import transactionRequestRoutes from './routes/transaction_requests.ts';
import bankAccountRoutes from './routes/bankAccounts.ts';
import kycRoutes from './routes/kyc.ts';
import notificationRoutes from './routes/notifications.ts';
import migrationRoutes from './routes/migrations.ts';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:8080',
      'http://localhost:3000',
      'http://34.31.185.19',
      'http://34.31.185.19:8080',
      'https://*.netlify.app'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Check if origin matches allowed origins or wildcard patterns
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace(/\*/g, '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowedOrigin === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow anyway for now, log for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Token']
}));

app.use(express.json({ limit: '50mb' })); // For document uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize database
console.log('Initializing PostgreSQL database...');
await initDatabase();
console.log('PostgreSQL Database initialized successfully');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transaction-requests', transactionRequestRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/migrations', migrationRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server is running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
  console.log(`🗄️  Database initialized successfully\n`);
});

export default app;

