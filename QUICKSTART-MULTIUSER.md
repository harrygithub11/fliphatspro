# Multi-User Collaboration System - Quick Start Guide

## 🚀 Setup (5 minutes)

### Step 1: Database Migration
Open phpMyAdmin or MySQL Workbench and run:

```sql
USE newyear;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS name VARCHAR(255) AFTER email;
UPDATE admins SET name = 'Admin' WHERE name IS NULL OR name = '';
```

### Step 2: Create Admin Accounts

**Option A: Using bcrypt online generator**
1. Go to https://bcrypt-generator.com/
2. Enter password (e.g., "admin123")
3. Use 10 rounds
4. Copy the hash

```sql
INSERT INTO admins (email, name, password_hash, role) VALUES
('john@example.com', 'John Doe', '$2a$10$[YOUR_HASH_HERE]', 'super_admin'),
('sarah@example.com', 'Sarah Smith', '$2a$10$[YOUR_HASH_HERE]', 'support');
```

**Option B: Hash existing passwords**
```bash
npx tsx scripts/hash-passwords.ts
```

### Step 3: Add JWT Secret
Update `.env.local`:
```env
JWT_SECRET=your-super-secret-random-string-here
```

### Step 4: Restart Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## ✅ Test the System

### Test 1: Login
1. Go to `http://localhost:3000/admin/login`
2. Login as `john@example.com` / `admin123`
3. Should redirect to dashboard

### Test 2: Activity Attribution
1. Go to any lead detail page
2. Add a note: "Customer interested in premium package"
3. Check timeline - should show "**John Doe** added a note"

### Test 3: Lead Assignment
1. Go to Leads page
2. Click "Owner" dropdown on any lead
3. Assign to "Sarah Smith"
4. Should update immediately

### Test 4: Multi-User
1. Open incognito window
2. Login as `sarah@example.com`
3. View the same lead
4. Should see "**John Doe**" in timeline for John's actions

---

## 🎯 What's Working

✅ **Authentication** - Secure JWT sessions  
✅ **Activity Tracking** - Every action shows who did it  
✅ **Lead Assignment** - Assign leads to team members  
✅ **Timeline Attribution** - "John Doe added a note - 2:30 PM"  
✅ **Session Protection** - Auto-redirect to login if not authenticated  

---

## 📊 Current Features

| Feature | Status | Description |
|---------|--------|-------------|
| Login System | ✅ Complete | JWT + bcrypt authentication |
| Activity Tracking | ✅ Complete | All interactions show admin name |
| Lead Assignment | ✅ Complete | Dropdown to assign owners |
| Timeline Display | ✅ Complete | Shows who did what |
| Order Timeline | ✅ Complete | Same as lead timeline |
| Session Security | ✅ Complete | HTTP-only cookies, 24h expiry |

---

## 🔜 Optional Enhancements

- [ ] "My Leads" filter button
- [ ] Color-code activities by team member
- [ ] Admin avatar/initials display
- [ ] Team management page
- [ ] Role-based permissions

---

## 🆘 Troubleshooting

**"Unauthorized" error:**
- Clear cookies and login again
- Check JWT_SECRET is set in .env.local

**Timeline shows "System" instead of name:**
- Run the database migration
- Ensure admin accounts have `name` field populated

**Can't login:**
- Verify password is bcrypt hashed (starts with $2a$)
- Check email exists in admins table
- Look at browser console for errors

---

## 🎉 You're Done!

Your CRM now supports multiple team members with full activity tracking and lead assignment!
