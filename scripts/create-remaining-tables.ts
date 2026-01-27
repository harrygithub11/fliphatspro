
import mysql from 'mysql2/promise'

async function createRemainingTables() {
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

        // 1. Activities table
        console.log('\n📦 Creating activities table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS activities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id VARCHAR(191) NOT NULL,
                contact_id INT,
                customer_id INT,
                deal_id INT,
                type ENUM('call', 'email', 'meeting', 'note', 'task', 'whatsapp') NOT NULL,
                subject VARCHAR(255),
                description TEXT,
                status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'completed',
                duration INT COMMENT 'Duration in minutes',
                scheduled_at TIMESTAMP NULL,
                completed_at TIMESTAMP NULL,
                created_by INT NOT NULL,
                assigned_to INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_tenant_contact (tenant_id, contact_id),
                INDEX idx_tenant_customer (tenant_id, customer_id),
                INDEX idx_tenant_deal (tenant_id, deal_id),
                INDEX idx_type (type),
                INDEX idx_scheduled (scheduled_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ activities');

        // 2. Companies table
        console.log('📦 Creating companies table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS companies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id VARCHAR(191) NOT NULL,
                name VARCHAR(255) NOT NULL,
                domain VARCHAR(255),
                industry VARCHAR(100),
                size ENUM('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'),
                website VARCHAR(255),
                phone VARCHAR(20),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                country VARCHAR(100),
                postal_code VARCHAR(20),
                logo_url VARCHAR(500),
                linkedin_url VARCHAR(255),
                annual_revenue DECIMAL(15,2),
                employee_count INT,
                tags JSON,
                custom_fields JSON,
                owner_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_tenant (tenant_id),
                INDEX idx_domain (domain),
                INDEX idx_owner (owner_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ companies');

        // 3. Custom Fields table
        console.log('📦 Creating custom_fields table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS custom_fields (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id VARCHAR(191) NOT NULL,
                entity_type ENUM('contact', 'customer', 'deal', 'company', 'task') NOT NULL,
                field_name VARCHAR(100) NOT NULL,
                field_label VARCHAR(255) NOT NULL,
                field_type ENUM('text', 'number', 'date', 'email', 'phone', 'url', 'select', 'multi_select', 'checkbox', 'textarea') NOT NULL,
                options JSON COMMENT 'For select/multi_select fields',
                default_value TEXT,
                is_required BOOLEAN DEFAULT FALSE,
                display_order INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_tenant_entity (tenant_id, entity_type),
                UNIQUE KEY unique_tenant_field (tenant_id, entity_type, field_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ custom_fields');

        // 4. Pipeline Stages table
        console.log('📦 Creating pipeline_stages table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS pipeline_stages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id VARCHAR(191) NOT NULL,
                pipeline_type ENUM('lead', 'deal') DEFAULT 'deal',
                name VARCHAR(100) NOT NULL,
                color VARCHAR(20) DEFAULT '#3B82F6',
                display_order INT DEFAULT 0,
                probability INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                is_system BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_tenant_type (tenant_id, pipeline_type),
                INDEX idx_order (tenant_id, display_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ pipeline_stages');

        // 5. Workflows table
        console.log('📦 Creating workflows table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS workflows (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id VARCHAR(191) NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                trigger_type ENUM('contact_created', 'deal_stage_changed', 'deal_created', 'email_received', 'tag_added', 'form_submitted', 'manual') NOT NULL,
                trigger_conditions JSON,
                actions JSON,
                is_active BOOLEAN DEFAULT TRUE,
                run_count INT DEFAULT 0,
                last_run_at TIMESTAMP NULL,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_tenant_active (tenant_id, is_active),
                INDEX idx_trigger_type (trigger_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ workflows');

        // 6. Workflow Executions table
        console.log('📦 Creating workflow_executions table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS workflow_executions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                workflow_id INT NOT NULL,
                tenant_id VARCHAR(191) NOT NULL,
                contact_id INT,
                deal_id INT,
                status ENUM('running', 'completed', 'failed', 'cancelled') DEFAULT 'running',
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                error TEXT,
                execution_log JSON,
                INDEX idx_workflow (workflow_id),
                INDEX idx_tenant (tenant_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ workflow_executions');

        // 7. Subscription Plans table
        console.log('📦 Creating subscription_plans table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS subscription_plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                slug VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                features JSON,
                limits JSON,
                trial_days INT DEFAULT 14,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ subscription_plans');

        // Seed default plans
        console.log('\n📥 Seeding subscription plans...');
        await connection.query(`
            INSERT IGNORE INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits) VALUES
            ('Free', 'free', 'Perfect for getting started', 0.00, 0.00, 
             '["1 User", "100 Contacts", "Basic Email"]',
             '{"users": 1, "contacts": 100, "emails_per_month": 500}'),
            ('Starter', 'starter', 'For small teams', 29.00, 290.00,
             '["5 Users", "1000 Contacts", "Email Campaigns"]',
             '{"users": 5, "contacts": 1000, "emails_per_month": 5000}'),
            ('Professional', 'professional', 'For growing businesses', 99.00, 990.00,
             '["25 Users", "10000 Contacts", "Advanced Automation"]',
             '{"users": 25, "contacts": 10000, "emails_per_month": 50000}'),
            ('Enterprise', 'enterprise', 'For large organizations', 299.00, 2990.00,
             '["Unlimited Users", "Unlimited Contacts", "Custom Features"]',
             '{"users": -1, "contacts": -1, "emails_per_month": -1}')
        `);
        console.log('✅ Plans seeded');

        console.log('\n════════════════════════════════════');
        console.log('🎉 All tables created successfully!');
        console.log('════════════════════════════════════');

    } catch (e: any) {
        console.error('❌ Error:', e.message);
    } finally {
        if (connection) connection.end();
    }
}

createRemainingTables();
