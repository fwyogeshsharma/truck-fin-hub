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

export default router;
