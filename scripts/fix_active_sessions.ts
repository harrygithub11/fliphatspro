
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'usernewyear',
    password: process.env.DB_PASSWORD || 'NEWyear11@@',
    database: process.env.DB_NAME || 'newyear',
};

async function main() {
    console.log('Creating active_sessions table...');
    const connection = await mysql.createConnection(dbConfig);

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS active_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                session_token VARCHAR(255) NOT NULL,
                ip_address VARCHAR(45),
                user_agent VARCHAR(255),
                is_revoked BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NULL,
                INDEX idx_session_token (session_token),
                INDEX idx_user_id (user_id),
                INDEX idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('Table active_sessions created successfully.');

    } catch (e) {
        console.error('Error creating table:', e);
    } finally {
        await connection.end();
    }
}

main();
