
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    try {
        const [rows]: any = await connection.execute(
            'SELECT id, name, slug, plan, status FROM tenants ORDER BY created_at DESC'
        );

        console.log('\n=== COMPANY / TENANT IDs ===');
        if (rows.length === 0) {
            console.log('No tenants found.');
        } else {
            console.table(rows.map((r: any) => ({
                'Company ID (TenantID)': r.id,
                'Name': r.name,
                'Slug': r.slug,
                'Plan': r.plan
            })));
        }
    } catch (error: any) {
        console.error('Error fetching tenants:', error.message);
    } finally {
        connection.end();
    }
}

main();
