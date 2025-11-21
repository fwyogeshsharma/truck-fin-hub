import { getDatabase } from '../src/db/database.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration030() {
  try {
    console.log('Starting migration 030...');
    const db = await getDatabase();

    // Read the migration file
    const migrationPath = path.join(__dirname, '../src/db/migrations/030_add_reconciliation_claims.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration SQL...');
    await db.query(migrationSQL);

    console.log('Migration 030 completed successfully!');

    // Verify columns were created
    const columnCheck = await db.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_name = 'reconciliations'
       AND column_name IN (
         'claim_requested', 'claim_requested_at', 'claim_amount',
         'lender_id', 'lender_name', 'lender_claim_amount',
         'transporter_claim_amount', 'lender_approved', 'lender_approved_at',
         'payment_notification_sent', 'payment_notification_message'
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

runMigration030();
