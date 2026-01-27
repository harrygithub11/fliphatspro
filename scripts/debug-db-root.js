
const mysql = require('mysql2/promise');

async function testRoot() {
    console.log('Testing root user...');
    try {
        const conn = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '',
            database: 'fliphatspro'
        });
        console.log('✅ SUCCESS: Connected as root');
        await conn.end();
        return true;
    } catch (e) {
        console.log(`❌ ROOT FAILED: ${e.code} - ${e.message}`);

        // Try without database selection
        try {
            console.log('Testing root (no db selected)...');
            const conn2 = await mysql.createConnection({
                host: '127.0.0.1',
                user: 'root',
                password: ''
            });
            console.log('✅ SUCCESS: Connected as root (no db)');
            await conn2.end();
        } catch (e2) {
            console.log(`❌ ROOT (No DB) FAILED: ${e2.code} - ${e2.message}`);
        }
    }
}

testRoot();
