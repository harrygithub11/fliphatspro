CREATE TABLE IF NOT EXISTS login_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    email VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    location VARCHAR(100),
    status ENUM('success', 'failed') NOT NULL DEFAULT 'success',
    failure_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_history (user_id),
    INDEX idx_email_history (email)
);
