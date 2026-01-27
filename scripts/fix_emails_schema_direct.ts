
import mysql from 'mysql2/promise';

async function migrate() {
    console.log('Connecting to database (Hardcoded)...');

    const pool = mysql.createPool({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'dbfliphats',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    console.log('Checking emails table for is_read column...');
    try {
        const [rows]: any = await pool.execute(`SHOW COLUMNS FROM emails LIKE 'is_read'`);
        if (rows.length === 0) {
            console.log('Column missing. Adding is_read...');
            await pool.execute(`ALTER TABLE emails ADD COLUMN is_read BOOLEAN DEFAULT FALSE`);
            console.log('Column added successfully.');
        } else {
            console.log('Column already exists.');
        }

        console.log('Migration complete.');
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
