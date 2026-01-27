# FliphatsPro Database Structure

**Total Tables:** 62

---

## active_sessions

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `user_id` | int | FK |
| `session_token` | varchar(255) | FK |
| `ip_address` | varchar(45) | - |
| `user_agent` | varchar(255) | - |
| `is_revoked` | tinyint(1) | - |
| `created_at` | timestamp | - |
| `expires_at` | timestamp | FK |

---

## admin_activity_log

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `admin_id` | int | - |
| `action_type` | varchar(50) | - |
| `action_description` | text | - |
| `entity_type` | varchar(50) | - |
| `entity_id` | int | - |
| `ip_address` | varchar(45) | - |
| `created_at` | timestamp | - |

---

## admin_activity_logs

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `admin_id` | int | FK |
| `action_type` | varchar(50) | - |
| `action_description` | text | - |
| `entity_type` | varchar(50) | - |
| `entity_id` | int | - |
| `created_at` | timestamp | - |
| `ip_address` | varchar(45) | - |

---

## admin_login_logs

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `admin_id` | int | FK |
| `ip_address` | varchar(45) | - |
| `user_agent` | text | - |
| `login_time` | timestamp | - |
| `success` | tinyint(1) | - |

---

## admin_preferences

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `admin_id` | int | - |
| `theme` | varchar(20) | - |
| `notify_email` | tinyint(1) | - |
| `notify_in_app` | tinyint(1) | - |
| `default_view` | varchar(50) | - |
| `updated_at` | timestamp | - |

---

## admins

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `email` | varchar(191) | - |
| `password_hash` | varchar(191) | - |
| `role` | enum('super_admin','support') | - |
| `last_login` | timestamp | - |
| `created_at` | timestamp | - |
| `name` | varchar(191) | - |
| `phone` | varchar(20) | - |
| `avatar_url` | varchar(255) | - |
| `timezone` | varchar(50) | - |
| `language` | varchar(10) | - |
| `isOnline` | tinyint(1) | - |
| `lastSeen` | datetime(3) | - |

---

## cachedemail

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `tenant_id` | varchar(191) | FK |
| `accountId` | varchar(191) | FK |
| `uid` | int | - |
| `from` | varchar(191) | - |
| `to` | varchar(191) | - |
| `subject` | varchar(191) | - |
| `textSnippet` | text | - |
| `htmlContent` | longtext | - |
| `date` | datetime(3) | FK |
| `createdAt` | datetime(3) | - |
| `folder` | varchar(191) | - |
| `hasAttachments` | tinyint(1) | - |
| `attachmentCount` | int | - |

---

## campaign_lead

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `campaignId` | varchar(191) | FK |
| `leadEmail` | varchar(191) | - |
| `status` | varchar(191) | FK |
| `currentStep` | int | - |
| `nextStepDue` | datetime(3) | FK |
| `joinedAt` | datetime(3) | - |
| `completedAt` | datetime(3) | - |
| `openCount` | int | - |
| `clickCount` | int | - |
| `replied` | tinyint(1) | - |

---

## campaign_logs

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `campaign_id` | varchar(36) | FK |
| `lead_id` | varchar(191) | FK |
| `type` | varchar(50) | FK |
| `message` | text | - |
| `created_at` | timestamp | - |

---

## campaign_step

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `campaignId` | varchar(191) | FK |
| `type` | varchar(191) | - |
| `delaySeconds` | int | - |
| `subject` | varchar(500) | - |
| `body` | longtext | - |
| `htmlBody` | longtext | - |
| `stepOrder` | int | FK |

---

## comment_reads

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `comment_id` | int | - |
| `user_id` | int | - |
| `seen_at` | timestamp | - |

---

## contact

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `accountId` | varchar(191) | FK |
| `email` | varchar(191) | FK |
| `name` | varchar(191) | - |
| `firstName` | varchar(100) | - |
| `lastName` | varchar(100) | - |
| `company` | varchar(191) | - |
| `phone` | varchar(50) | - |
| `notes` | text | - |
| `avatar` | varchar(500) | - |
| `tags` | text | - |
| `lastEmailDate` | datetime(3) | - |
| `emailCount` | int | - |
| `isFavorite` | tinyint(1) | - |
| `createdAt` | datetime(3) | - |
| `updatedAt` | datetime(3) | - |
| `tenant_id` | varchar(191) | FK |

---

## customers

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `name` | varchar(191) | - |
| `email` | varchar(191) | - |
| `phone` | varchar(191) | - |
| `whatsapp` | varchar(191) | - |
| `notes` | text | - |
| `location` | varchar(255) | - |
| `budget` | varchar(50) | - |
| `ltv` | decimal(10,2) | - |
| `created_at` | timestamp | - |
| `updated_at` | timestamp | - |
| `source` | varchar(191) | - |
| `campaign_name` | varchar(191) | - |
| `stage` | enum('new','contacted','qualified','proposal_sent','negotiation','won','lost','follow_up_required','follow_up_done') | - |
| `score` | enum('hot','warm','cold') | - |
| `tags` | json | - |
| `owner` | varchar(191) | - |
| `facebook_lead_id` | varchar(191) | - |
| `ad_data` | json | - |
| `fb_lead_id` | varchar(191) | - |
| `fb_created_time` | varchar(191) | - |
| `ad_id` | varchar(191) | - |
| `ad_name` | varchar(191) | - |
| `adset_id` | varchar(191) | - |
| `adset_name` | varchar(191) | - |
| `campaign_id` | varchar(191) | - |
| `form_id` | varchar(191) | - |
| `form_name` | varchar(191) | - |
| `is_organic` | tinyint(1) | - |
| `platform` | varchar(191) | - |
| `fb_lead_status` | varchar(191) | - |
| `company` | varchar(255) | - |
| `project_desc` | text | - |
| `tenant_id` | varchar(191) | FK |

---

## email_read_status

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `tenant_id` | varchar(255) | FK |
| `account_id` | int | FK |
| `uid` | int | - |
| `folder` | varchar(50) | - |
| `is_read` | tinyint(1) | - |
| `created_at` | timestamp | - |
| `updated_at` | timestamp | - |

---

## email_send_jobs

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `email_id` | int | - |
| `status` | varchar(255) | - |
| `attempt_count` | int | - |
| `last_error` | text | - |
| `started_at` | datetime | - |
| `finished_at` | datetime | - |
| `created_at` | datetime | - |

---

## emailaccount

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `tenant_id` | varchar(191) | FK |
| `userId` | int | - |
| `name` | varchar(191) | - |
| `email` | varchar(191) | - |
| `provider` | varchar(191) | - |
| `imapHost` | varchar(191) | - |
| `imapPort` | int | - |
| `imapSecure` | tinyint(1) | - |
| `smtpHost` | varchar(191) | - |
| `smtpPort` | int | - |
| `smtpSecure` | tinyint(1) | - |
| `username` | varchar(191) | - |
| `password` | varchar(191) | - |
| `isActive` | tinyint(1) | - |
| `isDefault` | tinyint(1) | - |
| `lastSync` | datetime(3) | - |
| `signature` | text | - |
| `signatureHtml` | text | - |
| `useSignature` | tinyint(1) | - |
| `createdAt` | datetime(3) | - |
| `updatedAt` | datetime(3) | - |

---

## emailanalytics

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `accountId` | varchar(191) | FK |
| `date` | date | FK |
| `emailsSent` | int | - |
| `emailsReceived` | int | - |
| `emailsRead` | int | - |
| `avgResponseTime` | int | - |
| `topSender` | varchar(255) | - |
| `topRecipient` | varchar(255) | - |
| `createdAt` | datetime(3) | - |

---

## emailattachment

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `emailId` | varchar(191) | FK |
| `filename` | varchar(191) | - |
| `contentType` | varchar(191) | - |
| `size` | int | - |
| `data` | longtext | - |
| `createdAt` | datetime(3) | - |

---

## emaildraft

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `accountId` | varchar(191) | FK |
| `to` | text | - |
| `cc` | text | - |
| `bcc` | text | - |
| `subject` | varchar(191) | - |
| `body` | longtext | - |
| `htmlBody` | longtext | - |
| `hasAttachments` | tinyint(1) | - |
| `createdAt` | datetime(3) | - |
| `updatedAt` | datetime(3) | FK |
| `tenant_id` | varchar(191) | FK |

---

## emailfolder

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `accountId` | varchar(191) | FK |
| `name` | varchar(100) | - |
| `type` | varchar(20) | - |
| `parent` | varchar(191) | - |
| `icon` | varchar(50) | - |
| `color` | varchar(20) | - |
| `emailCount` | int | - |
| `unreadCount` | int | - |
| `sortOrder` | int | - |
| `createdAt` | datetime(3) | - |

---

## emaillabel

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `accountId` | varchar(191) | FK |
| `name` | varchar(191) | - |
| `color` | varchar(191) | - |
| `icon` | varchar(191) | - |
| `createdAt` | datetime(3) | - |

---

## emaillabeling

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `accountId` | varchar(191) | FK |
| `emailUid` | int | - |
| `emailFolder` | varchar(191) | - |
| `labelId` | varchar(191) | FK |
| `createdAt` | datetime(3) | - |

---

## emaillog

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `accountId` | varchar(191) | FK |
| `direction` | varchar(191) | - |
| `from` | varchar(191) | - |
| `to` | varchar(191) | - |
| `subject` | varchar(191) | - |
| `body` | longtext | - |
| `status` | varchar(191) | - |
| `error` | text | - |
| `timestamp` | datetime(3) | FK |
| `tenant_id` | varchar(191) | FK |

---

## emailreadstatus

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `accountId` | varchar(191) | FK |
| `emailUid` | int | - |
| `emailFolder` | varchar(191) | - |
| `isRead` | tinyint(1) | - |
| `readAt` | datetime(3) | - |

---

## emailrule

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `accountId` | varchar(191) | FK |
| `name` | varchar(100) | - |
| `enabled` | tinyint(1) | FK |
| `priority` | int | - |
| `conditions` | text | - |
| `actions` | text | - |
| `createdAt` | datetime(3) | - |
| `updatedAt` | datetime(3) | - |

---

## emails

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `tenant_id` | varchar(255) | FK |
| `customer_id` | int | - |
| `user_id` | int | - |
| `smtp_account_id` | int | FK |
| `uid` | int | - |
| `status` | varchar(50) | - |
| `recipient_to` | json | - |
| `recipient_cc` | json | - |
| `recipient_bcc` | json | - |
| `subject` | varchar(255) | - |
| `body_html` | longtext | - |
| `body_text` | longtext | - |
| `headers_json` | json | - |
| `related_task_id` | int | - |
| `error_message` | text | - |
| `sent_at` | datetime | - |
| `received_at` | datetime | - |
| `created_at` | datetime | - |
| `updated_at` | datetime | - |
| `direction` | varchar(20) | - |
| `message_id` | varchar(255) | - |
| `in_reply_to` | varchar(255) | - |
| `folder` | varchar(50) | - |
| `is_read` | tinyint(1) | - |
| `from_name` | varchar(255) | - |
| `from_address` | varchar(255) | - |
| `attachment_count` | int | - |

---

## emailtemplate

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `accountId` | varchar(191) | FK |
| `name` | varchar(100) | - |
| `subject` | varchar(500) | - |
| `body` | longtext | - |
| `htmlBody` | longtext | - |
| `category` | varchar(50) | FK |
| `isShared` | tinyint(1) | - |
| `usageCount` | int | - |
| `lastUsed` | datetime(3) | - |
| `createdAt` | datetime(3) | - |
| `updatedAt` | datetime(3) | - |
| `tenant_id` | varchar(191) | FK |

---

## emailthread

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `accountId` | varchar(191) | FK |
| `subject` | varchar(500) | - |
| `participants` | text | - |
| `lastEmailDate` | datetime(3) | FK |
| `emailCount` | int | - |
| `unreadCount` | int | - |
| `createdAt` | datetime(3) | - |
| `updatedAt` | datetime(3) | - |
| `tenant_id` | varchar(191) | FK |

---

## emailthreadmember

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `threadId` | varchar(191) | FK |
| `emailUid` | int | - |
| `emailFolder` | varchar(191) | - |
| `createdAt` | datetime(3) | - |

---

## emailtracking

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `emailId` | varchar(191) | FK |
| `accountId` | varchar(191) | FK |
| `recipient` | varchar(191) | - |
| `sentAt` | datetime(3) | - |
| `openedAt` | datetime(3) | - |
| `clickedAt` | datetime(3) | - |
| `openCount` | int | - |
| `clickCount` | int | - |
| `ipAddress` | varchar(50) | - |
| `userAgent` | text | - |
| `createdAt` | datetime(3) | - |

---

## files

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `customer_id` | int | FK |
| `uploaded_by` | int | - |
| `file_name` | varchar(191) | - |
| `file_url` | varchar(500) | - |
| `file_type` | varchar(191) | - |
| `created_at` | timestamp | - |
| `tenant_id` | varchar(191) | FK |

---

## flash_messages

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `senderId` | int | FK |
| `receiverId` | int | FK |
| `message` | text | - |
| `type` | varchar(191) | - |
| `isRead` | tinyint(1) | FK |
| `readAt` | datetime(3) | - |
| `sentAt` | datetime(3) | - |
| `parentMessageId` | varchar(191) | FK |
| `attachmentType` | varchar(191) | - |
| `attachmentUrl` | varchar(191) | - |
| `deliveredAt` | datetime(3) | - |
| `tenant_id` | varchar(191) | FK |

---

## interactions

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `customer_id` | int | FK |
| `order_id` | int | FK |
| `type` | enum('call_log','email_sent','whatsapp_msg','internal_note','system_event') | - |
| `content` | text | - |
| `sentiment` | enum('positive','neutral','negative') | - |
| `created_by` | int | - |
| `created_at` | timestamp | - |
| `tenant_id` | varchar(191) | FK |

---

## landing_pages

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `slug` | varchar(255) | - |
| `name` | varchar(255) | - |
| `is_active` | tinyint(1) | - |
| `content` | json | - |
| `page_views` | int | - |
| `conversions` | int | - |
| `created_at` | datetime | - |
| `updated_at` | datetime | - |
| `tenant_id` | varchar(191) | FK |

---

## lead_reads

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `admin_id` | int | - |
| `lead_id` | int | - |
| `last_read_at` | timestamp | - |
| `tenant_id` | varchar(191) | FK |

---

## lead_scores

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `value` | varchar(50) | - |
| `label` | varchar(100) | - |
| `color` | varchar(50) | - |
| `emoji` | varchar(10) | - |
| `display_order` | int | - |
| `is_active` | tinyint(1) | - |
| `created_at` | timestamp | - |
| `tenant_id` | varchar(191) | FK |

---

## lead_stages

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `value` | varchar(50) | - |
| `label` | varchar(100) | - |
| `color` | varchar(50) | - |
| `display_order` | int | - |
| `is_active` | tinyint(1) | - |
| `created_at` | timestamp | - |
| `tenant_id` | varchar(191) | FK |

---

## marketing_campaign

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `tenant_id` | varchar(191) | FK |
| `accountId` | varchar(191) | FK |
| `created_by` | int | FK |
| `name` | varchar(191) | - |
| `description` | text | - |
| `type` | varchar(191) | - |
| `status` | varchar(191) | FK |
| `sentCount` | int | - |
| `openCount` | int | - |
| `clickCount` | int | - |
| `replyCount` | int | - |
| `createdAt` | datetime(3) | - |
| `updatedAt` | datetime(3) | - |

---

## meetings

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `title` | varchar(191) | - |
| `description` | text | - |
| `roomName` | varchar(191) | - |
| `hostId` | int | FK |
| `status` | varchar(191) | - |
| `startTime` | datetime(3) | - |
| `endTime` | datetime(3) | - |
| `notes` | longtext | - |
| `createdAt` | datetime(3) | - |
| `updatedAt` | datetime(3) | - |
| `tenant_id` | varchar(191) | FK |

---

## notifications

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `user_id` | int | - |
| `tenant_id` | varchar(255) | - |
| `type` | varchar(50) | - |
| `title` | varchar(255) | - |
| `message` | text | - |
| `is_read` | tinyint(1) | - |
| `related_entity_type` | varchar(50) | - |
| `related_entity_id` | int | - |
| `created_at` | timestamp | - |

---

## orders

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `amount` | decimal(10,2) | - |
| `status` | enum('new_lead','initiated','payment_failed','paid','onboarding_pending','processing','delivered','cancelled') | - |
| `created_at` | timestamp | - |
| `updated_at` | timestamp | - |
| `source` | varchar(191) | - |
| `customer_id` | int | FK |
| `razorpay_order_id` | varchar(191) | - |
| `invoice_url` | varchar(500) | - |
| `proposal_status` | enum('draft','sent','accepted','declined') | - |
| `due_date` | datetime | - |
| `razorpay_payment_id` | varchar(191) | - |
| `currency` | varchar(191) | - |
| `payment_mode` | varchar(191) | - |
| `onboarding_status` | enum('pending','completed') | - |
| `tenant_id` | varchar(191) | FK |

---

## platform_admins

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `user_id` | int | - |
| `role` | enum('platform_owner','master_admin','super_admin') | FK |
| `permissions` | json | - |
| `created_at` | datetime(3) | - |
| `updated_at` | datetime(3) | - |

---

## project_submissions

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `order_id` | int | FK |
| `brand_name` | varchar(191) | - |
| `assets_url` | varchar(500) | - |
| `raw_data_json` | json | - |
| `submission_date` | timestamp | - |
| `tenant_id` | varchar(191) | FK |

---

## scheduledemail

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `accountId` | varchar(191) | FK |
| `to` | text | - |
| `cc` | text | - |
| `bcc` | text | - |
| `subject` | varchar(500) | - |
| `body` | longtext | - |
| `htmlBody` | longtext | - |
| `attachments` | longtext | - |
| `scheduledFor` | datetime(3) | FK |
| `status` | varchar(20) | FK |
| `sentAt` | datetime(3) | - |
| `error` | text | - |
| `retryCount` | int | - |
| `createdAt` | datetime(3) | - |
| `updatedAt` | datetime(3) | - |
| `tenant_id` | varchar(191) | FK |

---

## settings

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `setting_key` | varchar(100) | - |
| `setting_value` | text | - |
| `description` | varchar(255) | - |
| `created_at` | timestamp | - |
| `updated_at` | timestamp | - |

---

## sharedmailbox

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `accountId` | varchar(191) | FK |
| `name` | varchar(100) | - |
| `description` | text | - |
| `members` | text | - |
| `permissions` | text | - |
| `createdAt` | datetime(3) | - |
| `updatedAt` | datetime(3) | - |

---

## site_settings

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `setting_key` | varchar(100) | - |
| `setting_value` | text | - |
| `description` | varchar(255) | - |
| `updated_at` | timestamp | - |
| `created_at` | timestamp | - |
| `tenant_id` | varchar(191) | FK |

---

## smtp_accounts

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `tenant_id` | varchar(255) | - |
| `name` | varchar(255) | - |
| `provider` | varchar(50) | - |
| `host` | varchar(255) | - |
| `imap_host` | varchar(255) | - |
| `port` | int | - |
| `imap_port` | int | - |
| `username` | varchar(255) | - |
| `imap_user` | varchar(255) | - |
| `encrypted_password` | text | - |
| `imap_encrypted_password` | text | - |
| `oauth_refresh_token` | text | - |
| `oauth_access_token` | text | - |
| `oauth_expires_at` | datetime | - |
| `from_email` | varchar(255) | - |
| `from_name` | varchar(255) | - |
| `dkim_selector` | varchar(255) | - |
| `dkim_private_key` | text | - |
| `created_by` | int | - |
| `created_at` | datetime | - |
| `updated_at` | datetime | - |
| `is_active` | tinyint(1) | - |
| `region` | varchar(50) | - |
| `last_synced_at` | datetime | - |

---

## system_settings

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `key` | varchar(191) | - |
| `value` | text | - |
| `description` | varchar(191) | - |
| `updated_at` | datetime(3) | - |

---

## task_comments

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `task_id` | int | - |
| `author_id` | int | - |
| `body` | text | - |
| `created_at` | datetime | - |
| `edited_at` | datetime | - |

---

## task_history

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `task_id` | int | - |
| `changed_by` | int | - |
| `change_type` | varchar(64) | - |
| `field_name` | varchar(64) | - |
| `old_value` | text | - |
| `new_value` | text | - |
| `created_at` | datetime | - |

---

## task_reads

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `task_id` | int | - |
| `user_id` | int | - |
| `last_seen_at` | datetime | - |
| `created_at` | datetime | - |

---

## tasks

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `related_order_id` | int | FK |
| `assigned_to` | int | - |
| `title` | varchar(191) | - |
| `description` | text | - |
| `due_date` | timestamp | - |
| `status` | enum('open','in_progress','done') | - |
| `priority` | enum('high','medium','low') | - |
| `created_at` | timestamp | - |
| `customer_id` | int | FK |
| `created_by` | int | - |
| `status_changed_by` | int | - |
| `status_changed_at` | timestamp | - |
| `updated_at` | timestamp | - |
| `tenant_id` | varchar(191) | FK |

---

## tenant_audit_logs

| Column | Type | Key |
|--------|------|-----|
| `id` | bigint | 🔑 PK |
| `tenant_id` | varchar(191) | FK |
| `user_id` | int | FK |
| `action` | varchar(100) | FK |
| `entity_type` | varchar(50) | - |
| `entity_id` | varchar(36) | - |
| `old_values` | json | - |
| `new_values` | json | - |
| `ip_address` | varchar(45) | - |
| `user_agent` | text | - |
| `created_at` | datetime(3) | FK |

---

## tenant_invitations

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `tenant_id` | varchar(191) | FK |
| `email` | varchar(255) | FK |
| `role` | enum('owner','admin','member','viewer') | - |
| `token` | varchar(255) | - |
| `invited_by` | int | - |
| `expires_at` | datetime(3) | - |
| `accepted_at` | datetime(3) | - |
| `created_at` | datetime(3) | - |

---

## tenant_roles

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `tenant_id` | varchar(36) | FK |
| `name` | varchar(50) | - |
| `description` | varchar(255) | - |
| `permissions` | json | - |
| `is_system` | tinyint(1) | - |
| `created_at` | timestamp | - |
| `updated_at` | timestamp | - |

---

## tenant_settings

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `tenant_id` | varchar(191) | FK |
| `setting_key` | varchar(100) | FK |
| `setting_value` | text | - |
| `description` | varchar(255) | - |
| `is_encrypted` | tinyint(1) | - |
| `created_at` | datetime(3) | - |
| `updated_at` | datetime(3) | - |

---

## tenant_users

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `tenant_id` | varchar(191) | FK |
| `user_id` | int | FK |
| `role` | enum('owner','admin','member','viewer') | FK |
| `permissions` | json | - |
| `invited_by` | int | - |
| `invited_at` | datetime(3) | - |
| `joined_at` | datetime(3) | - |
| `last_accessed_at` | datetime(3) | - |
| `role_id` | int | - |

---

## tenants

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `name` | varchar(255) | - |
| `slug` | varchar(100) | - |
| `plan` | enum('free','starter','professional','enterprise') | - |
| `status` | enum('active','suspended','archived') | FK |
| `owner_id` | int | FK |
| `logo_url` | varchar(500) | - |
| `domain` | varchar(255) | - |
| `settings` | json | - |
| `created_at` | datetime(3) | - |
| `updated_at` | datetime(3) | - |

---

## user_presence

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `userId` | int | - |
| `status` | enum('ONLINE','OFFLINE','AWAY') | - |
| `lastSeenAt` | datetime(3) | - |

---

## users

| Column | Type | Key |
|--------|------|-----|
| `id` | int | 🔑 PK |
| `email` | varchar(255) | - |
| `password_hash` | varchar(255) | - |
| `name` | varchar(255) | - |
| `avatar_url` | varchar(500) | - |
| `phone` | varchar(20) | - |
| `timezone` | varchar(50) | - |
| `language` | varchar(10) | - |
| `email_verified_at` | datetime(3) | - |
| `last_login` | datetime(3) | - |
| `is_active` | tinyint(1) | FK |
| `created_at` | datetime(3) | - |
| `updated_at` | datetime(3) | - |

---

## webhook

| Column | Type | Key |
|--------|------|-----|
| `id` | varchar(191) | 🔑 PK |
| `accountId` | varchar(191) | FK |
| `name` | varchar(100) | - |
| `url` | varchar(500) | - |
| `events` | text | - |
| `enabled` | tinyint(1) | FK |
| `secret` | varchar(100) | - |
| `lastTrigger` | datetime(3) | - |
| `createdAt` | datetime(3) | - |
| `tenant_id` | varchar(191) | FK |

---

