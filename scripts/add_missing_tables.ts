import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    console.log('=== Adding Missing Tables ===');

    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'dbfliphats'
    });

    const tenantId = 'ba60a2bc-2921-43f5-aa81-65dc7ba298e7';

    // 1. tenant_users table
    console.log('Creating tenant_users...');
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS tenant_users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id VARCHAR(36) NOT NULL,
            user_id INT NOT NULL,
            role VARCHAR(50) DEFAULT 'member',
            role_id INT,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_user (user_id)
        )
    `);

    // 2. tenant_roles table
    console.log('Creating tenant_roles...');
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS tenant_roles (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id VARCHAR(36) NOT NULL,
            name VARCHAR(100) NOT NULL,
            permissions JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id)
        )
    `);

    // 3. subscriptions table
    console.log('Creating subscriptions...');
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            company_id VARCHAR(36) NOT NULL,
            plan VARCHAR(50) DEFAULT 'free',
            status VARCHAR(50) DEFAULT 'active',
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NULL,
            INDEX idx_company (company_id)
        )
    `);

    // 4. login_history table
    console.log('Creating login_history...');
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS login_history (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            email VARCHAR(255),
            ip_address VARCHAR(50),
            user_agent TEXT,
            status VARCHAR(50) DEFAULT 'success',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (user_id)
        )
    `);

    // 5. tenant_audit_logs table
    console.log('Creating tenant_audit_logs...');
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS tenant_audit_logs (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id VARCHAR(36),
            user_id INT,
            action VARCHAR(100),
            ip_address VARCHAR(50),
            details JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_user (user_id)
        )
    `);

    // 6. Add slug and plan columns to tenants table
    console.log('Updating tenants table...');
    await connection.execute(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug VARCHAR(100)`).catch(() => { });
    await connection.execute(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'professional'`).catch(() => { });
    await connection.execute(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`).catch(() => { });

    // Update existing tenant
    await connection.execute(`UPDATE tenants SET slug = 'fliphats', plan = 'professional', status = 'active' WHERE id = ?`, [tenantId]).catch(() => { });

    // 7. Link admin user to tenant
    console.log('Linking user to tenant...');
    const [users]: any = await connection.execute(`SELECT id FROM users WHERE email = 'harrymailbox11@gmail.com'`);
    if (users.length > 0) {
        await connection.execute(`
            INSERT INTO tenant_users (tenant_id, user_id, role) 
            VALUES (?, ?, 'admin')
            ON DUPLICATE KEY UPDATE role = 'admin'
        `, [tenantId, users[0].id]);
    }

    // 8. Update user_presence table to match Prisma schema
    console.log('Fixing user_presence table...');
    await connection.execute(`ALTER TABLE user_presence ADD COLUMN IF NOT EXISTS lastSeenAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP`).catch(() => { });

    console.log('');
    console.log('✅ All missing tables created!');
    console.log('Now try logging in again.');

    connection.end();
}

main().catch(console.error);
