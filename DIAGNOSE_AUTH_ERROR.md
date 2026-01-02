# 🔍 Diagnose: "Authentication required" Error

## Step 1: Check Vercel Logs (Most Important)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **trenirenapp**
3. Go to **Deployments** → Latest deployment
4. Click **"Functions"** tab (or "Runtime Logs")
5. Try to create an event (trigger the error)
6. Look for errors in the logs

**What to look for:**
- `[next-auth][error]` messages
- `Authentication required` errors
- `NEXTAUTH_SECRET` errors
- Token decode errors
- Database connection errors

## Step 2: Check Browser Console

1. Open your app: `https://trenirenapp.vercel.app`
2. Open DevTools (F12) → **Console** tab
3. Try to create an event
4. Look for errors

**What to look for:**
- Network errors
- CORS errors
- Authentication errors
- Any red error messages

## Step 3: Check Network Tab (Cookies)

1. Open DevTools (F12) → **Network** tab
2. Try to create an event
3. Click on the `/api/events` request (POST)
4. Check **Headers** tab:
   - **Request Headers** → Look for `Cookie:` header
   - Should contain: `next-auth.session-token=...` or `__Secure-next-auth.session-token=...`
5. Check **Response** tab:
   - What error message is returned?
   - Status code (should be 401 if auth failed)

## Step 4: Check Application Tab (Cookies)

1. Open DevTools (F12) → **Application** tab
2. Click **Cookies** → `https://trenirenapp.vercel.app`
3. Look for:
   - `next-auth.session-token` (HTTP)
   - `__Secure-next-auth.session-token` (HTTPS)
4. **If missing:** Session cookie not being set after login

## Step 5: Verify Environment Variables

1. Go to Vercel → Settings → Environment Variables
2. Verify these are set for **Production**:
   - ✅ `NEXTAUTH_SECRET`
   - ✅ `NEXTAUTH_URL` = `https://trenirenapp.vercel.app`
   - ✅ `GOOGLE_CLIENT_ID`
   - ✅ `GOOGLE_CLIENT_SECRET`
   - ✅ `DATABASE_URL`

## Step 6: Check Middleware

The middleware might be blocking the request. Check Vercel logs for:
- Middleware errors
- Token validation errors
- Redirects to `/auth/signin`

## Common Issues Found in Logs

### Issue 1: "NEXTAUTH_SECRET is not defined"
**Fix:** Add `NEXTAUTH_SECRET` to Vercel environment variables

### Issue 2: "Token decode error"
**Fix:** `NEXTAUTH_SECRET` might be wrong or changed

### Issue 3: "User not found in database"
**Fix:** User might not exist after Google login - check database

### Issue 4: "Cookie not sent"
**Fix:** Check if `credentials: 'include'` is in fetch request

### Issue 5: "CORS error"
**Fix:** Check domain configuration

## Quick Test: Check Session

Open browser console and run:
```javascript
// Check if session exists
fetch('/api/auth/session', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**Expected:** Should return your user session
**If null:** Session not being created properly

## What to Share

When checking logs, share:
1. **Vercel log error message** (exact text)
2. **Browser console errors** (if any)
3. **Network tab:** Does Cookie header exist?
4. **Application tab:** Is session cookie present?
5. **Session test result:** What does `/api/auth/session` return?

This will help identify the exact issue!




