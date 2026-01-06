const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    console.log('Connected to database.');

    try {
        // Check if column exists
        const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'customers' 
      AND COLUMN_NAME = 'facebook_lead_id'
    `);

        if (columns.length === 0) {
            console.log('Adding facebook_lead_id column...');
            await connection.execute(`
        ALTER TABLE customers 
        ADD COLUMN facebook_lead_id VARCHAR(191) UNIQUE NULL
      `);
            console.log('Added facebook_lead_id column.');
        } else {
            console.log('facebook_lead_id column already exists.');
        }

        const [adColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'customers' 
      AND COLUMN_NAME = 'ad_data'
    `);

        if (adColumns.length === 0) {
            console.log('Adding ad_data column...');
            await connection.execute(`
        ALTER TABLE customers 
        ADD COLUMN ad_data JSON NULL
      `);
            console.log('Added ad_data column.');
        } else {
            console.log('ad_data column already exists.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
