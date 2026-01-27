
import pool from '../lib/db';

async function migrate() {
    console.log('Checking emails table for attachment_count column...');
    try {
        const [rows]: any = await pool.execute(`SHOW COLUMNS FROM emails LIKE 'attachment_count'`);
        if (rows.length === 0) {
            console.log('Column missing. Adding attachment_count...');
            await pool.execute(`ALTER TABLE emails ADD COLUMN attachment_count INT DEFAULT 0`);
            console.log('Column added successfully.');
        } else {
            console.log('Column already exists.');
        }

        // Also verify 'recipient_to' if needed, but error was specific to attachment_count

        console.log('Migration complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
