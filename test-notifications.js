import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres123@localhost:5432/logifin'
});

async function testNotifications() {
  try {
    console.log('=== Testing Notification System ===\n');

    // Step 1: Check if notifications table exists
    console.log('1. Checking if notifications table exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
      );
    `);
    console.log('Notifications table exists:', tableCheck.rows[0].exists);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Notifications table does not exist!');
      console.log('Run the schema creation script first.');
      return;
    }

    // Step 2: Check table structure
    console.log('\n2. Checking notifications table structure...');
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position;
    `);
    console.log('Columns:');
    columnsCheck.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // Step 3: Count existing notifications
    console.log('\n3. Checking existing notifications...');
    const countResult = await pool.query('SELECT COUNT(*) as count FROM notifications');
    console.log(`Total notifications in database: ${countResult.rows[0].count}`);

    // Step 4: Get all users
    console.log('\n4. Getting users...');
    const usersResult = await pool.query('SELECT id, name, role FROM users LIMIT 5');
    console.log(`Found ${usersResult.rows.length} users (showing first 5):`);
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.id}: ${user.name} (${user.role})`);
    });

    if (usersResult.rows.length === 0) {
      console.log('❌ No users found in database!');
      return;
    }

    const testUserId = usersResult.rows[0].id;

    // Step 5: Check notifications for first user
    console.log(`\n5. Checking notifications for user: ${testUserId}`);
    const userNotifsResult = await pool.query(`
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [testUserId]);
    console.log(`Found ${userNotifsResult.rows.length} notifications for user ${testUserId}:`);
    userNotifsResult.rows.forEach(notif => {
      console.log(`  - [${notif.type}] ${notif.title} (read: ${notif.read})`);
    });

    // Step 6: Create a test notification
    console.log(`\n6. Creating a test notification for user: ${testUserId}`);
    const testId = `notif_test_${Date.now()}`;
    await pool.query(`
      INSERT INTO notifications (
        id, user_id, type, title, message, priority, read, link, action_url, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7, $8, $9)
    `, [
      testId,
      testUserId,
      'test',
      'Test Notification',
      'This is a test notification created by the test script',
      'high',
      null,
      null,
      null
    ]);
    console.log('✅ Test notification created with ID:', testId);

    // Step 7: Verify the notification was created
    console.log('\n7. Verifying notification creation...');
    const verifyResult = await pool.query(
      'SELECT * FROM notifications WHERE id = $1',
      [testId]
    );
    if (verifyResult.rows.length > 0) {
      console.log('✅ Notification verified in database:');
      console.log(JSON.stringify(verifyResult.rows[0], null, 2));
    } else {
      console.log('❌ Notification not found after creation!');
    }

    // Step 8: Test the API endpoint (if server is running)
    console.log('\n8. Testing API endpoint...');
    console.log(`To test the API, make a GET request to:`);
    console.log(`  curl http://localhost:3001/api/notifications/${testUserId}`);
    console.log(`Or on production:`);
    console.log(`  curl https://34.93.247.3/api/notifications/${testUserId}`);

    console.log('\n=== Test Complete ===');
    console.log('Next steps:');
    console.log('1. Check if the server is running');
    console.log('2. Test the API endpoint with curl');
    console.log('3. Check browser console for any errors');
    console.log('4. Check server logs for notification creation/fetch logs');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await pool.end();
  }
}

testNotifications();
