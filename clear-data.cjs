// Script to clear trips and reset wallet data
// Run with: node clear-data.cjs

const Database = require('better-sqlite3');
const db = new Database('./data/truck-fin-hub.db');

console.log('🗑️  Clearing trips and resetting wallet data...\n');

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

  // 2. Reset wallet data (keep wallets but reset balances)
  console.log('\nResetting wallet balances...');
  const walletsReset = db.prepare(`
    UPDATE wallets
    SET balance = 500000,
        total_invested = 0,
        escrowed_amount = 0,
        total_returns = 0,
        locked_amount = 0
  `).run();
  console.log(`  ✓ Reset ${walletsReset.changes} wallets to ₹5,00,000`);

  // 3. Delete all transactions
  console.log('Deleting transactions...');
  const transactionsDeleted = db.prepare('DELETE FROM transactions').run();
  console.log(`  ✓ Deleted ${transactionsDeleted.changes} transactions`);

  // Commit transaction
  db.prepare('COMMIT').run();

  console.log('\n✅ Database cleared successfully!');
  console.log('\nSummary:');
  console.log(`  • ${tripsDeleted.changes} trips deleted`);
  console.log(`  • ${bidsDeleted.changes} bids deleted`);
  console.log(`  • ${investmentsDeleted.changes} investments deleted`);
  console.log(`  • ${docsDeleted.changes} documents deleted`);
  console.log(`  • ${walletsReset.changes} wallets reset to ₹5,00,000`);
  console.log(`  • ${transactionsDeleted.changes} transactions deleted`);

} catch (error) {
  // Rollback on error
  db.prepare('ROLLBACK').run();
  console.error('\n❌ Error clearing database:', error);
  process.exit(1);
} finally {
  db.close();
}
