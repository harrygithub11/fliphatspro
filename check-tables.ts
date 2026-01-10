
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();


async function checkTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'usernewyear',
        password: process.env.DB_PASSWORD || 'NEWyear11@@',
        database: process.env.DB_NAME || 'newyear'
    });
    const [rows]: any = await connection.execute('SHOW TABLES');
    console.log('Tables:', rows.map((r: any) => Object.values(r)[0]));
    await connection.end();
}

checkTables().catch(console.error);
