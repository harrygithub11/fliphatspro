-- ============================================
-- FliphatsPro Base Schema for Docker
-- Creates all essential tables
-- ============================================

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    notes TEXT,
    ltv DECIMAL(10, 2) DEFAULT 0.00,
    source VARCHAR(50) DEFAULT 'Website',
    score ENUM('hot', 'warm', 'cold') DEFAULT 'cold',
    stage ENUM('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'follow_up_required', 'follow_up_done') DEFAULT 'new',
    tags JSON,
    owner VARCHAR(100) DEFAULT 'unassigned',
    location VARCHAR(255),
    company VARCHAR(255),
    project_desc TEXT,
    budget VARCHAR(50),
    platform VARCHAR(191),
    ad_id VARCHAR(191),
    ad_name VARCHAR(191),
    adset_id VARCHAR(191),
    adset_name VARCHAR(191),
    campaign_id VARCHAR(191),
    campaign_name VARCHAR(191),
    form_id VARCHAR(191),
    form_name VARCHAR(191),
    fb_lead_id VARCHAR(191),
    fb_lead_status VARCHAR(191),
    fb_created_time VARCHAR(191),
    is_organic BOOLEAN DEFAULT FALSE,
    facebook_lead_id VARCHAR(191) UNIQUE,
    ad_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    source VARCHAR(50) DEFAULT 'Website',
    status ENUM('new_lead', 'initiated', 'payment_failed', 'paid', 'onboarding_pending', 'processing', 'delivered', 'cancelled') DEFAULT 'initiated',
    invoice_url VARCHAR(500),
    proposal_status ENUM('draft', 'sent', 'accepted', 'declined') DEFAULT 'draft',
    payment_mode VARCHAR(50),
    onboarding_status ENUM('pending', 'completed') DEFAULT 'pending',
    due_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    related_order_id INT,
    assigned_to INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP NULL,
    status ENUM('open', 'in_progress', 'done') DEFAULT 'open',
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    created_by INT,
    status_changed_at TIMESTAMP NULL,
    status_changed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Interactions table
CREATE TABLE IF NOT EXISTS interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    order_id INT,
    type ENUM('call_log', 'email_sent', 'whatsapp_msg', 'internal_note', 'system_event') NOT NULL,
    content TEXT,
    sentiment ENUM('positive', 'neutral', 'negative') DEFAULT 'neutral',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Files table
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    uploaded_by INT,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) DEFAULT 'link',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Project submissions table
CREATE TABLE IF NOT EXISTS project_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    brand_name VARCHAR(255),
    assets_url VARCHAR(500),
    raw_data_json JSON,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Landing pages table
CREATE TABLE IF NOT EXISTS landing_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    content JSON,
    page_views INT DEFAULT 0,
    conversions INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Lead stages table
CREATE TABLE IF NOT EXISTS lead_stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    value VARCHAR(50) UNIQUE,
    label VARCHAR(100),
    color VARCHAR(50) DEFAULT 'gray',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Lead scores table
CREATE TABLE IF NOT EXISTS lead_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    value VARCHAR(50) UNIQUE,
    label VARCHAR(100),
    color VARCHAR(50) DEFAULT 'gray',
    emoji VARCHAR(10),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100),
    setting_value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Lead reads table
CREATE TABLE IF NOT EXISTS lead_reads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT,
    lead_id INT,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Flash messages table
CREATE TABLE IF NOT EXISTS flash_messages (
    id VARCHAR(36) PRIMARY KEY,
    senderId INT,
    receiverId INT,
    message TEXT,
    attachmentUrl VARCHAR(500),
    attachmentType VARCHAR(50),
    type VARCHAR(50) DEFAULT 'flash',
    isRead BOOLEAN DEFAULT FALSE,
    readAt DATETIME,
    deliveredAt DATETIME,
    sentAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    parentMessageId VARCHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    roomName VARCHAR(255) UNIQUE,
    hostId INT,
    status VARCHAR(50) DEFAULT 'active',
    startTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    endTime DATETIME,
    notes LONGTEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Email system tables
CREATE TABLE IF NOT EXISTS emailaccount (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    provider VARCHAR(50),
    imapHost VARCHAR(255),
    imapPort INT DEFAULT 993,
    imapSecure BOOLEAN DEFAULT TRUE,
    smtpHost VARCHAR(255),
    smtpPort INT DEFAULT 587,
    smtpSecure BOOLEAN DEFAULT FALSE,
    username VARCHAR(255),
    password VARCHAR(255),
    isActive BOOLEAN DEFAULT TRUE,
    isDefault BOOLEAN DEFAULT FALSE,
    lastSync DATETIME,
    signature TEXT,
    signatureHtml TEXT,
    useSignature BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS emaillog (
    id VARCHAR(36) PRIMARY KEY,
    accountId VARCHAR(36),
    direction VARCHAR(20),
    `from` VARCHAR(255),
    `to` VARCHAR(255),
    subject VARCHAR(255),
    body LONGTEXT,
    status VARCHAR(50),
    error TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS cachedemail (
    id VARCHAR(36) PRIMARY KEY,
    accountId VARCHAR(36),
    uid INT,
    `from` VARCHAR(255),
    `to` VARCHAR(255),
    subject VARCHAR(255),
    textSnippet TEXT,
    htmlContent LONGTEXT,
    date DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    folder VARCHAR(50) DEFAULT 'INBOX',
    hasAttachments BOOLEAN DEFAULT FALSE,
    attachmentCount INT DEFAULT 0,
    UNIQUE KEY unique_email (accountId, uid, folder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS emaildraft (
    id VARCHAR(36) PRIMARY KEY,
    accountId VARCHAR(36),
    `to` TEXT,
    cc TEXT,
    bcc TEXT,
    subject VARCHAR(255),
    body LONGTEXT,
    htmlBody LONGTEXT,
    hasAttachments BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS emailtemplate (
    id VARCHAR(36) PRIMARY KEY,
    accountId VARCHAR(36),
    name VARCHAR(100),
    subject VARCHAR(500),
    body LONGTEXT,
    htmlBody LONGTEXT,
    category VARCHAR(50),
    isShared BOOLEAN DEFAULT FALSE,
    usageCount INT DEFAULT 0,
    lastUsed DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS scheduledemail (
    id VARCHAR(36) PRIMARY KEY,
    accountId VARCHAR(36),
    `to` TEXT,
    cc TEXT,
    bcc TEXT,
    subject VARCHAR(500),
    body LONGTEXT,
    htmlBody LONGTEXT,
    attachments LONGTEXT,
    scheduledFor DATETIME,
    status VARCHAR(20) DEFAULT 'pending',
    sentAt DATETIME,
    error TEXT,
    retryCount INT DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS contact (
    id VARCHAR(36) PRIMARY KEY,
    accountId VARCHAR(36),
    email VARCHAR(255),
    name VARCHAR(255),
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    company VARCHAR(255),
    phone VARCHAR(50),
    notes TEXT,
    avatar VARCHAR(500),
    tags TEXT,
    lastEmailDate DATETIME,
    emailCount INT DEFAULT 0,
    isFavorite BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_contact (accountId, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS emailthread (
    id VARCHAR(36) PRIMARY KEY,
    accountId VARCHAR(36),
    subject VARCHAR(500),
    participants TEXT,
    lastEmailDate DATETIME,
    emailCount INT DEFAULT 1,
    unreadCount INT DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS webhook (
    id VARCHAR(36) PRIMARY KEY,
    accountId VARCHAR(36),
    name VARCHAR(100),
    url VARCHAR(500),
    events TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    secret VARCHAR(100),
    lastTrigger DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Admin related tables
CREATE TABLE IF NOT EXISTS admin_login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT,
    action_type VARCHAR(50),
    action_description TEXT,
    entity_type VARCHAR(50),
    entity_id INT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SELECT 'Base schema created successfully!' AS status;
