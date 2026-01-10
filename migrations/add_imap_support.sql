-- Add IMAP fields to smtp_accounts
ALTER TABLE smtp_accounts 
ADD COLUMN imap_host VARCHAR(255) NULL AFTER host,
ADD COLUMN imap_port INT NULL AFTER port,
ADD COLUMN imap_user VARCHAR(255) NULL AFTER username,
ADD COLUMN imap_encrypted_password TEXT NULL AFTER encrypted_password,
ADD COLUMN last_synced_at DATETIME NULL;

-- Update emails table for inbox features
ALTER TABLE emails
ADD COLUMN direction ENUM('inbound', 'outbound') DEFAULT 'outbound',
ADD COLUMN message_id VARCHAR(255) NULL,
ADD COLUMN in_reply_to VARCHAR(255) NULL,
ADD COLUMN folder VARCHAR(50) DEFAULT 'SENT',
ADD COLUMN is_read BOOLEAN DEFAULT TRUE, -- Outbound are read by default
ADD COLUMN from_name VARCHAR(255) NULL,   -- Store sender name for inbound
ADD COLUMN from_address VARCHAR(255) NULL, -- Store sender address for inbound
ADD INDEX idx_direction_folder (direction, folder),
ADD INDEX idx_message_id (message_id);
