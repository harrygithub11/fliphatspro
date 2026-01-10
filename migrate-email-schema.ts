
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from current directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function migrate() {
    console.log("Starting Email Schema Migration...");

    // Check if DATABASE_URL is present
    if (!process.env.DATABASE_URL) {
        console.error("Error: DATABASE_URL not found in environment.");
        process.exit(1);
    }

    let connection;
    try {
        connection = await mysql.createConnection({
            uri: process.env.DATABASE_URL
        });

        console.log("Connected to Database.");

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
            console.log("Added IMAP columns to smtp_accounts");
        } catch (e: any) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log(`smtp_accounts error: ${e.message}`);
        }

        // 2. Add columns to emails
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
            console.log("Added core columns to emails");
        } catch (e: any) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log(`emails core columns error: ${e.message}`);
        }

        // 3. Add received_at (The one that was missing)
        try {
            await connection.execute(`
                ALTER TABLE emails
                ADD COLUMN received_at DATETIME NULL AFTER sent_at;
            `);
            console.log("SUCCESS: Added received_at column.");
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("Column received_at already exists.");
            } else {
                console.error("received_at Error:", e.message);
            }
        }

    } catch (e: any) {
        console.error("Database Connection/Migration Failed:", e.message);
    } finally {
        if (connection) await connection.end();
        console.log("Migration script finished.");
        process.exit(0);
    }
}

migrate();
