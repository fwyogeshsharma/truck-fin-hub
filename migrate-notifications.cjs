const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'truck-fin-hub.db');
const db = new Database(dbPath);

console.log('Creating notifications table...');

try {
  // Create notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
      read INTEGER DEFAULT 0,
      action_url TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      read_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
  `);

  console.log('✓ Notifications table created successfully');

  // Check if table was created
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'").all();
  console.log('Tables found:', tables);

} catch (error) {
  console.error('Error creating notifications table:', error);
  process.exit(1);
}

db.close();
console.log('Migration completed!');
