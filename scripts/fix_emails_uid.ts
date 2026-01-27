import mysql from 'mysql2/promise';

async function main() {
    const c = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'dbfliphats'
    });

    console.log('=== Adding uid to emails table ===\n');

    try {
        await c.execute(`ALTER TABLE emails ADD COLUMN uid INT DEFAULT NULL`);
        console.log(`✅ Added emails.uid`);

        // Add index for performance since we query by uid
        await c.execute(`ALTER TABLE emails ADD INDEX idx_uid (uid)`);
        console.log(`✅ Added index on emails.uid`);

        // Also ensure compound index for uniqueness per account/folder if possible, 
        // but for now simple index is enough to fix the crash.
        // Usually UID is unique per Folder. 
        await c.execute(`ALTER TABLE emails ADD UNIQUE INDEX idx_account_folder_uid (smtp_account_id, folder, uid)`);
        console.log(`✅ Added unique index on (smtp_account_id, folder, uid)`);

    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log(`⏭️  emails.uid already exists`);
        } else if (e.code === 'ER_DUP_KEYNAME') {
            console.log(`⏭️  Index already exists`);
        } else {
            console.log(`❌ Error: ${e.message}`);
        }
    }

    console.log('\n✅ Done!');
    c.end();
}

main().catch(console.error);
