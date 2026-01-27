-- ============================================
-- Initial Database Setup for Docker
-- This runs automatically when container starts
-- ============================================

-- Set character set
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ===========================================
-- Run multi-tenant migrations
-- ===========================================

-- Include the foundation tables
SOURCE /docker-entrypoint-initdb.d/multi-tenant/001_create_tenant_tables.sql;
