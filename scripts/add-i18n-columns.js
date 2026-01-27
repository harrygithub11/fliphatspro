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

        console.log('Starting Internationalization Migration...');

        // 1. Add Currency to Tenants
        // We add it to 'tenants' table as a default for the workspace
        // site_settings is Key-Value, so we don't ADD COLUMN, we just insert row if needed (handled by app logic usually)
        // But having a structured column in tenants is better for joins.
        try {
            const [cols] = await connection.execute("SHOW COLUMNS FROM tenants LIKE 'currency'");
            if (cols.length === 0) {
                console.log('Adding currency to tenants...');
                await connection.execute("ALTER TABLE tenants ADD COLUMN currency VARCHAR(10) DEFAULT 'USD'");
                console.log('✅ Added currency to tenants (Default: USD)');
            } else {
                console.log('ℹ️  tenants.currency already exists');
            }
        } catch (e) {
            console.error('Error updating tenants:', e.message);
        }

        // 2. Add Timezone to Users
        try {
            const [cols] = await connection.execute("SHOW COLUMNS FROM users LIKE 'timezone'");
            if (cols.length === 0) {
                console.log('Adding timezone to users...');
                // Defaulting to UTC
                await connection.execute("ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC'");
                console.log('✅ Added timezone to users (Default: UTC)');
            } else {
                console.log('ℹ️  users.timezone already exists');
            }
        } catch (e) {
            console.error('Error updating users:', e.message);
        }

        console.log('Migration Complete.');

    } catch (error) {
        console.error('Fatal Migration Error:', error);
    } finally {
        if (connection) await connection.end();
    }
})();
