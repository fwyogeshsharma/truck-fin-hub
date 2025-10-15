import { Pool } from 'pg';
import Database from 'better-sqlite3';
import * as path from 'path';

const pgPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'logifin',
  user: 'postgres',
  password: 'admin',
});

const sqliteDbPath = path.join(process.cwd(), 'data', 'truck-fin-hub.db');
const sqliteDb = new Database(sqliteDbPath, { readonly: true });

async function migrateNotifications() {
  const pgClient = await pgPool.connect();

  try {
    console.log('📦 Migrating notifications table...');

    // Get all notifications from SQLite
    const notifications = sqliteDb.prepare('SELECT * FROM notifications').all();

    console.log(`  📊 Found ${notifications.length} notifications`);

    if (notifications.length === 0) {
      console.log('  ⚠️  No notifications to migrate');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Insert each notification
    for (const notif of notifications) {
      try {
        // First check if the user exists
        const userCheck = await pgClient.query(
          'SELECT id FROM users WHERE id = $1',
          [notif.user_id]
        );

        if (userCheck.rows.length === 0) {
          skippedCount++;
          console.log(`  ⚠️  Skipping notification ${notif.id} - user ${notif.user_id} does not exist`);
          continue;
        }

        await pgClient.query(
          `INSERT INTO notifications (
            id, user_id, type, title, message, link, read,
            created_at, priority, action_url, metadata, read_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            notif.id,
            notif.user_id,
            notif.type,
            notif.title,
            notif.message,
            notif.link,
            notif.read === 1,
            notif.created_at,
            notif.priority,
            notif.action_url,
            notif.metadata,
            notif.read_at,
          ]
        );
        successCount++;
      } catch (error: any) {
        errorCount++;
        console.error(`  ❌ Error inserting notification ${notif.id}: ${error.message}`);
      }
    }

    console.log(`  ✅ Successfully migrated ${successCount} notifications`);
    if (skippedCount > 0) {
      console.log(`  ⚠️  Skipped ${skippedCount} notifications (orphaned records)`);
    }
    if (errorCount > 0) {
      console.log(`  ⚠️  Failed to migrate ${errorCount} notifications`);
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    pgClient.release();
    sqliteDb.close();
    await pgPool.end();
  }
}

migrateNotifications()
  .then(() => {
    console.log('🎉 Notifications migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
