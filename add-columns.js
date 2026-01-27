const mysql = require('mysql2/promise');

(async () => {
    try {
        const c = await mysql.createConnection({ host: '127.0.0.1', user: 'flipuser', password: 'flippass123', database: 'fliphatspro' });
        console.log('Adding columns to emails table...');

        const queries = [
            'ALTER TABLE emails ADD COLUMN uid INT',
            'ALTER TABLE emails ADD COLUMN folder VARCHAR(255) DEFAULT "INBOX"',
            'ALTER TABLE emails ADD COLUMN has_attachments BOOLEAN DEFAULT FALSE',
            'ALTER TABLE emails ADD COLUMN attachment_count INT DEFAULT 0'
        ];

        for (const q of queries) {
            try {
                await c.execute(q);
                console.log('Success:', q);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log('Column already exists, skipping:', q);
                } else {
                    console.error('Error executing:', q, e.message);
                }
            }
        }

        // Add unique index for upsert compatibility
        try {
            await c.execute('create unique index uq_emails_account_uid on emails (smtp_account_id, uid, folder)');
            console.log('Added unique index for upsert');
        } catch (e) {
            console.log('Index error (maybe exists):', e.message);
        }

        console.log('Done!');
        await c.end();
    } catch (e) {
        console.error('Connection error:', e);
    }
})();
