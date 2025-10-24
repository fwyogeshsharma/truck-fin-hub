import { Router, Request, Response } from 'express';
import {
  getAllThemeSettings,
  getThemeColors,
  getThemeSetting,
  updateThemeSetting,
  updateThemeColors,
} from '../../src/db/queries/theme_settings.js';

const router = Router();

// GET /api/theme - Get all theme colors (public endpoint)
router.get('/', async (req: Request, res: Response) => {
  try {
    const colors = await getThemeColors();
    res.json(colors);
  } catch (error: any) {
    console.error('Get theme colors error:', error);
    res.status(500).json({ error: 'Failed to get theme colors', message: error.message });
  }
});

// GET /api/theme/settings - Get all theme settings
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await getAllThemeSettings();
    res.json(settings);
  } catch (error: any) {
    console.error('Get theme settings error:', error);
    res.status(500).json({ error: 'Failed to get theme settings', message: error.message });
  }
});

// GET /api/theme/:key - Get a specific theme setting
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const value = await getThemeSetting(key);

    if (!value) {
      return res.status(404).json({ error: 'Theme setting not found' });
    }

    res.json({ key, value });
  } catch (error: any) {
    console.error('Get theme setting error:', error);
    res.status(500).json({ error: 'Failed to get theme setting', message: error.message });
  }
});

// PUT /api/theme - Update theme colors (super admin only)
router.put('/', async (req: Request, res: Response) => {
  try {
    const { primary_color, primary_color_dark, secondary_color, accent_color, updated_by } = req.body;

    if (!updated_by) {
      return res.status(400).json({ error: 'updated_by is required' });
    }

    const updates: any = {};
    if (primary_color) updates.primary_color = primary_color;
    if (primary_color_dark) updates.primary_color_dark = primary_color_dark;
    if (secondary_color) updates.secondary_color = secondary_color;
    if (accent_color) updates.accent_color = accent_color;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'At least one color must be provided' });
    }

    const colors = await updateThemeColors(updates, updated_by);

    res.json({
      message: 'Theme colors updated successfully',
      colors,
    });
  } catch (error: any) {
    console.error('Update theme colors error:', error);
    res.status(500).json({ error: 'Failed to update theme colors', message: error.message });
  }
});

// PUT /api/theme/:key - Update a specific theme setting (super admin only)
router.put('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value, updated_by } = req.body;

    if (!value || !updated_by) {
      return res.status(400).json({ error: 'value and updated_by are required' });
    }

    const setting = await updateThemeSetting(key, value, updated_by);

    res.json({
      message: 'Theme setting updated successfully',
      setting,
    });
  } catch (error: any) {
    console.error('Update theme setting error:', error);
    res.status(500).json({ error: 'Failed to update theme setting', message: error.message });
  }
});

export default router;
