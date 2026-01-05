const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectPage() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await connection.execute('SELECT content FROM landing_pages WHERE slug = ?', ['ai-launch-2026']);
        if (rows.length > 0) {
            const content = rows[0].content; // JSON is automatically parsed by mysql2 usually if column type is JSON, else string
            const parsed = typeof content === 'string' ? JSON.parse(content) : content;
            console.log('FAQ Data:', JSON.stringify(parsed.faq, null, 2));
        } else {
            console.log('Page not found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

inspectPage();
