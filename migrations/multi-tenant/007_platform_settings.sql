
-- Platform-wide settings table
CREATE TABLE platform_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default settings
INSERT INTO platform_settings (setting_key, setting_value, description) VALUES
('allow_registration', 'true', 'Allow new tenants to self-register'),
('default_trial_days', '14', 'Default trial period for new workspaces'),
('maintenance_mode', 'false', 'Put the entire platform into maintenance mode'),
('support_email', 'support@fliphats.com', 'Global support email address');
