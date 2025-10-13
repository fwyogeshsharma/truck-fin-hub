const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'truck-fin-hub.db');
const db = new Database(dbPath);

console.log('Checking notifications table schema...\n');

try {
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='notifications'").get();
  console.log('Notifications table schema:');
  console.log(schema.sql);
} catch (error) {
  console.error('Error:', error);
}

db.close();
