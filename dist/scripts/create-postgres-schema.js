import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// PostgreSQL configuration
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'logifin',
    user: 'postgres',
    password: 'admin',
});
async function createSchema() {
    const client = await pool.connect();
    try {
        console.log('🔌 Connected to PostgreSQL database: logifin');
        // Read the schema file
        const schemaPath = path.join(__dirname, '..', 'src', 'db', 'schema.postgres.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        console.log('📝 Executing PostgreSQL schema...');
        // Execute the schema
        await client.query(schema);
        console.log('✅ Schema created successfully!');
        // Verify tables were created
        const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
        console.log('\n📋 Tables created:');
        result.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.table_name}`);
        });
        console.log(`\n✨ Total tables: ${result.rows.length}`);
    }
    catch (error) {
        console.error('❌ Error creating schema:', error);
        throw error;
    }
    finally {
        client.release();
        await pool.end();
    }
}
// Run the script
createSchema()
    .then(() => {
    console.log('\n🎉 Database setup completed successfully!');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n💥 Database setup failed:', error);
    process.exit(1);
});
