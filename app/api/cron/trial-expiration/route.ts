import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPushNotification } from '@/lib/sendPushNotification';

export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const results = {
    expiredTrials: 0,
    endingSoonNotifications: 0,
    errors: 0,
  };

  try {
    // 1. Find users with trials ending in the next 24 hours (for reminder)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const usersTrialEndingSoon = await prisma.user.findMany({
      where: {
        subscriptionTier: 'trial',
        trialEndsAt: {
          gt: now,
          lte: tomorrow,
        },
      },
      select: { id: true, trialEndsAt: true },
    });

    for (const user of usersTrialEndingSoon) {
      try {
        // Check if we already sent this notification
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: 'trial_ending_soon',
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Within last 24 hours
            },
          },
        });

        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: 'Your trial ends tomorrow!',
              message: 'Subscribe now to keep premium features like Calendar, Shopping, unlimited notes, and more.',
              type: 'trial_ending_soon',
            },
          });
          sendPushNotification(
            user.id,
            'Your trial ends tomorrow!',
            'Subscribe now to keep premium features like Calendar, Shopping, unlimited notes, and more.',
            { type: 'trial_ending_soon' }
          ).catch(() => {});
          results.endingSoonNotifications++;
        }
      } catch (error) {
        console.error(`Error sending trial ending soon notification for user ${user.id}:`, error);
        results.errors++;
      }
    }

    // 2. Find and expire ended trials
    const expiredTrials = await prisma.user.findMany({
      where: {
        subscriptionTier: 'trial',
        trialEndsAt: {
          lte: now,
        },
      },
      select: { id: true },
    });

    for (const user of expiredTrials) {
      try {
        // Update user to free tier
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: 'free',
            subscriptionStatus: 'none',
          },
        });

        // Create trial ended notification
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Your trial has ended',
            message: 'Your premium features are now locked. Subscribe anytime to regain access - your data is safe!',
            type: 'trial_ended',
          },
        });
        sendPushNotification(
          user.id,
          'Your trial has ended',
          'Your premium features are now locked. Subscribe anytime to regain access - your data is safe!',
          { type: 'trial_ended' }
        ).catch(() => {});

        results.expiredTrials++;
      } catch (error) {
        console.error(`Error expiring trial for user ${user.id}:`, error);
        results.errors++;
      }
    }

    console.log('Trial expiration cron completed:', results);

    return NextResponse.json({
      success: true,
      processed: results,
    });
  } catch (error) {
    console.error('Trial expiration cron error:', error);
    return NextResponse.json(
      { error: 'Failed to process trial expirations' },
      { status: 500 }
    );
  }
}
