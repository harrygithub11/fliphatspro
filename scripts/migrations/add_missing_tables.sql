-- ============================================
-- SAFE MIGRATION: Add Missing Tables Only
-- This script only creates tables that DON'T exist
-- Run this on your existing database
-- ============================================

-- ============================================
-- 1. SUBSCRIPTION PLANS (Missing)
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    features JSON,
    limits JSON COMMENT '{"users": 5, "contacts": 1000, "emails_per_month": 5000}',
    trial_days INT DEFAULT 14,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default plans
INSERT IGNORE INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits) VALUES
('Free', 'free', 'Perfect for getting started', 0.00, 0.00, 
 '["1 User", "100 Contacts", "Basic Email", "Community Support"]',
 '{"users": 1, "contacts": 100, "emails_per_month": 500, "storage_gb": 1}'),
('Starter', 'starter', 'For small teams', 29.00, 290.00,
 '["5 Users", "1,000 Contacts", "Email Campaigns", "Email Support"]',
 '{"users": 5, "contacts": 1000, "emails_per_month": 5000, "storage_gb": 10}'),
('Professional', 'professional', 'For growing businesses', 99.00, 990.00,
 '["25 Users", "10,000 Contacts", "Advanced Automation", "Priority Support"]',
 '{"users": 25, "contacts": 10000, "emails_per_month": 50000, "storage_gb": 100}'),
('Enterprise', 'enterprise', 'For large organizations', 299.00, 2990.00,
 '["Unlimited Users", "Unlimited Contacts", "Advanced Features", "Dedicated Support"]',
 '{"users": -1, "contacts": -1, "emails_per_month": -1, "storage_gb": 1000}');

-- ============================================
-- 2. DEALS (Missing - Critical for CRM)
-- ============================================
CREATE TABLE IF NOT EXISTS deals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(191) NOT NULL,
    contact_id INT,
    customer_id INT COMMENT 'Legacy link to customers table',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'INR',
    stage VARCHAR(50) DEFAULT 'lead',
    probability INT DEFAULT 0 COMMENT 'Win probability 0-100',
    expected_close_date DATE,
    actual_close_date DATE,
    status ENUM('open', 'won', 'lost') DEFAULT 'open',
    lost_reason TEXT,
    source VARCHAR(100),
    owner_id INT,
    custom_fields JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_stage (tenant_id, stage),
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_tenant_owner (tenant_id, owner_id),
    INDEX idx_customer (customer_id),
    INDEX idx_close_date (expected_close_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. ACTIVITIES (Missing - Unified activity log)
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(191) NOT NULL,
    contact_id INT,
    customer_id INT COMMENT 'Legacy link to customers table',
    deal_id INT,
    type ENUM('call', 'email', 'meeting', 'note', 'task', 'whatsapp') NOT NULL,
    subject VARCHAR(255),
    description TEXT,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    duration INT COMMENT 'Duration in minutes',
    scheduled_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_by INT NOT NULL,
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_contact (tenant_id, contact_id),
    INDEX idx_tenant_customer (tenant_id, customer_id),
    INDEX idx_tenant_type (tenant_id, type),
    INDEX idx_assigned (assigned_to),
    INDEX idx_scheduled (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. CUSTOM FIELDS (Missing - Dynamic fields)
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. PIPELINE STAGES (Missing - Customizable)
-- ============================================
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(191) NOT NULL,
    pipeline_type ENUM('lead', 'deal') DEFAULT 'deal',
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#3B82F6',
    display_order INT DEFAULT 0,
    probability INT DEFAULT 0 COMMENT 'Win probability %',
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE COMMENT 'Cannot delete system stages',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_type (tenant_id, pipeline_type),
    INDEX idx_order (tenant_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default deal stages
INSERT IGNORE INTO pipeline_stages (tenant_id, pipeline_type, name, color, display_order, probability, is_system) 
SELECT t.id, 'deal', 'Lead', '#6B7280', 0, 10, TRUE FROM tenants t
UNION ALL
SELECT t.id, 'deal', 'Qualified', '#3B82F6', 1, 25, TRUE FROM tenants t
UNION ALL
SELECT t.id, 'deal', 'Proposal', '#8B5CF6', 2, 50, TRUE FROM tenants t
UNION ALL
SELECT t.id, 'deal', 'Negotiation', '#F59E0B', 3, 75, TRUE FROM tenants t
UNION ALL
SELECT t.id, 'deal', 'Closed Won', '#10B981', 4, 100, TRUE FROM tenants t
UNION ALL
SELECT t.id, 'deal', 'Closed Lost', '#EF4444', 5, 0, TRUE FROM tenants t;

-- ============================================
-- 6. WORKFLOWS (Missing - Automation rules)
-- ============================================
CREATE TABLE IF NOT EXISTS workflows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(191) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type ENUM('contact_created', 'deal_stage_changed', 'deal_created', 'email_received', 'tag_added', 'form_submitted', 'manual') NOT NULL,
    trigger_conditions JSON COMMENT 'Conditions to start workflow',
    actions JSON COMMENT 'Actions to perform',
    is_active BOOLEAN DEFAULT TRUE,
    run_count INT DEFAULT 0,
    last_run_at TIMESTAMP NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_active (tenant_id, is_active),
    INDEX idx_trigger_type (trigger_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. WORKFLOW EXECUTIONS (Missing - Track runs)
-- ============================================
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
    INDEX idx_status (status),
    INDEX idx_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. COMPANIES (Missing - Organization entities)
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DONE!
-- ============================================
SELECT 'Migration completed successfully!' AS status;
