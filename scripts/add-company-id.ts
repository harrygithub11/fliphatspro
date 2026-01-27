
import mysql from 'mysql2/promise'

async function addCompanyIdToCustomers() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'flipuser',
            password: 'flippass123',
            database: 'fliphatspro'
        });

        console.log('🔌 Connected to DB');

        // Check if column exists
        const [cols]: any = await connection.execute(
            "SHOW COLUMNS FROM customers LIKE 'company_id'"
        );

        if (cols.length > 0) {
            console.log('✅ company_id column already exists');
        } else {
            console.log('📦 Adding company_id column to customers...');
            await connection.execute(`
                ALTER TABLE customers 
                ADD COLUMN company_id INT NULL,
                ADD INDEX idx_company (company_id)
            `);
            console.log('✅ Added company_id column');
        }

        // Also add to deals table if missing
        const [dealCols]: any = await connection.execute(
            "SHOW COLUMNS FROM deals LIKE 'company_id'"
        );

        if (dealCols.length === 0) {
            console.log('📦 Adding company_id column to deals...');
            await connection.execute(`
                ALTER TABLE deals 
                ADD COLUMN company_id INT NULL AFTER tenant_id,
                ADD INDEX idx_company (company_id)
            `);
            console.log('✅ Added company_id to deals');
        }

        console.log('\n🎉 Done!');

    } catch (e: any) {
        console.error('❌ Error:', e.message);
    } finally {
        if (connection) connection.end();
    }
}

addCompanyIdToCustomers();
