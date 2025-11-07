import { Router, Request, Response } from 'express';
import {
  getUserThemeSettings,
  createUserThemeSettings,
  updateUserThemeSettings,
  upsertUserThemeSettings,
  deleteUserThemeSettings,
  resetUserThemeSettings,
  CreateUserThemeSettingsInput,
  UpdateUserThemeSettingsInput,
} from '../../src/db/queries/userThemeSettings.ts';

const router = Router();

// GET /api/user-theme-settings/:userId - Get theme settings for a user
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const settings = await getUserThemeSettings(userId);

    if (!settings) {
      // Return default settings if none exist
      return res.json({
        mode: 'light',
        primary_color: '#084570',
        secondary_color: '#1D923C',
        accent_color: '#1D923C',
      });
    }

    res.json(settings);
  } catch (error: any) {
    console.error('Get user theme settings error:', error);
    res.status(500).json({ error: 'Failed to get theme settings', message: error.message });
  }
});

// POST /api/user-theme-settings - Create or update theme settings for a user
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Validate required fields
    const requiredFields = ['user_id', 'mode', 'primary_color', 'secondary_color', 'accent_color'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate mode value
    if (!['light', 'dark', 'system'].includes(body.mode)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'mode must be one of: light, dark, system'
      });
    }

    const input: CreateUserThemeSettingsInput = {
      user_id: body.user_id,
      mode: body.mode,
      primary_color: body.primary_color,
      secondary_color: body.secondary_color,
      accent_color: body.accent_color,
    };

    const settings = await upsertUserThemeSettings(body.user_id, input);

    res.json(settings);
  } catch (error: any) {
    console.error('Upsert user theme settings error:', error);
    res.status(500).json({ error: 'Failed to save theme settings', message: error.message });
  }
});

// PUT /api/user-theme-settings/:userId - Update theme settings for a user
router.put('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const body = req.body;

    // Validate mode value if provided
    if (body.mode && !['light', 'dark', 'system'].includes(body.mode)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'mode must be one of: light, dark, system'
      });
    }

    const input: UpdateUserThemeSettingsInput = {
      mode: body.mode,
      primary_color: body.primary_color,
      secondary_color: body.secondary_color,
      accent_color: body.accent_color,
    };

    const settings = await updateUserThemeSettings(userId, input);

    if (!settings) {
      return res.status(404).json({ error: 'Theme settings not found' });
    }

    res.json(settings);
  } catch (error: any) {
    console.error('Update user theme settings error:', error);
    res.status(500).json({ error: 'Failed to update theme settings', message: error.message });
  }
});

// DELETE /api/user-theme-settings/:userId - Delete theme settings for a user
router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const deleted = await deleteUserThemeSettings(userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Theme settings not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete user theme settings error:', error);
    res.status(500).json({ error: 'Failed to delete theme settings', message: error.message });
  }
});

// POST /api/user-theme-settings/:userId/reset - Reset theme settings to default
router.post('/:userId/reset', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const settings = await resetUserThemeSettings(userId);

    res.json(settings);
  } catch (error: any) {
    console.error('Reset user theme settings error:', error);
    res.status(500).json({ error: 'Failed to reset theme settings', message: error.message });
  }
});

export default router;
