
import mysql from 'mysql2/promise'

async function migrate() {
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

        // 1. Add created_by column to marketing_campaign
        try {
            await connection.execute(`
                ALTER TABLE marketing_campaign
                ADD COLUMN created_by INT NULL AFTER accountId,
                ADD INDEX idx_creator (created_by)
            `);
            console.log('Column created_by added to marketing_campaign.');
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('Column created_by already exists.');
            } else {
                console.error('Error adding column:', e);
            }
        }

        // 2. Backfill with a default user (e.g., 1 or find from smtp_account)
        // We can join with smtp_accounts to guess the user?
        // smtp_accounts has created_by.
        console.log('Backfilling created_by...');
        await connection.execute(`
            UPDATE marketing_campaign c
            JOIN smtp_accounts a ON c.accountId = a.id
            SET c.created_by = a.created_by
            WHERE c.created_by IS NULL
        `);
        console.log('Backfill complete.');

    } catch (e) {
        console.error('Migration Error:', e);
    } finally {
        if (connection) connection.end();
    }
}

migrate();
