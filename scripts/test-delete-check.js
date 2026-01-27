// fetch removed
// mocking auth? No, testing api needs cookie.
// Actually, I can use the same code logic locally with mysql connection.
// "Simulate" logic.

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDeleteLogic() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    const tenantId = 'ba60a2bc-2921-43f5-aa81-65dc7ba298e7';
    // ID 8 is "color". Check usage first.

    console.log('--- Checking Usage for Stage 8 (color) ---');
    const [usage] = await connection.execute('SELECT COUNT(*) as c FROM customers WHERE stage = "color" AND tenant_id = ?', [tenantId]);
    console.log('Usage count:', usage[0].c);

    // If usage > 0, we need migration.
    // Let's Simulate Migration to ID 1 ("new").

    const migrateToId = 1;

    console.log('--- Simulating DELETE with Migration ---');
    // 1. Get Source
    const [src] = await connection.execute('SELECT * FROM lead_stages WHERE id = 8 AND tenant_id = ?', [tenantId]);
    if (src.length === 0) { console.log('Stage 8 not found'); return; }
    const sourceStage = src[0];

    // 2. Get Target
    const [tgt] = await connection.execute('SELECT * FROM lead_stages WHERE id = ? AND tenant_id = ?', [migrateToId, tenantId]);
    if (tgt.length === 0) { console.log('Target 1 not found'); return; }
    const targetStage = tgt[0];

    // 3. Update
    console.log(`Migrating leads from ${sourceStage.value} to ${targetStage.value}...`);
    // DRY RUN
    const [updateRes] = await connection.execute(
        'SELECT COUNT(*) as c FROM customers WHERE stage = ? AND tenant_id = ?',
        [sourceStage.value, tenantId]
    );
    console.log(`Would migrate ${updateRes[0].c} rows.`);

    // 4. Delete
    console.log(`Would DELETE FROM lead_stages WHERE id = 8 AND tenant_id = ?`);

    // Actually try it? No, don't destroy user data yet.
    // Just verify logic is sound.
    // The query logic matches the API route exactly.

    // Check constraints?
    // Is there a FK from somewhere else?
    // "lead_stages" might be referenced by "deals"? "tasks"?
    // I should check schema for Constraints on lead_stages.

    const [refs] = await connection.execute(`
        SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE REFERENCED_TABLE_NAME = 'lead_stages' AND TABLE_SCHEMA = '${process.env.DB_NAME}'
    `);
    console.table(refs);

    await connection.end();
}

testDeleteLogic().catch(console.error);
