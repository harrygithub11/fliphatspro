
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const connection = await pool.getConnection();
    const results = [];

    try {
        // 1. Add IMAP fields to smtp_accounts
        try {
            await connection.execute(`
                ALTER TABLE smtp_accounts 
                ADD COLUMN imap_host VARCHAR(255) NULL AFTER host,
                ADD COLUMN imap_port INT NULL AFTER port,
                ADD COLUMN imap_user VARCHAR(255) NULL AFTER username,
                ADD COLUMN imap_secure BOOLEAN DEFAULT TRUE AFTER imap_port,
                ADD COLUMN imap_encrypted_password TEXT NULL AFTER encrypted_password,
                ADD COLUMN last_synced_at DATETIME NULL;
            `);
            results.push("Added IMAP columns to smtp_accounts");
        } catch (e: any) {
            results.push(`smtp_accounts error: ${e.message}`);
        }

        // 2. Update emails table
        try {
            await connection.execute(`
                ALTER TABLE emails
                ADD COLUMN direction ENUM('inbound', 'outbound') DEFAULT 'outbound',
                ADD COLUMN message_id VARCHAR(255) NULL,
                ADD COLUMN in_reply_to VARCHAR(255) NULL,
                ADD COLUMN folder VARCHAR(50) DEFAULT 'SENT',
                ADD COLUMN is_read BOOLEAN DEFAULT TRUE,
                ADD COLUMN from_name VARCHAR(255) NULL,
                ADD COLUMN from_address VARCHAR(255) NULL;
            `);
            results.push("Added columns to emails");

            // Add indexes separately
            try { await connection.execute(`CREATE INDEX idx_direction_folder ON emails(direction, folder)`); } catch (e) { }
            try { await connection.execute(`CREATE INDEX idx_message_id ON emails(message_id)`); } catch (e) { }

        } catch (e: any) {
            results.push(`emails error: ${e.message}`);
        }

        // 3. Add received_at separate step
        try {
            await connection.execute(`
                ALTER TABLE emails
                ADD COLUMN received_at DATETIME NULL AFTER sent_at;
            `);
            results.push("Added received_at to emails");
        } catch (e: any) {
            results.push(`received_at error: ${e.message}`);
        }

        return NextResponse.json({ success: true, results });
    } finally {
        connection.release();
    }
}
