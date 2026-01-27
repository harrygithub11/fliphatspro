
import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const connection = await pool.getConnection();

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

        connection.release();
        return NextResponse.json({ success: true, message: 'Marketing tables created' });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
