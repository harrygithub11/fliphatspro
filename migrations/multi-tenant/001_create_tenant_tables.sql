-- ============================================
-- Multi-Tenant Foundation Migration
-- Phase 1: Create core tenant tables
-- Database: Uses connection default
-- Character Set: utf8mb4_general_ci (matches live database)
-- ============================================

-- 1. TENANTS TABLE (The core of multi-tenancy)
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    plan ENUM('free', 'starter', 'professional', 'enterprise') DEFAULT 'free',
    status ENUM('active', 'suspended', 'archived') DEFAULT 'active',
    owner_id INT NULL,
    logo_url VARCHAR(500) NULL,
    domain VARCHAR(255) NULL,
    settings JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenants_slug (slug),
    INDEX idx_tenants_status (status),
    INDEX idx_tenants_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. USERS TABLE (Global identity, replaces admins for new users)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NULL,
    avatar_url VARCHAR(500) NULL,
    phone VARCHAR(20) NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    email_verified_at TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. TENANT_USERS TABLE (Maps users to tenants with roles)
CREATE TABLE IF NOT EXISTS tenant_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'admin', 'member', 'viewer') DEFAULT 'member',
    permissions JSON NULL,
    invited_by INT NULL,
    invited_at TIMESTAMP NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP NULL,
    UNIQUE KEY unique_tenant_user (tenant_id, user_id),
    INDEX idx_tenant_users_tenant (tenant_id),
    INDEX idx_tenant_users_user (user_id),
    INDEX idx_tenant_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. PLATFORM_ADMINS TABLE (For global platform control)
CREATE TABLE IF NOT EXISTS platform_admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    role ENUM('platform_owner', 'master_admin', 'super_admin') NOT NULL,
    permissions JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_platform_admins_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. TENANT_INVITATIONS TABLE (For inviting users to tenants)
CREATE TABLE IF NOT EXISTS tenant_invitations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role ENUM('owner', 'admin', 'member', 'viewer') DEFAULT 'member',
    token VARCHAR(255) NOT NULL UNIQUE,
    invited_by INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_invitations_token (token),
    INDEX idx_invitations_email (email),
    INDEX idx_invitations_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 6. TENANT_SETTINGS TABLE (Per-tenant configuration)
CREATE TABLE IF NOT EXISTS tenant_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT NULL,
    description VARCHAR(255) NULL,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_tenant_setting (tenant_id, setting_key),
    INDEX idx_tenant_settings_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 7. AUDIT_LOGS TABLE (Platform-wide audit trail)
CREATE TABLE IF NOT EXISTS tenant_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NULL,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id VARCHAR(36) NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_tenant (tenant_id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SELECT 'Phase 1: Foundation tables created successfully!' AS status;
