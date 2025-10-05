# 🚀 Production Deployment Guide

## Environment Variables Setup

Your `.env.production` file currently has:
- ✅ `DATABASE_URL` (configured by Vercel)
- ✅ `VERCEL_OIDC_TOKEN` (configured by Vercel)

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
- Run Prisma migrations on production database:
```bash
npx prisma db push
npx prisma generate
```

### 5. Vercel Deployment
```bash
vercel --prod
```

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

## 📞 Support

If issues arise:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables
4. Test locally with production settings
