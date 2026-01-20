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

      // Check if user has in-app task reminders enabled
      if (!settings.notifyTaskReminders) {
        continue;
      }

      // Parse user's custom reminder settings
      let reminders: Array<{ enabled: boolean; value: number; unit: 'hours' | 'days' }> = [];
      const taskReminders = settings.taskReminders;
      if (taskReminders) {
        try {
          const parsed = typeof taskReminders === 'string'
            ? JSON.parse(taskReminders as string)
            : taskReminders;
          reminders = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error(`Failed to parse task reminders for user ${user.id}:`, e);
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

        // Find user's tasks in this reminder window
        const tasks = await prisma.task.findMany({
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

        // Send reminders for each task
        for (const task of tasks) {
          // Check if reminder already sent for this value/unit combo
          const reminderKey = `${reminder.value}_${reminder.unit}`;
          const alreadySent = task.reminders.some(r => r.reminderType === reminderKey);
          if (alreadySent) {
            results.skipped++;
            continue;
          }

          try {
            // Create notification
            const notification = await prisma.notification.create({
              data: {
                userId: task.userId,
                taskId: task.id,
                title: `Task Due: ${task.title}`,
                message: `Your task${task.course?.code ? ` for ${task.course.code}` : ''} is due ${getTimeUntilText(reminder.value, reminder.unit)}`,
                type: 'task_reminder',
                read: false,
              },
            });

            // Record reminder sent
            await prisma.taskReminder.create({
              data: {
                taskId: task.id,
                reminderType: reminderKey,
                notificationId: notification.id,
              },
            });

            results.sent++;
          } catch (error) {
            console.error(`Failed to send reminder for task ${task.id}:`, error);
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
