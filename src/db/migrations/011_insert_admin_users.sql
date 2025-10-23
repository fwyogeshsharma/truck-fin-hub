-- Migration: Insert super admin and admin users into the database
-- This ensures the hardcoded admin credentials have corresponding database records
-- Required for approved_by foreign key constraint to work properly

-- Insert super admin user (Alok)
-- Email: alok@faberwork.com
-- Password: faber@123
INSERT INTO users (
  id,
  user_id,
  email,
  phone,
  name,
  password_hash,
  role,
  approval_status,
  is_admin,
  is_active,
  terms_accepted,
  created_at,
  updated_at
) VALUES (
  'super_admin_001',
  'super_admin_001',
  'alok@faberwork.com',
  '+919876543210',
  'Alok',
  '$2b$10$reEIM3J3jqujh9RL53SHOuqNo29OhvxofgivJlNIjcdRRh.guRu5K',
  'super_admin',
  'approved',
  TRUE,
  TRUE,
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- Insert regular admin user
-- Email: admin@truckfin.com
-- Password: admin@123
INSERT INTO users (
  id,
  user_id,
  email,
  phone,
  name,
  password_hash,
  role,
  approval_status,
  is_admin,
  is_active,
  terms_accepted,
  created_at,
  updated_at
) VALUES (
  'admin_001',
  'admin_001',
  'admin@truckfin.com',
  '+919876543211',
  'Admin',
  '$2b$10$ymJ6uJCYUJc6IKBVAgn4v.iJcxentzVAY5JN5HSKcfzvYaKFTqM.G',
  'admin',
  'approved',
  TRUE,
  TRUE,
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;
