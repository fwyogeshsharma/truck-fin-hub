// Script to generate bcrypt password hashes for admin users
import bcrypt from 'bcryptjs';

const ADMIN_PASSWORDS = {
  superAdmin: {
    email: 'alok@faberwork.com',
    password: 'faber@123'
  },
  admin: {
    email: 'admin@truckfin.com',
    password: 'admin@123'
  }
};

console.log('Generating bcrypt password hashes...\n');

// Generate hash for super admin
const superAdminHash = bcrypt.hashSync(ADMIN_PASSWORDS.superAdmin.password, 10);
console.log('Super Admin (alok@faberwork.com):');
console.log('Password:', ADMIN_PASSWORDS.superAdmin.password);
console.log('Hash:', superAdminHash);
console.log();

// Generate hash for admin
const adminHash = bcrypt.hashSync(ADMIN_PASSWORDS.admin.password, 10);
console.log('Admin (admin@truckfin.com):');
console.log('Password:', ADMIN_PASSWORDS.admin.password);
console.log('Hash:', adminHash);
console.log();

console.log('Copy these hashes into the migration file 011_insert_admin_users.sql');
