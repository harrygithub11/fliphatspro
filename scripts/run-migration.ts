
import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'

async function runMigration() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'flipuser',
            password: 'flippass123',
            database: 'fliphatspro',
            multipleStatements: true
        });

        console.log('🔌 Connected to database');

        const sqlPath = path.join(__dirname, 'migrations', 'add_missing_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Running migration: add_missing_tables.sql');
        console.log('');

        // Split by statement and run one by one for better error reporting
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        let successCount = 0;
        let skipCount = 0;

        for (const stmt of statements) {
            if (stmt.toLowerCase().startsWith('create table')) {
                const tableName = stmt.match(/create table if not exists (\w+)/i)?.[1];
                try {
                    await connection.execute(stmt);
                    console.log(`✅ Created: ${tableName}`);
                    successCount++;
                } catch (e: any) {
                    if (e.code === 'ER_TABLE_EXISTS_ERROR') {
                        console.log(`⏭️  Skipped (exists): ${tableName}`);
                        skipCount++;
                    } else {
                        console.error(`❌ Error creating ${tableName}:`, e.message);
                    }
                }
            } else if (stmt.toLowerCase().startsWith('insert')) {
                try {
                    const [result]: any = await connection.execute(stmt);
                    console.log(`📥 Inserted ${result.affectedRows} rows`);
                } catch (e: any) {
                    // Ignore duplicate key errors for seeding
                    if (!e.message.includes('Duplicate')) {
                        console.log(`⚠️  Insert warning:`, e.message.substring(0, 80));
                    }
                }
            } else if (stmt.toLowerCase().startsWith('select')) {
                const [rows]: any = await connection.execute(stmt);
                console.log('');
                console.log(`🎉 ${rows[0]?.status || 'Done!'}`);
            }
        }

        console.log('');
        console.log('═══════════════════════════════════════');
        console.log(`✅ Created: ${successCount} tables`);
        console.log(`⏭️  Skipped: ${skipCount} tables (already exist)`);
        console.log('═══════════════════════════════════════');

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        if (connection) connection.end();
    }
}

runMigration();
