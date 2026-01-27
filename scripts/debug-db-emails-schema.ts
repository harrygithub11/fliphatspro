
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkSchema() {
    let connection;
    try {
        console.log("Connecting to DB...");
        connection = await mysql.createConnection({
            uri: process.env.DATABASE_URL
        });

        console.log("Listing columns of 'emails'...");
        const [columns]: any = await connection.execute("SHOW COLUMNS FROM emails");

        columns.forEach((c: any) => {
            console.log(`- ${c.Field}: ${c.Type} (Null: ${c.Null}, Key: ${c.Key})`);
        });

    } catch (e) {
        console.error("Error:", e);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

checkSchema();
