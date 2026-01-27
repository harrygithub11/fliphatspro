const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectStages() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Inspecting All Stages ===\n');
    const [rows] = await connection.execute('SELECT id, value, label, is_active, tenant_id FROM lead_stages');
    console.log(JSON.stringify(rows, null, 2));

    await connection.end();
}

inspectStages().catch(console.error);
