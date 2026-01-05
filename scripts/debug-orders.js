require('dotenv').config();
const mysql = require('mysql2/promise');

async function debugOrders() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD ?? '',
            database: process.env.DB_NAME || 'newyearlp',
        });

        console.log("Running Orders Query...");
        const [rows] = await connection.execute(`
            SELECT 
                o.id, 
                o.razorpay_order_id, 
                o.amount, 
                o.status, 
                o.onboarding_status, 
                o.created_at,
                c.name as customer_name,
                c.email as customer_email
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            ORDER BY o.created_at DESC
            LIMIT 100
        `);
        console.log(`Found ${rows.length} orders.`);
        if (rows.length > 0) {
            console.log("First order example:", rows[0]);
        } else {
            console.log("No orders found in DB.");
        }

        await connection.end();
    } catch (error) {
        console.error("Query Failed:", error);
    }
}

debugOrders();
