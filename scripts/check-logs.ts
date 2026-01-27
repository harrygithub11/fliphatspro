import mysql from 'mysql2/promise'

async function checkLogs() {
    console.log('Checking campaign_logs table...')
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'flipuser',
        password: 'flippass123',
        database: 'fliphatspro'
    })

    try {
        const [logs]: any = await connection.execute('SELECT * FROM campaign_logs ORDER BY id DESC LIMIT 10')
        console.log(`Found ${logs.length} logs.`)
        if (logs.length > 0) {
            console.log('Sample Log:', logs[0])
            console.log('campaign_id:', logs[0].campaign_id)
        } else {
            console.log('Table is empty.')
        }

        const [leads]: any = await connection.execute('SELECT id, leadEmail FROM campaign_lead LIMIT 2')
        console.log('Sample Leads:', leads)

    } catch (e) {
        console.error('Error:', e)
    } finally {
        await connection.end()
    }
}

checkLogs()
