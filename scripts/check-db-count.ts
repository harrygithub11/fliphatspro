
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkDB() {
    let connection;
    try {
        connection = await mysql.createConnection({ uri: process.env.DATABASE_URL });

        const [count]: any = await connection.execute("SELECT COUNT(*) as total FROM emails");
        console.log(`Total emails in database: ${count[0].total}`);

        const [folders]: any = await connection.execute("SELECT folder, COUNT(*) as cnt FROM emails GROUP BY folder");
        console.log("\nEmails by folder:");
        folders.forEach((f: any) => console.log(`  - ${f.folder}: ${f.cnt}`));

    } catch (e: any) {
        console.error("Error:", e.message);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

checkDB();
