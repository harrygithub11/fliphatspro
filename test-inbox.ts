
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function debug() {
    let connection;
    try {
        console.log("Debugging Inbox Query...");
        connection = await mysql.createConnection(process.env.DATABASE_URL!);

        const folder = 'INBOX';
        const accountId = 'all'; // or a specific ID

        let query = `
            SELECT 
                e.id, e.subject, e.is_read, e.thread_id, e.folder, e.smtp_account_id
            FROM emails e
            INNER JOIN (
                SELECT MAX(id) as last_id
                FROM emails
                WHERE 1=1
                AND folder = ?
                GROUP BY thread_id
            ) t ON e.id = t.last_id
        `;

        const [rows]: any = await connection.execute(query, [folder]);
        console.log("Rows returned:", rows.length);
        console.log("Sample row:", JSON.stringify(rows[0]));

        // Check unread count logic
        const [counts]: any = await connection.execute('SELECT COUNT(*) as count FROM emails WHERE folder = ? AND is_read = 0', [folder]);
        console.log("Unread count for folder INBOX:", counts[0].count);

    } catch (e) {
        console.error("Debug failed:", e);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}
debug();
