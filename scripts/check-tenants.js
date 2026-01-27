const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectData() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Stages ===');
    const [stages] = await connection.execute('SELECT id, value, tenant_id FROM lead_stages');
    console.table(stages);

    console.log('\n=== Scores ===');
    const [scores] = await connection.execute('SELECT id, value, tenant_id FROM lead_scores');
    console.table(scores);

    await connection.end();
}

inspectData().catch(console.error);
