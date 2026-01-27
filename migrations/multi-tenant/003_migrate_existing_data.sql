-- ============================================
-- Multi-Tenant Migration: Data Migration
-- Phase 1: Migrate existing data to default tenant
-- ============================================

-- IMPORTANT: Run this AFTER 002_add_tenant_id_columns.sql
-- This creates a default tenant and migrates all existing data

-- Generate a UUID for the default tenant
SET @default_tenant_id = UUID();

-- 1. Create the default tenant
INSERT INTO tenants (id, name, slug, plan, status, settings, created_at)
VALUES (
    @default_tenant_id,
    'Default Workspace',
    'default',
    'professional',
    'active',
    JSON_OBJECT(
        'branding', JSON_OBJECT('primaryColor', '#3B82F6'),
        'features', JSON_OBJECT('emailEnabled', true, 'tasksEnabled', true)
    ),
    NOW()
);

-- 2. Migrate admins to users table
INSERT INTO users (id, email, password_hash, name, avatar_url, phone, timezone, language, last_login, created_at)
SELECT 
    id, 
    email, 
    password_hash, 
    name, 
    avatar_url, 
    phone, 
    COALESCE(timezone, 'UTC'), 
    COALESCE(language, 'en'), 
    last_login, 
    created_at
FROM admins
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    avatar_url = VALUES(avatar_url);

-- 3. Create tenant_users mapping (map all admins to default tenant)
INSERT INTO tenant_users (tenant_id, user_id, role, joined_at)
SELECT 
    @default_tenant_id,
    id,
    CASE 
        WHEN role = 'super_admin' THEN 'owner'
        WHEN role = 'support' THEN 'member'
        ELSE 'member'
    END,
    created_at
FROM admins
ON DUPLICATE KEY UPDATE role = VALUES(role);

-- 4. Set the first super_admin as tenant owner
UPDATE tenants 
SET owner_id = (
    SELECT id FROM admins 
    WHERE role = 'super_admin' 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE id = @default_tenant_id;

-- 5. Make the first super_admin a platform admin as well
INSERT INTO platform_admins (user_id, role, permissions)
SELECT id, 'platform_owner', JSON_OBJECT('fullAccess', true)
FROM admins 
WHERE role = 'super_admin' 
ORDER BY created_at ASC 
LIMIT 1
ON DUPLICATE KEY UPDATE role = 'platform_owner';

-- =====================
-- MIGRATE EXISTING DATA
-- =====================

-- Update all business tables with default tenant_id
UPDATE customers SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
UPDATE orders SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
UPDATE tasks SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
UPDATE interactions SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
UPDATE files SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
UPDATE project_submissions SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;

-- Configuration tables
UPDATE landing_pages SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
UPDATE lead_stages SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
UPDATE lead_scores SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
UPDATE site_settings SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;

-- Email system tables
UPDATE emailaccount SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
UPDATE emaillog SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
UPDATE cachedemail SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
UPDATE emaildraft SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
UPDATE emailtemplate SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
UPDATE scheduledemail SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
UPDATE contact SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;

-- Messaging
UPDATE flash_messages SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;

-- Lead tracking
UPDATE lead_reads SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;

-- Webhooks
UPDATE webhook SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;

-- =====================
-- LOG THE MIGRATION
-- =====================

INSERT INTO tenant_audit_logs (tenant_id, user_id, action, entity_type, new_values, created_at)
VALUES (
    @default_tenant_id,
    NULL,
    'SYSTEM_MIGRATION',
    'tenant',
    JSON_OBJECT(
        'migration', 'initial_data_migration',
        'default_tenant_id', @default_tenant_id,
        'migrated_at', NOW()
    ),
    NOW()
);

-- Output the default tenant ID for reference
SELECT 
    @default_tenant_id AS default_tenant_id,
    'Data migration completed! All existing data moved to default tenant.' AS status;
