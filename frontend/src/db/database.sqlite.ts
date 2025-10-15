import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = path.join(process.cwd(), 'data', 'truck-fin-hub.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db: Database.Database | null = null;

/**
 * Initialize the database connection
 */
export const initDatabase = (): Database.Database => {
  if (db) {
    return db;
  }

  try {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Create database connection
    db = new Database(DB_PATH);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    console.log('✅ Database connected successfully');

    // Run schema if tables don't exist
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (!tableCheck) {
      console.log('📝 Creating database schema...');
      createSchema();
      console.log('✅ Schema created successfully');

      // Insert default super admin
      console.log('👤 Creating default super admin...');
      insertDefaultSuperAdmin();
      console.log('✅ Super admin created successfully');

      // Insert default load owners
      console.log('👤 Creating default load owners...');
      insertDefaultLoadOwners();
      console.log('✅ Load owners created successfully');
    }

    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

/**
 * Create database schema from schema.sql file
 */
const createSchema = (): void => {
  if (!db) throw new Error('Database not initialized');

  try {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
  } catch (error) {
    console.error('❌ Schema creation failed:', error);
    throw error;
  }
};

/**
 * Insert default super admin user
 */
const insertDefaultSuperAdmin = (): void => {
  if (!db) throw new Error('Database not initialized');

  try {
    // Hash the password
    const passwordHash = bcrypt.hashSync('Alok12345', 10);

    const insert = db.prepare(`
      INSERT INTO users (
        id,
        user_id,
        email,
        phone,
        name,
        password_hash,
        role,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      'sa-001',
      'SA001',
      'Alok@faberwork.com',
      '9999999999',
      'Alok',
      passwordHash,
      'super_admin',
      1
    );

    console.log('✅ Super admin user created: Alok@faberwork.com');
  } catch (error) {
    console.error('❌ Failed to create super admin:', error);
    // Don't throw - just log, as this might fail if user already exists
  }
};

/**
 * Insert default load owner users
 */
const insertDefaultLoadOwners = (): void => {
  if (!db) throw new Error('Database not initialized');

  try {
    const passwordHash = bcrypt.hashSync('password123', 10);

    const insert = db.prepare(`
      INSERT INTO users (
        id,
        user_id,
        email,
        phone,
        name,
        password_hash,
        role,
        company,
        company_logo,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Rolling Radius
    insert.run(
      'rr',
      'RR001',
      'contact@rollingradius.com',
      '8888888888',
      'Rolling Radius',
      passwordHash,
      'load_owner',
      'RollingRadius',
      '/rr_full_transp_old.png',
      1
    );

    // DARCL
    insert.run(
      'darcl',
      'DARCL001',
      'contact@darcl.com',
      '7777777777',
      'DARCL',
      passwordHash,
      'load_owner',
      'DARCL',
      '/darcl-logo.png',
      1
    );

    console.log('✅ Load owner users created: Rolling Radius, DARCL');
  } catch (error) {
    console.error('❌ Failed to create load owners:', error);
    // Don't throw - just log, as this might fail if users already exist
  }
};

/**
 * Get database instance
 */
export const getDatabase = (): Database.Database => {
  if (!db) {
    return initDatabase();
  }
  return db;
};

/**
 * Close database connection
 */
export const closeDatabase = (): void => {
  if (db) {
    db.close();
    db = null;
    console.log('✅ Database connection closed');
  }
};

/**
 * Execute a transaction
 */
export const transaction = <T>(callback: () => T): T => {
  const database = getDatabase();
  return database.transaction(callback)();
};

// Initialize database on module load
if (typeof window === 'undefined') {
  // Only initialize on server-side (Node.js)
  initDatabase();
}

export default {
  initDatabase,
  getDatabase,
  closeDatabase,
  transaction,
};
