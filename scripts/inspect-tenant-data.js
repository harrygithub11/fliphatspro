
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    console.log('🔍 Inspecting Tenant Data...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: 'root',
        password: 'rootpassword',
        database: process.env.DB_NAME || 'fliphatspro'
    });

    try {
        const [rows] = await connection.query('SELECT id, name FROM tenants');
        console.log('Current Tenants:', rows);

        // Check if any ID is 0
        const zeroId = rows.find(r => r.id === 0);
        if (zeroId) {
            console.log('⚠️ Found tenant with ID 0. Fixing...');
            // Determine a safe new ID (max + 1)
            const maxId = rows.reduce((max, r) => (r.id > max ? r.id : max), 0);
            const newId = maxId > 0 ? maxId + 1 : 1;

            await connection.query('UPDATE tenants SET id = ? WHERE id = 0', [newId]);
            console.log(`✅ Updated Tenant ID 0 to ${newId}`);
        } else {
            console.log('✅ No ID 0 found.');
            // If no zero, maybe it's something else?
            // "Data truncated" can also happen if we convert string to int (not the case here)
            // or if auto_increment next value is weird.
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

run();
