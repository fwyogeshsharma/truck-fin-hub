const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'truck-fin-hub.db');
const db = new Database(dbPath);

console.log('Updating notifications table schema...\n');

try {
  // Check if columns exist
  const tableInfo = db.prepare("PRAGMA table_info(notifications)").all();
  const columnNames = tableInfo.map(col => col.name);

  console.log('Current columns:', columnNames.join(', '));

  // Add missing columns if they don't exist
  if (!columnNames.includes('priority')) {
    console.log('Adding priority column...');
    db.prepare("ALTER TABLE notifications ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'").run();
  }

  if (!columnNames.includes('action_url')) {
    console.log('Adding action_url column...');
    db.prepare("ALTER TABLE notifications ADD COLUMN action_url TEXT").run();
  }

  if (!columnNames.includes('metadata')) {
    console.log('Adding metadata column...');
    db.prepare("ALTER TABLE notifications ADD COLUMN metadata TEXT").run();
  }

  if (!columnNames.includes('read_at')) {
    console.log('Adding read_at column...');
    db.prepare("ALTER TABLE notifications ADD COLUMN read_at TEXT").run();
  }

  // Rename 'link' to match our new schema (if it exists and action_url doesn't)
  if (columnNames.includes('link') && !columnNames.includes('action_url')) {
    console.log('Note: link column exists, will use it as action_url');
  }

  console.log('\n✓ Schema update completed!');

  // Show updated schema
  const updatedInfo = db.prepare("PRAGMA table_info(notifications)").all();
  console.log('\nUpdated columns:', updatedInfo.map(col => col.name).join(', '));

} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}

db.close();
