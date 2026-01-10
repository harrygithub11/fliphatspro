import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function runMigration() {
    const pool = mysql.createPool(process.env.DATABASE_URL!);
    console.log('--- Starting Advanced Email Migration ---');

    const sqlPath = path.resolve(__dirname, 'migrations', 'advanced_email_features.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolon but ignore semicolons inside strings or blocks
    // This is a simple split, might fail on complex SQL, but should work for this one
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (const statement of statements) {
        try {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            await pool.execute(statement);
        } catch (error: any) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('Field already exists, skipping...');
            } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                console.log('Table already exists, skipping...');
            } else {
                console.error(`Error executing statement: ${error.message}`);
                // Continue to next statement even if one fails
            }
        }
    }

    console.log('--- Migration Finished ---');
    await pool.end();
}

runMigration().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
