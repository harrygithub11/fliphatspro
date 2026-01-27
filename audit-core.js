const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
    try {
        const c = await mysql.createConnection({ host: '127.0.0.1', user: 'flipuser', password: 'flippass123', database: 'fliphatspro' });

        const tables = ['orders', 'tasks', 'files', 'customers', 'leads', 'emails', 'interactions', 'site_settings', 'users'];
        let output = 'Core Business Table Audit:\n--------------------------\n';

        for (const t of tables) {
            try {
                const [cols] = await c.execute(`SHOW COLUMNS FROM ${t}`);
                const fields = cols.map(c => c.Field);

                const hasTenant = fields.includes('tenant_id');
                const owner = fields.find(f => ['created_by', 'user_id', 'assigned_to', 'admin_id'].includes(f));

                output += `${t.padEnd(15)} | Tenant: ${hasTenant ? '✅' : '❌'} | Owner: ${owner || '❌'}\n`;
            } catch (e) {
                if (e.code === 'ER_NO_SUCH_TABLE') {
                    if (t !== 'leads') output += `${t.padEnd(15)} | Table Missing ❌\n`;
                } else {
                    console.error(e);
                }
            }
        }
        await c.end();
        fs.writeFileSync('audit-db.txt', output);
        console.log('DB Audit written to audit-db.txt');
    } catch (e) {
        console.error(e);
    }
})();
