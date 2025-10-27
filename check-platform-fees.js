/**
 * Script to check platform_fees table status
 * Run with: node check-platform-fees.js
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'logifin',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function checkPlatformFees() {
  try {
    console.log('🔍 Checking platform_fees table...\n');

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'platform_fees'
      );
    `);

    const tableExists = tableCheck.rows[0].exists;
    console.log(`✅ Table exists: ${tableExists}`);

    if (!tableExists) {
      console.log('\n❌ platform_fees table does NOT exist!');
      console.log('📝 You need to run the migration:');
      console.log('   016_create_platform_fees_table.postgres.sql');
      await pool.end();
      return;
    }

    // Count records
    const countResult = await pool.query('SELECT COUNT(*) FROM platform_fees');
    const count = parseInt(countResult.rows[0].count);
    console.log(`📊 Number of records: ${count}\n`);

    if (count === 0) {
      console.log('⚠️  No platform fee records found.');
      console.log('💡 This could mean:');
      console.log('   1. No loans have been disbursed yet');
      console.log('   2. Platform fee creation is failing silently');
      console.log('   3. Check your server logs for errors during loan allotment\n');
    } else {
      // Show sample records
      const sampleResult = await pool.query('SELECT * FROM platform_fees ORDER BY collected_at DESC LIMIT 5');
      console.log('📋 Latest platform fee records:');
      sampleResult.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. Fee ID: ${row.id}`);
        console.log(`   Trip: ${row.trip_id}`);
        console.log(`   Lender: ${row.lender_name} (${row.lender_id})`);
        console.log(`   Borrower: ${row.borrower_name} (${row.borrower_id})`);
        console.log(`   Loan Amount: ₹${row.loan_amount}`);
        console.log(`   Fee: ${row.fee_percentage}% = ₹${row.fee_amount}`);
        console.log(`   Collected: ${row.collected_at}`);
      });
    }

    await pool.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    await pool.end();
  }
}

checkPlatformFees();
