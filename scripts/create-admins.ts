// Script to create admin users directly in the database
// Run: npx tsx scripts/create-admins.ts

import bcrypt from 'bcryptjs';
import pool from '../lib/db';

async function createAdmins() {
    const connection = await pool.getConnection();

    try {
        console.log('🔧 Setting up admin users...\n');

        // 1. Add name column if it doesn't exist
        try {
            // Check if column exists first
            const [columns]: any = await connection.execute(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'newyear' 
                AND TABLE_NAME = 'admins' 
                AND COLUMN_NAME = 'name'
            `);

            if (columns.length === 0) {
                await connection.execute(`
                    ALTER TABLE admins ADD COLUMN name VARCHAR(255) AFTER email
                `);
                console.log('✅ Name column added');
            } else {
                console.log('✅ Name column already exists');
            }
        } catch (e: any) {
            console.log('⚠️  Column check:', e.message);
        }

        // 2. Hash the password
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);
        console.log('✅ Password hashed');

        // 3. Create admin users
        const admins = [
            { email: 'admin@fliphats.com', name: 'Admin User', role: 'super_admin' },
            { email: 'john@fliphats.com', name: 'John Doe', role: 'super_admin' },
            { email: 'sarah@fliphats.com', name: 'Sarah Smith', role: 'support' }
        ];

        for (const admin of admins) {
            try {
                await connection.execute(`
                    INSERT INTO admins (email, name, password_hash, role, created_at) 
                    VALUES (?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE 
                        name = VALUES(name),
                        password_hash = VALUES(password_hash),
                        role = VALUES(role)
                `, [admin.email, admin.name, hash, admin.role]);

                console.log(`✅ Created/Updated: ${admin.name} (${admin.email})`);
            } catch (e: any) {
                console.error(`❌ Error creating ${admin.email}:`, e.message);
            }
        }

        // 4. Verify
        const [users]: any = await connection.execute('SELECT id, email, name, role FROM admins');

        console.log('\n📋 Admin Users in Database:');
        console.log('═══════════════════════════════════════════════════');
        users.forEach((user: any) => {
            console.log(`${user.id}. ${user.name} (${user.email}) - ${user.role}`);
        });
        console.log('═══════════════════════════════════════════════════');

        console.log('\n🔑 Login Credentials:');
        console.log('Email: admin@fliphats.com | Password: admin123');
        console.log('Email: john@fliphats.com  | Password: admin123');
        console.log('Email: sarah@fliphats.com | Password: admin123');

        console.log('\n✅ Setup complete! You can now login at /admin/login');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        connection.release();
        process.exit(0);
    }
}

createAdmins();
