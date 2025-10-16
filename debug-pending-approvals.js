// Debug script to check pending approvals issue
// Run with: node debug-pending-approvals.js

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'logifin',
  user: 'postgres',
  password: 'admin',
});

async function debugPendingApprovals() {
  try {
    console.log('\n🔍 ===== DEBUGGING PENDING APPROVALS =====\n');

    // 1. Check deepa2 user details
    console.log('1️⃣ Checking deepa2 admin details:');
    const adminResult = await pool.query(
      `SELECT id, name, email, role, company, company_id, is_admin, approval_status
       FROM users
       WHERE name = 'deepa2' OR email ILIKE '%deepa2%'`
    );

    if (adminResult.rows.length > 0) {
      console.log('   ✅ Found deepa2:', JSON.stringify(adminResult.rows[0], null, 2));
    } else {
      console.log('   ❌ deepa2 user NOT FOUND!');
    }

    // 2. Check Alisha company
    console.log('\n2️⃣ Checking Alisha company:');
    const companyResult = await pool.query(
      `SELECT id, name, display_name
       FROM companies
       WHERE name ILIKE '%alisha%' OR display_name ILIKE '%alisha%'`
    );

    if (companyResult.rows.length > 0) {
      console.log('   ✅ Found company:', JSON.stringify(companyResult.rows[0], null, 2));
    } else {
      console.log('   ❌ Alisha company NOT FOUND!');
    }

    // 3. Check pending shipper users
    console.log('\n3️⃣ Checking ALL pending users:');
    const pendingResult = await pool.query(
      `SELECT id, name, email, role, company, company_id, approval_status, created_at
       FROM users
       WHERE approval_status = 'pending' AND is_active = TRUE
       ORDER BY created_at DESC`
    );

    if (pendingResult.rows.length > 0) {
      console.log(`   ✅ Found ${pendingResult.rows.length} pending user(s):`);
      pendingResult.rows.forEach((u, i) => {
        console.log(`   \n   User ${i + 1}:`, JSON.stringify(u, null, 2));
      });
    } else {
      console.log('   ❌ NO pending users found!');
    }

    // 4. Check if company_id matches
    console.log('\n4️⃣ Checking company_id match:');
    const adminCompanyId = adminResult.rows[0]?.company_id;
    const pendingUsersWithSameCompany = pendingResult.rows.filter(
      u => u.company_id === adminCompanyId
    );

    console.log(`   Admin's company_id: ${adminCompanyId || 'NULL'}`);
    console.log(`   Pending users with matching company_id: ${pendingUsersWithSameCompany.length}`);

    if (pendingUsersWithSameCompany.length > 0) {
      console.log('   ✅ MATCH FOUND! These users should appear in deepa2\'s dashboard:');
      pendingUsersWithSameCompany.forEach(u => {
        console.log(`      - ${u.name} (${u.email})`);
      });
    } else {
      console.log('   ❌ NO MATCH! Company IDs don\'t match.');
      console.log('\n   💡 ISSUE FOUND:');
      if (!adminCompanyId) {
        console.log('      → deepa2 has NO company_id assigned!');
        console.log('      → Need to set company_id for deepa2');
      } else {
        console.log('      → Pending user(s) have different company_id');
        console.log('      → Admin company_id:', adminCompanyId);
        pendingResult.rows.forEach(u => {
          console.log(`      → ${u.name}'s company_id: ${u.company_id || 'NULL'}`);
        });
      }
    }

    // 5. Check is_admin flag
    console.log('\n5️⃣ Checking is_admin flag:');
    const isAdmin = adminResult.rows[0]?.is_admin;
    console.log(`   deepa2's is_admin: ${isAdmin}`);

    if (!isAdmin) {
      console.log('   ❌ ISSUE: deepa2 is NOT marked as admin (is_admin = false or null)');
      console.log('   💡 Solution: Run make-admin API to set is_admin=true');
    } else {
      console.log('   ✅ is_admin is set correctly');
    }

    // 6. Simulate the query that would run
    console.log('\n6️⃣ Simulating the actual API query:');
    if (isAdmin && adminCompanyId) {
      const simulatedResult = await pool.query(
        `SELECT * FROM users
         WHERE approval_status = 'pending'
         AND is_active = TRUE
         AND company_id = $1
         ORDER BY created_at DESC`,
        [adminCompanyId]
      );
      console.log(`   Query: SELECT * FROM users WHERE approval_status='pending' AND company_id='${adminCompanyId}'`);
      console.log(`   Result: ${simulatedResult.rows.length} user(s) found`);

      if (simulatedResult.rows.length > 0) {
        simulatedResult.rows.forEach(u => {
          console.log(`      ✅ ${u.name} (${u.email})`);
        });
      }
    } else {
      console.log('   ⚠️ Cannot simulate - admin not properly configured');
    }

    // 7. Solution
    console.log('\n📋 ===== SOLUTION =====\n');

    if (!isAdmin) {
      console.log('❌ Problem: deepa2 is NOT marked as admin\n');
      console.log('✅ Solution: Run this command:\n');
      const adminUserId = adminResult.rows[0]?.id;
      const companyId = companyResult.rows[0]?.id;
      if (adminUserId && companyId) {
        console.log(`curl -X PUT http://localhost:3001/api/users/${adminUserId}/make-admin \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -d '{"company_id": "${companyId}"}'`);
      }
    } else if (!adminCompanyId) {
      console.log('❌ Problem: deepa2 has is_admin=true but NO company_id assigned\n');
      console.log('✅ Solution: Update company_id for deepa2\n');
      const adminUserId = adminResult.rows[0]?.id;
      const companyId = companyResult.rows[0]?.id;
      if (adminUserId && companyId) {
        console.log(`curl -X PUT http://localhost:3001/api/users/${adminUserId} \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -d '{"company_id": "${companyId}"}'`);
      }
    } else if (pendingUsersWithSameCompany.length === 0 && pendingResult.rows.length > 0) {
      console.log('❌ Problem: Pending user(s) have WRONG company_id\n');
      console.log('✅ Solution: Update pending user\'s company_id\n');
      const correctCompanyId = adminCompanyId;
      pendingResult.rows.forEach(u => {
        console.log(`curl -X PUT http://localhost:3001/api/users/${u.id} \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -d '{"company_id": "${correctCompanyId}"}'`);
        console.log('');
      });
    } else if (pendingResult.rows.length === 0) {
      console.log('❌ Problem: NO users with approval_status=\'pending\'\n');
      console.log('✅ Solution: The shipper user needs to have approval_status=\'pending\'\n');
      console.log('   Check if the user was created correctly during signup.');
    } else {
      console.log('✅ Everything looks correct! The query should work.');
      console.log('   Try refreshing the dashboard or check browser console logs.');
    }

    console.log('\n🏁 ===== DEBUG COMPLETE =====\n');

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await pool.end();
  }
}

debugPendingApprovals();
