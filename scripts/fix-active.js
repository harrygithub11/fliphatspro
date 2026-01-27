const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixActiveStatus() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Fixing is_active for custom stages ===\n');

    const [result] = await connection.execute(
        'UPDATE lead_stages SET is_active = 1 WHERE is_active IS NULL OR is_active = 0'
    );
    console.log(`Updated ${result.affectedRows} stages.`);

    const [resultScore] = await connection.execute(
        'UPDATE lead_scores SET is_active = 1 WHERE is_active IS NULL OR is_active = 0'
    );
    console.log(`Updated ${resultScore.affectedRows} scores.`);

    await connection.end();
}

fixActiveStatus().catch(console.error);
