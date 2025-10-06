# Complete Database Migration Implementation Guide

## 🎯 Overview

This guide provides step-by-step instructions to complete the SQLite database migration for the Truck Finance Hub application.

### ✅ What's Already Done

1. **Database Layer (100% Complete)**
   - SQLite schema with 9 tables
   - Comprehensive query functions
   - Database connection manager
   - Default super admin account
   - Password hashing with bcrypt

2. **Backend Setup (25% Complete)**
   - Express server started
   - Auth route created
   - Dependencies installed

### 🔨 What Needs To Be Done

The remaining work is organized into clear, actionable steps below.

---

## Step 1: Complete Backend API Routes (4-6 hours)

### Create Remaining Route Files

Create these files in `server/routes/`:

#### 1. `server/routes/trips.ts`

```typescript
import { Router, Request, Response } from 'express';
import {
  getAllTrips,
  getTrip,
  getTripsByLoadOwner,
  getTripsByLender,
  getTripsByStatus,
  createTrip,
  updateTrip,
  addBid,
  uploadDocument,
  getTripBids,
} from '../../src/db/queries/trips';

const router = Router();

// GET /api/trips - Get all trips
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, loadOwnerId, lenderId } = req.query;

    let trips;
    if (status) {
      trips = getTripsByStatus(status as any);
    } else if (loadOwnerId) {
      trips = getTripsByLoadOwner(loadOwnerId as string);
    } else if (lenderId) {
      trips = getTripsByLender(lenderId as string);
    } else {
      trips = getAllTrips();
    }

    res.json(trips);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/trips/:id - Get single trip
router.get('/:id', (req: Request, res: Response) => {
  try {
    const trip = getTrip(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(trip);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips - Create trip
router.post('/', (req: Request, res: Response) => {
  try {
    const trip = createTrip(req.body);
    res.status(201).json(trip);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/trips/:id - Update trip
router.put('/:id', (req: Request, res: Response) => {
  try {
    const trip = updateTrip(req.params.id, req.body);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(trip);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips/:id/bids - Add bid
router.post('/:id/bids', (req: Request, res: Response) => {
  try {
    const { lenderId, lenderName, amount, interestRate } = req.body;
    const bid = addBid(req.params.id, lenderId, lenderName, amount, interestRate);
    res.status(201).json(bid);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips/:id/documents - Upload document
router.post('/:id/documents', (req: Request, res: Response) => {
  try {
    const { documentType, documentData, uploadedBy } = req.body;
    const doc = uploadDocument(req.params.id, documentType, documentData, uploadedBy);
    res.status(201).json(doc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

#### 2. `server/routes/wallets.ts`

```typescript
import { Router, Request, Response } from 'express';
import {
  getWallet,
  updateWallet,
  addToBalance,
  deductFromBalance,
  moveToEscrow,
} from '../../src/db/queries/wallets';
import { createTransaction } from '../../src/db/queries/transactions';

const router = Router();

// GET /api/wallets/:userId
router.get('/:userId', (req: Request, res: Response) => {
  try {
    const wallet = getWallet(req.params.userId);
    res.json(wallet);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/wallets/:userId/add-money
router.post('/:userId/add-money', (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const wallet = addToBalance(req.params.userId, amount);

    // Create transaction record
    createTransaction({
      user_id: req.params.userId,
      type: 'credit',
      amount,
      category: 'payment',
      description: `Added money to wallet`,
      balance_after: wallet.balance,
    });

    res.json(wallet);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/wallets/:userId/withdraw
router.post('/:userId/withdraw', (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const wallet = deductFromBalance(req.params.userId, amount);

    // Create transaction record
    createTransaction({
      user_id: req.params.userId,
      type: 'debit',
      amount,
      category: 'withdrawal',
      description: `Withdrawal from wallet`,
      balance_after: wallet.balance,
    });

    res.json(wallet);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

#### 3. `server/routes/investments.ts`
#### 4. `server/routes/transactions.ts`
#### 5. `server/routes/bankAccounts.ts`
#### 6. `server/routes/kyc.ts`
#### 7. `server/routes/users.ts`

*Follow the same pattern as above routes*

---

## Step 2: Update Server Configuration (30 min)

### Update `server/index.ts`

The file is already created. Make sure all routes are imported and mounted correctly.

### Create `server/tsconfig.json`

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "outDir": "../dist/server",
    "rootDir": ".",
    "esModuleInterop": true
  },
  "include": ["./**/*"],
  "exclude": ["node_modules"]
}
```

---

## Step 3: Update Package.json Scripts (15 min)

Update your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:server": "nodemon --watch server --exec ts-node server/index.ts",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:server\"",
    "build": "tsc && vite build",
    "build:server": "tsc --project server/tsconfig.json",
    "preview": "vite preview",
    "start": "node dist/server/index.js"
  }
}
```

---

## Step 4: Create API Client Layer (2-3 hours)

Create `src/api/client.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let authToken: string | null = localStorage.getItem('auth_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const apiClient = {
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': authToken ? `Bearer ${authToken}` : '',
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    return response.json();
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': authToken ? `Bearer ${authToken}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    return response.json();
  },

  async put(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': authToken ? `Bearer ${authToken}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    return response.json();
  },

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authToken ? `Bearer ${authToken}` : '',
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    return response.json();
  },
};
```

Create API service files:
- `src/api/auth.ts`
- `src/api/trips.ts`
- `src/api/wallets.ts`
- etc.

---

## Step 5: Refactor Frontend Code (4-6 hours)

### Update `src/lib/auth.ts`

```typescript
import { apiClient, setAuthToken } from '../api/client';

export interface User {
  id: string;
  userId: string;
  email: string;
  name: string;
  role?: 'load_owner' | 'vehicle_owner' | 'lender' | 'admin' | 'super_admin' | 'load_agent' | 'vehicle_agent';
  company?: string;
  companyLogo?: string;
  userLogo?: string;
}

const AUTH_KEY = 'current_user';

export const auth = {
  getCurrentUser: (): User | null => {
    const userData = localStorage.getItem(AUTH_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  login: async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post('/auth/login', { email, password });
    setAuthToken(response.token);
    localStorage.setItem(AUTH_KEY, JSON.stringify(response.user));
    return response.user;
  },

  signup: async (email: string, password: string, name: string, phone: string): Promise<User> => {
    const response = await apiClient.post('/auth/signup', { email, password, name, phone });
    setAuthToken(response.token);
    localStorage.setItem(AUTH_KEY, JSON.stringify(response.user));
    return response.user;
  },

  logout: () => {
    setAuthToken(null);
    localStorage.removeItem(AUTH_KEY);
  },

  updateUserRole: async (userId: string, role: User['role'], company?: string, companyLogo?: string): Promise<User> => {
    const response = await apiClient.put('/auth/role', { userId, role, company, companyLogo });
    localStorage.setItem(AUTH_KEY, JSON.stringify(response.user));
    return response.user;
  },

  isAuthenticated: (): boolean => {
    return !!auth.getCurrentUser();
  },
};
```

### Update `src/lib/data.ts`

Replace all localStorage calls with API calls using `apiClient`.

---

## Step 6: Create Environment Files (5 min)

Create `.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3001
```

Add to `.gitignore`:
```
.env.local
data/
*.db
```

---

## Step 7: Run and Test (1-2 hours)

### Start Development Servers

```bash
# Terminal 1: Start backend
npm run dev:server

# Terminal 2: Start frontend
npm run dev

# Or run both together
npm run dev:all
```

### Test Checklist

- [ ] Super admin can login (Alok@faberwork.com / Alok12345)
- [ ] New user signup works
- [ ] Role selection works
- [ ] Trips can be created
- [ ] Investments work
- [ ] Wallet operations work
- [ ] Transactions appear correctly
- [ ] KYC submission works

---

## Step 8: Data Migration (Optional, 1 hour)

Create `scripts/migrate.ts`:

```typescript
import { auth } from '../src/lib/auth';
import { data } from '../src/lib/data';
import { apiClient } from '../src/api/client';

async function migrate() {
  console.log('Starting migration...');

  // Migrate trips
  const trips = data.getTrips();
  for (const trip of trips) {
    await apiClient.post('/trips', trip);
  }

  // Migrate investments
  const investments = data.getInvestments();
  for (const investment of investments) {
    await apiClient.post('/investments', investment);
  }

  console.log('Migration complete!');
}

migrate();
```

---

## Quick Start Commands

```bash
# Install dependencies (already done)
npm install

# Start development
npm run dev:all

# Build for production
npm run build && npm run build:server

# Start production server
npm start
```

---

## 🎯 Summary

**Completed:**
- ✅ Database schema (9 tables)
- ✅ Query layer (all CRUD operations)
- ✅ Backend dependencies
- ✅ Auth route
- ✅ Server setup

**To Do:**
- 🔲 Complete remaining API routes (4-6 hours)
- 🔲 Create API client layer (2-3 hours)
- 🔲 Refactor frontend to use APIs (4-6 hours)
- 🔲 Testing and bug fixes (2-3 hours)

**Total Estimated Time:** 12-18 hours

---

## 📝 Notes

- The database is automatically initialized on first server start
- Super admin is auto-created (Email: Alok@faberwork.com, Password: Alok12345)
- Database file location: `./data/truck-fin-hub.db`
- All passwords are hashed with bcrypt
- JWT tokens expire after 7 days

---

**Need Help?** Check the existing code in `src/db/queries/` for reference on database operations.
