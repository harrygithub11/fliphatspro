const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetDatabase() {
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        console.log("Connected. Dropping tables...");

        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        const tables = ['admins', 'customers', 'orders', 'project_submissions', 'interactions', 'tasks'];
        for (const t of tables) {
            await connection.query(`DROP TABLE IF EXISTS ${t}`);
            console.log(`Dropped ${t}`);
        }
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log("Database Cleared.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
resetDatabase();
