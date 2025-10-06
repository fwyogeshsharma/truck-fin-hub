import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'truck-fin-hub.db');

const db = new Database(DB_PATH);

console.log('🔄 Running migration to add trip_bids table...');

try {
  // Check if table exists
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='trip_bids'").get();

  if (tableCheck) {
    console.log('✅ trip_bids table already exists');
  } else {
    // Create trip_bids table
    db.exec(`
      CREATE TABLE IF NOT EXISTS trip_bids (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        lender_id TEXT NOT NULL,
        lender_name TEXT NOT NULL,
        amount REAL NOT NULL,
        interest_rate REAL NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
        FOREIGN KEY (lender_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_trip_bids_trip ON trip_bids(trip_id);
      CREATE INDEX IF NOT EXISTS idx_trip_bids_lender ON trip_bids(lender_id);
    `);

    console.log('✅ trip_bids table created successfully');
  }

  // Check if trip_documents table exists
  const docTableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='trip_documents'").get();

  if (docTableCheck) {
    console.log('✅ trip_documents table already exists');
  } else {
    // Create trip_documents table
    db.exec(`
      CREATE TABLE IF NOT EXISTS trip_documents (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        document_type TEXT NOT NULL CHECK(document_type IN ('bilty', 'ewaybill', 'invoice')),
        document_data TEXT NOT NULL,
        uploaded_at TEXT DEFAULT (datetime('now')),
        uploaded_by TEXT NOT NULL,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_trip_documents_trip ON trip_documents(trip_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_trip_documents_type ON trip_documents(trip_id, document_type);
    `);

    console.log('✅ trip_documents table created successfully');
  }

  console.log('🎉 Migration completed successfully');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
