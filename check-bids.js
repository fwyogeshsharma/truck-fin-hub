import fs from 'fs';

const data = fs.readFileSync('test-trips-new.json', 'utf-8');
const trips = JSON.parse(data);

console.log('Total trips:', trips.length);
trips.forEach(t => {
  console.log('Trip', t.id);
  console.log('  Status:', t.status);
  console.log('  Has bids field:', 'bids' in t);
  console.log('  Bids:', t.bids);
  console.log('');
});
