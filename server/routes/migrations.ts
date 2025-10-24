import { Router, Request, Response } from 'express';
import { getDatabase } from '../../src/db/database.js';
import { companyDatabase } from '../../src/data/companyInfo.js';

const router = Router();

// POST /api/migrations/add-supported-companies - Add all supported companies as load_owners
router.post('/add-supported-companies', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();

    console.log('Starting migration: Adding supported companies as load_owners...');

    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const [key, company] of Object.entries(companyDatabase)) {
      try {
        // Check if company already exists
        const existing = await db.query(
          'SELECT id FROM users WHERE company ILIKE $1 OR name ILIKE $1',
          [company.name]
        );

        if (existing.rows.length > 0) {
          console.log(`  ⏭️  Skipped: ${company.name} (already exists)`);
          skipped++;
          continue;
        }

        // Generate ID and user_id
        const id = `company-${key.toLowerCase().replace(/\s+/g, '-')}`;
        const userId = `COMP${Date.now().toString().slice(-6)}`;

        // Create email and phone from company name
        const emailDomain = company.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const email = `contact@${emailDomain}.com`;
        const phone = `${9000000000 + added}`;

        // Insert company as load_owner
        await db.query(`
          INSERT INTO users (
            id, user_id, email, phone, name, password_hash, role, company,
            company_logo, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
        `, [
          id,
          userId,
          email,
          phone,
          company.name,
          '$2a$10$defaulthashforcompanies', // Placeholder hash
          'load_owner',
          company.name,
          company.logo || null
        ]);

        console.log(`  ✅ Added: ${company.name}`);
        added++;
      } catch (error: any) {
        const errorMsg = `Error adding ${company.name}: ${error.message}`;
        console.error(`  ❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`\n✨ Migration completed!`);
    console.log(`   Added: ${added} companies`);
    console.log(`   Skipped: ${skipped} companies (already existed)`);

    res.json({
      success: true,
      message: 'Migration completed successfully',
      added,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      totalCompanies: Object.keys(companyDatabase).length
    });
  } catch (error: any) {
    console.error('Migration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message
    });
  }
});

// POST /api/migrations/add-user-approval-columns - Add approval columns to users table
router.post('/add-user-approval-columns', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();

    console.log('Starting migration: Adding user approval columns...');

    // Check if columns already exist by trying to select them
    try {
      await db.query('SELECT approval_status, company_id, approved_by, approved_at, rejection_reason FROM users LIMIT 1');
      console.log('Columns already exist, skipping migration');
      return res.json({
        success: true,
        message: 'Columns already exist, no migration needed',
        alreadyExists: true
      });
    } catch (error) {
      // Columns don't exist, proceed with migration
      console.log('Columns do not exist, proceeding with migration...');
    }

    // Add the columns
    const alterQueries = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT`,
    ];

    // Add CHECK constraint separately (PostgreSQL doesn't allow CHECK in ADD COLUMN IF NOT EXISTS)
    const checkConstraintQuery = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'users_approval_status_check'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_approval_status_check
          CHECK(approval_status IN ('approved', 'pending', 'rejected'));
        END IF;
      END $$;
    `;

    for (const query of alterQueries) {
      try {
        await db.query(query);
        console.log(`  ✅ Executed: ${query.substring(0, 60)}...`);
      } catch (error: any) {
        console.error(`  ❌ Failed: ${error.message}`);
        // Continue even if one fails (might already exist)
      }
    }

    // Add CHECK constraint
    try {
      await db.query(checkConstraintQuery);
      console.log('  ✅ Added CHECK constraint for approval_status');
    } catch (error: any) {
      console.error(`  ❌ Failed to add CHECK constraint: ${error.message}`);
    }

    // Add indexes
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status)`,
      `CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id)`,
    ];

    for (const query of indexQueries) {
      try {
        await db.query(query);
        console.log(`  ✅ Created index: ${query.substring(0, 60)}...`);
      } catch (error: any) {
        console.error(`  ❌ Failed to create index: ${error.message}`);
      }
    }

    console.log('\n✨ Migration completed successfully!');

    res.json({
      success: true,
      message: 'User approval columns added successfully',
    });
  } catch (error: any) {
    console.error('Migration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message
    });
  }
});

// GET /api/migrations/check-user-columns - Check if user columns exist
router.get('/check-user-columns', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();

    // Get all columns from users table
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    const columns = result.rows.map(row => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable,
      default: row.column_default
    }));

    // Check specifically for the approval columns
    const requiredColumns = ['company_id', 'approval_status', 'approved_by', 'approved_at', 'rejection_reason'];
    const missingColumns = requiredColumns.filter(
      col => !columns.find(c => c.name === col)
    );

    res.json({
      success: true,
      columns,
      requiredColumns: {
        present: requiredColumns.filter(col => columns.find(c => c.name === col)),
        missing: missingColumns
      },
      allPresent: missingColumns.length === 0
    });
  } catch (error: any) {
    console.error('Check columns failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check columns',
      message: error.message
    });
  }
});

// POST /api/migrations/set-company-admin - Set a user as company admin
router.post('/set-company-admin', async (req: Request, res: Response) => {
  try {
    const { userId, companyId } = req.body;

    if (!userId || !companyId) {
      return res.status(400).json({
        success: false,
        error: 'userId and companyId are required'
      });
    }

    const db = await getDatabase();

    // Get the company details
    const companyResult = await db.query(
      'SELECT id, name FROM companies WHERE id = $1',
      [companyId]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Company with ID ${companyId} not found`
      });
    }

    const company = companyResult.rows[0];

    // Update the user to be a company admin
    const updateResult = await db.query(
      `UPDATE users
       SET is_admin = TRUE,
           company_id = $1,
           company = $2,
           approval_status = 'approved'
       WHERE id = $3
       RETURNING id, name, email, company, company_id, is_admin`,
      [companyId, company.name, userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `User with ID ${userId} not found`
      });
    }

    const updatedUser = updateResult.rows[0];

    console.log('✅ User set as company admin:', {
      userId: updatedUser.id,
      name: updatedUser.name,
      company: updatedUser.company,
      company_id: updatedUser.company_id,
      is_admin: updatedUser.is_admin
    });

    res.json({
      success: true,
      message: `User ${updatedUser.name} is now a company admin for ${company.name}`,
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Set company admin failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set company admin',
      message: error.message
    });
  }
});

// GET /api/migrations/list-users - List all users with their admin status
router.get('/list-users', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();

    const result = await db.query(`
      SELECT id, user_id, name, email, role, company, company_id, is_admin, approval_status
      FROM users
      WHERE role != 'super_admin' AND role != 'admin'
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      users: result.rows
    });
  } catch (error: any) {
    console.error('List users failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list users',
      message: error.message
    });
  }
});

// POST /api/migrations/create-theme-settings-table - Create theme_settings table
router.post('/create-theme-settings-table', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();

    console.log('Starting migration: Creating theme_settings table...');

    // Check if table already exists
    const tableCheck = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'theme_settings'"
    );

    if (tableCheck.rows.length > 0) {
      console.log('Table already exists, skipping migration');
      return res.json({
        success: true,
        message: 'Table already exists, no migration needed',
        alreadyExists: true
      });
    }

    // Create the table
    await db.query(`
      CREATE TABLE IF NOT EXISTS theme_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(255)
      )
    `);
    console.log('  ✅ Created theme_settings table');

    // Insert default theme colors
    await db.query(`
      INSERT INTO theme_settings (setting_key, setting_value, updated_by) VALUES
        ('primary_color', '#3b82f6', 'system'),
        ('primary_color_dark', '#2563eb', 'system'),
        ('secondary_color', '#10b981', 'system'),
        ('accent_color', '#f59e0b', 'system')
      ON CONFLICT (setting_key) DO NOTHING
    `);
    console.log('  ✅ Inserted default theme colors');

    // Create index for faster lookups
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_theme_settings_key ON theme_settings(setting_key)
    `);
    console.log('  ✅ Created index on setting_key');

    // Add comment
    await db.query(`
      COMMENT ON TABLE theme_settings IS 'Stores customizable theme colors and settings for the application'
    `);
    console.log('  ✅ Added table comment');

    console.log('\n✨ Migration completed successfully!');

    res.json({
      success: true,
      message: 'Theme settings table created successfully',
    });
  } catch (error: any) {
    console.error('Migration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message
    });
  }
});

export default router;
