import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'logifin',
  user: 'postgres',
  password: 'admin',
});

async function fixNotificationsTable() {
  const client = await pool.connect();

  try {
    console.log('🔧 Fixing notifications table schema...');

    // Add the missing 'link' column
    await client.query(`
      ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS link TEXT;
    `);

    console.log('✅ Added "link" column to notifications table');

    // Reorder columns to match SQLite order (optional, for consistency)
    // PostgreSQL doesn't support reordering columns directly, so we'll just ensure the column exists

  } catch (error: any) {
    console.error('❌ Error fixing notifications table:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixNotificationsTable()
  .then(() => {
    console.log('🎉 Notifications table fixed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to fix notifications table:', error);
    process.exit(1);
  });
