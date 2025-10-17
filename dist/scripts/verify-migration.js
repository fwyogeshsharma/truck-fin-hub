import { initDatabase, getDatabase } from '../src/db/database.js';
async function verifyMigration() {
    console.log('🔍 Verifying migration results...\n');
    try {
        await initDatabase();
        const db = getDatabase();
        // Check companies table
        const companies = await db.query('SELECT id, name, display_name, email FROM companies LIMIT 10');
        console.log(`✅ Companies in companies table: ${companies.rows.length}`);
        console.log('Sample companies:');
        companies.rows.forEach(c => {
            console.log(`   - ${c.id}: ${c.display_name} (${c.email})`);
        });
        console.log('\n');
        // Check for company records still in users table
        const companyUsers = await db.query("SELECT id, name, role FROM users WHERE id LIKE 'company-%'");
        console.log(`⚠️  Company records still in users table: ${companyUsers.rows.length}`);
        if (companyUsers.rows.length > 0) {
            console.log('These records are still referenced by trips and need manual cleanup:');
            companyUsers.rows.forEach(u => {
                console.log(`   - ${u.id}: ${u.name}`);
            });
        }
        console.log('\n');
        // Check users with company_id set
        const usersWithCompany = await db.query('SELECT COUNT(*) as count FROM users WHERE company_id IS NOT NULL');
        console.log(`✅ Users with company_id set: ${usersWithCompany.rows[0].count}`);
        console.log('\n✨ Verification complete!\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}
verifyMigration();
