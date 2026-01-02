// Script to generate VAPID keys for Web Push notifications
const webpush = require('web-push');

console.log('Generating VAPID keys...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Add these to your .env.local and Vercel environment variables:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('\nVAPID_SUBJECT should be a mailto: URL (e.g., mailto:your-email@example.com)');

