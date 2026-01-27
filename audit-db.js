const mysql = require('mysql2/promise');

(async () => {
    try {
        const c = await mysql.createConnection({ host: '127.0.0.1', user: 'flipuser', password: 'flippass123', database: 'fliphatspro' });

        const [tables] = await c.execute('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);

        console.log('Database Isolation Audit:');
        console.log('-------------------------');
        console.log(`Analyzing ${tableNames.length} tables...\n`);

        const results = [];

        for (const t of tableNames) {
            const [cols] = await c.execute(`SHOW COLUMNS FROM ${t}`);
            const colNames = cols.map(c => c.Field);

            const hasTenant = colNames.includes('tenant_id');
            const ownerCol = colNames.find(c => ['created_by', 'user_id', 'assigned_to', 'admin_id'].includes(c));

            results.push({
                table: t,
                hasTenant,
                ownerCol: ownerCol || null
            });
        }

        // Group by status
        const properIsolation = results.filter(r => r.hasTenant && r.ownerCol);
        const tenantOnly = results.filter(r => r.hasTenant && !r.ownerCol);
        const noIsolation = results.filter(r => !r.hasTenant);

        console.log(`✅ Fully Isolated (Tenant + User): ${properIsolation.length}`);
        properIsolation.forEach(r => console.log(`  - ${r.table} (Owner: ${r.ownerCol})`));

        console.log(`\n⚠️ Tenant Only (Shared within Tenant): ${tenantOnly.length}`);
        tenantOnly.forEach(r => console.log(`  - ${r.table}`));

        console.log(`\n❌ Global / No Isolation (Critical Check Needed): ${noIsolation.length}`);
        noIsolation.forEach(r => console.log(`  - ${r.table}`));

        await c.end();
    } catch (e) {
        console.error('Audit Error:', e);
    }
})();
