import Database from 'better-sqlite3';
import * as path from 'path';

const sqliteDbPath = path.join(process.cwd(), 'data', 'truck-fin-hub.db');
const db = new Database(sqliteDbPath, { readonly: true });

// Get schema for notifications table
const schema = db.prepare("PRAGMA table_info(notifications)").all();

console.log('Notifications table schema:');
console.log(schema);

// Get sample row
const sampleRow = db.prepare("SELECT * FROM notifications LIMIT 1").get();
console.log('\nSample notification row:');
console.log(sampleRow);

db.close();
