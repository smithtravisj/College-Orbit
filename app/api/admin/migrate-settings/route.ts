import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLog';

// Current defaults that all users should have access to
const CURRENT_PAGES = ['Dashboard', 'Calendar', 'Work', 'Exams', 'Notes', 'Courses', 'Shopping', 'Tools', 'Progress', 'Settings'];
const CURRENT_DASHBOARD_CARDS = ['timeline', 'progress', 'dashboard_quickLinks'];
const LEGACY_DASHBOARD_CARDS = ['nextClass', 'dueSoon', 'overview', 'todayTasks', 'upcomingWeek', 'quickLinks'];
const CURRENT_TOOLS_CARDS = [
  'pomodoroTimer', 'fileConverter', 'unitConverter', 'wordCounter',
  'citationGenerator', 'flashcards', 'gradeTracker', 'gpaTrendChart',
  'whatIfProjector', 'gpaCalculator', 'finalGradeCalculator', 'tools_quickLinks',
];

function migratePageName(p: string): string {
  if (p === 'Deadlines' || p === 'Assignments' || p === 'Tasks') return 'Work';
  return p;
}

function migrateSettings(settings: any) {
  const updates: Record<string, any> = {};

  // 1. Migrate visiblePages
  if (settings.visiblePages) {
    const pages = typeof settings.visiblePages === 'string'
      ? JSON.parse(settings.visiblePages)
      : settings.visiblePages;
    const migrated = [...new Set(pages.map(migratePageName))] as string[];
    const newPages = CURRENT_PAGES.filter(p => !migrated.includes(p));
    if (newPages.length > 0 || migrated.length !== pages.length) {
      updates.visiblePages = [...migrated, ...newPages];
    }
  } else {
    updates.visiblePages = CURRENT_PAGES;
  }

  // 2. Migrate visibleDashboardCards
  if (settings.visibleDashboardCards) {
    const cards = typeof settings.visibleDashboardCards === 'string'
      ? JSON.parse(settings.visibleDashboardCards)
      : settings.visibleDashboardCards;
    const hasOnlyLegacy = cards.every((c: string) =>
      LEGACY_DASHBOARD_CARDS.includes(c) || c === 'dashboard_quickLinks'
    );
    const hasNewCards = cards.some((c: string) => ['timeline', 'progress'].includes(c));
    if (hasOnlyLegacy && !hasNewCards) {
      updates.visibleDashboardCards = CURRENT_DASHBOARD_CARDS;
    }
  } else {
    updates.visibleDashboardCards = CURRENT_DASHBOARD_CARDS;
  }

  // 3. Migrate visibleToolsCards
  if (settings.visibleToolsCards) {
    const tools = typeof settings.visibleToolsCards === 'string'
      ? JSON.parse(settings.visibleToolsCards)
      : settings.visibleToolsCards;
    const newTools = CURRENT_TOOLS_CARDS.filter(t => !tools.includes(t));
    if (newTools.length > 0) {
      updates.visibleToolsCards = [...tools, ...newTools];
    }
  } else {
    updates.visibleToolsCards = CURRENT_TOOLS_CARDS;
  }

  // 4. Migrate visiblePagesOrder
  if (settings.visiblePagesOrder) {
    const order = typeof settings.visiblePagesOrder === 'string'
      ? JSON.parse(settings.visiblePagesOrder)
      : settings.visiblePagesOrder;
    const migratedOrder = [...new Set(order.map(migratePageName))] as string[];
    const allPages = CURRENT_PAGES.filter(p => p !== 'Settings');
    const missingPages = allPages.filter(p => !migratedOrder.includes(p));
    if (missingPages.length > 0 || migratedOrder.length !== order.length) {
      updates.visiblePagesOrder = [...migratedOrder, ...missingPages];
    }
  }

  // 5. Migrate toolsCardsOrder
  if (settings.toolsCardsOrder) {
    const order = typeof settings.toolsCardsOrder === 'string'
      ? JSON.parse(settings.toolsCardsOrder)
      : settings.toolsCardsOrder;
    const missingTools = CURRENT_TOOLS_CARDS.filter(t => !order.includes(t));
    if (missingTools.length > 0) {
      updates.toolsCardsOrder = [...order, ...missingTools];
    }
  }

  return updates;
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requester = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { isAdmin: true, email: true },
    });

    if (!requester?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all settings records
    const allSettings = await prisma.settings.findMany();

    let migratedCount = 0;
    let skippedCount = 0;
    let streaksCreated = 0;

    for (const settings of allSettings) {
      const updates = migrateSettings(settings);

      if (Object.keys(updates).length > 0) {
        await prisma.settings.update({
          where: { id: settings.id },
          data: updates,
        });
        migratedCount++;
      } else {
        skippedCount++;
      }
    }

    // Create UserStreak records for users who don't have one
    const usersWithoutStreaks = await prisma.user.findMany({
      where: {
        NOT: {
          id: {
            in: (await prisma.userStreak.findMany({ select: { userId: true } })).map(s => s.userId),
          },
        },
      },
      select: { id: true },
    });

    if (usersWithoutStreaks.length > 0) {
      await prisma.userStreak.createMany({
        data: usersWithoutStreaks.map(u => ({
          userId: u.id,
          currentStreak: 0,
          longestStreak: 0,
          totalTasksCompleted: 0,
          totalXp: 0,
          level: 1,
        })),
        skipDuplicates: true,
      });
      streaksCreated = usersWithoutStreaks.length;
    }

    // Create Settings records for users who don't have one
    const usersWithoutSettings = await prisma.user.findMany({
      where: {
        settings: null,
      },
      select: { id: true },
    });

    let settingsCreated = 0;
    for (const user of usersWithoutSettings) {
      await prisma.settings.create({
        data: {
          userId: user.id,
          visiblePages: CURRENT_PAGES,
          visibleDashboardCards: CURRENT_DASHBOARD_CARDS,
          visibleToolsCards: CURRENT_TOOLS_CARDS,
          visiblePagesOrder: CURRENT_PAGES.filter(p => p !== 'Settings'),
          toolsCardsOrder: CURRENT_TOOLS_CARDS,
        },
      });
      settingsCreated++;
    }

    await logAuditEvent({
      adminId: token.id as string,
      adminEmail: requester.email,
      action: 'grant_admin' as any, // Using existing action type for audit trail
      details: {
        type: 'migrate_settings',
        settingsMigrated: migratedCount,
        settingsSkipped: skippedCount,
        settingsCreated,
        streaksCreated,
      },
    });

    return NextResponse.json({
      success: true,
      results: {
        settingsMigrated: migratedCount,
        settingsSkipped: skippedCount,
        settingsCreated,
        streaksCreated,
        totalUsers: allSettings.length + usersWithoutSettings.length,
      },
    });
  } catch (error) {
    console.error('Error migrating settings:', error);
    return NextResponse.json(
      { error: 'Failed to migrate settings' },
      { status: 500 }
    );
  }
}
