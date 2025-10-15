import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  createUser,
  verifyPassword,
  getUserByEmail,
  updateUser
} from '../../db/queries/users.ts';
import { getWallet } from '../../db/queries/wallets.ts';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Admin credentials (from config)
const ADMIN_CONFIG = {
  superAdmin: {
    username: 'Alok',
    email: 'alok@faberwork.com',
    password: 'faber@123',
    role: 'super_admin',
    id: 'super_admin_001',
  },
  admin: {
    username: 'Admin',
    email: 'admin@truckfin.com',
    password: 'admin@123',
    role: 'admin',
    id: 'admin_001',
  },
};

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check for super admin credentials
    if (email.toLowerCase() === ADMIN_CONFIG.superAdmin.email.toLowerCase() &&
        password === ADMIN_CONFIG.superAdmin.password) {
      const token = jwt.sign(
        { id: ADMIN_CONFIG.superAdmin.id, email: ADMIN_CONFIG.superAdmin.email, role: ADMIN_CONFIG.superAdmin.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        user: {
          id: ADMIN_CONFIG.superAdmin.id,
          userId: ADMIN_CONFIG.superAdmin.id,
          email: ADMIN_CONFIG.superAdmin.email,
          name: ADMIN_CONFIG.superAdmin.username,
          role: ADMIN_CONFIG.superAdmin.role,
        },
        wallet: {
          userId: ADMIN_CONFIG.superAdmin.id,
          balance: 0,
          lockedAmount: 0,
          escrowedAmount: 0,
          totalInvested: 0,
          totalReturns: 0,
        },
        token,
      });
    }

    // Check for admin credentials
    if (email.toLowerCase() === ADMIN_CONFIG.admin.email.toLowerCase() &&
        password === ADMIN_CONFIG.admin.password) {
      const token = jwt.sign(
        { id: ADMIN_CONFIG.admin.id, email: ADMIN_CONFIG.admin.email, role: ADMIN_CONFIG.admin.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        user: {
          id: ADMIN_CONFIG.admin.id,
          userId: ADMIN_CONFIG.admin.id,
          email: ADMIN_CONFIG.admin.email,
          name: ADMIN_CONFIG.admin.username,
          role: ADMIN_CONFIG.admin.role,
        },
        wallet: {
          userId: ADMIN_CONFIG.admin.id,
          balance: 0,
          lockedAmount: 0,
          escrowedAmount: 0,
          totalInvested: 0,
          totalReturns: 0,
        },
        token,
      });
    }

    // Regular user authentication
    const user = await verifyPassword(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Get wallet
    const wallet = await getWallet(user.id);

    res.json({
      user: {
        id: user.id,
        userId: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        companyLogo: user.company_logo,
        userLogo: user.user_logo,
        termsAccepted: user.terms_accepted,
        termsAcceptedAt: user.terms_accepted_at,
      },
      wallet,
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

// Signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name || !phone) {
      return res.status(400).json({ error: 'Email, password, name, and phone are required' });
    }

    // Generate user_id
    const userId = `USR${Date.now().toString().slice(-6)}`;

    const user = await createUser({
      user_id: userId,
      email,
      phone,
      name,
      password,
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Get wallet (auto-created)
    const wallet = await getWallet(user.id);

    res.status(201).json({
      user: {
        id: user.id,
        userId: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        companyLogo: user.company_logo,
        userLogo: user.user_logo,
        termsAccepted: user.terms_accepted,
        termsAcceptedAt: user.terms_accepted_at,
      },
      wallet,
      token,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Signup failed', message: error.message });
  }
});

// Update user role (one-time selection)
router.put('/role', async (req: Request, res: Response) => {
  try {
    const { userId, role, company, companyLogo } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ error: 'User ID and role are required' });
    }

    const user = await updateUser(userId, {
      role,
      company,
      company_logo: companyLogo,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        userId: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        companyLogo: user.company_logo,
        userLogo: user.user_logo,
      },
    });
  } catch (error: any) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Role update failed', message: error.message });
  }
});

// Accept terms and conditions
router.put('/accept-terms', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await updateUser(userId, {
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        userId: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        companyLogo: user.company_logo,
        userLogo: user.user_logo,
        termsAccepted: user.terms_accepted,
        termsAcceptedAt: user.terms_accepted_at,
      },
    });
  } catch (error: any) {
    console.error('Accept terms error:', error);
    res.status(500).json({ error: 'Failed to accept terms', message: error.message });
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check if this is a super admin or admin
    if (decoded.role === 'super_admin') {
      return res.json({
        user: {
          id: ADMIN_CONFIG.superAdmin.id,
          userId: ADMIN_CONFIG.superAdmin.id,
          email: ADMIN_CONFIG.superAdmin.email,
          name: ADMIN_CONFIG.superAdmin.username,
          role: ADMIN_CONFIG.superAdmin.role,
        },
        wallet: {
          userId: ADMIN_CONFIG.superAdmin.id,
          balance: 0,
          lockedAmount: 0,
          escrowedAmount: 0,
          totalInvested: 0,
          totalReturns: 0,
        },
      });
    }

    if (decoded.role === 'admin') {
      return res.json({
        user: {
          id: ADMIN_CONFIG.admin.id,
          userId: ADMIN_CONFIG.admin.id,
          email: ADMIN_CONFIG.admin.email,
          name: ADMIN_CONFIG.admin.username,
          role: ADMIN_CONFIG.admin.role,
        },
        wallet: {
          userId: ADMIN_CONFIG.admin.id,
          balance: 0,
          lockedAmount: 0,
          escrowedAmount: 0,
          totalInvested: 0,
          totalReturns: 0,
        },
      });
    }

    // Regular user
    const user = await getUserByEmail(decoded.email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const wallet = await getWallet(user.id);

    res.json({
      user: {
        id: user.id,
        userId: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        companyLogo: user.company_logo,
        userLogo: user.user_logo,
        termsAccepted: user.terms_accepted,
        termsAcceptedAt: user.terms_accepted_at,
      },
      wallet,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
