
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const configs = [
    {
        name: 'ENV Credentials',
        user: process.env.DB_USER, // flipuser
        password: process.env.DB_PASSWORD, // flippass123
        database: process.env.DB_NAME // fliphatspro
    },
    {
        name: 'Hardcoded Fallback (lib/db.ts)',
        user: 'usernewyear',
        password: 'NEWyear11@@',
        database: 'newyear'
    }
];

async function testConnection(config) {
    console.log(`Testing ${config.name} (User: ${config.user})...`);
    try {
        const conn = await mysql.createConnection({
            host: '127.0.0.1',
            user: config.user,
            password: config.password,
            database: config.database
        });
        console.log(`✅ SUCCESS: Connected to ${config.database}`);

        // Try simple query
        const [rows] = await conn.execute('SELECT 1 as val');
        console.log(`   Query Result: ${rows[0].val}`);

        await conn.end();
        return true;
    } catch (error) {
        console.log(`❌ FAILED: ${error.code} - ${error.message}`);
        return false;
    }
}

async function run() {
    console.log('--- DB Connectivity Test ---');
    for (const config of configs) {
        if (!config.user) {
            console.log(`Skipping ${config.name} (No user defined)`);
            continue;
        }
        await testConnection(config);
        console.log('----------------------------');
    }
}

run();
