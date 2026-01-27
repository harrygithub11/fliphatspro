
import 'dotenv/config';
import pool from '../lib/db';

async function run() {
    try {
        console.log('Running AB Test Migration...');
        const [rows]: any = await pool.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE table_name = 'landing_pages' 
      AND table_schema = DATABASE() 
      AND column_name = 'ab_tests'
    `);

        if (rows[0].count === 0) {
            await pool.query('ALTER TABLE landing_pages ADD COLUMN ab_tests JSON DEFAULT NULL');
            console.log('Successfully added ab_tests column.');
        } else {
            console.log('Column ab_tests already exists.');
        }
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit(0);
    }
}

run();
