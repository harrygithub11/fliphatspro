-- Migration: Add tenant_id to Email System tables
-- Run this to support app/api/email-system routes

-- emailaccount (already checked, but ensuring)
ALTER TABLE emailaccount ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_emailaccount_tenant ON emailaccount(tenant_id);

-- cachedemail
ALTER TABLE cachedemail ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_cachedemail_tenant ON cachedemail(tenant_id);

-- emaildraft
ALTER TABLE emaildraft ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_emaildraft_tenant ON emaildraft(tenant_id);

-- emailtemplate
ALTER TABLE emailtemplate ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_emailtemplate_tenant ON emailtemplate(tenant_id);

-- scheduledemail
ALTER TABLE scheduledemail ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_scheduledemail_tenant ON scheduledemail(tenant_id);

-- emailthread
ALTER TABLE emailthread ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_emailthread_tenant ON emailthread(tenant_id);

-- contact
ALTER TABLE contact ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_tenant ON contact(tenant_id);

-- Set default tenant (FlipHats Pro)
SET @default_tenant = (SELECT id FROM tenants ORDER BY created_at LIMIT 1);

-- Update all tables
UPDATE emailaccount SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE cachedemail SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE emaildraft SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE emailtemplate SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE scheduledemail SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE emailthread SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE contact SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
