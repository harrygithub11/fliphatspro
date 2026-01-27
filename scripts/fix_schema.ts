
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('=== CREATING EMAIL_READ_STATUS TABLE ===\n');

    try {
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS email_read_status (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id VARCHAR(255) NOT NULL,
                account_id INT NOT NULL,
                uid INT NOT NULL,
                folder VARCHAR(50) DEFAULT 'INBOX',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_email (account_id, uid, folder),
                INDEX idx_tenant (tenant_id),
                INDEX idx_account (account_id)
            )
        `);
        console.log('✅ email_read_status table created!');
    } catch (e: any) {
        console.log('Table might already exist:', e.message);
    }

    connection.end();
}

main().catch(console.error);
