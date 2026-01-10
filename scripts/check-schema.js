const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
    console.log('Connecting to DB to check schema...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
        const [rows] = await connection.execute('DESCRIBE email_send_jobs');
        console.table(rows);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await connection.end();
    }
}

run();
