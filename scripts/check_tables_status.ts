
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import path from 'path';

// Try loading .env.local first, then .env
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'usernewyear',
    password: process.env.DB_PASSWORD || 'NEWyear11@@',
    database: process.env.DB_NAME || 'newyear',
};

async function main() {
    console.log('Checking tables in database:', dbConfig.database);
    const connection = await mysql.createConnection(dbConfig);

    try {
        const [rows] = await connection.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = ? 
            AND table_name IN ('tenant_roles', 'marketing_campaign', 'campaign_step', 'tenant_users')
        `, [dbConfig.database]);

        console.log('Found tables:', rows);

        // Also check if tenant_users has role_id column
        const [columns] = await connection.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = ? 
            AND table_name = 'tenant_users' 
            AND column_name = 'role_id'
        `, [dbConfig.database]);

        console.log('tenant_users.role_id column:', columns);

        const [roles]: any = await connection.query('SELECT COUNT(*) as count FROM tenant_roles');
        console.log('tenant_roles count:', roles[0].count);

    } catch (e) {
        console.error('Error checking tables:', e.message);
    } finally {
        await connection.end();
    }
}

main();
