
import mysql from 'mysql2/promise'

async function fixCollation() {
    console.log('Fixing collation for campaign_logs...')
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'flipuser',
        password: 'flippass123',
        database: 'fliphatspro'
    })

    try {
        // Convert table to utf8mb4_unicode_ci to match other tables (Prisma default)
        await connection.execute('ALTER TABLE campaign_logs CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
        console.log('Successfully converted campaign_logs to utf8mb4_unicode_ci')
    } catch (e) {
        console.error('Migration failed:', e)
    } finally {
        await connection.end()
    }
}

fixCollation()
