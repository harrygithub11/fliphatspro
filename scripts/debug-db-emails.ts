
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkEmails() {
    let connection;
    try {
        console.log("Connecting to DB...");
        // Handle potential parsing issue if DATABASE_URL has schema
        connection = await mysql.createConnection({
            uri: process.env.DATABASE_URL
        });

        console.log("Checking 'emails' table count...");
        const [rows]: any = await connection.execute("SELECT COUNT(*) as count FROM emails");
        console.log("Total emails in DB:", rows[0].count);

        console.log("Listing columns of 'smtp_accounts'...");
        const [columns]: any = await connection.execute("SHOW COLUMNS FROM smtp_accounts");
        console.log("Columns:", columns.map((c: any) => c.Field));

        console.log("Fetching first account...");
        const [accounts]: any = await connection.execute("SELECT * FROM smtp_accounts LIMIT 1");
        if (accounts.length > 0) {
            console.log("First Account:", accounts[0]);
        } else {
            console.log("No accounts found.");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

checkEmails();
