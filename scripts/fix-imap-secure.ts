
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function fixImapSecure() {
    let connection;
    try {
        console.log("Connecting to DB...");
        connection = await mysql.createConnection({
            uri: process.env.DATABASE_URL
        });

        console.log("Updating 'imap_secure' for fliphat/test accounts...");
        const [result]: any = await connection.execute(
            "UPDATE smtp_accounts SET imap_secure = 1 WHERE from_email LIKE '%fliphat%' OR from_email LIKE '%test%'"
        );

        console.log(`Updated ${result.changedRows} rows.`);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

fixImapSecure();
