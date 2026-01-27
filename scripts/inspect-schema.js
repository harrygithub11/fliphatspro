
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    console.log('🔍 Inspecting Schema...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: 'root',
        password: 'rootpassword',
        database: process.env.DB_NAME || 'fliphatspro'
    });

    try {
        console.log('\n--- USERS Table ---');
        const [usersDesc] = await connection.query('DESCRIBE users');
        console.log(usersDesc);
        const [usersCreate] = await connection.query('SHOW CREATE TABLE users');
        console.log(usersCreate[0]['Create Table']);

        console.log('\n--- TENANTS Table ---');
        const [tenantsDesc] = await connection.query('DESCRIBE tenants');
        console.log(tenantsDesc);
        const [tenantsCreate] = await connection.query('SHOW CREATE TABLE tenants');
        console.log(tenantsCreate[0]['Create Table']);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

run();
