const mysql = require('mysql2/promise');

async function debugLeads() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'usernewyear',
        password: 'NEWyear11@@',
        database: 'newyear'
    });

    try {
        console.log('--- Checking customers TABLE columns ---');
        const [cols] = await connection.execute("SHOW COLUMNS FROM customers");
        const colNames = cols.map(c => c.Field);
        console.log('Columns:', colNames.join(', '));

        if (!colNames.includes('owner')) {
            console.error('CRITICAL: owner column is MISSING!');
        } else {
            console.log('✅ owner column exists.');
        }

        console.log('\n--- Test Update on first customer ---');
        const [rows] = await connection.execute("SELECT id, name FROM customers LIMIT 1");
        if (rows.length > 0) {
            const customer = rows[0];
            console.log(`Attempting to update owner for Customer ID ${customer.id} (${customer.name})...`);

            try {
                await connection.execute('UPDATE customers SET owner = ? WHERE id = ?', ['TestAdmin', customer.id]);
                console.log('✅ Update SUCCESSFUL!');
            } catch (updateErr) {
                console.error('❌ Update FAILED:', updateErr.message);
            }
        } else {
            console.log('No customers found to test.');
        }

    } catch (error) {
        console.error('Connection/Query Error:', error.message);
    } finally {
        await connection.end();
    }
}

debugLeads();
