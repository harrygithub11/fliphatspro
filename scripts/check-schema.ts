
import mysql from 'mysql2/promise'

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'flipuser',
        password: 'flippass123',
        database: 'fliphatspro'
    })

    try {
        await connection.execute("SHOW COLUMNS FROM smtp_accounts").then(([r]: any) => console.log('smtp_accounts:', r.map((c: any) => c.Field)));
        await connection.execute("SHOW COLUMNS FROM marketing_campaign").then(([r]: any) => console.log('marketing_campaign:', r.map((c: any) => c.Field)));
        await connection.execute("SHOW COLUMNS FROM emails").then(([r]: any) => console.log('emails:', r.map((c: any) => c.Field)));
    } catch (e) {
        console.error(e)
    } finally {
        await connection.end()
    }
}

checkSchema()
