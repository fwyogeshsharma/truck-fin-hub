// Script to run migration 011 - Insert admin users
import { initDatabase, getDatabase } from '../src/db/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Initializing database connection...');
    await initDatabase();
    const db = getDatabase();

    console.log('📖 Reading migration file...');
    const migrationPath = path.join(__dirname, '../src/db/migrations/011_insert_admin_users.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Running migration 011_insert_admin_users...');
    await db.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('\nAdmin users inserted:');
    console.log('- Super Admin: alok@faberwork.com (ID: super_admin_001)');
    console.log('- Admin: admin@truckfin.com (ID: admin_001)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
