
import mysql from 'mysql2/promise'

async function fixSchema() {
    console.log('Fixing campaign_logs schema...')
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'flipuser',
        password: 'flippass123',
        database: 'fliphatspro'
    })

    try {
        await connection.execute('ALTER TABLE campaign_logs MODIFY COLUMN lead_id VARCHAR(191)')
        console.log('Successfully changed lead_id to VARCHAR(191)')
    } catch (e) {
        console.error('Migration failed:', e)
    } finally {
        await connection.end()
    }
}

fixSchema()
