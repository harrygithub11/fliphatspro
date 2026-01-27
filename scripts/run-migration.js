
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fliphatspro',
        multipleStatements: true
    });

    try {
        const filePath = path.join(__dirname, '../migrations/multi-tenant/010_create_rbac_tables.sql');
        const sql = fs.readFileSync(filePath, 'utf8');

        console.log(`Executing migration from ${filePath}...`);
        await connection.query(sql);
        console.log("Migration completed successfully.");

    } catch (error) {
        console.error("Migration Error:", error);
    } finally {
        await connection.end();
    }
}

runMigration();
