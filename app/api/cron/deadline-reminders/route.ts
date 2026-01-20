import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const results = { sent: 0, skipped: 0, errors: 0 };

  try {
    // Fetch all users with their settings
    const users = await prisma.user.findMany({
      include: { settings: true },
    });

    // Process reminders for each user
    for (const user of users) {
      if (!user.settings) continue;
      const settings = user.settings!;

      // Check if user has in-app deadline reminders enabled
      if (!settings.notifyDeadlineReminders) {
        continue;
      }

      // Parse user's custom reminder settings
      let reminders: Array<{ enabled: boolean; value: number; unit: 'hours' | 'days' }> = [];
      const deadlineReminders = settings.deadlineReminders;
      if (deadlineReminders) {
        try {
          const parsed = typeof deadlineReminders === 'string'
            ? JSON.parse(deadlineReminders as string)
            : deadlineReminders;
          reminders = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error(`Failed to parse deadline reminders for user ${user.id}:`, e);
          continue;
        }
      }

      // Process each enabled reminder
      for (const reminder of reminders) {
        if (!reminder.enabled) continue;

        // Convert value/unit to hours
        const reminderHours = reminder.unit === 'days' ? reminder.value * 24 : reminder.value;

        const hoursBuffer = 0.5; // ±30 minutes buffer
        const windowStart = new Date(now.getTime() + (reminderHours - hoursBuffer) * 60 * 60 * 1000);
        const windowEnd = new Date(now.getTime() + (reminderHours + hoursBuffer) * 60 * 60 * 1000);

        // Find user's deadlines in this reminder window
        const deadlines = await prisma.deadline.findMany({
          where: {
            userId: user.id,
            dueAt: { gte: windowStart, lte: windowEnd },
            status: 'open',
          },
          include: {
            course: true,
            reminders: true,
          },
        });

        // Send reminders for each deadline
        for (const deadline of deadlines) {
          // Check if reminder already sent for this value/unit combo
          const reminderKey = `${reminder.value}_${reminder.unit}`;
          const alreadySent = deadline.reminders.some(r => r.reminderType === reminderKey);
          if (alreadySent) {
            results.skipped++;
            continue;
          }

          try {
            // Create notification
            const notification = await prisma.notification.create({
              data: {
                userId: deadline.userId,
                deadlineId: deadline.id,
                title: `Assignment Due: ${deadline.title}`,
                message: `Your ${deadline.course?.code || 'assignment'} is due ${getTimeUntilText(reminder.value, reminder.unit)}`,
                type: 'deadline_reminder',
                read: false,
              },
            });

            // Record reminder sent
            await prisma.deadlineReminder.create({
              data: {
                deadlineId: deadline.id,
                reminderType: reminderKey,
                notificationId: notification.id,
              },
            });

            results.sent++;
          } catch (error) {
            console.error(`Failed to send reminder for deadline ${deadline.id}:`, error);
            results.errors++;
          }
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    );
  }
}

function getTimeUntilText(value: number, unit: 'hours' | 'days'): string {
  if (unit === 'days') {
    if (value === 1) return 'tomorrow';
    return `in ${value} days`;
  } else {
    if (value <= 1) return 'in less than an hour';
    if (value <= 3) return 'in a few hours';
    return `in ${value} hours`;
  }
}
