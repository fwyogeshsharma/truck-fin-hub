const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'truck-fin-hub.db');
const db = new Database(dbPath);

console.log('Checking notifications...\n');

try {
  // Check if notifications table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'").all();
  console.log('Notifications table exists:', tables.length > 0);

  if (tables.length > 0) {
    // Get notification count
    const count = db.prepare('SELECT COUNT(*) as count FROM notifications').get();
    console.log('Total notifications:', count.count);

    // Get all notifications
    const notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10').all();
    console.log('\nRecent notifications:');
    notifications.forEach(notif => {
      console.log(`- [${notif.type}] ${notif.title} (User: ${notif.user_id}, Read: ${notif.read})`);
    });
  }

  // Check users with lender role
  const lenders = db.prepare("SELECT id, name, role FROM users WHERE role = 'lender'").all();
  console.log('\n\nLenders in database:', lenders.length);
  lenders.forEach(lender => {
    console.log(`- ${lender.name} (${lender.id})`);
  });

  // Check recent trips
  const recentTrips = db.prepare('SELECT id, origin, destination, status, created_at FROM trips ORDER BY created_at DESC LIMIT 5').all();
  console.log('\n\nRecent trips:', recentTrips.length);
  recentTrips.forEach(trip => {
    console.log(`- ${trip.origin} → ${trip.destination} (Status: ${trip.status})`);
  });

} catch (error) {
  console.error('Error:', error);
}

db.close();
