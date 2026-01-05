-- Create Admin Users for Multi-User CRM System
-- Run this in phpMyAdmin or MySQL Workbench

USE newyear;

-- First, ensure the name column exists
ALTER TABLE admins ADD COLUMN IF NOT EXISTS name VARCHAR(255) AFTER email;

-- Create admin users with bcrypt hashed passwords
-- All passwords are: admin123

-- Admin 1: Super Admin
INSERT INTO admins (email, name, password_hash, role, created_at) 
VALUES (
    'admin@fliphats.com',
    'Admin User',
    '$2b$10$5d83h.8yLlUcxOAjFbSEaO.2XTOPScMGgmefAH9eMJ41buXEoPDQ2',
    'super_admin',
    NOW()
) ON DUPLICATE KEY UPDATE 
    name = 'Admin User',
    password_hash = '$2b$10$5d83h.8yLlUcxOAjFbSEaO.2XTOPScMGgmefAH9eMJ41buXEoPDQ2';

-- Admin 2: John Doe (Sales Lead)
INSERT INTO admins (email, name, password_hash, role, created_at) 
VALUES (
    'john@fliphats.com',
    'John Doe',
    '$2b$10$5d83h.8yLlUcxOAjFbSEaO.2XTOPScMGgmefAH9eMJ41buXEoPDQ2',
    'super_admin',
    NOW()
) ON DUPLICATE KEY UPDATE 
    name = 'John Doe',
    password_hash = '$2b$10$5d83h.8yLlUcxOAjFbSEaO.2XTOPScMGgmefAH9eMJ41buXEoPDQ2';

-- Admin 3: Sarah Smith (Support)
INSERT INTO admins (email, name, password_hash, role, created_at) 
VALUES (
    'sarah@fliphats.com',
    'Sarah Smith',
    '$2b$10$5d83h.8yLlUcxOAjFbSEaO.2XTOPScMGgmefAH9eMJ41buXEoPDQ2',
    'support',
    NOW()
) ON DUPLICATE KEY UPDATE 
    name = 'Sarah Smith',
    password_hash = '$2b$10$5d83h.8yLlUcxOAjFbSEaO.2XTOPScMGgmefAH9eMJ41buXEoPDQ2';

-- Verify the users were created
SELECT id, email, name, role, created_at FROM admins ORDER BY id;

-- Expected output:
-- +----+----------------------+--------------+--------------+---------------------+
-- | id | email                | name         | role         | created_at          |
-- +----+----------------------+--------------+--------------+---------------------+
-- |  1 | admin@fliphats.com   | Admin User   | super_admin  | 2025-12-29 02:44:00 |
-- |  2 | john@fliphats.com    | John Doe     | super_admin  | 2025-12-29 02:44:00 |
-- |  3 | sarah@fliphats.com   | Sarah Smith  | support      | 2025-12-29 02:44:00 |
-- +----+----------------------+--------------+--------------+---------------------+

-- Login Credentials:
-- Email: admin@fliphats.com | Password: admin123 | Role: Super Admin
-- Email: john@fliphats.com  | Password: admin123 | Role: Super Admin
-- Email: sarah@fliphats.com | Password: admin123 | Role: Support
