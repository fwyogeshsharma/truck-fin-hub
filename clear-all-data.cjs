// Script to clear ALL data including users
// Run with: node clear-all-data.cjs

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const db = new Database('./data/truck-fin-hub.db');

console.log('🗑️  Clearing ALL data and resetting to initial state...\n');

try {
  // Start transaction
  db.prepare('BEGIN').run();

  // 1. Delete all trip-related data
  console.log('Deleting trip documents...');
  const docsDeleted = db.prepare('DELETE FROM trip_documents').run();
  console.log(`  ✓ Deleted ${docsDeleted.changes} documents`);

  console.log('Deleting trip bids...');
  const bidsDeleted = db.prepare('DELETE FROM trip_bids').run();
  console.log(`  ✓ Deleted ${bidsDeleted.changes} bids`);

  console.log('Deleting investments...');
  const investmentsDeleted = db.prepare('DELETE FROM investments').run();
  console.log(`  ✓ Deleted ${investmentsDeleted.changes} investments`);

  console.log('Deleting trips...');
  const tripsDeleted = db.prepare('DELETE FROM trips').run();
  console.log(`  ✓ Deleted ${tripsDeleted.changes} trips`);

  // 2. Delete transactions
  console.log('Deleting transactions...');
  const transactionsDeleted = db.prepare('DELETE FROM transactions').run();
  console.log(`  ✓ Deleted ${transactionsDeleted.changes} transactions`);

  // 3. Delete bank accounts
  console.log('Deleting bank accounts...');
  const bankAccountsDeleted = db.prepare('DELETE FROM bank_accounts').run();
  console.log(`  ✓ Deleted ${bankAccountsDeleted.changes} bank accounts`);

  // 4. Delete KYC data (if table exists)
  try {
    console.log('Deleting KYC data...');
    const kycDeleted = db.prepare('DELETE FROM kyc').run();
    console.log(`  ✓ Deleted ${kycDeleted.changes} KYC records`);
  } catch (e) {
    console.log('  ℹ KYC table does not exist, skipping...');
  }

  // 5. Delete wallets
  console.log('Deleting wallets...');
  const walletsDeleted = db.prepare('DELETE FROM wallets').run();
  console.log(`  ✓ Deleted ${walletsDeleted.changes} wallets`);

  // 6. Delete users
  console.log('Deleting users...');
  const usersDeleted = db.prepare('DELETE FROM users').run();
  console.log(`  ✓ Deleted ${usersDeleted.changes} users`);

  // 7. Create a default test user
  console.log('\nCreating default test user...');
  const hashedPassword = bcrypt.hashSync('password123', 10);
  const id = `u-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const userId = `user-${Date.now()}`;

  db.prepare(`
    INSERT INTO users (id, user_id, name, email, phone, password_hash, role, company, company_logo, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, userId, 'Test User', 'test@example.com', '9999999999', hashedPassword, 'lender', 'Test Company', null);

  console.log(`  ✓ Created user: test@example.com / 9999999999 / password123`);

  // 8. Create wallet for test user
  db.prepare(`
    INSERT INTO wallets (user_id, balance, total_invested, escrowed_amount, total_returns, locked_amount)
    VALUES (?, 500000, 0, 0, 0, 0)
  `).run(id);

  console.log(`  ✓ Created wallet with ₹5,00,000`);

  // Commit transaction
  db.prepare('COMMIT').run();

  console.log('\n✅ Database reset successfully!');
  console.log('\n📋 Summary:');
  console.log(`  • ${tripsDeleted.changes} trips deleted`);
  console.log(`  • ${bidsDeleted.changes} bids deleted`);
  console.log(`  • ${investmentsDeleted.changes} investments deleted`);
  console.log(`  • ${docsDeleted.changes} documents deleted`);
  console.log(`  • ${transactionsDeleted.changes} transactions deleted`);
  console.log(`  • ${bankAccountsDeleted.changes} bank accounts deleted`);
  console.log(`  • ${kycDeleted.changes} KYC records deleted`);
  console.log(`  • ${walletsDeleted.changes} wallets deleted`);
  console.log(`  • ${usersDeleted.changes} users deleted`);
  console.log('\n👤 Test User Created:');
  console.log('  Email: test@example.com');
  console.log('  Phone: 9999999999');
  console.log('  Password: password123');
  console.log('  Role: lender');
  console.log('  Wallet: ₹5,00,000');

} catch (error) {
  // Rollback on error
  try {
    db.prepare('ROLLBACK').run();
  } catch (e) {
    // Rollback may fail if no transaction is active
  }
  console.error('\n❌ Error clearing database:', error);
  process.exit(1);
} finally {
  db.close();
}
