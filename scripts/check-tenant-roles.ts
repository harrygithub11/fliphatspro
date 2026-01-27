import 'dotenv/config';
import mysql from 'mysql2/promise';

async function check() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    try {
        const [rows] = await connection.execute("SHOW TABLES LIKE 'tenant_roles'");
        console.log('Tables found:', rows);

        try {
            const [data] = await connection.execute("SELECT * FROM tenant_roles");
            console.log('Data count:', Array.isArray(data) ? data.length : 0);
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
