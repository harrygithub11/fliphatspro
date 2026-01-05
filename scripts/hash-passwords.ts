// Utility script to hash passwords for admin users
// Run this once to convert plain text passwords to bcrypt hashes

import bcrypt from 'bcryptjs';
import pool from '../lib/db';

async function hashAdminPasswords() {
    const connection = await pool.getConnection();

    try {
        // Get all admins
        const [admins]: any = await connection.execute('SELECT id, email, password_hash FROM admins');

        console.log(`Found ${admins.length} admin(s)`);

        for (const admin of admins) {
            // Check if password is already hashed (bcrypt hashes start with $2)
            if (admin.password_hash.startsWith('$2')) {
                console.log(`✓ ${admin.email} - already hashed`);
                continue;
            }

            // Hash the plain text password
            const hashedPassword = await bcrypt.hash(admin.password_hash, 10);

            // Update in database
            await connection.execute(
                'UPDATE admins SET password_hash = ? WHERE id = ?',
                [hashedPassword, admin.id]
            );

            console.log(`✓ ${admin.email} - password hashed`);
        }

        console.log('\n✅ All passwords hashed successfully!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        connection.release();
        process.exit(0);
    }
}

hashAdminPasswords();
