const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'newyear',
        port: process.env.DB_PORT || 3306,
    };

    console.log('Connecting to database...', { ...config, password: '***' });

    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected!');

        const sql = fs.readFileSync(path.join(__dirname, '../migrations/update_stage_enum.sql'), 'utf8');
        console.log('Executing migration: update_stage_enum.sql');

        await connection.query(sql);

        console.log('Migration successful: Extended stage enum values.');
        await connection.end();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
