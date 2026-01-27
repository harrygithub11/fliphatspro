import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME
    });

    const tenantId = 'ba60a2bc-2921-43f5-aa81-65dc7ba298e7';

    // Pre-hashed password for 'harish123' using bcrypt
    const hashedPassword = '$2b$10$rQZ5JxD1rvGQB6hQ5qYU9.TtIB/E5kABZ3YV6P8yLJ0X8YQy0zIYK';

    // Add user
    await connection.execute(`
        INSERT INTO users (tenant_id, email, password, name, role)
        VALUES (?, 'harrymailbox11@gmail.com', ?, 'Harish Kumar', 'admin')
        ON DUPLICATE KEY UPDATE password = ?, name = 'Harish Kumar', role = 'admin'
    `, [tenantId, hashedPassword, hashedPassword]);

    console.log('✅ User added successfully!');
    console.log('Email: harrymailbox11@gmail.com');
    console.log('Password: harish123');

    connection.end();
}

main().catch(console.error);
