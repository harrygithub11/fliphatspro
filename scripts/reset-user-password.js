
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const email = 'harshdeepkumaryadav@gmail.com';
const newPassword = 'password123';

async function run() {
    console.log(`Resetting password for: ${email}`);

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const [result] = await connection.execute(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [hashedPassword, email]
        );

        console.log('✅ Password updated successfully.');
        console.log(`New Password: ${newPassword}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

run();
