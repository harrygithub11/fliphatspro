# Database Schema Comparison Report

## Summary
Comparing **Ideal Schema** (React component) vs **Actual Database** (62 tables)

---

## ✅ Tables That EXIST (Match or Similar)

| Category | Ideal Table | Actual Table | Status |
|----------|-------------|--------------|--------|
| **Core** | `tenants` | `tenants` | ✅ Match |
| **Core** | `users` | `users` | ✅ Match |
| **Core** | `tenant_users` | `tenant_users` | ✅ Match |
| **Core** | `tenant_roles` | `tenant_roles` | ✅ Match |
| **CRM** | `contacts` | `customers` + `contact` | ⚠️ Split (consider consolidating) |
| **CRM** | `activities` | `interactions` | ✅ Similar (rename?) |
| **Email** | `email_accounts` | `smtp_accounts` + `emailaccount` | ⚠️ Duplicated |
| **Email** | `emails` | `emails` | ✅ Match |
| **Email** | `email_templates` | `emailtemplate` | ✅ Match |
| **Tasks** | `tasks` | `tasks` | ✅ Match |
| **Automation** | `campaigns` | `marketing_campaign` | ✅ Match |
| **Automation** | `campaign_steps` | `campaign_step` | ✅ Match |
| **Automation** | `campaign_contacts` | `campaign_lead` | ✅ Similar |
| **Settings** | `tenant_settings` | `tenant_settings` | ✅ Match |

---

## ❌ Tables That are MISSING

| Category | Missing Table | Purpose | Priority |
|----------|---------------|---------|----------|
| **CRM** | `deals` | Sales opportunities/pipeline tracking | 🔴 HIGH |
| **CRM** | `companies` | Company/Organization entities | 🟡 MEDIUM |
| **Settings** | `custom_fields` | Dynamic custom field definitions | 🟡 MEDIUM |
| **Settings** | `pipeline_stages` | Customizable deal pipeline stages | 🟡 MEDIUM |
| **Billing** | `subscription_plans` | Available subscription tiers | 🟡 MEDIUM |
| **Billing** | `subscriptions` | Tenant subscription records | 🟡 MEDIUM |
| **Billing** | `invoices` | Invoice records | 🟢 LOW |
| **Billing** | `payments` | Payment transaction records | 🟢 LOW |

---

## ⚠️ Potential Issues Found

### 1. **Duplicate Email Account Tables**
You have both:
- `smtp_accounts` (62 columns, newer)
- `emailaccount` (18 columns, older/Prisma)

**Recommendation:** Migrate to `smtp_accounts` only, deprecate `emailaccount`.

### 2. **Duplicate Contact Tables**
You have both:
- `customers` (CRM leads with stages, scores, etc.)
- `contact` (Email contacts)

**Recommendation:** Consider consolidating into a single `contacts` table or clearly separate purposes.

### 3. **Missing Deals/Pipeline Table**
No dedicated `deals` table exists. Currently using `orders` table which mixes:
- Order/payment tracking
- Deal/opportunity tracking

**Recommendation:** Create separate `deals` table for sales pipeline.

### 4. **No Custom Fields System**
The ideal schema has `custom_fields` for dynamic field definitions. Your current tables use `custom_fields JSON` columns but no metadata table.

**Recommendation:** Add `custom_fields` definition table for proper UI rendering.

---

## Tables You Have EXTRA (Not in Ideal)

These exist in your DB but weren't in the React schema (may be useful additions):

| Table | Purpose |
|-------|---------|
| `active_sessions` | Session tracking |
| `admin_activity_logs` | Audit trail |
| `campaign_logs` | Campaign execution logs |
| `email_tracking` | Email open/click tracking |
| `flash_messages` | Team chat messages |
| `landing_pages` | Landing page builder |
| `lead_scores` | Custom score definitions |
| `lead_stages` | Custom stage definitions |
| `meetings` | Video meetings |
| `notifications` | In-app notifications |
| `webhooks` | Webhook integrations |

---

## Recommended Next Steps

1. **Create `deals` table** - Most important for sales CRM
2. **Consolidate email accounts** - Remove duplication
3. **Add `custom_fields` metadata table** - For dynamic forms
4. **Consider `subscription_plans` table** - If offering tiered pricing
5. **Cleanup duplicate contact tables** - Unify `customers` and `contact`
