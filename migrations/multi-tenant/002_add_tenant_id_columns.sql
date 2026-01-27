-- ============================================
-- Multi-Tenant Migration: Add tenant_id to existing tables
-- Phase 1: Add tenant_id column to all business tables
-- Character Set: utf8mb4_general_ci (matches live database)
-- ============================================

-- IMPORTANT: Run this AFTER 001_create_tenant_tables.sql

-- Helper procedure to add column if not exists
DELIMITER //
DROP PROCEDURE IF EXISTS add_tenant_id_column//
CREATE PROCEDURE add_tenant_id_column(IN table_name VARCHAR(100))
BEGIN
    SET @sql = CONCAT('ALTER TABLE ', table_name, ' ADD COLUMN tenant_id VARCHAR(36) NULL');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    SET @idx_sql = CONCAT('ALTER TABLE ', table_name, ' ADD INDEX idx_', table_name, '_tenant (tenant_id)');
    PREPARE stmt2 FROM @idx_sql;
    EXECUTE stmt2;
    DEALLOCATE PREPARE stmt2;
END//
DELIMITER ;

-- =====================
-- Add tenant_id to each table (wrapped in error handling)
-- =====================

-- Customers
ALTER TABLE customers ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE customers ADD INDEX idx_customers_tenant (tenant_id);

-- Orders  
ALTER TABLE orders ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE orders ADD INDEX idx_orders_tenant (tenant_id);

-- Tasks
ALTER TABLE tasks ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE tasks ADD INDEX idx_tasks_tenant (tenant_id);

-- Interactions
ALTER TABLE interactions ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE interactions ADD INDEX idx_interactions_tenant (tenant_id);

-- Files
ALTER TABLE files ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE files ADD INDEX idx_files_tenant (tenant_id);

-- Project submissions
ALTER TABLE project_submissions ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE project_submissions ADD INDEX idx_project_submissions_tenant (tenant_id);

-- Landing pages
ALTER TABLE landing_pages ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE landing_pages ADD INDEX idx_landing_pages_tenant (tenant_id);

-- Lead stages
ALTER TABLE lead_stages ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE lead_stages ADD INDEX idx_lead_stages_tenant (tenant_id);

-- Lead scores
ALTER TABLE lead_scores ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE lead_scores ADD INDEX idx_lead_scores_tenant (tenant_id);

-- Site settings
ALTER TABLE site_settings ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE site_settings ADD INDEX idx_site_settings_tenant (tenant_id);

-- Lead reads
ALTER TABLE lead_reads ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE lead_reads ADD INDEX idx_lead_reads_tenant (tenant_id);

-- Flash messages
ALTER TABLE flash_messages ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE flash_messages ADD INDEX idx_flash_messages_tenant (tenant_id);

-- Meetings
ALTER TABLE meetings ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE meetings ADD INDEX idx_meetings_tenant (tenant_id);

-- Email system tables (if they exist)
-- emailaccount
ALTER TABLE emailaccount ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE emailaccount ADD INDEX idx_emailaccount_tenant (tenant_id);

-- emaillog
ALTER TABLE emaillog ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE emaillog ADD INDEX idx_emaillog_tenant (tenant_id);

-- cachedemail
ALTER TABLE cachedemail ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE cachedemail ADD INDEX idx_cachedemail_tenant (tenant_id);

-- emaildraft
ALTER TABLE emaildraft ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE emaildraft ADD INDEX idx_emaildraft_tenant (tenant_id);

-- emailtemplate
ALTER TABLE emailtemplate ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE emailtemplate ADD INDEX idx_emailtemplate_tenant (tenant_id);

-- scheduledemail
ALTER TABLE scheduledemail ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE scheduledemail ADD INDEX idx_scheduledemail_tenant (tenant_id);

-- contact
ALTER TABLE contact ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE contact ADD INDEX idx_contact_tenant (tenant_id);

-- emailthread
ALTER TABLE emailthread ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE emailthread ADD INDEX idx_emailthread_tenant (tenant_id);

-- webhook
ALTER TABLE webhook ADD COLUMN tenant_id VARCHAR(36) NULL;
ALTER TABLE webhook ADD INDEX idx_webhook_tenant (tenant_id);

-- Clean up
DROP PROCEDURE IF EXISTS add_tenant_id_column;

SELECT 'Phase 1: tenant_id columns added to all business tables!' AS status;
