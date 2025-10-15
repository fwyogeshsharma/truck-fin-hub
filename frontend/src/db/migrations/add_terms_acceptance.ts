/**
 * Migration: Add terms acceptance fields to users table
 * Date: 2025-10-07
 */

import { getDatabase } from '../database.js';

export const runMigration = () => {
  const db = getDatabase();

  console.log('🔄 Running migration: Add terms acceptance fields...');

  try {
    // Check if columns already exist
    const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
    const hasTermsAccepted = tableInfo.some((col: any) => col.name === 'terms_accepted');
    const hasTermsAcceptedAt = tableInfo.some((col: any) => col.name === 'terms_accepted_at');

    if (!hasTermsAccepted) {
      console.log('  Adding terms_accepted column...');
      db.exec('ALTER TABLE users ADD COLUMN terms_accepted INTEGER DEFAULT 0');
      console.log('  ✅ terms_accepted column added');
    } else {
      console.log('  ⏭️  terms_accepted column already exists');
    }

    if (!hasTermsAcceptedAt) {
      console.log('  Adding terms_accepted_at column...');
      db.exec('ALTER TABLE users ADD COLUMN terms_accepted_at TEXT');
      console.log('  ✅ terms_accepted_at column added');
    } else {
      console.log('  ⏭️  terms_accepted_at column already exists');
    }

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  runMigration();
  process.exit(0);
}
