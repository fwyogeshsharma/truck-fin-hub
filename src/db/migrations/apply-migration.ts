import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../../data/truck-fin-hub.db');

const db = new Database(DB_PATH);

try {
  console.log('Applying migration: add_terms_columns');

  // Check if columns exist
  const columns = db.prepare("PRAGMA table_info(users)").all() as any[];
  const hasTermsAccepted = columns.some(col => col.name === 'terms_accepted');

  if (!hasTermsAccepted) {
    db.exec(`ALTER TABLE users ADD COLUMN terms_accepted INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE users ADD COLUMN terms_accepted_at TEXT`);
    console.log('✅ Added terms_accepted and terms_accepted_at columns to users table');
  } else {
    console.log('✅ Columns already exist, skipping migration');
  }

  db.close();
  console.log('Migration completed successfully');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}
