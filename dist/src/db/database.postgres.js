import { Pool } from 'pg';
import { postgresConfig } from './config.postgres.js';
let pool = null;
/**
 * Initialize the PostgreSQL database connection pool
 */
export const initDatabase = async () => {
    if (pool) {
        return pool;
    }
    try {
        pool = new Pool(postgresConfig);
        // Test the connection
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ PostgreSQL Database connected successfully');
        console.log(`📍 Database: ${postgresConfig.database}@${postgresConfig.host}:${postgresConfig.port}`);
        // Check if tables exist
        const tableCheck = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'");
        if (tableCheck.rows.length === 0) {
            console.log('⚠️  Warning: Database tables not found. Please run schema creation script.');
        }
        return pool;
    }
    catch (error) {
        console.error('❌ PostgreSQL Database initialization failed:', error);
        throw error;
    }
};
/**
 * Get database pool instance
 */
export const getDatabase = () => {
    if (!pool) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return pool;
};
/**
 * Get a client from the pool for transactions
 */
export const getClient = async () => {
    const database = getDatabase();
    return await database.connect();
};
/**
 * Close database connection pool
 */
export const closeDatabase = async () => {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('✅ PostgreSQL Database connection closed');
    }
};
/**
 * Execute a query
 */
export const query = async (text, params) => {
    const database = getDatabase();
    return await database.query(text, params);
};
/**
 * Execute a transaction
 */
export const transaction = async (callback) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
// Initialize database on module load
if (typeof window === 'undefined') {
    // Only initialize on server-side (Node.js)
    initDatabase().catch(err => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });
}
export default {
    initDatabase,
    getDatabase,
    getClient,
    closeDatabase,
    query,
    transaction,
};
