
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function fixSchema() {
    let connection;
    try {
        console.log("Connecting to DB...");
        connection = await mysql.createConnection({
            uri: process.env.DATABASE_URL
        });

        console.log("Adding 'last_sync' column to 'smtp_accounts'...");
        try {
            await connection.execute("ALTER TABLE smtp_accounts ADD COLUMN last_sync DATETIME NULL");
            console.log("Column added successfully.");
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("Column already exists.");
            } else {
                console.error("Failed to add column:", e);
            }
        }

    } catch (e) {
        console.error("Script Error:", e);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

fixSchema();
