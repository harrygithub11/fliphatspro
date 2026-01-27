
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function fixSchemaImapSecure() {
    let connection;
    try {
        console.log("Connecting to DB...");
        connection = await mysql.createConnection({
            uri: process.env.DATABASE_URL
        });

        console.log("Adding 'imap_secure' column to 'smtp_accounts'...");
        try {
            // Add imap_secure as BOOLEAN (TINYINT(1)) defaulting to 1 (Secure by default for modern email)
            await connection.execute("ALTER TABLE smtp_accounts ADD COLUMN imap_secure TINYINT(1) DEFAULT 1");
            console.log("Column 'imap_secure' added successfully.");
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("Column 'imap_secure' already exists.");
            } else {
                console.error("Failed to add column:", e);
            }
        }

        console.log("Setting 'imap_secure' to 1 for all accounts...");
        await connection.execute("UPDATE smtp_accounts SET imap_secure = 1");
        console.log("Updated accounts.");

    } catch (e) {
        console.error("Script Error:", e);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

fixSchemaImapSecure();
