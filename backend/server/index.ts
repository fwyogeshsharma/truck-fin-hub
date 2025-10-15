import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { initDatabase } from '../db/database.ts';
import { swaggerSpec } from './config/swagger.ts';

// Import API routes
import authRoutes from './routes/auth.ts';
import userRoutes from './routes/users.ts';
import tripRoutes from './routes/trips.ts';
import investmentRoutes from './routes/investments.ts';
import walletRoutes from './routes/wallets.ts';
import transactionRoutes from './routes/transactions.ts';
import bankAccountRoutes from './routes/bankAccounts.ts';
import kycRoutes from './routes/kyc.ts';
import notificationRoutes from './routes/notifications.ts';
import publicApiRoutes from './routes/publicApi.ts';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Truck Fin Hub - API Documentation',
}));

// Swagger JSON
app.get('/api/docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/notifications', notificationRoutes);

// Public API Routes (no authentication required on route level - handled by middleware)
app.use('/api/public', publicApiRoutes);

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
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🔐 Public API: http://localhost:${PORT}/api/public/shippers/trips`);
  console.log(`🗄️  Database initialized successfully\n`);
});

export default app;

