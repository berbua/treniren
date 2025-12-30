# 🔧 Fix: "Authentication required" When Creating Events

## Problem
You can log in successfully, but when trying to create an event, you get:
```
Failed to create event: Authentication required
```

## Root Cause

The API route uses `getToken` from `next-auth/jwt` which needs:
1. ✅ `NEXTAUTH_SECRET` - Should be set (you added this)
2. ✅ Session cookie - Should be sent with the request
3. ⚠️ Cookie might not be accessible in production

## Common Issues & Fixes

### Issue 1: Cookies Not Being Sent

**Check:** Are cookies being sent with API requests?

**Fix:** Make sure fetch requests include credentials:

```typescript
// In your client code (EventForm, calendar page, etc.)
fetch('/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // ← This is important!
  body: JSON.stringify(data),
})
```

### Issue 2: NEXTAUTH_SECRET Not Available in API Route

**Check:** Is `NEXTAUTH_SECRET` accessible in the API route?

**Fix:** The secret should be available, but let's verify:
- Go to Vercel → Settings → Environment Variables
- Check `NEXTAUTH_SECRET` is set for **Production**
- Redeploy after checking

### Issue 3: Cookie Domain/SameSite Issues

**Check:** Are cookies being set correctly for your domain?

**Fix:** NextAuth should handle this automatically, but check:
- Your domain: `trenirenapp.vercel.app`
- Cookies should be set for this domain
- Check browser DevTools → Application → Cookies

### Issue 4: Session Not Persisting After Login

**Check:** After logging in, is the session cookie set?

**Fix:** 
1. Open browser DevTools → Application → Cookies
2. Look for a cookie named `next-auth.session-token` or `__Secure-next-auth.session-token`
3. If missing, the session isn't being created properly

## Quick Diagnostic Steps

### Step 1: Check Browser Cookies
1. Open your app: `https://trenirenapp.vercel.app`
2. Log in with Google
3. Open DevTools (F12) → **Application** tab → **Cookies**
4. Look for:
   - `next-auth.session-token` (HTTP)
   - `__Secure-next-auth.session-token` (HTTPS)
5. If missing → Session not being created

### Step 2: Check API Request Headers
1. Open DevTools → **Network** tab
2. Try to create an event
3. Click on the `/api/events` request
4. Check **Headers** tab:
   - Look for `Cookie:` header
   - Should contain `next-auth.session-token=...`
5. If missing → Cookies not being sent

### Step 3: Check Vercel Logs
1. Go to Vercel → Deployments → Latest → Functions
2. Look for errors when creating events
3. Check for:
   - `NEXTAUTH_SECRET` errors
   - Token decode errors
   - User lookup errors

## Most Likely Fix

The issue is probably that **cookies aren't being sent** with the API request.

**Check your client code** (where you call `/api/events`):

```typescript
// Make sure you have credentials: 'include'
const response = await fetch('/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // ← ADD THIS if missing!
  body: JSON.stringify(eventData),
})
```

## Alternative: Check if Session is Available

You can also check if the session is available on the client:

```typescript
import { useSession } from 'next-auth/react'

// In your component
const { data: session, status } = useSession()

if (status === 'loading') {
  return <div>Loading...</div>
}

if (status === 'unauthenticated') {
  return <div>Not logged in</div>
}

// If session exists, API should work
```

## If Still Not Working

1. **Check Vercel Logs** for specific error messages
2. **Check Browser Console** for client-side errors
3. **Verify NEXTAUTH_SECRET** is set correctly
4. **Try logging out and back in** to refresh the session
5. **Clear browser cookies** and try again

## Summary

Most likely the issue is:
- ❌ Cookies not being sent with API requests (missing `credentials: 'include'`)
- ❌ Session cookie not being set after login
- ❌ NEXTAUTH_SECRET not accessible in API route

Check these in order, and the issue should be resolved!

