const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
    console.log('Connecting to DB...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
        const sql = fs.readFileSync(path.join(__dirname, '../migrations/fix_email_jobs_schema.sql'), 'utf8');
        const statements = sql.split(';').filter(s => s.trim());

        for (const statement of statements) {
            console.log('Running:', statement.substring(0, 50) + '...');
            await connection.execute(statement);
        }
        console.log('✅ Schema Fix Applied!');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await connection.end();
    }
}

run();
