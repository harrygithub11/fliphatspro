import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'flipuser',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'flip_password',
    database: process.env.DB_NAME || 'fliphatspro',
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0,
    maxIdle: 10,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Disable schema caching to pick up table changes immediately
    typeCast: function (field: any, next: any) {
        return next();
    }
};

console.log('[DB] Connecting to:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database
});

const pool = mysql.createPool(dbConfig as any);

export default pool;
