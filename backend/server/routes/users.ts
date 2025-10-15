import { Router, Request, Response } from 'express';
import {
  getAllUsers,
  getUserById,
  getUserByEmail,
  getUserByUserId,
  getUsersByRole,
  createUser,
  updateUser,
  deleteUser,
  updatePassword,
} from '../../src/db/queries/users.ts';

const router = Router();

// GET /api/users - Get all users or filter by role
router.get('/', (req: Request, res: Response) => {
  try {
    const { role } = req.query;

    let users;
    if (role) {
      users = getUsersByRole(role as any);
    } else {
      users = getAllUsers();
    }

    // Remove password hashes from response
    const sanitizedUsers = users.map(user => {
      const { password_hash, ...rest } = user;
      return rest;
    });

    res.json(sanitizedUsers);
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users', message: error.message });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const user = getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password hash
    const { password_hash, ...sanitizedUser } = user;
    res.json(sanitizedUser);
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user', message: error.message });
  }
});

// GET /api/users/email/:email - Get user by email
router.get('/email/:email', (req: Request, res: Response) => {
  try {
    const user = getUserByEmail(req.params.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password hash
    const { password_hash, ...sanitizedUser } = user;
    res.json(sanitizedUser);
  } catch (error: any) {
    console.error('Get user by email error:', error);
    res.status(500).json({ error: 'Failed to get user', message: error.message });
  }
});

// GET /api/users/userId/:userId - Get user by userId
router.get('/userId/:userId', (req: Request, res: Response) => {
  try {
    const user = getUserByUserId(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password hash
    const { password_hash, ...sanitizedUser } = user;
    res.json(sanitizedUser);
  } catch (error: any) {
    console.error('Get user by userId error:', error);
    res.status(500).json({ error: 'Failed to get user', message: error.message });
  }
});

// POST /api/users - Create new user
router.post('/', (req: Request, res: Response) => {
  try {
    const user = createUser(req.body);

    // Remove password hash
    const { password_hash, ...sanitizedUser } = user;
    res.status(201).json(sanitizedUser);
  } catch (error: any) {
    console.error('Create user error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create user', message: error.message });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', (req: Request, res: Response) => {
  try {
    const user = updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password hash
    const { password_hash, ...sanitizedUser } = user;
    res.json(sanitizedUser);
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user', message: error.message });
  }
});

// PUT /api/users/:id/password - Update password
router.put('/:id/password', (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const updated = updatePassword(req.params.id, newPassword);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password', message: error.message });
  }
});

// DELETE /api/users/:id - Soft delete user
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const deleted = deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user', message: error.message });
  }
});

export default router;
