
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    console.log('🔍 Inspecting TEMANTS Schema Only...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: 'root',
        password: 'rootpassword',
        database: process.env.DB_NAME
    });

    try {
        const [tenantsCreate] = await connection.query('SHOW CREATE TABLE tenants');
        console.log(tenantsCreate[0]['Create Table']);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

run();
