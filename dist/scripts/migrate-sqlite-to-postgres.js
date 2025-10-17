import { Pool } from 'pg';
import Database from 'better-sqlite3';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// PostgreSQL configuration
const pgPool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'logifin',
    user: 'postgres',
    password: 'admin',
});
// SQLite configuration
const sqliteDbPath = path.join(process.cwd(), 'data', 'truck-fin-hub.db');
const sqliteDb = new Database(sqliteDbPath, { readonly: true });
// Table migration order (respecting foreign key dependencies)
const TABLES_ORDER = [
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
async function migrateTable(tableName, pgClient) {
    try {
        console.log(`\n📦 Migrating table: ${tableName}`);
        // Get all rows from SQLite
        const rows = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all();
        if (rows.length === 0) {
            console.log(`  ⚠️  No data found in ${tableName}`);
            return { table: tableName, rowCount: 0, success: true };
        }
        console.log(`  📊 Found ${rows.length} rows`);
        // Get column names from first row
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const columnNames = columns.join(', ');
        const insertQuery = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`;
        let successCount = 0;
        let errorCount = 0;
        // Insert rows one by one
        for (const row of rows) {
            try {
                const values = columns.map(col => {
                    const value = row[col];
                    // Convert SQLite INTEGER boolean to PostgreSQL boolean
                    if (typeof value === 'number' && (value === 0 || value === 1)) {
                        // Check if column name suggests it's a boolean
                        if (col.includes('is_') || col.includes('_status') || col === 'read' || col === 'terms_accepted' || col === 'insurance_status') {
                            return value === 1;
                        }
                    }
                    // Return value as-is for other types
                    return value;
                });
                await pgClient.query(insertQuery, values);
                successCount++;
            }
            catch (error) {
                errorCount++;
                console.error(`  ❌ Error inserting row: ${error.message}`);
            }
        }
        console.log(`  ✅ Successfully migrated ${successCount} rows`);
        if (errorCount > 0) {
            console.log(`  ⚠️  Failed to migrate ${errorCount} rows`);
        }
        return { table: tableName, rowCount: successCount, success: true };
    }
    catch (error) {
        console.error(`  ❌ Failed to migrate table ${tableName}: ${error.message}`);
        return { table: tableName, rowCount: 0, success: false, error: error.message };
    }
}
async function migrate() {
    const pgClient = await pgPool.connect();
    const stats = [];
    try {
        console.log('🚀 Starting data migration from SQLite to PostgreSQL');
        console.log('📂 SQLite database:', sqliteDbPath);
        console.log('🐘 PostgreSQL database: logifin\n');
        // Check if SQLite database exists
        try {
            sqliteDb.prepare('SELECT 1').get();
        }
        catch (error) {
            console.error('❌ Cannot access SQLite database. Please ensure the database file exists.');
            throw error;
        }
        // Migrate each table in order (no transaction, handle errors per table)
        for (const tableName of TABLES_ORDER) {
            const result = await migrateTable(tableName, pgClient);
            stats.push(result);
        }
        console.log('\n' + '='.repeat(60));
        console.log('📊 Migration Summary:');
        console.log('='.repeat(60));
        let totalRows = 0;
        let successfulTables = 0;
        stats.forEach(stat => {
            const status = stat.success ? '✅' : '❌';
            console.log(`${status} ${stat.table.padEnd(20)} - ${stat.rowCount} rows`);
            if (stat.success) {
                totalRows += stat.rowCount;
                successfulTables++;
            }
        });
        console.log('='.repeat(60));
        console.log(`✨ Total rows migrated: ${totalRows}`);
        console.log(`✨ Successful tables: ${successfulTables}/${TABLES_ORDER.length}`);
        console.log('='.repeat(60));
    }
    catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        throw error;
    }
    finally {
        pgClient.release();
        sqliteDb.close();
        await pgPool.end();
    }
}
// Run migration
migrate()
    .then(() => {
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
});
