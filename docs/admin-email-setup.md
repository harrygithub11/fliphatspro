# Enterprise Email System Setup Guide

## Overview
This module brings a full-featured email subsystem into the CRM, allowing for:
-   **Multi-SMTP Support**: Connect multiple providers (Gmail, Outlook, SendGrid, Amazon SES).
-   **Encrypted Credentials**: All sensitive passwords and API keys are stored with AES-256 encryption.
-   **Email Tracking**: Built-in open and click tracking.
-   **Queue-Based Sending**: High-performance sending using a dedicated background worker.

---

## 🚀 1. Setup Instructions

### A. Environment Variables
Ensure the following variables are set in your `.env` file:
```bash
# Security
SMTP_ENCRYPTION_KEY="your-secure-random-32-char-string"

# Database & Queue
DATABASE_URL="mysql://user:pass@localhost:3306/db"
REDIS_URL="redis://localhost:6379"
```
> **Important**: `SMTP_ENCRYPTION_KEY` must remain constant. If you change it later, you will lose access to existing stored passwords.

### B. Start the Email Worker
The email system relies on a background worker process to send emails. Run this in a separate terminal or process manager (like PM2):
```bash
# Development
npx ts-node workers/email-worker.ts

# Production
npm run build
node .next/server/workers/email-worker.js # (Path may vary based on build output)
```

---

## 📧 2. Configuring SMTP Providers

Navigate to **Email Center > SMTP Accounts** in the Admin Dashboard.

### Gmail / Google Workspace
1.  **Host**: `smtp.gmail.com`
2.  **Port**: `587`
3.  **Username**: Your full Gmail address.
4.  **Password**: You MUST use an **App Password**.
    *   Go to [Google Account Security](https://myaccount.google.com/security).
    *   Enable 2-Step Verification.
    *   Search for "App Passwords" and create one.
    *   Use that 16-character code as the password here.

### Outlook / Office 365
1.  **Host**: `smtp.office365.com`
2.  **Port**: `587`
3.  **Username**: Your full email address.
4.  **Password**: Your account password (or App Password if MFA is enabled).

### SendGrid / Other SMTP
1.  **Host**: `smtp.sendgrid.net` (example)
2.  **Port**: `587`
3.  **Username**: `apikey` (usually)
4.  **Password**: Your SendGrid API Key.

---

## 🔒 3. Sender Verification (SPF & DKIM)

To prevent your emails from going to spam, you must configure DNS records for your domain.

### SPF (Sender Policy Framework)
Add a TXT record to your domain DNS:
```
v=spf1 include:_spf.google.com include:sendgrid.net ~all
```
*(Customize based on the providers you use)*

### DKIM (DomainKeys Identified Mail)
The system currently relies on the SMTP provider's DKIM (e.g., Gmail signing). For generic SMTP, ensure your provider handles signing (most do automatically).

---

## 🛠️ Troubleshooting

### Emails stuck in "Queued"
*   Check if the **Email Worker** is running.
*   Check Redis connection (`REDIS_URL`).
*   Check `email_send_jobs` table for error logs.

### "Authentication Failed" Error
*   Verify your App Password is correct.
*   Ensure "Less Secure Apps" is NOT the issue (Google deprecated this; use App Passwords).

### Tracking not working
*   Ensure your `NEXT_PUBLIC_APP_URL` is set correctly so tracking pixels load from the correct domain.
