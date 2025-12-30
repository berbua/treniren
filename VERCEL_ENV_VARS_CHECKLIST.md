# ✅ Vercel Environment Variables Checklist

## 🔴 CRITICAL - Required for App to Work

These **MUST** be set or your app won't work:

### 1. ✅ NEXTAUTH_SECRET
- **Status:** Already added (you fixed this!)
- **Purpose:** Secures NextAuth sessions
- **Required:** YES

### 2. ✅ NEXTAUTH_URL
- **Value:** `https://trenirenapp.vercel.app`
- **Purpose:** Tells NextAuth your production URL
- **Required:** YES
- **Note:** Vercel might auto-set this, but check it's correct

### 3. ✅ GOOGLE_CLIENT_ID
- **Status:** You're adding this now
- **Purpose:** Google OAuth login
- **Required:** YES (if using Google login)

### 4. ✅ GOOGLE_CLIENT_SECRET
- **Status:** You're adding this now
- **Purpose:** Google OAuth login
- **Required:** YES (if using Google login)

### 5. ✅ DATABASE_URL
- **Purpose:** Database connection
- **Required:** YES
- **Note:** Vercel might auto-set this if using Vercel Postgres

---

## 🟡 IMPORTANT - Required for Specific Features

These are needed for certain features to work:

### Email Features (Password Reset)
- `EMAIL_SERVER_HOST` - Only if you use password reset
- `EMAIL_SERVER_PORT` - Only if you use password reset
- `EMAIL_SERVER_USER` - Only if you use password reset
- `EMAIL_SERVER_PASSWORD` - Only if you use password reset
- `EMAIL_FROM` - Only if you use password reset

**Status:** Optional if you only use Google OAuth login

### Supabase (if using)
- `SUPABASE_URL` - Only if using Supabase
- `SUPABASE_ANON_KEY` - Only if using Supabase

**Status:** Optional (only if you're using Supabase)

### Google Calendar API
- `GOOGLE_CALENDAR_API_KEY` - Only for calendar integration

**Status:** Optional (future feature)

---

## 📋 Quick Checklist

### Minimum Required (App Works):
- [x] `NEXTAUTH_SECRET` ✅ (you added this)
- [ ] `NEXTAUTH_URL` - Check if set to `https://trenirenapp.vercel.app`
- [ ] `GOOGLE_CLIENT_ID` - Add this now
- [ ] `GOOGLE_CLIENT_SECRET` - Add this now
- [ ] `DATABASE_URL` - Check if Vercel auto-set it

### Optional (Features):
- [ ] `EMAIL_*` variables - Only if using password reset
- [ ] `SUPABASE_*` - Only if using Supabase
- [ ] `GOOGLE_CALENDAR_API_KEY` - Only for calendar features

---

## 🎯 What You Need to Do Right Now

**Minimum to get login working:**
1. ✅ `NEXTAUTH_SECRET` - Already done!
2. ⏳ `GOOGLE_CLIENT_ID` - Add this
3. ⏳ `GOOGLE_CLIENT_SECRET` - Add this
4. ✅ `NEXTAUTH_URL` - Check it's set (Vercel might auto-set)
5. ✅ `DATABASE_URL` - Check it's set (Vercel might auto-set)

**That's it!** The rest are optional.

---

## How to Check What's Already Set

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Look at the list - you'll see what's already there
3. Check each variable is set for **Production** environment

## Common Auto-Set Variables

Vercel often auto-sets:
- ✅ `DATABASE_URL` - If you connected a database
- ✅ `NEXTAUTH_URL` - Sometimes auto-detected
- ✅ `VERCEL_URL` - Always auto-set
- ✅ `NODE_ENV` - Auto-set to "production"

You still need to manually add:
- ⏳ `NEXTAUTH_SECRET` - ✅ Done!
- ⏳ `GOOGLE_CLIENT_ID` - Add now
- ⏳ `GOOGLE_CLIENT_SECRET` - Add now

---

## Summary

**You need to add:**
- `GOOGLE_CLIENT_ID` ✅ (doing this now)
- `GOOGLE_CLIENT_SECRET` ✅ (doing this now)

**You should check:**
- `NEXTAUTH_URL` is set to `https://trenirenapp.vercel.app`
- `DATABASE_URL` is set (if using a database)

**Everything else is optional!**

