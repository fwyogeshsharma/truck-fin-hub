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

const TABLES = [
  'users',
  'wallets',
  'bank_accounts',
  'user_kyc',
  'trips',
  'trip_bids',
  'trip_documents',
  'investments',
  'transactions',
  'notifications',
];

interface VerificationResult {
  table: string;
  sqliteCount: number;
  postgresCount: number;
  match: boolean;
  difference: number;
}

async function verifyMigration() {
  const pgClient = await pgPool.connect();
  const results: VerificationResult[] = [];

  try {
    console.log('🔍 Verifying data migration...\n');
    console.log('=' .repeat(70));
    console.log('Table Name           | SQLite Count | PostgreSQL Count | Status');
    console.log('=' .repeat(70));

    for (const table of TABLES) {
      // Get SQLite count
      const sqliteCount = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };

      // Get PostgreSQL count
      const pgResult = await pgClient.query(`SELECT COUNT(*) as count FROM ${table}`);
      const postgresCount = parseInt(pgResult.rows[0].count);

      const match = sqliteCount.count === postgresCount;
      const difference = sqliteCount.count - postgresCount;

      results.push({
        table,
        sqliteCount: sqliteCount.count,
        postgresCount,
        match,
        difference,
      });

      const status = match ? '✅ Match' : `⚠️  Diff: ${difference > 0 ? '+' : ''}${difference}`;
      const tableName = table.padEnd(20);
      const sqliteCountStr = sqliteCount.count.toString().padStart(12);
      const postgresCountStr = postgresCount.toString().padStart(16);

      console.log(`${tableName} | ${sqliteCountStr} | ${postgresCountStr} | ${status}`);
    }

    console.log('=' .repeat(70));

    // Summary
    const totalSqlite = results.reduce((sum, r) => sum + r.sqliteCount, 0);
    const totalPostgres = results.reduce((sum, r) => sum + r.postgresCount, 0);
    const matchCount = results.filter(r => r.match).length;

    console.log('\n📊 Summary:');
    console.log(`  Total SQLite records:      ${totalSqlite}`);
    console.log(`  Total PostgreSQL records:  ${totalPostgres}`);
    console.log(`  Tables matched:            ${matchCount}/${TABLES.length}`);
    console.log(`  Migration success rate:    ${((totalPostgres / totalSqlite) * 100).toFixed(2)}%`);

    // Check for differences
    const differences = results.filter(r => !r.match);
    if (differences.length > 0) {
      console.log('\n⚠️  Tables with differences:');
      differences.forEach(diff => {
        console.log(`  - ${diff.table}: ${diff.difference > 0 ? 'Missing' : 'Extra'} ${Math.abs(diff.difference)} records`);
        if (diff.table === 'notifications' && diff.difference > 0) {
          console.log(`    (Likely orphaned records with non-existent user_ids)`);
        }
      });
    } else {
      console.log('\n✅ All tables match perfectly!');
    }

  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  } finally {
    pgClient.release();
    sqliteDb.close();
    await pgPool.end();
  }
}

verifyMigration()
  .then(() => {
    console.log('\n🎉 Verification completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  });
