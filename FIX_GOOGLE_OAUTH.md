# 🔧 Fix: Google OAuth "client_id is required" Error

## Problem
```
[next-auth][error][SIGNIN_OAUTH_ERROR]
client_id is required
```

This means `GOOGLE_CLIENT_ID` is missing or not set correctly in Vercel.

## Solution

### Step 1: Get Your Google OAuth Credentials

You need:
1. **Google Client ID** (looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
2. **Google Client Secret** (looks like: `GOCSPX-abcdefghijklmnopqrstuvwxyz`)

**Where to find them:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to: **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID**
5. Click on it to see:
   - **Client ID** (copy this)
   - **Client secret** (copy this)

### Step 2: Add to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **trenirenapp**
3. Go to: **Settings** → **Environment Variables**
4. Add these two variables:

   **Variable 1:**
   - **Name:** `GOOGLE_CLIENT_ID`
   - **Value:** (paste your Google Client ID)
   - **Environment:** Select **Production** (and Preview/Development if needed)
   - Click **"Save"**

   **Variable 2:**
   - **Name:** `GOOGLE_CLIENT_SECRET`
   - **Value:** (paste your Google Client Secret)
   - **Environment:** Select **Production** (and Preview/Development if needed)
   - Click **"Save"**

### Step 3: Update Google OAuth Redirect URI

**IMPORTANT:** You must add your production URL to Google's authorized redirect URIs:

1. In Google Cloud Console → **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Scroll to **"Authorized redirect URIs"**
4. Click **"Add URI"**
5. Add:
   ```
   https://trenirenapp.vercel.app/api/auth/callback/google
   ```
6. Click **"Save"**

### Step 4: Redeploy

**CRITICAL:** After adding environment variables, you MUST redeploy:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **"..."** menu (three dots)
4. Click **"Redeploy"**
5. Wait for deployment to complete (1-2 minutes)

### Step 5: Verify

1. Visit: `https://trenirenapp.vercel.app/auth/signin`
2. Click "Sign in with Google"
3. The error should be gone!

## Common Issues

### Issue 1: Variables Not Set for Production
- ✅ Make sure you select **Production** environment when adding variables
- ❌ If you only set them for Preview/Development, production won't see them

### Issue 2: Wrong Client ID/Secret
- ✅ Use the **production** OAuth credentials (not development)
- ✅ Make sure you copied the entire Client ID (it's long!)
- ✅ Make sure you copied the entire Client Secret (it starts with `GOCSPX-`)

### Issue 3: Redirect URI Not Added
- ✅ Must add: `https://trenirenapp.vercel.app/api/auth/callback/google`
- ✅ Must match exactly (no trailing slash, correct domain)

### Issue 4: Forgot to Redeploy
- ✅ Environment variables only apply after redeployment
- ✅ Adding variables alone won't fix it - you must redeploy!

## Quick Checklist

- [ ] Got Google Client ID from Google Cloud Console
- [ ] Got Google Client Secret from Google Cloud Console
- [ ] Added `GOOGLE_CLIENT_ID` to Vercel (Production environment)
- [ ] Added `GOOGLE_CLIENT_SECRET` to Vercel (Production environment)
- [ ] Added redirect URI to Google Cloud Console
- [ ] Redeployed the application
- [ ] Tested login - error is gone!

## Why This Happens

NextAuth needs:
1. `GOOGLE_CLIENT_ID` - To tell Google which app is requesting login
2. `GOOGLE_CLIENT_SECRET` - To prove your app is authorized
3. Redirect URI in Google Console - So Google knows where to send users back

Without any of these, Google OAuth won't work!


