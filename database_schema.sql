USE newyear;

-- 1. ADMINS TABLE (Secure Access)
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'support') DEFAULT 'super_admin',
    phone VARCHAR(20) NULL,
    avatar_url VARCHAR(500) NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: Insert default admin for demo purposes (password: admin123)
-- INSERT INTO admins (email, password_hash, role) VALUES ('admin', 'admin123', 'super_admin');


-- 2. CUSTOMERS TABLE (Central Profile)
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- 3. ORDERS TABLE (Transactional Core)
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    source VARCHAR(50) DEFAULT 'Website',
    status ENUM('initiated', 'payment_failed', 'paid', 'onboarding_pending', 'processing', 'delivered', 'cancelled') DEFAULT 'initiated',
    invoice_url VARCHAR(500),
    proposal_status ENUM('draft', 'sent', 'accepted', 'declined') DEFAULT 'draft',
    payment_mode VARCHAR(50),
    due_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);


-- 4. PROJECT SUBMISSIONS (Onboarding Data)
CREATE TABLE IF NOT EXISTS project_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    brand_name VARCHAR(255),
    assets_url VARCHAR(500), -- Link to zip/folder if needed
    raw_data_json JSON, -- The full 15-point checklist
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);


-- 5. INTERACTIONS (The "What He Said" Log)
CREATE TABLE IF NOT EXISTS interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    order_id INT,
    type ENUM('call_log', 'email_sent', 'whatsapp_msg', 'internal_note', 'system_event') NOT NULL,
    content TEXT,
    sentiment ENUM('positive', 'neutral', 'negative') DEFAULT 'neutral',
    created_by INT, -- Link to admin id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);


-- 6. TASKS (Actionable Items)
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT, -- Direct link to lead
    related_order_id INT,
    assigned_to INT, -- admin_id
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP NULL,
    status ENUM('open', 'in_progress', 'done') DEFAULT 'open',
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (related_order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- 7. FILES (Attachments)
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    uploaded_by INT,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) DEFAULT 'link',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- 8. ADMIN SESSIONS (Security)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- 9. ADMIN LOGIN HISTORY (Audit)
CREATE TABLE IF NOT EXISTS admin_login_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT,
    email_attempted VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    location VARCHAR(100),
    success BOOLEAN DEFAULT FALSE,
    failure_reason VARCHAR(255),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. ADMIN ACTIVITY LOG (Audit)
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_description TEXT,
    entity_type VARCHAR(50),
    entity_id INT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- 11. ADMIN PREFERENCES (Settings)
CREATE TABLE IF NOT EXISTS admin_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL UNIQUE,
    theme ENUM('light', 'dark', 'system') DEFAULT 'system',
    notify_email BOOLEAN DEFAULT TRUE,
    notify_in_app BOOLEAN DEFAULT TRUE,
    default_view VARCHAR(50) DEFAULT 'dashboard',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);
