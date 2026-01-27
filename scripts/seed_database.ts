import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function main() {
    const c = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'dbfliphats'
    });

    console.log('=== Seeding Database ===');

    // 1. Create tenant
    const tenantId = 'ba60a2bc-2921-43f5-aa81-65dc7ba298e7';
    console.log('Creating tenant...');
    await c.execute(`
        INSERT INTO tenants (id, name, slug, domain, plan, status, created_at, updated_at)
        VALUES (?, 'Fliphats', 'fliphats', 'fliphats.com', 'professional', 'active', NOW(), NOW())
        ON DUPLICATE KEY UPDATE name = 'Fliphats'
    `, [tenantId]);

    // 2. Create user (matching actual Prisma schema - no role, no tenant_id)
    console.log('Creating user...');
    const hashedPassword = await bcrypt.hash('harish123', 10);
    await c.execute(`
        INSERT INTO users (email, password_hash, name, phone, timezone, language, is_active, created_at, updated_at)
        VALUES ('harrymailbox11@gmail.com', ?, 'Harish Kumar', '+91 9999999999', 'Asia/Kolkata', 'en', true, NOW(), NOW())
        ON DUPLICATE KEY UPDATE password_hash = ?, name = 'Harish Kumar'
    `, [hashedPassword, hashedPassword]);

    // Get user ID
    const [users]: any = await c.execute(`SELECT id FROM users WHERE email = 'harrymailbox11@gmail.com'`);
    const userId = users[0]?.id;
    console.log('User ID:', userId);

    if (userId) {
        // 3. Link user to tenant via tenant_users
        console.log('Linking user to tenant...');
        await c.execute(`
            INSERT INTO tenant_users (tenant_id, user_id, role, joined_at)
            VALUES (?, ?, 'owner', NOW())
            ON DUPLICATE KEY UPDATE role = 'owner'
        `, [tenantId, userId]);

        // 4. Make user a platform admin
        console.log('Making user platform admin...');
        await c.execute(`
            INSERT INTO platform_admins (user_id, role, created_at)
            VALUES (?, 'super_admin', NOW())
            ON DUPLICATE KEY UPDATE role = 'super_admin'
        `, [userId]);

        // 5. Create subscription for tenant
        console.log('Creating subscription...');
        const subId = require('crypto').randomUUID();
        await c.execute(`
            INSERT INTO subscriptions (id, company_id, plan, status, start_date, created_at, updated_at)
            VALUES (?, ?, 'professional', 'active', NOW(), NOW(), NOW())
            ON DUPLICATE KEY UPDATE status = 'active'
        `, [subId, tenantId]);
    }

    console.log('');
    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('  Email: harrymailbox11@gmail.com');
    console.log('  Password: harish123');

    c.end();
}

main().catch(console.error);
