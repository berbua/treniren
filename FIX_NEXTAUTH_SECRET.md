# 🔧 Fix: Missing NEXTAUTH_SECRET

## Problem
```
[next-auth][error][NO_SECRET]
Please define a `secret` in production.
```

## Solution

### Step 1: Generate a Secret

Run this command locally:
```bash
openssl rand -base64 32
```

This will output something like:
```
Xk8pL2mN9qR4sT7vW0yZ3aB6cD9eF2gH5iJ8kL1mN4oP7qR0sT3uV6wX9yZ
```

### Step 2: Add to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **trenirenapp**
3. Go to: **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Fill in:
   - **Name:** `NEXTAUTH_SECRET`
   - **Value:** (paste the generated secret from Step 1)
   - **Environment:** Select **Production** (and optionally Preview/Development if you want)
6. Click **"Save"**

### Step 3: Redeploy

**IMPORTANT:** After adding the environment variable, you MUST redeploy:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **"..."** menu (three dots)
4. Click **"Redeploy"**
5. Wait for deployment to complete (usually 1-2 minutes)

### Step 4: Verify

1. Visit: `https://trenirenapp.vercel.app/auth/signin`
2. Try to sign in with Google
3. The error should be gone!

## Why This Happens

NextAuth requires a `NEXTAUTH_SECRET` in production to:
- Sign and encrypt JWT tokens
- Secure session cookies
- Protect against CSRF attacks

Without it, NextAuth cannot function in production mode.

## Quick Checklist

- [ ] Generated secret with `openssl rand -base64 32`
- [ ] Added `NEXTAUTH_SECRET` to Vercel environment variables
- [ ] Set environment to **Production**
- [ ] Redeployed the application
- [ ] Tested login - error is gone!




