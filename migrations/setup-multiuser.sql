-- Multi-User Collaboration System - Complete Setup Script
-- Run this in your MySQL database (phpMyAdmin or MySQL Workbench)

USE newyear;

-- 1. Add name column to admins table (if not exists)
ALTER TABLE admins ADD COLUMN IF NOT EXISTS name VARCHAR(255) AFTER email;

-- 2. Update existing admins with default names
UPDATE admins SET name = 'Admin' WHERE name IS NULL OR name = '';

-- 3. Create a test admin account with bcrypt hashed password
-- Password: "admin123" (bcrypt hash)
INSERT INTO admins (email, name, password_hash, role) 
VALUES (
    'admin@test.com', 
    'Test Admin', 
    '$2a$10$YourBcryptHashHere',
    'super_admin'
) ON DUPLICATE KEY UPDATE name = 'Test Admin';

-- 4. Verify the structure
DESCRIBE admins;

-- 5. Check existing admins
SELECT id, email, name, role, created_at FROM admins;

-- 6. Verify interactions table has created_by column
DESCRIBE interactions;

-- Expected output for admins table:
-- +---------------+--------------+------+-----+-------------------+
-- | Field         | Type         | Null | Key | Default           |
-- +---------------+--------------+------+-----+-------------------+
-- | id            | int          | NO   | PRI | NULL              |
-- | email         | varchar(255) | NO   | UNI | NULL              |
-- | name          | varchar(255) | YES  |     | NULL              |
-- | password_hash | varchar(255) | NO   |     | NULL              |
-- | role          | enum(...)    | YES  |     | super_admin       |
-- | last_login    | timestamp    | YES  |     | NULL              |
-- | created_at    | timestamp    | YES  |     | CURRENT_TIMESTAMP |
-- +---------------+--------------+------+-----+-------------------+

-- NOTE: To generate a bcrypt hash for a password, use the hash-passwords.ts script
-- or an online bcrypt generator with 10 salt rounds
