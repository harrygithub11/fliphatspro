import 'dotenv/config';
import mysql from 'mysql2/promise';

async function check() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    try {
        const [rows] = await connection.execute("SHOW TABLES LIKE 'platform_settings'");
        console.log('Tables found:', rows);

        // Also try to select
        try {
            const [data] = await connection.execute("SELECT * FROM platform_settings");
            console.log('Data:', data);
        } catch (e) {
            console.error('Select failed:', e);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await connection.end();
    }
}

check();
