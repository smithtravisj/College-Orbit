import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';
import { sendAnnouncementEmail } from '@/lib/email';
import { logAuditEvent } from '@/lib/auditLog';

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if requester is admin
    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, email: true },
    });

    if (!requester?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, message, tierFilter, deliveryMethod = 'both', specificEmails } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    // Validate delivery method
    if (!['both', 'notification', 'email'].includes(deliveryMethod)) {
      return NextResponse.json({ error: 'Invalid delivery method' }, { status: 400 });
    }

    let users: { id: string; email: string; name: string | null; settings: { emailAnnouncements: boolean } | null }[] = [];

    // Handle specific users targeting
    if (tierFilter === 'specific') {
      if (!specificEmails || !Array.isArray(specificEmails) || specificEmails.length === 0) {
        return NextResponse.json({ error: 'Please provide at least one email address' }, { status: 400 });
      }

      // Find users by their email addresses
      users = await prisma.user.findMany({
        where: {
          email: { in: specificEmails },
        },
        select: {
          id: true,
          email: true,
          name: true,
          settings: {
            select: { emailAnnouncements: true },
          },
        },
      });

      if (users.length === 0) {
        return NextResponse.json({ error: 'No users found with the provided email addresses' }, { status: 400 });
      }

      // Notify admin of any emails that weren't found
      const foundEmails = users.map(u => u.email.toLowerCase());
      const notFoundEmails = specificEmails.filter((e: string) => !foundEmails.includes(e.toLowerCase()));
      if (notFoundEmails.length > 0) {
        console.log(`Emails not found in system: ${notFoundEmails.join(', ')}`);
      }
    } else {
      // Build the where clause based on tier filter
      const now = new Date();
      let whereClause = {};

      switch (tierFilter) {
        case 'free':
          whereClause = {
            OR: [
              { subscriptionTier: 'free' },
              { subscriptionTier: 'trial', trialEndsAt: { lte: now } },
              { subscriptionTier: 'trial', trialEndsAt: null },
            ],
            lifetimePremium: false,
          };
          break;
        case 'trial':
          whereClause = {
            subscriptionTier: 'trial',
            trialEndsAt: { gt: now },
            lifetimePremium: false,
          };
          break;
        case 'premium':
          whereClause = {
            subscriptionTier: 'premium',
            lifetimePremium: false,
          };
          break;
        case 'lifetime':
          whereClause = {
            lifetimePremium: true,
          };
          break;
        case 'admin':
          whereClause = {
            isAdmin: true,
          };
          break;
        case 'all':
        default:
          whereClause = {};
          break;
      }

      // Get all matching users with email, name, and settings
      users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          name: true,
          settings: {
            select: { emailAnnouncements: true },
          },
        },
      });

      if (users.length === 0) {
        return NextResponse.json({ error: 'No users match the selected filter' }, { status: 400 });
      }
    }

    let notificationsSent = 0;
    let emailsSent = 0;
    let emailsFailed = 0;
    let usersOptedOut = 0;
    const emailErrors: string[] = [];

    // Create notifications if delivery method includes notifications
    if (deliveryMethod === 'both' || deliveryMethod === 'notification') {
      await prisma.notification.createMany({
        data: users.map((user) => ({
          userId: user.id,
          title,
          message,
          type: 'announcement',
        })),
      });
      notificationsSent = users.length;
    }

    // Send emails if delivery method includes email
    if (deliveryMethod === 'both' || deliveryMethod === 'email') {
      // Filter users who have email announcements enabled (default is true)
      const usersWithEmailEnabled = users.filter(
        (user) => user.settings?.emailAnnouncements !== false
      );
      usersOptedOut = users.length - usersWithEmailEnabled.length;

      // Send emails to users with announcements enabled (in batches to avoid rate limiting)
      const BATCH_SIZE = 10;

      for (let i = 0; i < usersWithEmailEnabled.length; i += BATCH_SIZE) {
        const batch = usersWithEmailEnabled.slice(i, i + BATCH_SIZE);

        const results = await Promise.allSettled(
          batch.map(async (user) => {
            await sendAnnouncementEmail({
              email: user.email,
              name: user.name,
              title,
              message,
            });
            return user.email;
          })
        );

        for (const result of results) {
          if (result.status === 'fulfilled') {
            emailsSent++;
          } else {
            emailsFailed++;
            emailErrors.push(result.reason?.message || 'Unknown error');
            console.error('Email send failed:', result.reason);
          }
        }
      }
    }

    // Log audit event
    await logAuditEvent({
      adminId: userId,
      adminEmail: requester.email || 'unknown',
      action: 'send_announcement',
      details: {
        title,
        tierFilter: tierFilter || 'all',
        deliveryMethod,
        specificEmails: tierFilter === 'specific' ? specificEmails : undefined,
        recipientCount: users.length,
        notificationsSent,
        emailsSent,
        emailsFailed,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Announcement sent to ${users.length} user${users.length === 1 ? '' : 's'}`,
      recipientCount: users.length,
      notificationsSent,
      emailsSent,
      emailsFailed,
      emailsOptedOut: usersOptedOut,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
    });
  } catch (error) {
    console.error('Error sending announcement:', error);
    return NextResponse.json(
      { error: 'Failed to send announcement' },
      { status: 500 }
    );
  }
}
