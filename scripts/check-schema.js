
const pool = require('../lib/db');

async function checkSchema() {
    try {
        const [rows] = await pool.query("SHOW COLUMNS FROM orders");
        console.log("Columns in 'orders' table:");
        rows.forEach(r => console.log(`- ${r.Field} (${r.Type})`));
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        process.exit();
    }
}

checkSchema();
