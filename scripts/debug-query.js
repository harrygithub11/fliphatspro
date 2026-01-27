const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugQuery() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    const targetId = 2;
    const targetTenantId = 'ba60a2bc-2921-43f5-aa81-65dc7ba298e7';

    console.log(`=== Debugging Query for ID ${targetId} ===\n`);
    console.log(`Target Tenant ID: '${targetTenantId}'`);

    // 1. Check raw row
    const [raw] = await connection.execute('SELECT id, tenant_id, deleted_at FROM customers WHERE id = ?', [targetId]);
    if (raw.length === 0) {
        console.log('❌ Raw row NOT found!');
        process.exit(1);
    }
    const row = raw[0];
    console.log('Raw Row Data:');
    console.log(`- ID: ${row.id}`);
    console.log(`- Tenant ID: '${row.tenant_id}' (Length: ${row.tenant_id.length})`);
    console.log(`- Deleted At: ${row.deleted_at}`);

    // Check for whitespace
    if (row.tenant_id !== targetTenantId) {
        console.log('⚠️  TENANT ID MISMATCH!');
        console.log(`Expected: '${targetTenantId}'`);
        console.log(`Actual:   '${row.tenant_id}'`);

        // Byte comparison
        console.log('Byte comparison:');
        for (let i = 0; i < Math.max(targetTenantId.length, row.tenant_id.length); i++) {
            if (targetTenantId.charCodeAt(i) !== row.tenant_id.charCodeAt(i)) {
                console.log(`Position ${i}: Expected ${targetTenantId.charCodeAt(i)} vs Actual ${row.tenant_id.charCodeAt(i)}`);
            }
        }
    } else {
        console.log('✅ Tenant ID matches exactly (string equality check).');
    }

    // 2. Run Exact Query
    console.log('\nRunning API Query:');
    const query = 'SELECT * FROM customers WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL';
    const params = [targetId, targetTenantId];
    console.log(`SQL: ${query}`);
    console.log(`Params: [${params.join(', ')}]`);

    const [results] = await connection.execute(query, params);

    if (results.length > 0) {
        console.log('✅ Query SUCCESS! Returned 1 row.');
        console.log('The API *should* allow this.');
    } else {
        console.log('❌ Query FAILED! Returned 0 rows.');
        if (row.deleted_at !== null) console.log('   Reason: deleted_at is NOT NULL');
        else if (row.tenant_id !== targetTenantId) console.log('   Reason: tenant_id mismatch');
        else console.log('   Reason: Unknown?');
    }

    await connection.end();
}

debugQuery().catch(console.error);
