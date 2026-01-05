const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3307,
        user: 'root',
        password: 'admin',
        database: 'newyear'
    });

    try {
        console.log('Running migration to create log tables...\n');

        const sql = fs.readFileSync(path.join(__dirname, '../migrations/002_add_admin_logs.sql'), 'utf8');

        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(s => s.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                await connection.execute(statement);
                console.log('✓ Executed statement');
            }
        }

        console.log('\n✅ Migration completed successfully!');

        // Verify tables were created
        const [tables] = await connection.execute("SHOW TABLES LIKE '%log%'");
        console.log('\nCreated tables:', tables);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await connection.end();
    }
}

runMigration();
