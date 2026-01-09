-- Enterprise Email System Schema

-- 1. SMTP Accounts Table
CREATE TABLE IF NOT EXISTS smtp_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL COMMENT 'gmail, outlook, sendgrid, mailgun, ses, custom_smtp',
    host VARCHAR(255) NOT NULL,
    port INT NOT NULL,
    username VARCHAR(255) NOT NULL,
    encrypted_password TEXT NOT NULL,
    oauth_refresh_token TEXT NULL,
    oauth_access_token TEXT NULL,
    oauth_expires_at DATETIME NULL,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255) NOT NULL,
    dkim_selector VARCHAR(255) NULL,
    dkim_private_key TEXT NULL COMMENT 'Encrypted',
    created_by INT NULL, -- Link to users table? Assuming users table exists
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    region VARCHAR(50) NULL
);

-- 2. Emails Table (Sent/Drafts)
CREATE TABLE IF NOT EXISTS emails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NULL,
    user_id INT NULL COMMENT 'Sender',
    smtp_account_id INT NULL,
    status VARCHAR(50) DEFAULT 'draft' COMMENT 'draft, queued, sent, failed, bounced',
    recipient_to JSON NOT NULL COMMENT 'Array of {name, email}',
    recipient_cc JSON NULL,
    recipient_bcc JSON NULL,
    subject VARCHAR(255) NULL,
    body_html LONGTEXT NULL,
    body_text LONGTEXT NULL,
    headers_json JSON NULL COMMENT 'Message-ID, etc.',
    related_task_id INT NULL,
    error_message TEXT NULL,
    sent_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (smtp_account_id) REFERENCES smtp_accounts(id) ON DELETE SET NULL
);

-- 3. Email Attachments
CREATE TABLE IF NOT EXISTS email_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    content_type VARCHAR(100) NULL,
    file_size INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

-- 4. Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NULL,
    body_html LONGTEXT NULL,
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Email Tracking Events
CREATE TABLE IF NOT EXISTS email_tracking_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_id INT NOT NULL,
    type VARCHAR(50) NOT NULL COMMENT 'open, click',
    url VARCHAR(2048) NULL COMMENT 'For clicks',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

-- 6. Email Bounces
CREATE TABLE IF NOT EXISTS email_bounces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_id INT NULL,
    recipient VARCHAR(255) NOT NULL,
    bounce_type VARCHAR(50) NULL COMMENT 'hard, soft, complaint',
    reason TEXT NULL,
    provider_response TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    -- Flexible FK, might not link to email_id if webhook comes late or mismatches
);

-- 7. Email Send Jobs (Optional log, mainly for debugging/audit beyond BullMQ)
CREATE TABLE IF NOT EXISTS email_send_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    attempt_count INT DEFAULT 0,
    last_error TEXT NULL,
    started_at DATETIME NULL,
    finished_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
