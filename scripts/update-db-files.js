
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function updateDb() {
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        console.log('Connected to database.');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS files (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT,
                uploaded_by INT,
                file_name VARCHAR(255) NOT NULL,
                file_url VARCHAR(500) NOT NULL,
                file_type VARCHAR(50) DEFAULT 'link',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            );
        `);

        console.log('Files table created successfully.');
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

updateDb();
