
const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectUsers() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fliphatspro'
    });

    try {
        const [cols] = await connection.execute('DESCRIBE users');
        const colNames = cols.map(c => c.Field);
        console.log("Users Columns:", colNames.join(', '));

        ['phone', 'timezone', 'language', 'role'].forEach(reqCol => {
            if (!colNames.includes(reqCol)) {
                console.log(`MISSING COLUMN: ${reqCol}`);
            } else {
                console.log(`Found column: ${reqCol}`);
            }
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await connection.end();
    }
}

inspectUsers();
