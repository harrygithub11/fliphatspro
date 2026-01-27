import mysql from 'mysql2/promise';

async function main() {
    const c = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'dbfliphats'
    });

    console.log('Creating platform_admins...');
    await c.execute(`
        CREATE TABLE IF NOT EXISTS platform_admins (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL UNIQUE,
            role VARCHAR(50) DEFAULT 'super_admin',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (user_id)
        )
    `);

    console.log('Creating admins...');
    await c.execute(`
        CREATE TABLE IF NOT EXISTS admins (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id VARCHAR(36),
            email VARCHAR(255) UNIQUE,
            password_hash VARCHAR(255),
            name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'admin',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Make user a platform admin
    const [users]: any = await c.execute(`SELECT id FROM users WHERE email = 'harrymailbox11@gmail.com'`);
    if (users.length > 0) {
        console.log('Making user a platform admin...');
        await c.execute(`
            INSERT INTO platform_admins (user_id, role) VALUES (?, 'super_admin')
            ON DUPLICATE KEY UPDATE role = 'super_admin'
        `, [users[0].id]);
    }

    console.log('✅ Done!');
    c.end();
}

main().catch(console.error);
