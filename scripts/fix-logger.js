const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixActivityLogFK() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Dropping FK Constraint on admin_activity_logs ===\n');

    try {
        // Need to know the constraint name. The log said "admin_activity_logs_admin_id_fkey".
        await connection.execute('ALTER TABLE admin_activity_logs DROP FOREIGN KEY admin_activity_logs_admin_id_fkey');
        console.log('Constraint dropped successfully.');
    } catch (e) {
        console.log('Error dropping constraint (might not exist):', e.message);

        // Try to verify if it exists under another name or already gone
        try {
            await connection.execute('ALTER TABLE admin_activity_logs DROP FOREIGN KEY admin_activity_logs_ibfk_1'); // Common default
            console.log('Dropped default constraint name.');
        } catch (e2) {
            // Ignore
        }
    }

    await connection.end();
}

fixActivityLogFK().catch(console.error);
