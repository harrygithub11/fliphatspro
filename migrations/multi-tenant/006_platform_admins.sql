-- Create platform_admins table
CREATE TABLE IF NOT EXISTS platform_admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    role ENUM('platform_owner', 'master_admin', 'super_admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed defaults: Make User 1 (Harry) a Platform Owner
INSERT INTO platform_admins (user_id, role)
SELECT id, 'platform_owner' FROM users WHERE id = 1
ON DUPLICATE KEY UPDATE role = 'platform_owner';
