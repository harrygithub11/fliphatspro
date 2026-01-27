
import pool from '@/lib/db'

async function check() {
    try {
        const [rows]: any = await pool.execute('SELECT id, name, status FROM marketing_campaign')
        console.log('Campaigns:', rows)
        process.exit(0)
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}
check()
