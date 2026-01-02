import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';

// Configure web-push with VAPID keys
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@treniren.app';

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!publicKey || !privateKey) {
      return NextResponse.json(
        { error: 'VAPID keys not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { title, message, icon, badge, tag, data, userId } = body;

    // If userId is provided, send to that user's subscriptions
    // Otherwise, send to current user's subscriptions
    const targetUserId = userId || session.user.id;

    // Get all push subscriptions for the user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: targetUserId }
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No push subscriptions found' },
        { status: 404 }
      );
    }

    const payload = JSON.stringify({
      title: title || 'Treniren',
      body: message || 'You have a new notification',
      icon: icon || '/icon-192.svg',
      badge: badge || '/icon-192.svg',
      tag: tag || 'default',
      data: data || {}
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
              }
            },
            payload
          );
          return { success: true, endpoint: subscription.endpoint };
        } catch (error: any) {
          // If subscription is invalid, remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({
              where: { endpoint: subscription.endpoint }
            });
          }
          return { 
            success: false, 
            endpoint: subscription.endpoint, 
            error: error.message,
            statusCode: error.statusCode 
          };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      { error: 'Failed to send push notification' },
      { status: 500 }
    );
  }
}

