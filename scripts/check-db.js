const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3307'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD ?? 'admin',
        database: process.env.DB_NAME || 'newyear',
    });

    try {
        const [rows] = await connection.execute('SELECT slug, content FROM landing_pages');
        rows.forEach(row => {
            console.log(`--- Slug: ${row.slug} ---`);
            try {
                const content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
                console.log(JSON.stringify(content, null, 2));
            } catch (e) {
                console.log('Error parsing content:', e.message);
                console.log('Raw content:', row.content);
            }
        });
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

check();
