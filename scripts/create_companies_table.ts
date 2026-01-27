
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

    console.log('=== CREATING COMPANIES TABLE ===');

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS companies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            domain VARCHAR(255),
            industry VARCHAR(100),
            size VARCHAR(50),
            website VARCHAR(255),
            phone VARCHAR(50),
            address TEXT,
            city VARCHAR(100),
            state VARCHAR(100),
            country VARCHAR(100),
            postal_code VARCHAR(20),
            logo_url TEXT,
            linkedin_url VARCHAR(255),
            annual_revenue DECIMAL(15, 2),
            employee_count INT,
            tags TEXT,
            owner_id INT,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL,
            INDEX idx_tenant (tenant_id),
            INDEX idx_name (name),
            INDEX idx_domain (domain)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
        await connection.execute(createTableQuery);
        console.log('✅ Created companies table');
    } catch (e: any) {
        console.error('❌ Failed to create companies table:', e.message);
    }

    connection.end();
}

main().catch(console.error);
