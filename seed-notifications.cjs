const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'truck-fin-hub.db');
const db = new Database(dbPath);

console.log('Seeding notifications for recent activities...\n');

try {
  // Get all lenders
  const lenders = db.prepare("SELECT id, name FROM users WHERE role = 'lender'").all();
  console.log(`Found ${lenders.length} lenders`);

  // Get recent pending trips (created in last 7 days)
  const recentTrips = db.prepare(`
    SELECT * FROM trips
    WHERE status = 'pending'
    AND datetime(created_at) > datetime('now', '-7 days')
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  console.log(`Found ${recentTrips.length} recent pending trips\n`);

  let notificationCount = 0;

  // Create investment opportunity notifications for each lender for each recent trip
  recentTrips.forEach(trip => {
    lenders.forEach(lender => {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const title = 'New Investment Opportunity Available';
      const message = `New investment opportunity: ${trip.origin} → ${trip.destination}, ₹${(trip.amount / 1000).toFixed(0)}K at ${trip.interest_rate || 'N/A'}% interest`;

      const metadata = JSON.stringify({
        tripId: trip.id,
        origin: trip.origin,
        destination: trip.destination,
        loadType: trip.load_type,
        amount: trip.amount,
        distance: trip.distance,
        interestRate: trip.interest_rate,
        riskLevel: trip.risk_level,
        maturityDays: trip.maturity_days,
      });

      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, priority, read, link, action_url, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        notifId,
        lender.id,
        'investment_opportunity',
        title,
        message,
        'high',
        0,
        '/investment-opportunities',
        '/investment-opportunities',
        metadata
      );

      notificationCount++;
    });
  });

  // Get recent bids
  const recentBids = db.prepare(`
    SELECT tb.*, t.*
    FROM trip_bids tb
    JOIN trips t ON t.id = tb.trip_id
    WHERE datetime(tb.created_at) > datetime('now', '-7 days')
    ORDER BY tb.created_at DESC
    LIMIT 10
  `).all();

  console.log(`Found ${recentBids.length} recent bids\n`);

  // Create bid received notifications for trip owners
  recentBids.forEach(bid => {
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const title = 'New Investment Bid Received';
    const message = `New bid: ₹${(bid.amount / 1000).toFixed(0)}K at ${bid.interest_rate}% from ${bid.lender_name}`;

    const metadata = JSON.stringify({
      tripId: bid.trip_id,
      origin: bid.origin,
      destination: bid.destination,
      lenderName: bid.lender_name,
      amount: bid.amount,
      interestRate: bid.interest_rate,
    });

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, priority, read, link, action_url, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      notifId,
      bid.load_owner_id,
      'bid_received',
      title,
      message,
      'high',
      0,
      `/trips/${bid.trip_id}`,
      `/trips/${bid.trip_id}`,
      metadata
    );

    notificationCount++;
  });

  console.log(`\n✓ Created ${notificationCount} notifications successfully!`);

  // Show summary
  const summary = db.prepare('SELECT COUNT(*) as count FROM notifications').get();
  console.log(`\nTotal notifications in database: ${summary.count}`);

} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}

db.close();
console.log('\nSeeding completed!');
