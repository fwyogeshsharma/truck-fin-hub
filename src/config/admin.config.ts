/**
 * Admin Configuration
 *
 * This file contains super admin and admin credentials.
 * These roles have elevated permissions and are not visible to regular users.
 *
 * IMPORTANT: Keep this file secure and never commit real credentials to version control.
 */

export const ADMIN_CONFIG = {
  superAdmin: {
    username: 'Alok',
    email: 'alok@faberwork.com',
    password: 'faber@123', // In production, this should be hashed
    role: 'super_admin' as const,
  },
  admin: {
    username: 'Admin',
    email: 'admin@truckfin.com',
    password: 'admin@123', // In production, this should be hashed
    role: 'admin' as const,
  },
} as const;

// Helper function to check if credentials match super admin
export const isSuperAdminCredentials = (email: string, password: string): boolean => {
  return (
    email.toLowerCase() === ADMIN_CONFIG.superAdmin.email.toLowerCase() &&
    password === ADMIN_CONFIG.superAdmin.password
  );
};

// Helper function to check if credentials match admin
export const isAdminCredentials = (email: string, password: string): boolean => {
  return (
    email.toLowerCase() === ADMIN_CONFIG.admin.email.toLowerCase() &&
    password === ADMIN_CONFIG.admin.password
  );
};

// Helper function to check if user is super admin or admin
export const isAdminRole = (role: string): boolean => {
  return role === 'super_admin' || role === 'admin';
};
