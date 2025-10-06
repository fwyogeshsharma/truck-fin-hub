import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  createUser,
  verifyPassword,
  getUserByEmail,
  updateUser
} from '../../src/db/queries/users.ts';
import { getWallet } from '../../src/db/queries/wallets.ts';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = verifyPassword(email, password);
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
    const wallet = getWallet(user.id);

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

    const user = createUser({
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
    const wallet = getWallet(user.id);

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

    const user = updateUser(userId, {
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

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = getUserByEmail(decoded.email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const wallet = getWallet(user.id);

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
      wallet,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
