
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

    console.log('=== FIXING USER_PRESENCE FOREIGN KEY ===');

    // 1. Inspect Constraints
    try {
        console.log('Inspecting current constraints...');
        const [rows]: any = await connection.execute(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'user_presence' 
            AND COLUMN_NAME = 'userId' 
            AND TABLE_SCHEMA = '${process.env.DB_NAME}';
        `);

        if (rows.length > 0) {
            const fkName = rows[0].CONSTRAINT_NAME;
            console.log(`Found FK: ${fkName}. Dropping it...`);
            await connection.execute(`ALTER TABLE user_presence DROP FOREIGN KEY ${fkName}`);
            console.log('✅ Dropped old FK');
        } else {
            console.log('No FK found? Attempting to drop generically if predictable names exist...');
            // Prisma default naming: user_presence_userId_fkey
            try {
                await connection.execute(`ALTER TABLE user_presence DROP FOREIGN KEY user_presence_userId_fkey`);
                console.log('✅ Dropped user_presence_userId_fkey');
            } catch (e) {
                console.log('Could not drop specific FK by name.');
            }
        }
    } catch (e: any) {
        console.error('Error handling Drop FK:', e.message);
    }

    // 2. Clear table to avoid orphan conflicts immediately
    try {
        await connection.execute('TRUNCATE TABLE user_presence');
        console.log('✅ Truncated user_presence table');
    } catch (e: any) {
        console.error('Failed to truncate:', e.message);
    }

    // 3. Add New FK to users(id)
    try {
        console.log('Adding new FK to users(id)...');
        await connection.execute(`
            ALTER TABLE user_presence 
            ADD CONSTRAINT fk_user_presence_user 
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        `);
        console.log('✅ Added FK referencing users(id)');
    } catch (e: any) {
        console.error('❌ Failed to add new FK:', e.message);
    }

    connection.end();
}

main().catch(console.error);
