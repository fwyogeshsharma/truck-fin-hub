const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'truck-fin-hub.db');

console.log('Fixing trip columns...');

try {
  const db = new Database(DB_PATH);

  // SQLite doesn't support ALTER COLUMN type, so we need to recreate the table
  console.log('Creating temporary trips table with correct column types...');

  db.exec(`
    -- Create new table with correct types
    CREATE TABLE trips_new (
      id TEXT PRIMARY KEY,
      load_owner_id TEXT NOT NULL,
      load_owner_name TEXT NOT NULL,
      load_owner_logo TEXT,
      load_owner_rating REAL,
      client_company TEXT,
      client_logo TEXT,
      transporter_id TEXT,
      transporter_name TEXT,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      distance REAL NOT NULL,
      load_type TEXT NOT NULL,
      weight REAL NOT NULL,
      amount REAL NOT NULL CHECK(amount >= 20000 AND amount <= 80000),
      interest_rate REAL,
      maturity_days INTEGER,
      risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high')),
      insurance_status INTEGER DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('pending', 'escrowed', 'funded', 'in_transit', 'completed', 'cancelled')) DEFAULT 'pending',
      lender_id TEXT,
      lender_name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      funded_at TEXT,
      completed_at TEXT,
      FOREIGN KEY (load_owner_id) REFERENCES users(id),
      FOREIGN KEY (transporter_id) REFERENCES users(id),
      FOREIGN KEY (lender_id) REFERENCES users(id)
    );

    -- Copy data from old table to new table
    INSERT INTO trips_new SELECT * FROM trips;

    -- Drop old table
    DROP TABLE trips;

    -- Rename new table to trips
    ALTER TABLE trips_new RENAME TO trips;

    -- Recreate indexes
    CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
    CREATE INDEX IF NOT EXISTS idx_trips_load_owner ON trips(load_owner_id);
    CREATE INDEX IF NOT EXISTS idx_trips_lender ON trips(lender_id);
    CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at);
  `);

  console.log('✅ Trip columns fixed successfully!');

  db.close();
} catch (error) {
  console.error('❌ Error fixing trip columns:', error);
  process.exit(1);
}
