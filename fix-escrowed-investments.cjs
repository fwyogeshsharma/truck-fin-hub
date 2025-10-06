// Script to fix escrowed investments for funded trips
// Run with: node fix-escrowed-investments.js

const Database = require('better-sqlite3');
const db = new Database('./data/truck-fin-hub.db');

console.log('Checking for funded trips with escrowed investments...\n');

// Get all funded trips
const fundedTrips = db.prepare("SELECT id, lender_id, lender_name FROM trips WHERE status = 'funded'").all();

console.log(`Found ${fundedTrips.length} funded trips`);

let updatedCount = 0;

fundedTrips.forEach(trip => {
  // Find escrowed investments for this trip
  const escrowedInvestments = db.prepare(
    "SELECT * FROM investments WHERE trip_id = ? AND status = 'escrowed'"
  ).all(trip.id);

  if (escrowedInvestments.length > 0) {
    console.log(`\nTrip ${trip.id} (funded) has ${escrowedInvestments.length} escrowed investments:`);

    escrowedInvestments.forEach(inv => {
      console.log(`  - Investment ${inv.id} (lender: ${inv.lender_id}) - Updating to active...`);

      // Update to active
      db.prepare('UPDATE investments SET status = ? WHERE id = ?').run('active', inv.id);
      updatedCount++;

      console.log(`    ✓ Updated`);
    });
  }
});

console.log(`\n✅ Done! Updated ${updatedCount} investments from escrowed to active`);

db.close();
