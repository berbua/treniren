# 🔍 How to Check Vercel Logs & Fix NextAuth Configuration Error

## Step 1: Check Vercel Logs

### Option A: Via Vercel Dashboard (Easiest)
1. Go to [vercel.com](https://vercel.com) and login
2. Select your project: `trenirenapp`
3. Click on the **"Deployments"** tab
4. Click on the latest deployment
5. Click on the **"Functions"** tab (or "Runtime Logs")
6. Look for errors related to:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### Option B: Via Vercel CLI
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# View logs
vercel logs trenirenapp --follow
```

## Step 2: Verify Environment Variables

The error `CLIENT_FETCH_ERROR` usually means missing or incorrect environment variables.

### Required Variables (Check in Vercel Dashboard → Settings → Environment Variables):

1. **NEXTAUTH_SECRET** (CRITICAL - Must be set!)
   - Generate one: `openssl rand -base64 32`
   - Must be set for Production environment

2. **NEXTAUTH_URL** (CRITICAL - Must match your domain!)
   - Should be: `https://trenirenapp.vercel.app`
   - Must NOT have trailing slash
   - Must be set for Production environment

3. **GOOGLE_CLIENT_ID** (Required for Google OAuth)
   - Your production Google OAuth client ID
   - Must be set for Production environment

4. **GOOGLE_CLIENT_SECRET** (Required for Google OAuth)
   - Your production Google OAuth client secret
   - Must be set for Production environment

5. **DATABASE_URL** (Required for database)
   - Your production PostgreSQL connection string
   - Must be set for Production environment

### How to Check/Add Environment Variables:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Check that all variables are:
   - ✅ Added
   - ✅ Set for **Production** environment (not just Preview/Development)
   - ✅ Have correct values (no typos)

## Step 3: Common Issues & Fixes

### Issue 1: NEXTAUTH_SECRET Missing
**Error:** `[next-auth][error][NO_SECRET]`

**Fix:**
```bash
# Generate a secret
openssl rand -base64 32

# Add to Vercel: Settings → Environment Variables
# Name: NEXTAUTH_SECRET
# Value: (paste generated secret)
# Environment: Production
```

### Issue 2: NEXTAUTH_URL Incorrect
**Error:** `[next-auth][error][CLIENT_FETCH_ERROR]`

**Fix:**
- Go to Vercel Dashboard → Settings → Environment Variables
- Check `NEXTAUTH_URL` value:
  - ✅ Should be: `https://trenirenapp.vercel.app`
  - ❌ Should NOT be: `https://trenirenapp.vercel.app/` (no trailing slash)
  - ❌ Should NOT be: `http://localhost:3000`

### Issue 3: Google OAuth Not Configured
**Error:** `[next-auth][error][CLIENT_FETCH_ERROR]`

**Fix:**
1. Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in Vercel
2. Update Google Cloud Console:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to: APIs & Services → Credentials
   - Find your OAuth 2.0 Client ID
   - Add to **Authorized redirect URIs**:
     ```
     https://trenirenapp.vercel.app/api/auth/callback/google
     ```

### Issue 4: Environment Variables Not Applied
**After adding/updating environment variables:**
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

## Step 4: Quick Diagnostic Script

Run this locally to verify your environment variables are correct:

```bash
# Check what variables are needed
cat env.example

# Verify format (run locally with production values)
node -e "
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'NOT SET');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
"
```

## Step 5: Test After Fix

1. **Redeploy** (if you changed environment variables)
2. Visit: `https://trenirenapp.vercel.app/auth/signin`
3. Try Google OAuth login
4. Check browser console for errors
5. Check Vercel logs again if still failing

## Most Likely Issue

Based on the error, you're probably missing:
- **NEXTAUTH_SECRET** (most common)
- **NEXTAUTH_URL** not set to `https://trenirenapp.vercel.app`

Fix these first, then redeploy!


