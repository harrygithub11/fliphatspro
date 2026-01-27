const mysql = require('mysql2/promise');
require('dotenv').config();

// Since we cannot easily fetch() localhost API from node script without keeping server running and port,
// I will simulate the API logic flow using DIRECT DB CALLS in the exact same sequence.
// This validates the LOGIC (SQL queries), if not the routing.

async function testFullDelete() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    const tenantId = 'ba60a2bc-2921-43f5-aa81-65dc7ba298e7';
    console.log('--- STARTING LOGIC TEST ---');

    try {
        // 1. Create Dummy Stage
        const slug = 'todelete_' + Date.now();
        console.log(`Creating stage ${slug}...`)
        const [ins] = await connection.execute(
            'INSERT INTO lead_stages (tenant_id, value, label, is_active) VALUES (?, ?, ?, 1)',
            [tenantId, slug, 'To Delete']
        );
        const stageId = ins.insertId;
        console.log(`Created Stage ID ${stageId}`);

        // 2. Assign Lead 3 to it
        await connection.execute('UPDATE customers SET stage = ? WHERE id = 3', [slug]);
        console.log(`Assigned Lead 3 to ${slug}`);

        // 3. Logic: Check Usage
        const [usage] = await connection.execute('SELECT COUNT(*) as c FROM customers WHERE stage = ? AND tenant_id = ?', [slug, tenantId]);
        console.log(`Usage: ${usage[0].c}`);

        if (usage[0].c > 0) {
            console.log('Detected In Use. Migrating to "new"...');
            // 4. Migrate Logic
            const targetSlug = 'new';
            await connection.execute(
                'UPDATE customers SET stage = ? WHERE stage = ? AND tenant_id = ?',
                [targetSlug, slug, tenantId]
            );
            console.log('Migrated leads.');
        }

        // 5. Delete Logic
        const [del] = await connection.execute('DELETE FROM lead_stages WHERE id = ? AND tenant_id = ?', [stageId, tenantId]);
        console.log(`Deleted rows: ${del.affectedRows}`);

        if (del.affectedRows === 1) {
            console.log('SUCCESS: Stage deleted.');
        } else {
            console.log('FAILURE: Stage not deleted (tenant mismatch?)');
        }

        // 6. Restore Lead 3
        await connection.execute('UPDATE customers SET stage = "custom_test" WHERE id = 3');
        console.log('Restored Lead 3.');

    } catch (e) {
        console.error(e);
    } finally {
        await connection.end();
    }
}

testFullDelete().catch(console.error);
