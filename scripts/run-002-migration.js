const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3307,
        user: 'root',
        password: 'admin',
        database: 'newyear',
        multipleStatements: true
    });

    try {
        const sqlPath = path.join(__dirname, '../migrations/002_add_logging_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration: 002_add_logging_tables.sql');
        await connection.query(sql);
        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await connection.end();
    }
}

runMigration();
