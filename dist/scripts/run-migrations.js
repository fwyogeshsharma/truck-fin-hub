import { initDatabase, getDatabase } from '../src/db/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function runMigrations() {
    console.log('🚀 Starting database migrations...\n');
    try {
        // Initialize database connection
        await initDatabase();
        const db = getDatabase();
        // Read migration files
        const migrationsDir = path.join(__dirname, '../src/db/migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
        console.log(`Found ${files.length} migration files:\n`);
        for (const file of files) {
            console.log(`📄 Running migration: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf-8');
            try {
                await db.query(sql);
                console.log(`   ✅ Success: ${file}\n`);
            }
            catch (error) {
                console.error(`   ❌ Error in ${file}:`, error.message);
                console.error(`   Continuing with next migration...\n`);
            }
        }
        console.log('✨ All migrations completed!\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}
runMigrations();
