const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
    console.log('Checking last sent email details...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
        const [rows] = await connection.execute(
            'SELECT id, subject, recipient_to, status, sent_at, headers_json FROM emails WHERE status = "sent" ORDER BY id DESC LIMIT 1'
        );

        if (rows.length > 0) {
            console.log('Last Email:', rows[0]);
            console.log('Response Details:', JSON.stringify(rows[0].headers_json, null, 2));
        } else {
            console.log('No sent emails found.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await connection.end();
    }
}

run();
