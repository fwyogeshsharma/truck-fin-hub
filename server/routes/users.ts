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
  getPendingUserApprovals,
  approveUser,
  rejectUser,
} from '../../src/db/queries/users.ts';

const router = Router();

// GET /api/users - Get all users or filter by role
router.get('/', async (req: Request, res: Response) => {
  try {
    const { role } = req.query;

    let users;
    if (role) {
      users = await getUsersByRole(role as any);
    } else {
      users = await getAllUsers();
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
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.params.id);
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
router.get('/email/:email', async (req: Request, res: Response) => {
  try {
    const user = await getUserByEmail(req.params.email);
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
router.get('/userId/:userId', async (req: Request, res: Response) => {
  try {
    const user = await getUserByUserId(req.params.userId);
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
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = await createUser(req.body);

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
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const user = await updateUser(req.params.id, req.body);
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

// PUT /api/users/:id/make-admin - Make user an admin for a company
router.put('/:id/make-admin', async (req: Request, res: Response) => {
  try {
    const { company, company_id } = req.body;

    // Prefer company_id, fall back to company for backward compatibility
    if (!company_id && !company) {
      return res.status(400).json({ error: 'Company ID or company name is required' });
    }

    // Update user: set is_admin to true and assign company
    const user = await updateUser(req.params.id, {
      is_admin: true,
      company_id: company_id || undefined,
      company: company || undefined,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password hash
    const { password_hash, ...sanitizedUser } = user;
    res.json({
      message: 'User successfully promoted to admin',
      user: sanitizedUser,
    });
  } catch (error: any) {
    console.error('Make admin error:', error);
    res.status(500).json({ error: 'Failed to make user admin', message: error.message });
  }
});

// PUT /api/users/:id/remove-admin - Remove admin privileges from user
router.put('/:id/remove-admin', async (req: Request, res: Response) => {
  try {
    // Update user: set is_admin to false
    const user = await updateUser(req.params.id, {
      is_admin: false,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password hash
    const { password_hash, ...sanitizedUser } = user;
    res.json({
      message: 'Admin privileges removed successfully',
      user: sanitizedUser,
    });
  } catch (error: any) {
    console.error('Remove admin error:', error);
    res.status(500).json({ error: 'Failed to remove admin privileges', message: error.message });
  }
});

// PUT /api/users/:id/password - Update password
router.put('/:id/password', async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const updated = await updatePassword(req.params.id, newPassword);
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
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user', message: error.message });
  }
});

// GET /api/users/pending-approvals - Get pending user approvals
router.get('/pending-approvals', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    const pendingUsers = await getPendingUserApprovals(companyId as string);

    // Remove password hashes from response
    const sanitizedUsers = pendingUsers.map(user => {
      const { password_hash, ...rest } = user;
      return rest;
    });

    res.json(sanitizedUsers);
  } catch (error: any) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Failed to get pending approvals', message: error.message });
  }
});

// PUT /api/users/:id/approve - Approve a user
router.put('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { approvedBy } = req.body;

    if (!approvedBy) {
      return res.status(400).json({ error: 'Approver ID is required' });
    }

    const user = await approveUser(req.params.id, approvedBy);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password hash
    const { password_hash, ...sanitizedUser } = user;
    res.json({
      message: 'User approved successfully',
      user: sanitizedUser,
    });
  } catch (error: any) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user', message: error.message });
  }
});

// PUT /api/users/:id/reject - Reject a user
router.put('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { rejectedBy, reason } = req.body;

    if (!rejectedBy) {
      return res.status(400).json({ error: 'Rejecter ID is required' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const user = await rejectUser(req.params.id, rejectedBy, reason);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password hash
    const { password_hash, ...sanitizedUser } = user;
    res.json({
      message: 'User rejected successfully',
      user: sanitizedUser,
    });
  } catch (error: any) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Failed to reject user', message: error.message });
  }
});

export default router;
