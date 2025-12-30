# 🔧 Fix: "Unable to open the database file" Error

## Problem
```
Error querying the database: Error code 14: Unable to open the database file
```

This means Prisma is trying to use a **SQLite file database** (`file:./dev.db`) instead of a **PostgreSQL database**.

## Root Cause

In production (Vercel), you **cannot** use SQLite file databases because:
- Vercel's file system is read-only
- SQLite files can't be written to in serverless environments
- You need a **PostgreSQL database** (or other hosted database)

## Solution

### Step 1: Check DATABASE_URL in Vercel

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Look for `DATABASE_URL`
3. Check its value:

**❌ WRONG (SQLite - won't work in production):**
```
DATABASE_URL="file:./dev.db"
```

**✅ CORRECT (PostgreSQL - required for production):**
```
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

### Step 2: Set Up PostgreSQL Database

You have several options:

#### Option A: Vercel Postgres (Easiest)
1. Go to Vercel Dashboard → Your Project
2. Click **"Storage"** tab
3. Click **"Create Database"**
4. Select **"Postgres"**
5. Choose a plan (Hobby is free)
6. Vercel will automatically add `DATABASE_URL` to your environment variables

#### Option B: External PostgreSQL (Supabase, Neon, etc.)
1. Create a PostgreSQL database on:
   - [Supabase](https://supabase.com) (free tier available)
   - [Neon](https://neon.tech) (free tier available)
   - [Railway](https://railway.app) (free tier available)
   - [Render](https://render.com) (free tier available)
2. Get the connection string (looks like: `postgresql://user:password@host:5432/dbname`)
3. Add to Vercel → Settings → Environment Variables:
   - **Name:** `DATABASE_URL`
   - **Value:** (paste your PostgreSQL connection string)
   - **Environment:** Production

### Step 3: Run Database Migrations

After setting up the database, you need to run migrations:

```bash
# Connect to your production database
DATABASE_URL="your-postgresql-connection-string" npx prisma migrate deploy
```

Or if using Vercel Postgres, you can run migrations via Vercel CLI:

```bash
vercel env pull .env.local
npx prisma migrate deploy
```

### Step 4: Verify Database Connection

1. Check Vercel logs after deployment
2. Look for database connection errors
3. Try logging in again - should work now!

## Quick Checklist

- [ ] `DATABASE_URL` is set in Vercel
- [ ] `DATABASE_URL` uses PostgreSQL format (not `file:./dev.db`)
- [ ] Database is accessible (not blocked by firewall)
- [ ] Migrations have been run on the production database
- [ ] Redeployed after setting `DATABASE_URL`

## Why This Happens

- **Development:** Uses SQLite file (`file:./dev.db`) - works locally
- **Production:** Needs PostgreSQL - SQLite doesn't work on Vercel

The error happens because:
1. `DATABASE_URL` is not set → Prisma defaults to SQLite
2. `DATABASE_URL` is set incorrectly → Points to a file path
3. Database doesn't exist → Connection fails

## Most Likely Fix

**You need to:**
1. Set up a PostgreSQL database (Vercel Postgres is easiest)
2. Add `DATABASE_URL` to Vercel environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Redeploy

After this, authentication and event creation should work!

