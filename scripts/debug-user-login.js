
const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load .env explicitly
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

console.log('Dotenv parsed:', result.parsed ? 'Yes' : 'No');
if (result.error) console.error('Dotenv Error:', result.error);

console.log('DB Config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    // Mask password
    passLength: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0
});

const email = 'harshdeepkumaryadav@gmail.com';
const newPassword = 'password123';

async function run() {
    // Try explicit root connection if flipuser fails
    const configs = [
        {
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'flipuser',
            password: process.env.DB_PASSWORD || 'flippass123',
            database: process.env.DB_NAME || 'fliphatspro'
        },
        // Fallback to root
        {
            host: process.env.DB_HOST || '127.0.0.1',
            user: 'root',
            password: 'rootpassword', // From docker-compose
            database: process.env.DB_NAME || 'fliphatspro'
        }
    ];

    for (const config of configs) {
        console.log(`\nTesting connection with user: ${config.user}...`);
        let connection;
        try {
            connection = await mysql.createConnection(config);
            console.log('✅ Connected successfully!');

            // Check User
            const [users] = await connection.execute(
                'SELECT id, email, password_hash, name FROM users WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                console.log('❌ User NOT FOUND.');
                // Create user if missing? No, might cause issues. 
            } else {
                console.log('✅ User FOUND:', users[0]);

                // RESET PASSWORD
                console.log('🔄 Resetting password...');
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                await connection.execute(
                    'UPDATE users SET password_hash = ? WHERE email = ?',
                    [hashedPassword, email]
                );
                console.log(`✅ Password reset to: ${newPassword}`);
            }

            // Check Tenant
            if (users.length > 0) {
                const [mappings] = await connection.execute(
                    `SELECT tu.*, t.name as tenant_name 
                     FROM tenant_users tu 
                     JOIN tenants t ON tu.tenant_id = t.id 
                     WHERE tu.user_id = ?`,
                    [users[0].id]
                );
                console.log('Tenant Mappings:', mappings);
            }

            await connection.end();
            return; // Success, exit

        } catch (error) {
            console.error(`❌ Failed with ${config.user}:`, error.message);
            if (connection) await connection.end();
        }
    }
}

run();
