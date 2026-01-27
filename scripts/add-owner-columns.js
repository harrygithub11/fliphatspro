const mysql = require('mysql2/promise');

(async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'flipuser',
            password: 'flippass123',
            database: 'fliphatspro'
        });

        const migrations = [
            {
                table: 'orders',
                column: 'created_by',
                definition: 'INT NULL',
                description: 'User who created the order'
            },
            {
                table: 'files',
                column: 'created_by',
                definition: 'INT NULL',
                description: 'User who uploaded the file'
            },
            {
                table: 'customers',
                column: 'owner_id', // keeping terminology 'owner' for leads/customers often used in CRM
                definition: 'INT NULL',
                description: 'User assigned as owner of the lead/customer'
            }
        ];

        console.log('Starting Database Hardening Migration...');

        for (const m of migrations) {
            try {
                // Check if column exists
                const [cols] = await connection.execute(`SHOW COLUMNS FROM ${m.table} LIKE '${m.column}'`);

                if (cols.length === 0) {
                    console.log(`Adding ${m.column} to ${m.table}...`);
                    await connection.execute(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.definition}`);
                    console.log(`✅ Added ${m.column} to ${m.table}`);
                } else {
                    console.log(`ℹ️  ${m.table}.${m.column} already exists`);
                }

                // Add index for performance on filtering by owner
                const indexName = `idx_${m.table}_${m.column}`;
                const [indexes] = await connection.execute(`SHOW INDEX FROM ${m.table} WHERE Key_name = '${indexName}'`);

                if (indexes.length === 0) {
                    await connection.execute(`ALTER TABLE ${m.table} ADD INDEX ${indexName} (${m.column})`);
                    console.log(`✅ Added index ${indexName}`);
                }

            } catch (err) {
                console.error(`❌ Error migrating ${m.table}:`, err.message);
            }
        }

        console.log('Migration Complete.');

    } catch (error) {
        console.error('Fatal Migration Error:', error);
    } finally {
        if (connection) await connection.end();
    }
})();
