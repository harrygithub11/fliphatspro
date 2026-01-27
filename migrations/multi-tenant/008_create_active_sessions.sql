
CREATE TABLE IF NOT EXISTS active_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    INDEX idx_user_sessions (user_id),
    INDEX idx_session_token (session_token),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
