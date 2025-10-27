/**
 * Script to apply platform_fees table migration
 * Run with: node apply-platform-fees-migration.js
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'logifin',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function applyMigration() {
  try {
    console.log('📝 Applying platform_fees table migration...\n');

    // Check if table already exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'platform_fees'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Table already exists. Checking structure...');

      // Get column info
      const columnsResult = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'platform_fees'
        ORDER BY ordinal_position;
      `);

      console.log('\n📋 Current columns:');
      columnsResult.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });

      await pool.end();
      return;
    }

    // Read migration file
    const migrationPath = path.join(__dirname, 'src', 'db', 'migrations', '016_create_platform_fees_table.postgres.sql');
    console.log(`📂 Reading migration from: ${migrationPath}`);

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Executing migration...\n');
    await pool.query(migrationSQL);

    console.log('✅ Migration applied successfully!');
    console.log('📊 platform_fees table has been created.\n');

    await pool.end();
  } catch (error) {
    console.error('\n❌ Error applying migration:', error.message);
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.error('\n💡 This error suggests a foreign key constraint failed.');
      console.error('   Make sure the trips and users tables exist first.');
    }
    console.error('\nFull error:', error);
    await pool.end();
    process.exit(1);
  }
}

applyMigration();
