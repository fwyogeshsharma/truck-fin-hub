import express, { Request, Response } from 'express';
import cors from 'cors';
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
import themeSettingsRoutes from './routes/theme_settings.ts';
import loanAgreementRoutes from './routes/loanAgreements.ts';
import loanContractTemplateRoutes from './routes/loanContractTemplates.ts';
import platformFeesRoutes from './routes/platformFees.ts';
import ratingsRoutes from './routes/ratings.ts';
import aiSuggestionsRoutes from './routes/ai-suggestions.ts';

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:8080',
      'http://localhost:4000',
      'http://34.93.247.3',
      'https://34.93.247.3',
      'http://34.93.247.3:4000',
      'https://34.93.247.3:4000',
      'http://34.93.247.3:8080',
      'https://tf.rollingradius.com',
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
app.use('/api/theme', themeSettingsRoutes);
app.use('/api/loan-agreements', loanAgreementRoutes);
app.use('/api/loan-contract-templates', loanContractTemplateRoutes);
app.use('/api/platform-fees', platformFeesRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/ai-suggestions', aiSuggestionsRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server is running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
  console.log(`📍 Production: http://34.93.247.3:${PORT}/api`);
  console.log(`🗄️  Database initialized successfully\n`);
});

export default app;

