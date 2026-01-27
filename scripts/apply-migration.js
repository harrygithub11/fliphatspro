
const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const filePath = process.argv[2];

if (!filePath) {
    console.error('Please provide a SQL file path');
    process.exit(1);
}

const fullPath = path.resolve(filePath);

if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
}

const sql = fs.readFileSync(fullPath, 'utf8');

async function run() {
    console.log(`Applying migration: ${path.basename(fullPath)}`);

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        await connection.query(sql);
        console.log('Migration applied successfully.');
    } catch (error) {
        console.error('Migration failed:', error.message);
    } finally {
        await connection.end();
    }
}

run();
