const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPages() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await connection.execute('SELECT id, slug, name, is_active FROM landing_pages');
        console.log('Total Pages Found:', rows.length);
        console.table(rows);
    } catch (error) {
        console.error('Error fetching pages:', error);
    } finally {
        await connection.end();
    }
}

checkPages();
