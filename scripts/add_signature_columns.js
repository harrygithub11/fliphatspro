
const mysql = require('mysql2/promise');
require('dotenv').config();

const candidates = [
    { user: 'root', pass: 'rootpassword' },
    { user: 'root', pass: '' },
    { user: 'flipuser', pass: 'flippass123' },
    { user: 'flipuser', pass: 'flip_password' },
    { user: process.env.DB_USER, pass: process.env.DB_PASSWORD },
];

async function run() {
    console.log('🔧 Adding Signature Columns to smtp_accounts...');

    let connection;

    for (const cred of candidates) {
        if (!cred.user) continue;
        try {
            console.log(`Trying ${cred.user} / ${cred.pass ? '***' : '(empty)'}...`);
            connection = await mysql.createConnection({
                host: process.env.DB_HOST || '127.0.0.1',
                user: cred.user,
                password: cred.pass,
                database: process.env.DB_NAME || 'fliphatspro',
                multipleStatements: true
            });
            console.log('✅ Connected!');
            break;
        } catch (e) {
            console.log(`❌ Failed: ${e.message}`);
        }
    }

    if (!connection) {
        console.error('❌ Could not connect with any credentials.');
        process.exit(1);
    }

    try {
        const sql = `
            ALTER TABLE smtp_accounts 
            ADD COLUMN IF NOT EXISTS signature_html_content TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS signature_text TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS use_signature TINYINT(1) DEFAULT 1;
        `;

        await connection.query(sql);
        console.log('✅ Columns added successfully.');

    } catch (error) {
        console.error('❌ Failed to add columns:', error.message);
    } finally {
        await connection.end();
    }
}

run();
