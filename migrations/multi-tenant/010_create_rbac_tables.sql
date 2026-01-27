
-- Create tenant_roles table
CREATE TABLE IF NOT EXISTS tenant_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    permissions JSON NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY idx_tenant_role_name (tenant_id, name)
);

-- Add column to tenant_users (initially NULL until migration script runs)
-- We use a safe procedure to add column if not exists
SET @dbname = DATABASE();
SET @tablename = "tenant_users";
SET @columnname = "role_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE tenant_users ADD COLUMN role_id INT NULL, ADD CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES tenant_roles(id) ON DELETE SET NULL;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
