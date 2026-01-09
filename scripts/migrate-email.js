const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Robust env loading
require('dotenv').config({ path: require('fs').existsSync('.env') ? '.env' : '.env.local' });

async function migrate() {
    console.log('Starting Enterprise Email System migration...');
    console.log('Connecting via DATABASE_URL...');

    let connection;
    try {
        connection = await mysql.createConnection({
            uri: process.env.DATABASE_URL,
            multipleStatements: true
        });

        try {
            const migrationPath = path.join(__dirname, '..', 'migrations', 'enterprise_email.sql');
            const sql = fs.readFileSync(migrationPath, 'utf8');

            console.log('Executing SQL...');
            await connection.query(sql);
            console.log('Migration completed successfully!');
        } catch (error) {
            console.error('Migration failed:', error);
        } finally {
            if (connection) await connection.end();
        }
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}

migrate();

