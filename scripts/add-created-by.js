const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Checking Schema for Created By ===\n');

    const [stageCols] = await connection.execute('SHOW COLUMNS FROM lead_stages');
    const hasStageCreatedBy = stageCols.some(c => c.Field === 'created_by');
    console.log(`lead_stages has created_by: ${hasStageCreatedBy}`);

    const [scoreCols] = await connection.execute('SHOW COLUMNS FROM lead_scores');
    const hasScoreCreatedBy = scoreCols.some(c => c.Field === 'created_by');
    console.log(`lead_scores has created_by: ${hasScoreCreatedBy}`);

    if (!hasStageCreatedBy) {
        console.log('Adding created_by to lead_stages...');
        await connection.execute('ALTER TABLE lead_stages ADD COLUMN created_by INT NULL');
    }

    if (!hasScoreCreatedBy) {
        console.log('Adding created_by to lead_scores...');
        await connection.execute('ALTER TABLE lead_scores ADD COLUMN created_by INT NULL');
    }

    await connection.end();
}

checkSchema().catch(console.error);
