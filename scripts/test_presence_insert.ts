
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('=== TESTING USER_PRESENCE INSERTION ===');

    // 1. Get a valid User ID
    const [users]: any = await connection.execute("SELECT id, email FROM users LIMIT 1");
    if (users.length === 0) {
        console.error('❌ No users found in DB! cannot test.');
        process.exit(1);
    }
    const user = users[0];
    console.log(`Target User: ID=${user.id}, Email=${user.email}`);

    // 2. Try Insert (Raw SQL)
    try {
        // First delete if exists to clear way for test
        await connection.execute("DELETE FROM user_presence WHERE userId = ?", [user.id]);

        console.log('Attempting INSERT...');
        await connection.execute(`
            INSERT INTO user_presence (userId, status, lastSeenAt) 
            VALUES (?, 'ONLINE', NOW())
        `, [user.id]);
        console.log('✅ INSERT SUCCESSFUL! Constraint is valid.');
    } catch (e: any) {
        console.error('❌ INSERT FAILED:', e.message);
        console.error('Code:', e.code);
    }

    // 3. Inspect Constraints again (Output properly this time)
    console.log('\n=== CONSTRAINTS ON user_presence ===');
    const [constraints]: any = await connection.execute(`
        SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'user_presence' 
        AND TABLE_SCHEMA = '${process.env.DB_NAME}'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.table(constraints);

    connection.end();
}

main().catch(console.error);
