const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function debugBooking() {
    console.log('--- Debugging Booking Process ---');
    console.log('Testing SQL insertion flow...');

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '3306')
        });

        const testUser = {
            name: "Debug User",
            email: `debug_${Date.now()}@test.com`,
            phone: "1234567890",
            store: "DebugStore.com",
            source: "debug_script"
        };

        console.log(`\n1. Creating Test User: ${testUser.email}`);

        // 1. INSERT CUSTOMER
        try {
            const [res] = await connection.execute(
                `INSERT INTO customers (name, email, phone, source, stage, score, tags, notes, created_at) 
                 VALUES (?, ?, ?, 'Strategy Call', 'new', 'warm', ?, ?, NOW())`,
                [testUser.name, testUser.email, testUser.phone, JSON.stringify(['booking_form']), testUser.store]
            );
            console.log(`✅ Customer Inserted! ID: ${res.insertId}`);

            const customerId = res.insertId;

            // 2. INSERT INTERACTION
            console.log('\n2. Logging Interaction...');
            await connection.execute(
                `INSERT INTO interactions (type, customer_id, content, created_at) 
                 VALUES ('system_event', ?, ?, NOW())`,
                [customerId, JSON.stringify({ source: 'debug', action: 'test' })]
            );
            console.log('✅ Interaction Logged!');

            // 3. INSERT ORDER (Simulate Deal)
            console.log('\n3. Creating Order...');
            await connection.execute(
                'INSERT INTO orders (customer_id, amount, status, source, razorpay_order_id, proposal_status) VALUES (?, ?, ?, ?, ?, ?)',
                [customerId, 5000, 'initiated', 'test_source', `DEAL_${Date.now()}`, 'draft']
            );
            console.log('✅ Order Created!');

            console.log('\n🎉 SUCCESS! All SQL queries are working correctly.');

        } catch (sqlError) {
            console.error('\n❌ SQL FAILURE:', sqlError.message);
            console.error('Code:', sqlError.code);
            console.error('SQL State:', sqlError.sqlState);
        }

    } catch (err) {
        console.error('❌ Connection Error:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

debugBooking();
