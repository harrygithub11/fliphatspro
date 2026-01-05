require('dotenv').config();
const mysql = require('mysql2/promise');

async function testInsert() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD ?? '',
            database: process.env.DB_NAME || 'newyearlp',
        });

        console.log("Testing direct INSERT...");

        try {
            // Attempt to insert the exact values that are failing
            const query = `INSERT INTO admin_activity_logs 
            (admin_id, action_type, action_description, entity_type, entity_id, ip_address, created_at) 
            VALUES (1, 'lead_update', 'Updated lead fields: score to hot', 'customer', 32, NULL, NOW())`;

            await connection.execute(query);
            console.log("SUCCESS: Row inserted!");
        } catch (err) {
            console.error("\n!!! INSERT FAILED !!!");
            console.error("Code:", err.code);
            console.error("Message:", err.message);
            console.error("SQL State:", err.sqlState);
        }

        console.log("\nChecking Schema...");
        const [rows] = await connection.execute("DESCRIBE admin_activity_logs");
        rows.forEach(r => console.log(`${r.Field}: ${r.Type}`));

        await connection.end();
    } catch (error) {
        console.error("Connection failed:", error);
    }
}

testInsert();
