const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkConfigTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Checking Config Tables ===\n');

    // Guessing table names based on standard CRM patterns
    // Usually 'pipeline_stages' or 'stages', 'lead_scores' or 'scores'

    // List tables to find potential matches
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('Tables:', tableNames.join(', '));

    // Check Stages
    const stageTable = tableNames.find(t => t.includes('stage'));
    if (stageTable) {
        console.log(`\n--- ${stageTable} ---`);
        const [rows] = await connection.execute(`SELECT * FROM ${stageTable}`);
        console.table(rows);
    } else {
        console.log('\n❌ No stage table found');
    }

    // Check Scores
    const scoreTable = tableNames.find(t => t.includes('score'));
    if (scoreTable) {
        console.log(`\n--- ${scoreTable} ---`);
        const [rows] = await connection.execute(`SELECT * FROM ${scoreTable}`);
        console.table(rows);
    } else {
        console.log('\n❌ No score table found');
    }

    await connection.end();
}

checkConfigTables().catch(console.error);
