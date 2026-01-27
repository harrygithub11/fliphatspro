
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

    console.log('=== CHECKING EMAILS TABLE ===');
    const [tables]: any = await connection.execute("SHOW TABLES LIKE 'emails'");

    if (tables.length > 0) {
        console.log('✅ emails table already exists');
        const [count]: any = await connection.execute('SELECT count(*) as c FROM emails');
        console.log(`   Contains ${count[0].c} emails`);
    } else {
        console.log('⚠️ emails table does NOT exist. Creating...');
        await connection.execute(`
            CREATE TABLE emails (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id VARCHAR(255),
                user_id INT,
                smtp_account_id INT,
                uid INT,
                folder VARCHAR(50),
                from_name VARCHAR(255),
                from_address VARCHAR(255),
                recipient_to JSON,
                body_text TEXT,
                body_html LONGTEXT,
                received_at DATETIME,
                attachment_count INT DEFAULT 0,
                subject VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_account (smtp_account_id),
                INDEX idx_folder (folder),
                INDEX idx_tenant (tenant_id),
                INDEX idx_uid (uid)
            )
        `);
        console.log('✅ emails table created!');
    }

    connection.end();
}

main().catch(console.error);
