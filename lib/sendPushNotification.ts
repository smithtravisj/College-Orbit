import { prisma } from '@/lib/prisma';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
}

/**
 * Send push notifications to all registered devices for a user.
 * Uses Expo Push Notification service.
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  try {
    const tokens = await prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length === 0) return;

    // Count unread for badge
    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    const messages: PushMessage[] = tokens.map(({ token }) => ({
      to: token,
      title,
      body,
      data: data || {},
      sound: 'default',
      badge: unreadCount,
    }));

    // Send via Expo Push API (handles batching up to 100 per request)
    const chunks = chunkArray(messages, 100);

    for (const chunk of chunks) {
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Push] Expo push API error:', errorText);
        }

        const result = await response.json();

        // Handle invalid tokens (DeviceNotRegistered)
        if (result.data) {
          for (let i = 0; i < result.data.length; i++) {
            const ticket = result.data[i];
            if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
              // Remove invalid token
              await prisma.pushToken.deleteMany({
                where: { token: chunk[i].to, userId },
              }).catch(() => {});
            }
          }
        }
      } catch (error) {
        console.error('[Push] Failed to send push chunk:', error);
      }
    }
  } catch (error) {
    console.error('[Push] sendPushNotification error:', error);
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Create a notification in the database AND send a push notification.
 * Drop-in replacement for prisma.notification.create + push.
 */
export async function createNotificationWithPush(params: {
  userId: string;
  title: string;
  message: string;
  type: string;
  examId?: string;
  deadlineId?: string;
  taskId?: string;
  workItemId?: string;
  collegeRequestId?: string;
  featureRequestId?: string;
  issueReportId?: string;
  betaFeedbackId?: string;
  canvasAnnouncementId?: string;
}) {
  const { userId, title, message, type, ...rest } = params;

  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      ...rest,
    },
  });

  // Fire and forget — don't block on push delivery
  sendPushNotification(userId, title, message, {
    notificationId: notification.id,
    type,
  }).catch(() => {});

  return notification;
}
