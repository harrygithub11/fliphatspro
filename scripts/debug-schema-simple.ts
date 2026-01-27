
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkSchema() {
    let connection;
    try {
        console.log("Connecting...");
        connection = await mysql.createConnection({
            uri: process.env.DATABASE_URL
        });

        console.log("Describing 'emails' table...");
        const [columns]: any = await connection.execute("DESCRIBE emails");

        columns.forEach((c: any) => {
            console.log(`${c.Field}: ${c.Type}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

checkSchema();
