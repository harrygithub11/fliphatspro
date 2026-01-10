
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const attempts = [
    { host: '127.0.0.1', port: 3306 },
    { host: '127.0.0.1', port: 3307 },
    { host: 'localhost', port: 3306 },
    { host: 'localhost', port: 3307 }
];

async function findConnection() {
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD ?? 'admin';
    const database = process.env.DB_NAME || 'newyear';

    console.log(`Trying to connect with User: ${user}, DB: ${database}...`);

    for (const config of attempts) {
        try {
            console.log(`Attempting ${config.host}:${config.port}...`);
            const conn = await mysql.createConnection({
                ...config,
                user,
                password,
                database
            });
            console.log(`SUCCESS! Connected to ${config.host}:${config.port}`);
            await conn.end();
            process.exit(0);
        } catch (e: any) {
            console.log(`Failed ${config.host}:${config.port}: ${e.message}`);
        }
    }
    console.error("All attempts failed.");
    process.exit(1);
}

findConnection();
