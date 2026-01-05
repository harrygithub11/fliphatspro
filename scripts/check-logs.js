const mysql = require('mysql2/promise');

async function checkLogs() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3307,
        user: 'root',
        password: 'admin',
        database: 'newyear'
    });

    try {
        console.log('Checking login logs table...');
        const [loginLogs] = await connection.execute('SELECT * FROM admin_login_logs ORDER BY login_time DESC LIMIT 5');
        console.log('Login logs:', loginLogs);
        console.log('Total login logs:', loginLogs.length);

        console.log('\nChecking activity logs table...');
        const [activityLogs] = await connection.execute('SELECT * FROM admin_activity_logs ORDER BY created_at DESC LIMIT 5');
        console.log('Activity logs:', activityLogs);
        console.log('Total activity logs:', activityLogs.length);

        console.log('\nChecking if tables exist...');
        const [tables] = await connection.execute("SHOW TABLES LIKE '%log%'");
        console.log('Tables with "log":', tables);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkLogs();
