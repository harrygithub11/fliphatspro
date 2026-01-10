const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
    console.log('Connecting to DB...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
        const sql = fs.readFileSync(path.join(__dirname, '../migrations/add_imap_support.sql'), 'utf8');
        // Simple splitting by semicolon (careful with stored procs, but fine here)
        const statements = sql.split(';').filter(s => s.trim());

        for (const statement of statements) {
            console.log('Running:', statement.substring(0, 50) + '...');
            try {
                await connection.execute(statement);
            } catch (err) {
                // Ignore "duplicate column" errors if ran user ran it twice
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('Column already exists, skipping.');
                } else {
                    throw err;
                }
            }
        }
        console.log('✅ IMAP Schema Applied!');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await connection.end();
    }
}

run();
