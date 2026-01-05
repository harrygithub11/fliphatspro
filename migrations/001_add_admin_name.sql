-- Multi-User Collaboration System - Database Migrations

-- 1. Add name column to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS name VARCHAR(255) AFTER email;

-- 2. Update existing admin with a name (if any exist)
UPDATE admins SET name = 'Admin' WHERE name IS NULL OR name = '';

-- 3. Verify the structure
DESCRIBE admins;

-- Expected result:
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
