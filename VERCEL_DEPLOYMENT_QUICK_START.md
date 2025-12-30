# 🚀 Vercel Deployment - Quick Start Guide

## Prerequisites
- ✅ Code pushed to GitHub
- ✅ Production database ready (PostgreSQL)
- ✅ Google OAuth credentials for production domain

## Quick Deployment Steps

### 1. Database Migration (CRITICAL - Do this first!)
```bash
# Connect to your production database and run migrations
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
```

**Why?** We added new fields (`testReminderEnabled`, `testReminderInterval`, `testReminderUnit`) that need to be in the database before deployment.

### 2. Vercel Dashboard Setup

1. **Go to [vercel.com](https://vercel.com) and login**

2. **Import Project** (if not already imported):
   - Click "Add New Project"
   - Select your GitHub repository: `berbua/treniren`
   - Framework: Next.js (auto-detected)
   - Click "Deploy" (we'll add env vars after)

3. **Add Environment Variables**:
   Go to: **Project Settings → Environment Variables**
   
   Add these (mark as "Production" environment):
   ```
   NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
   NEXTAUTH_URL=https://your-app.vercel.app
   GOOGLE_CLIENT_ID=<your-production-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-production-google-client-secret>
   DATABASE_URL=<your-production-postgresql-url>
   EMAIL_SERVER_HOST=smtp.gmail.com
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=<your-email@gmail.com>
   EMAIL_SERVER_PASSWORD=<gmail-app-password>
   EMAIL_FROM=noreply@unicornclimb.app
   NODE_ENV=production
   ```

4. **Update Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Add authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`

5. **Redeploy**:
   - Go to Deployments tab
   - Click "..." on latest deployment → "Redeploy"
   - Or push a new commit to trigger auto-deploy

### 3. Verify Deployment

After deployment completes:
- [ ] Visit your Vercel URL
- [ ] Test Google OAuth login
- [ ] Create a test workout
- [ ] Check database connection works
- [ ] Verify no console errors

## Troubleshooting

**Build fails?**
- Check Vercel build logs
- Verify all environment variables are set
- Ensure `DATABASE_URL` is correct

**Database errors?**
- Run migrations: `npx prisma migrate deploy`
- Check database connection string format
- Verify database is accessible from Vercel

**Auth not working?**
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain exactly
- Verify Google OAuth redirect URI is correct

## Need Help?

Check full deployment guide: `PRODUCTION_DEPLOYMENT.md`

