# 🚀 Production Deployment Guide

## Environment Variables Setup

**Important:** Add these in Vercel Dashboard → Project Settings → Environment Variables

Vercel automatically provides:
- ✅ `DATABASE_URL` (if using Vercel Postgres)
- ✅ `VERCEL_OIDC_TOKEN` (automatically set)

### Required Environment Variables to Add

You need to add these variables to your `.env.production` file:

```bash
# NextAuth.js Configuration - REQUIRED
NEXTAUTH_SECRET="your-production-nextauth-secret-key-here"
NEXTAUTH_URL="https://your-production-domain.vercel.app"

# Google OAuth - REQUIRED for authentication
GOOGLE_CLIENT_ID="your-production-google-client-id"
GOOGLE_CLIENT_SECRET="your-production-google-client-secret"

# Email Configuration - REQUIRED for password reset
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-production-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-production-app-password"
EMAIL_FROM="noreply@unicornclimb.app"

# Supabase (if using Supabase for production)
SUPABASE_URL="your-production-supabase-url"
SUPABASE_ANON_KEY="your-production-supabase-anon-key"

# Google Calendar API (for future integration)
GOOGLE_CALENDAR_API_KEY="your-google-calendar-api-key"

# Environment
NODE_ENV="production"
```

## 🔧 Setup Steps

### 1. Generate NextAuth Secret
```bash
openssl rand -base64 32
```

### 2. Update Google OAuth Settings
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Update authorized redirect URIs to include your production domain
- Use production client ID and secret

### 3. Configure Email Service
- Set up a production email account
- Generate an app password for Gmail
- Update EMAIL_FROM to match your domain

### 4. Database Setup

#### For Vercel Deployment:
Vercel will automatically run `prisma generate` during build (via `postinstall` script).

**IMPORTANT:** You need to run database migrations manually before first deployment:

```bash
# Connect to your production database
DATABASE_URL="your-production-database-url" npx prisma migrate deploy

# Or if using db push (for initial setup):
DATABASE_URL="your-production-database-url" npx prisma db push
```

**Alternative:** Add a build script to run migrations automatically:
```json
"scripts": {
  "build": "prisma migrate deploy && next build",
  "postinstall": "prisma generate"
}
```

**Note:** Since we added new fields (`testReminderEnabled`, `testReminderInterval`, `testReminderUnit`), you MUST run migrations before deploying.

### 5. Vercel Deployment

**Note:** Your `package.json` uses `--turbopack` flag in the build script. Vercel will handle Next.js builds automatically, but if you encounter build issues, you may need to remove the `--turbopack` flag for production builds.

#### Option A: Automatic Deployment (Recommended)
If your repository is already connected to Vercel:
1. Push your code to GitHub (already done ✅)
2. Vercel will automatically detect the push and deploy
3. Monitor deployment in Vercel dashboard

#### Option B: Manual Deployment via CLI
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link project (if not already linked)
vercel link

# Deploy to production
vercel --prod
```

#### Option C: First-Time Setup via Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository (`berbua/treniren`)
4. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)
5. Add environment variables (see below)
6. Click "Deploy"

## 🎯 Key Features to Test

### Core Functionality
- [ ] User authentication (Google OAuth)
- [ ] Workout creation and editing
- [ ] Event creation and editing
- [ ] Calendar view
- [ ] Statistics calculations

### New Features (v2.0)
- [ ] Strong Mind section (lead climbing only)
- [ ] Goal system (process and project goals)
- [ ] Goal progress tracking
- [ ] Goal achievements in Strong Mind page
- [ ] Translation system (Polish/English)
- [ ] Hydration error prevention

### PWA Features
- [ ] Offline functionality
- [ ] Install prompt
- [ ] Service worker
- [ ] Data synchronization

## 🔍 Post-Deployment Checklist

### Performance
- [ ] Page load times < 3 seconds
- [ ] No console errors
- [ ] Responsive design on mobile
- [ ] PWA installation works

### Security
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Authentication working
- [ ] No sensitive data exposed

### Functionality
- [ ] All workout types work
- [ ] All event types work
- [ ] Calendar displays correctly
- [ ] Statistics calculate properly
- [ ] Goal system functions
- [ ] Translations work

## 🚨 Common Issues

### Database Connection
- Ensure `DATABASE_URL` is correct
- Run Prisma migrations
- Check database permissions

### Authentication Issues
- Verify Google OAuth settings
- Check `NEXTAUTH_SECRET` is set
- Ensure `NEXTAUTH_URL` matches domain

### Build Errors
- Clear `.next` folder
- Reinstall dependencies
- Check TypeScript errors

## 📋 Step-by-Step Deployment Checklist

### Pre-Deployment
- [ ] Code committed and pushed to GitHub
- [ ] Version tagged (v1.0.0 ✅)
- [ ] All environment variables prepared
- [ ] Production database created and accessible
- [ ] Database migrations run on production database
- [ ] Google OAuth configured with production domain

### Vercel Dashboard Setup
1. [ ] Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. [ ] Import project from GitHub (if not already imported)
3. [ ] Go to Project Settings → Environment Variables
4. [ ] Add all required environment variables:
   - [ ] `NEXTAUTH_SECRET`
   - [ ] `NEXTAUTH_URL` (your Vercel domain)
   - [ ] `GOOGLE_CLIENT_ID`
   - [ ] `GOOGLE_CLIENT_SECRET`
   - [ ] `DATABASE_URL` (if not using Vercel Postgres)
   - [ ] `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM`
   - [ ] `NODE_ENV=production`
5. [ ] Save environment variables
6. [ ] Go to Deployments tab
7. [ ] Trigger new deployment (or wait for auto-deploy from git push)

### Post-Deployment
- [ ] Check deployment logs for errors
- [ ] Test authentication (Google OAuth)
- [ ] Test database connection
- [ ] Verify all pages load correctly
- [ ] Test core functionality (workouts, events, calendar)
- [ ] Check mobile responsiveness
- [ ] Test PWA installation

## 📞 Support

If issues arise:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Test locally with production settings
5. Check Prisma migration status: `npx prisma migrate status`
6. Verify database connection string format
