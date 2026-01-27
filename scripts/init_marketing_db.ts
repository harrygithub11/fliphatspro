
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config();
import pool from '../lib/db';
import { RowDataPacket } from 'mysql2';

async function main() {
    console.log('Initializing Marketing Database...');

    try {
        const connection = await pool.getConnection();

        console.log('Creating marketing_campaign table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS marketing_campaign (
        id VARCHAR(191) PRIMARY KEY,
        tenant_id VARCHAR(191),
        accountId VARCHAR(191),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) DEFAULT 'sequence',
        status VARCHAR(50) DEFAULT 'draft',
        sentCount INT DEFAULT 0,
        openCount INT DEFAULT 0,
        clickCount INT DEFAULT 0,
        replyCount INT DEFAULT 0,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_tenant (tenant_id),
        INDEX idx_account (accountId),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        console.log('Creating campaign_step table...');
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
        INDEX idx_order (stepOrder),
        FOREIGN KEY (campaignId) REFERENCES marketing_campaign(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        console.log('Creating campaign_lead table...');
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
        INDEX idx_nextDue (nextStepDue),
        FOREIGN KEY (campaignId) REFERENCES marketing_campaign(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        console.log('Marketing Database Initialized Successfully!');
        connection.release();
        process.exit(0);

    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
}

main();
