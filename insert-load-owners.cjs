const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'truck-fin-hub.db');

console.log('Inserting load owner users...');

try {
  const db = new Database(DB_PATH);
  const passwordHash = bcrypt.hashSync('password123', 10);

  const insert = db.prepare(`
    INSERT OR REPLACE INTO users (
      id,
      user_id,
      email,
      phone,
      name,
      password_hash,
      role,
      company,
      company_logo,
      is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Rolling Radius
  insert.run(
    'rr',
    'RR001',
    'contact@rollingradius.com',
    '8888888888',
    'Rolling Radius',
    passwordHash,
    'load_owner',
    'RollingRadius',
    '/rr_full_transp_old.png',
    1
  );

  console.log('✅ Created Rolling Radius load owner');

  // DARCL
  insert.run(
    'darcl',
    'DARCL001',
    'contact@darcl.com',
    '7777777777',
    'DARCL',
    passwordHash,
    'load_owner',
    'DARCL',
    '/CJ-Darcl-01.png',
    1
  );

  console.log('✅ Created DARCL load owner');

  db.close();
  console.log('✅ Load owners inserted successfully!');
} catch (error) {
  console.error('❌ Error inserting load owners:', error);
  process.exit(1);
}
