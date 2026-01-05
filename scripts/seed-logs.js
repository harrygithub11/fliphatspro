const mysql = require('mysql2/promise');

async function seedLogs() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3307,
        user: 'root',
        password: 'admin',
        database: 'newyear'
    });

    try {
        // Get the first admin ID
        const [admins] = await connection.execute('SELECT id, email, name FROM admins LIMIT 1');

        if (admins.length === 0) {
            console.log('No admins found to seed logs for.');
            return;
        }

        const admin = admins[0];
        console.log(`Seeding logs for admin: ${admin.name} (${admin.email})`);

        // Seed Login Logs
        console.log('Seeding login logs...');
        await connection.execute(
            `INSERT INTO admin_login_logs (admin_id, ip_address, user_agent, login_time, success) VALUES 
            (?, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW(), TRUE),
            (?, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', DATE_SUB(NOW(), INTERVAL 1 DAY), TRUE)`,
            [admin.id, admin.id]
        );

        // Seed Activity Logs
        console.log('Seeding activity logs...');
        await connection.execute(
            `INSERT INTO admin_activity_logs (admin_id, action_type, action_description, entity_type, entity_id, created_at) VALUES 
            (?, 'login', 'Logged into the system', 'auth', NULL, NOW()),
            (?, 'lead_view', 'Viewed leads dashboard', 'page', NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
            (?, 'profile_update', 'Updated profile settings', 'admin', ?, DATE_SUB(NOW(), INTERVAL 2 HOUR))`,
            [admin.id, admin.id, admin.id, admin.id]
        );

        console.log('✅ Successfully seeded sample logs!');

    } catch (error) {
        console.error('❌ Error seeding logs:', error.message);
    } finally {
        await connection.end();
    }
}

seedLogs();
