
import mysql from 'mysql2/promise'

async function fixEmailsTable() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'flipuser',
            password: 'flippass123',
            database: 'fliphatspro'
        });
        console.log('Connected to DB');

        // 1. Check for duplicates and keep only the latest one
        // Group by smtp_account_id, uid, folder.

        console.log('Identifying duplicates...');
        const [dups]: any = await connection.execute(`
            SELECT smtp_account_id, uid, folder, COUNT(*) as c, MAX(id) as max_id
            FROM emails
            GROUP BY smtp_account_id, uid, folder
            HAVING c > 1
        `);

        console.log(`Found ${dups.length} groups with duplicates.`);

        for (const d of dups) {
            console.log(`Deleting duplicates for uid=${d.uid}, folder=${d.folder}...`);
            // Keep max_id, delete others
            await connection.execute(`
                DELETE FROM emails 
                WHERE smtp_account_id = ? AND uid = ? AND folder = ? AND id != ?
            `, [d.smtp_account_id, d.uid, d.folder, d.max_id]);
        }

        console.log('Duplicates removed.');

        // 2. Add Unique Index
        try {
            await connection.execute(`
                ALTER TABLE emails
                ADD UNIQUE INDEX idx_emails_uid_folder (smtp_account_id, uid, folder)
            `);
            console.log('Unique Index added successfully.');
        } catch (e: any) {
            if (e.code === 'ER_DUP_KEY') {
                console.error('Duplicate key error still present!');
            } else if (e.message.includes('Duplicate key name')) {
                console.log('Index already exists.');
            } else {
                console.error('Error adding index:', e);
            }
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (connection) connection.end();
    }
}

fixEmailsTable();
