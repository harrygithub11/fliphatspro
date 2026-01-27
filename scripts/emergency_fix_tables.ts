
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env same as check_tables_status.ts
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
    console.log('Starting Emergency Table Fix...');
    const connection = await mysql.createConnection(dbConfig);

    try {
        // 1. Create tenant_roles
        console.log('Creating tenant_roles...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tenant_roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id VARCHAR(36) NOT NULL,
                name VARCHAR(50) NOT NULL,
                description VARCHAR(255),
                permissions JSON NOT NULL,
                is_system BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY idx_tenant_role_name (tenant_id, name)
            );
        `);

        // 2. Add role_id to tenant_users
        console.log('Checking tenant_users.role_id...');
        const [columns]: any = await connection.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_schema = ? AND table_name = 'tenant_users' AND column_name = 'role_id'
        `, [dbConfig.database]);

        if (columns.length === 0) {
            console.log('Adding role_id column to tenant_users...');
            await connection.query(`ALTER TABLE tenant_users ADD COLUMN role_id INT NULL;`);
        } else {
            console.log('role_id column already exists.');
        }

        // 3. Create missing Marketing tables
        console.log('Creating campaign_step...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS campaign_step (
                id VARCHAR(191) PRIMARY KEY,
                campaignId VARCHAR(191) NOT NULL,
                type VARCHAR(50) DEFAULT 'email',
                delaySeconds INT DEFAULT 0,
                subject VARCHAR(500),
                body LONGTEXT,
                htmlBody LONGTEXT,
                stepOrder INT DEFAULT 0,
                INDEX idx_campaign (campaignId),
                INDEX idx_order (stepOrder)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('Creating campaign_lead...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS campaign_lead (
                id VARCHAR(191) PRIMARY KEY,
                campaignId VARCHAR(191) NOT NULL,
                leadEmail VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'active',
                currentStep INT DEFAULT 0,
                nextStepDue DATETIME(3),
                joinedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
                completedAt DATETIME(3),
                openCount INT DEFAULT 0,
                clickCount INT DEFAULT 0,
                replied BOOLEAN DEFAULT FALSE,
                UNIQUE KEY uniq_camp_lead (campaignId, leadEmail),
                INDEX idx_status (status),
                INDEX idx_nextDue (nextStepDue)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('Fix Complete! Tables created.');

    } catch (e) {
        console.error('Error during fix:', e);
    } finally {
        await connection.end();
    }
}

main();
