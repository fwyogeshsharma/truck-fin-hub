export const postgresConfig = {
    host: 'localhost',
    port: 5432,
    database: 'logifin',
    user: 'postgres',
    password: 'admin',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection not established
};
export default postgresConfig;
