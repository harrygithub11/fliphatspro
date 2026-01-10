-- Migration: Advanced Email Features
-- This script adds tables for drafts, templates, tracking, analytics, and enhances smtp_accounts for signatures.

-- 1. Enhance smtp_accounts for signatures
ALTER TABLE smtp_accounts 
ADD COLUMN signature_text TEXT NULL,
ADD COLUMN signature_html TEXT NULL,
ADD COLUMN use_signature BOOLEAN DEFAULT FALSE;

-- 2. Email Drafts
CREATE TABLE IF NOT EXISTS email_drafts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    smtp_account_id INT NOT NULL,
    recipient_to TEXT NULL,
    recipient_cc TEXT NULL,
    recipient_bcc TEXT NULL,
    subject VARCHAR(500) NULL,
    body_text LONGTEXT NULL,
    body_html LONGTEXT NULL,
    has_attachments BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (smtp_account_id) REFERENCES smtp_accounts(id) ON DELETE CASCADE
);

-- 3. Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NULL,
    body_text LONGTEXT NULL,
    body_html LONGTEXT NULL,
    category VARCHAR(100) NULL,
    usage_count INT DEFAULT 0,
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Email Tracking
CREATE TABLE IF NOT EXISTS email_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_id INT NOT NULL,
    smtp_account_id INT NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tracking_uuid VARCHAR(100) NOT NULL,
    opened_at TIMESTAMP NULL,
    clicked_at TIMESTAMP NULL,
    open_count INT DEFAULT 0,
    click_count INT DEFAULT 0,
    ip_address VARCHAR(50) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
    FOREIGN KEY (smtp_account_id) REFERENCES smtp_accounts(id) ON DELETE CASCADE,
    INDEX (email_id),
    INDEX (smtp_account_id),
    INDEX (tracking_uuid)
);

-- 5. Email Analytics (Daily Stats)
CREATE TABLE IF NOT EXISTS email_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    smtp_account_id INT NOT NULL,
    stat_date DATE NOT NULL,
    emails_sent INT DEFAULT 0,
    emails_received INT DEFAULT 0,
    emails_read INT DEFAULT 0,
    avg_response_time_seconds INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (smtp_account_id, stat_date),
    FOREIGN KEY (smtp_account_id) REFERENCES smtp_accounts(id) ON DELETE CASCADE
);

-- 6. Enhance emails table for attachments display
ALTER TABLE emails
ADD COLUMN has_attachments BOOLEAN DEFAULT FALSE,
ADD COLUMN attachment_count INT DEFAULT 0;

-- 7. Email Attachments (Base64 storage for now, similar to old build)
CREATE TABLE IF NOT EXISTS email_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_id INT NULL,
    draft_id INT NULL,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size INT NOT NULL,
    data LONGTEXT NOT NULL, -- Base64 encoded or path
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
    FOREIGN KEY (draft_id) REFERENCES email_drafts(id) ON DELETE CASCADE,
    INDEX (email_id),
    INDEX (draft_id)
);
