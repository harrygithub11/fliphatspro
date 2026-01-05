const mysql = require('mysql2/promise');

async function checkOwners() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'newyearlp'
    });

    console.log('Checking customers with assigned owners...\n');

    const [customers] = await connection.execute(
        'SELECT id, name, email, owner FROM customers WHERE owner IS NOT NULL ORDER BY id DESC LIMIT 10'
    );

    console.log(`Found ${customers.length} customers with owners:`);
    customers.forEach(c => {
        console.log(`- ${c.name} -> Owner: ${c.owner}`);
    });

    await connection.end();
}

checkOwners();
