-- Migration: Add tenant_id to all remaining tables
-- Run after Docker MySQL is accessible

-- Add tenant_id to emails table
ALTER TABLE emails ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_tenant ON emails(tenant_id);

-- Add tenant_id to smtp_accounts table  
ALTER TABLE smtp_accounts ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_smtp_tenant ON smtp_accounts(tenant_id);

-- Add tenant_id to email_templates table
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_email_templates_tenant ON email_templates(tenant_id);

-- Add tenant_id to email_drafts table
ALTER TABLE email_drafts ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_email_drafts_tenant ON email_drafts(tenant_id);

-- Add tenant_id to flash_messages table  
ALTER TABLE flash_messages ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_flash_messages_tenant ON flash_messages(tenant_id);

-- Add tenant_id to meetings table
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_meetings_tenant ON meetings(tenant_id);

-- Add tenant_id to landing_pages table
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_landing_pages_tenant ON landing_pages(tenant_id);

-- Add tenant_id to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);

-- Update existing data to default tenant (get the first tenant ID)
SET @default_tenant = (SELECT id FROM tenants ORDER BY created_at LIMIT 1);

-- Update all tables with default tenant
UPDATE emails SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE smtp_accounts SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE email_templates SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE email_drafts SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE flash_messages SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE meetings SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE landing_pages SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE notifications SET tenant_id = @default_tenant WHERE tenant_id IS NULL;

-- Also update tables from previous migration
UPDATE customers SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE orders SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE tasks SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE interactions SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE files SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
