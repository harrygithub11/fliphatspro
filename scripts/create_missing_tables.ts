import mysql from 'mysql2/promise';

async function main() {
    const c = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'dbfliphats'
    });

    console.log('=== Creating Missing Tables ===\n');

    // Helper to create table if not exists
    const createTable = async (name: string, sql: string) => {
        try {
            await c.execute(sql);
            console.log(`✅ Created/verified: ${name}`);
        } catch (e: any) {
            console.log(`❌ Error with ${name}: ${e.message}`);
        }
    };

    // DEALS table
    await createTable('deals', `
        CREATE TABLE IF NOT EXISTS deals (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id VARCHAR(36) NOT NULL,
            company_id INT,
            customer_id INT,
            title VARCHAR(255) NOT NULL,
            amount DECIMAL(15,2),
            stage VARCHAR(50) DEFAULT 'qualification',
            stage_id INT,
            status VARCHAR(50) DEFAULT 'open',
            expected_close_date DATE,
            owner_id INT,
            created_by INT,
            deleted_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_company (company_id),
            INDEX idx_status (status)
        )
    `);

    // MARKETING_CAMPAIGNS table
    await createTable('marketing_campaigns', `
        CREATE TABLE IF NOT EXISTS marketing_campaigns (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            subject VARCHAR(500),
            body_html LONGTEXT,
            body_text TEXT,
            status VARCHAR(50) DEFAULT 'draft',
            type VARCHAR(50) DEFAULT 'email',
            smtp_account_id INT,
            audience_filter JSON,
            total_recipients INT DEFAULT 0,
            sent_count INT DEFAULT 0,
            open_count INT DEFAULT 0,
            click_count INT DEFAULT 0,
            scheduled_at TIMESTAMP NULL,
            sent_at TIMESTAMP NULL,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_status (status)
        )
    `);

    // SMTP_ACCOUNTS table
    await createTable('smtp_accounts', `
        CREATE TABLE IF NOT EXISTS smtp_accounts (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            from_email VARCHAR(255) NOT NULL,
            from_name VARCHAR(255),
            smtp_host VARCHAR(255) NOT NULL,
            smtp_port INT DEFAULT 587,
            smtp_user VARCHAR(255) NOT NULL,
            smtp_pass VARCHAR(255) NOT NULL,
            smtp_secure TINYINT(1) DEFAULT 1,
            imap_host VARCHAR(255),
            imap_port INT DEFAULT 993,
            imap_secure TINYINT(1) DEFAULT 1,
            is_active TINYINT(1) DEFAULT 1,
            daily_limit INT DEFAULT 500,
            sent_today INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id)
        )
    `);

    // EMAILS table
    await createTable('emails', `
        CREATE TABLE IF NOT EXISTS emails (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id VARCHAR(36) NOT NULL,
            smtp_account_id INT,
            message_id VARCHAR(255),
            thread_id VARCHAR(255),
            folder VARCHAR(50) DEFAULT 'inbox',
            from_email VARCHAR(255),
            from_name VARCHAR(255),
            to_email VARCHAR(255),
            to_name VARCHAR(255),
            subject VARCHAR(500),
            body_text TEXT,
            body_html LONGTEXT,
            is_read TINYINT(1) DEFAULT 0,
            is_starred TINYINT(1) DEFAULT 0,
            has_attachments TINYINT(1) DEFAULT 0,
            received_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_smtp (smtp_account_id),
            INDEX idx_folder (folder)
        )
    `);

    // COMPANIES table (ensure it has all columns)
    await createTable('companies', `
        CREATE TABLE IF NOT EXISTS companies (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            domain VARCHAR(255),
            industry VARCHAR(100),
            size VARCHAR(50),
            website VARCHAR(255),
            phone VARCHAR(50),
            city VARCHAR(100),
            country VARCHAR(100),
            logo_url VARCHAR(500),
            linkedin_url VARCHAR(500),
            annual_revenue DECIMAL(15,2),
            employee_count INT,
            owner_id INT,
            created_by INT,
            deleted_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id)
        )
    `);

    // ADMINS table (legacy compat)
    await createTable('admins', `
        CREATE TABLE IF NOT EXISTS admins (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id VARCHAR(36),
            email VARCHAR(255) UNIQUE,
            password_hash VARCHAR(255),
            name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'admin',
            is_active BOOLEAN DEFAULT TRUE,
            avatar_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('\n=================================');
    console.log('✅ Missing tables created!');
    console.log('=================================');

    c.end();
}

main().catch(console.error);
