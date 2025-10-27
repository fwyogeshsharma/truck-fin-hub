import { Pool, PoolConfig } from 'pg';

export interface PostgresConfig extends PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

// Safe access to process.env that works in both Node.js and browser
const getEnv = (key: string, defaultValue: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
};

export const postgresConfig: PostgresConfig = {
  host: getEnv('DB_HOST', 'localhost'),
  port: parseInt(getEnv('DB_PORT', '5432')),
  database: getEnv('DB_NAME', 'logifin'),
  user: getEnv('DB_USER', 'postgres'),
  password: getEnv('DB_PASSWORD', 'admin'),
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection not established
};

export default postgresConfig;
