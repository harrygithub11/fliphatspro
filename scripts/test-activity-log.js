const mysql = require('mysql2/promise');

async function testLog() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'newyearlp'
    });

    console.log('Testing activity log insertion...');

    try {
        // Insert a test activity log
        await connection.execute(
            `INSERT INTO admin_activity_logs 
            (admin_id, action_type, action_description, entity_type, entity_id, created_at) 
            VALUES (?, ?, ?, ?, ?, NOW())`,
            [1, 'lead_assignment', 'Test: Assigned lead to Harry', 'customer', 1]
        );

        console.log('✅ Successfully inserted test activity log!');

        // Fetch and display
        const [logs] = await connection.execute('SELECT * FROM admin_activity_logs ORDER BY created_at DESC LIMIT 5');
        console.log('\nActivity logs in database:');
        logs.forEach(log => {
            console.log('- Admin ID:', log.admin_id, '| Action:', log.action_type, '| Date:', log.created_at);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

testLog();
