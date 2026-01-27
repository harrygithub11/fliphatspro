const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixTenantsTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Fixing Tenants Table ===\n');

    try {
        await connection.execute('ALTER TABLE tenants ADD COLUMN domain_slug VARCHAR(255) NULL');
        console.log('   ✓ Added domain_slug column');
    } catch (e) {
        if (e.errno === 1060) console.log('   ✓ domain_slug already exists');
        else console.error('   ✗ domain_slug:', e.message);
    }

    await connection.end();
}

fixTenantsTable().catch(console.error);
