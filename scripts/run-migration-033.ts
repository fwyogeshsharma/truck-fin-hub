import { initDatabase, getDatabase } from '../src/db/database.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration033() {
  try {
    console.log('Starting migration 033...');

    // Initialize database first
    await initDatabase();
    const db = getDatabase();

    // Read the migration file
    const migrationPath = path.join(__dirname, '../src/db/migrations/033_enhance_reconciliation_workflow.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration SQL...');
    await db.query(migrationSQL);

    console.log('Migration 033 completed successfully!');

    // Verify columns were created
    const columnCheck = await db.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_name = 'reconciliations'
       AND column_name IN (
         'selected_trip_ids', 'transporter_approved', 'transporter_approved_at',
         'bank_request_generated', 'bank_request_generated_at', 'bank_request_message',
         'selected_lender_id', 'selected_lender_name', 'workflow_status'
       )
       ORDER BY column_name`
    );

    console.log('\nVerification - Columns created:');
    console.table(columnCheck.rows);

    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration033();
