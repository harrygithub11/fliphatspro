
import * as dotenv from 'dotenv';
dotenv.config();
import pool from './lib/db';

async function checkMigration() {
    try {
        console.log("Checking for IMAP columns...");
        const connection = await pool.getConnection();

        try {
            // Try selecting new columns
            await connection.execute('SELECT imap_host FROM smtp_accounts LIMIT 1');
            console.log("Migration verification passed: smtp_accounts.imap_host exists.");
        } catch (e: any) {
            console.error("smtp_accounts check failed:", e.message);
        }

        try {
            await connection.execute('SELECT direction FROM emails LIMIT 1');
            console.log("Migration verification passed: emails.direction exists.");
        } catch (e: any) {
            console.error("emails check failed:", e.message);
        }

        connection.release();
    } catch (e) {
        console.error("Connection error:", e);
    } finally {
        process.exit();
    }
}

checkMigration();
