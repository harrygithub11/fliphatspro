ALTER TABLE email_send_jobs CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE email_send_jobs MODIFY status VARCHAR(255);
ALTER TABLE email_send_jobs MODIFY last_error TEXT;
ALTER TABLE email_send_jobs MODIFY attempt_count BIGINT DEFAULT 0;
