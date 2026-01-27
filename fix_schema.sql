-- Fix missing deleted_at columns and create files table
-- Run this with: mysql -u root -p dbfliphats < fix_schema.sql

-- Add deleted_at to customers if missing
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;

-- Add company_id to customers if missing
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id INT;

-- Add deleted_at to orders if missing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;

-- Add deleted_at to tasks if missing
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;

-- Add deleted_at to deals if missing
ALTER TABLE deals ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;

-- Create files table with deleted_at column
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    customer_id INT,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    INDEX idx_tenant (tenant_id),
    INDEX idx_customer (customer_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SELECT 'Schema fixes applied successfully!' AS status;
