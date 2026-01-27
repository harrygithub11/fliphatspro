
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('=== CREATING DEALS TABLE ===');

    // Schema based on typical CRM usage and error logs
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS deals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            amount DECIMAL(15, 2) DEFAULT 0.00,
            currency VARCHAR(10) DEFAULT 'USD',
            status ENUM('open', 'won', 'lost', 'archived') DEFAULT 'open',
            stage_id INT COMMENT 'Foreign key to pipeline_stages',
            company_id INT,
            contact_id INT,
            owner_id INT,
            created_by INT,
            probability INT DEFAULT 0,
            closing_date DATE,
            tags TEXT,
            priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL,
            INDEX idx_tenant (tenant_id),
            INDEX idx_company (company_id),
            INDEX idx_contact (contact_id),
            INDEX idx_stage (stage_id),
            INDEX idx_owner (owner_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
        await connection.execute(createTableQuery);
        console.log('✅ Created deals table');
    } catch (e: any) {
        console.error('❌ Failed to create deals table:', e.message);
    }

    connection.end();
}

main().catch(console.error);
