
const mysql = require('mysql2/promise');

async function testDockerRoot() {
    console.log('Testing Docker root credentials...');
    try {
        const conn = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: 'rootpassword', // From docker-compose.yml
            database: 'fliphatspro'
        });
        console.log('✅ SUCCESS: Connected as root (with password)');
        await conn.end();
        return true;
    } catch (e) {
        console.log(`❌ DOCKER ROOT FAILED: ${e.code} - ${e.message}`);
    }
}

testDockerRoot();
