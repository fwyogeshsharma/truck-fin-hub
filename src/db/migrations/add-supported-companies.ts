import { getDatabase } from '../database.js';
import { companyDatabase } from '../../data/companyInfo.js';

/**
 * Migration to add all supported companies from companyInfo.ts as load_owners
 */
export const addSupportedCompanies = async () => {
  const db = await getDatabase();

  console.log('Starting migration: Adding supported companies as load_owners...');

  let added = 0;
  let skipped = 0;

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
      console.error(`  ❌ Error adding ${company.name}:`, error.message);
    }
  }

  console.log(`\n✨ Migration completed!`);
  console.log(`   Added: ${added} companies`);
  console.log(`   Skipped: ${skipped} companies (already existed)`);
  console.log(`\nSupported companies are now available as load_owners for bulk trip creation.`);
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addSupportedCompanies()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
