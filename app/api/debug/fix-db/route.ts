
import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    let connection;
    try {
        connection = await pool.getConnection();

        // 1. RBAC Tables
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

        // Safely add role_id to tenant_users
        try {
            await connection.query(`ALTER TABLE tenant_users ADD COLUMN role_id INT NULL;`);
        } catch (e: any) {
            if (!e.message.includes("Duplicate column")) {
                console.log("Column role_id might already exist or other error:", e.message);
            }
        }

        // 2. Marketing Tables
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
        return NextResponse.json({ success: true, message: 'Database tables fixed (RBAC + Marketing)' });

    } catch (error: any) {
        if (connection) connection.release();
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
