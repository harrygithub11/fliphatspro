const mysql = require('mysql2/promise');

async function debugAdmins() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'usernewyear',
        password: 'NEWyear11@@',
        database: 'newyear'
    });

    try {
        const [rows] = await connection.execute("SELECT id, name, email, created_at FROM admins");
        console.log('--- Admin Users ---');
        rows.forEach(admin => {
            console.log(`ID: ${admin.id}, Name: ${admin.name}, Created At:`, admin.created_at, 'Type:', typeof admin.created_at);
        });
    } catch (error) {
        console.error('Query Error:', error.message);
    } finally {
        await connection.end();
    }
}

debugAdmins();
