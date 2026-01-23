import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Priority mapping functions
function mapTaskImportanceToPriority(importance: string | null): string | null {
  if (!importance) return null;
  // Task importance is already 'low' | 'medium' | 'high'
  return importance;
}

function mapDeadlinePriorityToString(priority: number | null): string | null {
  if (priority === null) return null;
  switch (priority) {
    case 1:
      return 'critical';
    case 2:
      return 'high';
    case 3:
      return 'medium';
    default:
      return 'medium';
  }
}

interface MigrationStats {
  tasksProcessed: number;
  deadlinesProcessed: number;
  recurringPatternsProcessed: number;
  recurringDeadlinePatternsProcessed: number;
  taskRemindersProcessed: number;
  deadlineRemindersProcessed: number;
  notesUpdated: number;
  notificationsUpdated: number;
  errors: string[];
}

async function migrateToWorkItems(): Promise<void> {
  console.log('='.repeat(60));
  console.log('WorkItem Migration Script');
  console.log('='.repeat(60));
  console.log('\nThis script will migrate Tasks and Deadlines to WorkItems.\n');

  const stats: MigrationStats = {
    tasksProcessed: 0,
    deadlinesProcessed: 0,
    recurringPatternsProcessed: 0,
    recurringDeadlinePatternsProcessed: 0,
    taskRemindersProcessed: 0,
    deadlineRemindersProcessed: 0,
    notesUpdated: 0,
    notificationsUpdated: 0,
    errors: [],
  };

  // Get counts before migration
  const taskCount = await prisma.task.count();
  const deadlineCount = await prisma.deadline.count();
  const recurringPatternCount = await prisma.recurringPattern.count();
  const recurringDeadlinePatternCount = await prisma.recurringDeadlinePattern.count();

  console.log('Pre-migration counts:');
  console.log(`  Tasks: ${taskCount}`);
  console.log(`  Deadlines: ${deadlineCount}`);
  console.log(`  Recurring Task Patterns: ${recurringPatternCount}`);
  console.log(`  Recurring Deadline Patterns: ${recurringDeadlinePatternCount}`);
  console.log('');

  // Create ID mapping for recurring patterns
  const recurringPatternIdMap = new Map<string, string>(); // old ID -> new ID
  const recurringDeadlinePatternIdMap = new Map<string, string>(); // old ID -> new ID

  // Step 1: Migrate RecurringPattern -> RecurringWorkPattern
  console.log('Step 1: Migrating RecurringPattern to RecurringWorkPattern...');
  const recurringPatterns = await prisma.recurringPattern.findMany();

  for (const pattern of recurringPatterns) {
    try {
      // Transform taskTemplate to workItemTemplate
      const taskTemplate = pattern.taskTemplate as Record<string, unknown>;
      const workItemTemplate = {
        ...taskTemplate,
        type: 'task',
        priority: mapTaskImportanceToPriority(taskTemplate.importance as string | null),
      };
      // Remove old importance field
      delete workItemTemplate.importance;

      const newPattern = await prisma.recurringWorkPattern.create({
        data: {
          id: pattern.id, // Preserve ID for foreign key integrity
          userId: pattern.userId,
          recurrenceType: pattern.recurrenceType,
          intervalDays: pattern.intervalDays,
          daysOfWeek: pattern.daysOfWeek,
          daysOfMonth: pattern.daysOfMonth,
          startDate: pattern.startDate,
          endDate: pattern.endDate,
          occurrenceCount: pattern.occurrenceCount,
          lastGenerated: pattern.lastGenerated,
          instanceCount: pattern.instanceCount,
          workItemTemplate: workItemTemplate,
          isActive: pattern.isActive,
          createdAt: pattern.createdAt,
          updatedAt: pattern.updatedAt,
        },
      });
      recurringPatternIdMap.set(pattern.id, newPattern.id);
      stats.recurringPatternsProcessed++;
    } catch (error) {
      const errorMsg = `Error migrating RecurringPattern ${pattern.id}: ${error}`;
      console.error(`  ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }
  console.log(`  Processed ${stats.recurringPatternsProcessed} recurring task patterns\n`);

  // Step 2: Migrate RecurringDeadlinePattern -> RecurringWorkPattern
  console.log('Step 2: Migrating RecurringDeadlinePattern to RecurringWorkPattern...');
  const recurringDeadlinePatterns = await prisma.recurringDeadlinePattern.findMany();

  for (const pattern of recurringDeadlinePatterns) {
    try {
      // Transform deadlineTemplate to workItemTemplate
      const deadlineTemplate = pattern.deadlineTemplate as Record<string, unknown>;
      const workItemTemplate = {
        ...deadlineTemplate,
        type: 'assignment',
        priority: mapDeadlinePriorityToString(deadlineTemplate.priority as number | null),
        checklist: [], // Deadlines don't have checklists
        pinned: false,
      };
      // Remove old priority field (it was numeric)
      delete workItemTemplate.priority;
      workItemTemplate.priority = mapDeadlinePriorityToString(deadlineTemplate.priority as number | null);

      const newPattern = await prisma.recurringWorkPattern.create({
        data: {
          id: pattern.id, // Preserve ID for foreign key integrity
          userId: pattern.userId,
          recurrenceType: pattern.recurrenceType,
          intervalDays: pattern.intervalDays,
          daysOfWeek: pattern.daysOfWeek,
          daysOfMonth: pattern.daysOfMonth,
          startDate: pattern.startDate,
          endDate: pattern.endDate,
          occurrenceCount: pattern.occurrenceCount,
          lastGenerated: pattern.lastGenerated,
          instanceCount: pattern.instanceCount,
          workItemTemplate: workItemTemplate,
          isActive: pattern.isActive,
          createdAt: pattern.createdAt,
          updatedAt: pattern.updatedAt,
        },
      });
      recurringDeadlinePatternIdMap.set(pattern.id, newPattern.id);
      stats.recurringDeadlinePatternsProcessed++;
    } catch (error) {
      const errorMsg = `Error migrating RecurringDeadlinePattern ${pattern.id}: ${error}`;
      console.error(`  ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }
  console.log(`  Processed ${stats.recurringDeadlinePatternsProcessed} recurring deadline patterns\n`);

  // Step 3: Migrate Tasks -> WorkItems
  console.log('Step 3: Migrating Tasks to WorkItems...');
  const tasks = await prisma.task.findMany();

  for (const task of tasks) {
    try {
      await prisma.workItem.create({
        data: {
          id: task.id, // Preserve ID for foreign key integrity
          userId: task.userId,
          title: task.title,
          type: 'task',
          courseId: task.courseId,
          dueAt: task.dueAt,
          priority: mapTaskImportanceToPriority(task.importance),
          effort: null, // Tasks didn't have effort
          pinned: task.pinned,
          checklist: task.checklist,
          notes: task.notes,
          tags: task.tags,
          status: task.status,
          workingOn: task.workingOn,
          links: task.links,
          files: task.files,
          instanceDate: task.instanceDate,
          isRecurring: task.isRecurring,
          recurringPatternId: task.recurringPatternId
            ? recurringPatternIdMap.get(task.recurringPatternId) || task.recurringPatternId
            : null,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
      });
      stats.tasksProcessed++;
    } catch (error) {
      const errorMsg = `Error migrating Task ${task.id}: ${error}`;
      console.error(`  ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }
  console.log(`  Processed ${stats.tasksProcessed} tasks\n`);

  // Step 4: Migrate Deadlines -> WorkItems
  console.log('Step 4: Migrating Deadlines to WorkItems...');
  const deadlines = await prisma.deadline.findMany();

  for (const deadline of deadlines) {
    try {
      await prisma.workItem.create({
        data: {
          id: deadline.id, // Preserve ID for foreign key integrity
          userId: deadline.userId,
          title: deadline.title,
          type: 'assignment',
          courseId: deadline.courseId,
          dueAt: deadline.dueAt,
          priority: mapDeadlinePriorityToString(deadline.priority),
          effort: deadline.effort,
          pinned: false,
          checklist: [], // Deadlines don't have checklists
          notes: deadline.notes,
          tags: deadline.tags,
          status: deadline.status,
          workingOn: deadline.workingOn,
          links: deadline.links,
          files: deadline.files,
          instanceDate: deadline.instanceDate,
          isRecurring: deadline.isRecurring,
          recurringPatternId: deadline.recurringPatternId
            ? recurringDeadlinePatternIdMap.get(deadline.recurringPatternId) || deadline.recurringPatternId
            : null,
          // Canvas fields
          canvasAssignmentId: deadline.canvasAssignmentId,
          canvasSubmissionId: deadline.canvasSubmissionId,
          canvasPointsPossible: deadline.canvasPointsPossible,
          canvasPointsEarned: deadline.canvasPointsEarned,
          canvasGradePostedAt: deadline.canvasGradePostedAt,
          createdAt: deadline.createdAt,
          updatedAt: deadline.updatedAt,
        },
      });
      stats.deadlinesProcessed++;
    } catch (error) {
      const errorMsg = `Error migrating Deadline ${deadline.id}: ${error}`;
      console.error(`  ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }
  console.log(`  Processed ${stats.deadlinesProcessed} deadlines\n`);

  // Step 5: Migrate TaskReminder -> WorkItemReminder
  console.log('Step 5: Migrating TaskReminder to WorkItemReminder...');
  const taskReminders = await prisma.taskReminder.findMany();

  for (const reminder of taskReminders) {
    try {
      await prisma.workItemReminder.create({
        data: {
          id: reminder.id,
          workItemId: reminder.taskId,
          reminderType: reminder.reminderType,
          sentAt: reminder.sentAt,
          notificationId: reminder.notificationId,
        },
      });
      stats.taskRemindersProcessed++;
    } catch (error) {
      const errorMsg = `Error migrating TaskReminder ${reminder.id}: ${error}`;
      console.error(`  ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }
  console.log(`  Processed ${stats.taskRemindersProcessed} task reminders\n`);

  // Step 6: Migrate DeadlineReminder -> WorkItemReminder
  console.log('Step 6: Migrating DeadlineReminder to WorkItemReminder...');
  const deadlineReminders = await prisma.deadlineReminder.findMany();

  for (const reminder of deadlineReminders) {
    try {
      await prisma.workItemReminder.create({
        data: {
          id: reminder.id,
          workItemId: reminder.deadlineId,
          reminderType: reminder.reminderType,
          sentAt: reminder.sentAt,
          notificationId: reminder.notificationId,
        },
      });
      stats.deadlineRemindersProcessed++;
    } catch (error) {
      const errorMsg = `Error migrating DeadlineReminder ${reminder.id}: ${error}`;
      console.error(`  ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }
  console.log(`  Processed ${stats.deadlineRemindersProcessed} deadline reminders\n`);

  // Step 7: Update Notes with workItemId
  console.log('Step 7: Updating Notes with workItemId...');
  const notesWithTask = await prisma.note.findMany({
    where: { taskId: { not: null } },
  });
  const notesWithDeadline = await prisma.note.findMany({
    where: { deadlineId: { not: null } },
  });

  for (const note of notesWithTask) {
    try {
      await prisma.note.update({
        where: { id: note.id },
        data: { workItemId: note.taskId },
      });
      stats.notesUpdated++;
    } catch (error) {
      const errorMsg = `Error updating Note ${note.id} with taskId: ${error}`;
      console.error(`  ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }

  for (const note of notesWithDeadline) {
    try {
      await prisma.note.update({
        where: { id: note.id },
        data: { workItemId: note.deadlineId },
      });
      stats.notesUpdated++;
    } catch (error) {
      const errorMsg = `Error updating Note ${note.id} with deadlineId: ${error}`;
      console.error(`  ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }

  // Update Notes with recurringWorkPatternId
  const notesWithRecurringTask = await prisma.note.findMany({
    where: { recurringTaskPatternId: { not: null } },
  });
  const notesWithRecurringDeadline = await prisma.note.findMany({
    where: { recurringDeadlinePatternId: { not: null } },
  });

  for (const note of notesWithRecurringTask) {
    try {
      await prisma.note.update({
        where: { id: note.id },
        data: { recurringWorkPatternId: note.recurringTaskPatternId },
      });
    } catch (error) {
      const errorMsg = `Error updating Note ${note.id} with recurringTaskPatternId: ${error}`;
      console.error(`  ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }

  for (const note of notesWithRecurringDeadline) {
    try {
      await prisma.note.update({
        where: { id: note.id },
        data: { recurringWorkPatternId: note.recurringDeadlinePatternId },
      });
    } catch (error) {
      const errorMsg = `Error updating Note ${note.id} with recurringDeadlinePatternId: ${error}`;
      console.error(`  ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }
  console.log(`  Updated ${stats.notesUpdated} notes\n`);

  // Step 8: Update Notifications with workItemId
  console.log('Step 8: Updating Notifications with workItemId...');
  const notificationsWithTask = await prisma.notification.findMany({
    where: { taskId: { not: null } },
  });
  const notificationsWithDeadline = await prisma.notification.findMany({
    where: { deadlineId: { not: null } },
  });

  for (const notification of notificationsWithTask) {
    try {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { workItemId: notification.taskId },
      });
      stats.notificationsUpdated++;
    } catch (error) {
      const errorMsg = `Error updating Notification ${notification.id} with taskId: ${error}`;
      console.error(`  ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }

  for (const notification of notificationsWithDeadline) {
    try {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { workItemId: notification.deadlineId },
      });
      stats.notificationsUpdated++;
    } catch (error) {
      const errorMsg = `Error updating Notification ${notification.id} with deadlineId: ${error}`;
      console.error(`  ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }
  console.log(`  Updated ${stats.notificationsUpdated} notifications\n`);

  // Verification
  console.log('='.repeat(60));
  console.log('Verification');
  console.log('='.repeat(60));

  const workItemTaskCount = await prisma.workItem.count({ where: { type: 'task' } });
  const workItemAssignmentCount = await prisma.workItem.count({ where: { type: 'assignment' } });
  const recurringWorkPatternCount = await prisma.recurringWorkPattern.count();
  const workItemReminderCount = await prisma.workItemReminder.count();

  console.log('\nPost-migration counts:');
  console.log(`  WorkItems (type=task): ${workItemTaskCount} (expected: ${taskCount})`);
  console.log(`  WorkItems (type=assignment): ${workItemAssignmentCount} (expected: ${deadlineCount})`);
  console.log(`  RecurringWorkPatterns: ${recurringWorkPatternCount} (expected: ${recurringPatternCount + recurringDeadlinePatternCount})`);
  console.log(`  WorkItemReminders: ${workItemReminderCount}`);

  // Verify counts
  const taskMismatch = workItemTaskCount !== taskCount;
  const deadlineMismatch = workItemAssignmentCount !== deadlineCount;
  const patternMismatch = recurringWorkPatternCount !== (recurringPatternCount + recurringDeadlinePatternCount);

  if (taskMismatch || deadlineMismatch || patternMismatch) {
    console.log('\n⚠️  WARNING: Count mismatches detected!');
    if (taskMismatch) console.log(`    Task count mismatch: ${workItemTaskCount} vs ${taskCount}`);
    if (deadlineMismatch) console.log(`    Deadline count mismatch: ${workItemAssignmentCount} vs ${deadlineCount}`);
    if (patternMismatch) console.log(`    Pattern count mismatch: ${recurringWorkPatternCount} vs ${recurringPatternCount + recurringDeadlinePatternCount}`);
  } else {
    console.log('\n✓ All counts match!');
  }

  // Sample verification of Canvas fields
  console.log('\nVerifying Canvas field preservation (sample of 5 items)...');
  const canvasWorkItems = await prisma.workItem.findMany({
    where: { canvasAssignmentId: { not: null } },
    take: 5,
  });

  for (const item of canvasWorkItems) {
    console.log(`  ${item.title}:`);
    console.log(`    canvasAssignmentId: ${item.canvasAssignmentId}`);
    console.log(`    canvasPointsPossible: ${item.canvasPointsPossible}`);
    console.log(`    canvasPointsEarned: ${item.canvasPointsEarned}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Migration Summary');
  console.log('='.repeat(60));
  console.log(`  Tasks migrated: ${stats.tasksProcessed}`);
  console.log(`  Deadlines migrated: ${stats.deadlinesProcessed}`);
  console.log(`  Recurring task patterns migrated: ${stats.recurringPatternsProcessed}`);
  console.log(`  Recurring deadline patterns migrated: ${stats.recurringDeadlinePatternsProcessed}`);
  console.log(`  Task reminders migrated: ${stats.taskRemindersProcessed}`);
  console.log(`  Deadline reminders migrated: ${stats.deadlineRemindersProcessed}`);
  console.log(`  Notes updated: ${stats.notesUpdated}`);
  console.log(`  Notifications updated: ${stats.notificationsUpdated}`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  ${stats.errors.length} errors occurred during migration:`);
    stats.errors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
  } else {
    console.log('\n✓ Migration completed successfully with no errors!');
  }

  console.log('\nNote: Old Task, Deadline, and related tables are preserved for rollback.');
  console.log('They can be safely deleted after verifying the migration.');
}

// Run the migration
migrateToWorkItems()
  .catch((error) => {
    console.error('\nFatal error during migration:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
