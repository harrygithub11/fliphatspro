
import pool from '../lib/db';
import dotenv from 'dotenv';
dotenv.config();

async function checkSchema() {
    try {
        const [rows]: any = await pool.query("SHOW COLUMNS FROM orders");
        console.log("Columns in 'orders' table:");
        rows.forEach((r: any) => console.log(`- ${r.Field} (${r.Type})`));

        // Also check if table exists by ensuring rows has length
        if (rows.length === 0) console.log("Table 'orders' matches nothing or is empty definition (unlikely).");

    } catch (e: any) {
        console.error("Error Checking Schema:", e.message);
    } finally {
        process.exit();
    }
}

checkSchema();
