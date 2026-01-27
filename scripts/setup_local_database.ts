import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    console.log('=== FliphatsPro Local Database Setup ===');
    console.log('Database:', process.env.DB_NAME);
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME
    });

    console.log('✅ Connected to database');

    // ============================================
    // CORE TABLES
    // ============================================

    // 1. Tenants table
    console.log('Creating tenants table...');
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS tenants (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            domain VARCHAR(255),
            logo_url VARCHAR(500),
            settings JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    // 2. Users table
    console.log('Creating users table...');
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id VARCHAR(36) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'user',
            phone VARCHAR(50),
            avatar_url VARCHAR(500),
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_email (email)
        )
    `);

    // 3. Companies table
    console.log('Creating companies table...');
    await connection.execute(`
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_owner (owner_id)
        )
    `);

    // 4. Customers table (leads/contacts)
    console.log('Creating customers table...');
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS customers (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id VARCHAR(36) NOT NULL,
            company_id INT,
            name VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(50),
            company VARCHAR(255),
            location VARCHAR(255),
            stage VARCHAR(50) DEFAULT 'new',
            score VARCHAR(20) DEFAULT 'cold',
            budget VARCHAR(100),
            source VARCHAR(100),
            notes TEXT,
            owner_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_company (company_id),
            INDEX idx_email (email),
            INDEX idx_stage (stage)
        )
    `);

    // 5. Deals table
    console.log('Creating deals table...');
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS deals (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id VARCHAR(36) NOT NULL,
            company_id INT,
            customer_id INT,
            title VARCHAR(255) NOT NULL,
            amount DECIMAL(15,2),
            stage VARCHAR(50) DEFAULT 'qualification',
            status VARCHAR(50) DEFAULT 'open',
            stage_id INT,
            expected_close_date DATE,
            owner_id INT,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_company (company_id),
            INDEX idx_status (status)
        )
    `);

    // 6. SMTP Accounts table
    console.log('Creating smtp_accounts table...');
    await connection.execute(`
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

    // 7. Emails table
    console.log('Creating emails table...');
    await connection.execute(`
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
            INDEX idx_folder (folder),
            INDEX idx_thread (thread_id)
        )
    `);

    // 8. Marketing Campaigns table
    console.log('Creating marketing_campaign table...');
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS marketing_campaign (
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

    // 9. User Presence table
    console.log('Creating user_presence table...');
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_presence (
            id INT PRIMARY KEY AUTO_INCREMENT,
            userId INT NOT NULL,
            socketId VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'online',
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (userId),
            INDEX idx_socket (socketId)
        )
    `);

    // 10. Notifications table
    console.log('Creating notifications table...');
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id VARCHAR(36) NOT NULL,
            user_id INT NOT NULL,
            type VARCHAR(100) NOT NULL,
            title VARCHAR(255),
            message TEXT,
            link VARCHAR(500),
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_user (user_id),
            INDEX idx_read (is_read)
        )
    `);

    // 11. Tasks table
    console.log('Creating tasks table...');
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id VARCHAR(36) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            priority VARCHAR(20) DEFAULT 'medium',
            due_date DATE,
            assigned_to INT,
            related_type VARCHAR(50),
            related_id INT,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_status (status),
            INDEX idx_assigned (assigned_to)
        )
    `);

    // 12. Activity Log table
    console.log('Creating activity_log table...');
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS activity_log (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id VARCHAR(36) NOT NULL,
            user_id INT,
            action VARCHAR(100) NOT NULL,
            entity_type VARCHAR(50),
            entity_id INT,
            details JSON,
            ip_address VARCHAR(50),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_user (user_id),
            INDEX idx_entity (entity_type, entity_id)
        )
    `);

    console.log('');
    console.log('✅ All tables created successfully!');
    console.log('');

    // ============================================
    // SEED DATA
    // ============================================

    // Create default tenant
    const tenantId = 'ba60a2bc-2921-43f5-aa81-65dc7ba298e7';
    console.log('Creating default tenant...');
    await connection.execute(`
        INSERT INTO tenants (id, name, domain) 
        VALUES (?, 'Fliphats', 'fliphats.com')
        ON DUPLICATE KEY UPDATE name = 'Fliphats'
    `, [tenantId]);

    // Create default admin user (password: admin123)
    console.log('Creating default admin user...');
    const bcryptHash = '$2b$10$rQZ5JxD1rvGQB6hQ5qYU9.TtIB/E5kABZ3YV6P8yLJ0X8YQy0zIYK'; // admin123
    await connection.execute(`
        INSERT INTO users (tenant_id, email, password, name, role)
        VALUES (?, 'admin@fliphats.com', ?, 'Admin User', 'admin')
        ON DUPLICATE KEY UPDATE name = 'Admin User'
    `, [tenantId, bcryptHash]);

    // Create sample company
    console.log('Creating sample company...');
    await connection.execute(`
        INSERT INTO companies (tenant_id, name, industry, size, city, country)
        VALUES (?, 'Fliphats', 'Technology', '11-50', 'Mumbai', 'India')
        ON DUPLICATE KEY UPDATE name = 'Fliphats'
    `, [tenantId]);

    // Create sample customers/leads
    console.log('Creating sample leads...');
    const sampleLeads = [
        ['John Doe', 'john@example.com', '+91 9876543210', 'TechCorp', 'Mumbai', 'new', 'warm', '₹50,000'],
        ['Jane Smith', 'jane@example.com', '+91 8765432109', 'DesignHub', 'Delhi', 'qualified', 'hot', '₹1,00,000'],
        ['Mike Johnson', 'mike@example.com', '+91 7654321098', 'StartupXYZ', 'Bangalore', 'new', 'cold', '₹25,000'],
        ['Sarah Wilson', 'sarah@example.com', '+91 6543210987', 'AgencyPro', 'Pune', 'proposal', 'warm', '₹75,000'],
        ['David Brown', 'david@example.com', '+91 5432109876', 'ConsultCo', 'Chennai', 'negotiation', 'hot', '₹2,00,000'],
    ];

    for (const lead of sampleLeads) {
        await connection.execute(`
            INSERT INTO customers (tenant_id, name, email, phone, company, location, stage, score, budget)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name = VALUES(name)
        `, [tenantId, ...lead]);
    }

    console.log('');
    console.log('============================================');
    console.log('✅ DATABASE SETUP COMPLETE!');
    console.log('============================================');
    console.log('');
    console.log('Default Login Credentials:');
    console.log('  Email: admin@fliphats.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('Tenant ID:', tenantId);
    console.log('');

    connection.end();
}

main().catch(err => {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
});
