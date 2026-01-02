# 🔔 Push Notifications Setup Guide

This app uses **Web Push Protocol (VAPID)** for server-side push notifications. This is completely **free** when using Vercel's Hobby plan.

## Prerequisites

- Node.js installed
- Vercel account (free tier works)
- PostgreSQL database (for storing push subscriptions)

## Step 1: Generate VAPID Keys

Run the following command to generate VAPID keys:

```bash
npm run generate-vapid-keys
```

This will output:
- `VAPID_PUBLIC_KEY` - Public key (safe to expose)
- `VAPID_PRIVATE_KEY` - Private key (keep secret!)
- `VAPID_SUBJECT` - Should be a `mailto:` URL (e.g., `mailto:admin@treniren.app`)

## Step 2: Add Environment Variables

### Local Development (.env.local)

Add these to your `.env.local` file:

```bash
VAPID_PUBLIC_KEY="your-public-key-here"
VAPID_PRIVATE_KEY="your-private-key-here"
VAPID_SUBJECT="mailto:your-email@example.com"
```

### Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the three variables:
   - `VAPID_PUBLIC_KEY` (Production)
   - `VAPID_PRIVATE_KEY` (Production) - **Mark as sensitive**
   - `VAPID_SUBJECT` (Production)

## Step 3: Database Migration

The push notifications feature requires a new database table. Run:

```bash
npx prisma db push
```

Or if using migrations:

```bash
npx prisma migrate dev --name add_push_subscriptions
```

## Step 4: Enable Push Notifications

1. **Start your app** (development or production)
2. **Go to Profile** → **Settings** tab
3. **Click "Enable"** next to "Push Notifications"
4. **Allow notifications** when your browser prompts you

## How It Works

### User Flow

1. User clicks "Enable" in profile settings
2. Browser requests notification permission
3. Service worker subscribes to push notifications
4. Subscription is saved to database
5. User receives push notifications even when app is closed

### Notification Types

The app sends push notifications for:
- **Cycle reminders** - When period is due
- **Late period alerts** - When period is overdue
- **Workout inactivity** - When no workouts logged for X days
- **Test reminders** - When fingerboard test is due

### Technical Details

- **Service Worker**: Handles push events and displays notifications
- **API Routes**:
  - `/api/push/subscribe` - Subscribe/unsubscribe to push
  - `/api/push/send` - Send push notification (server-side)
  - `/api/push/public-key` - Get VAPID public key
- **Database**: Stores push subscriptions in `push_subscriptions` table

## Troubleshooting

### "Push notifications are not supported"

- Make sure you're using HTTPS (required for push notifications)
- Check that your browser supports Service Workers and Push API
- Chrome, Firefox, Edge, and Safari (iOS 16.4+) support push notifications

### "Failed to enable push notifications"

1. Check browser console for errors
2. Verify VAPID keys are set correctly in environment variables
3. Make sure database migration was run
4. Check that service worker is registered (check DevTools → Application → Service Workers)

### Notifications not received

1. Check notification settings in browser
2. Verify subscription exists in database
3. Check server logs for errors when sending notifications
4. Make sure `pushNotificationsEnabled` is true in user settings

## Testing

To test push notifications:

1. Enable push notifications in profile
2. Wait for a notification trigger (e.g., cycle reminder, workout inactivity)
3. Or manually trigger via API:

```bash
curl -X POST http://localhost:2137/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test push notification",
    "tag": "test"
  }'
```

## Security Notes

- **VAPID_PRIVATE_KEY** must be kept secret - never commit to git
- Only authenticated users can subscribe to push notifications
- Subscriptions are tied to user accounts and deleted when user is deleted
- Invalid subscriptions are automatically cleaned up

## Cost

- **VAPID keys**: Free
- **Vercel Serverless Functions**: Free on Hobby plan (100GB-hours/month)
- **Database storage**: Minimal (only subscription endpoints)
- **Total cost**: $0/month for typical usage

## Next Steps

For scheduled notifications (e.g., daily cycle reminders), you can:
1. Use Vercel Cron Jobs (free tier: 2 cron jobs)
2. Or create a scheduled API route that runs periodically

Example cron job configuration in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/send-notifications",
    "schedule": "0 9 * * *"
  }]
}
```



