import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/auth.config';

export async function GET() {
  try {
    // Check admin access
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get analytics data
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsers = await prisma.user.count();

    // New users in last 30 days
    const newUsersLast30Days = await prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Active users in last 30 days - count distinct users with any event
    const activeUsers = await prisma.analyticsEvent
      .findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          userId: { not: null },
        },
        distinct: ['userId'],
        select: { userId: true },
      })
      .then((results) => results.length);

    // Most visited pages
    const topPages = await prisma.analyticsEvent.groupBy({
      by: ['eventName'],
      where: { eventType: 'page_view' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Login frequency (last 30 days)
    const loginCount = await prisma.analyticsEvent.count({
      where: {
        eventType: 'login',
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Page view trends (last 7 days, by day and page)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all page view events for the last 7 days with page name
    const pageViewEvents = await prisma.analyticsEvent.findMany({
      where: {
        eventType: 'page_view',
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true, eventName: true },
    });

    // Count total visits per page
    const pageVisitCounts = new Map<string, number>();
    const allPages = new Set<string>();

    pageViewEvents.forEach((event) => {
      const page = event.eventName;
      allPages.add(page);
      pageVisitCounts.set(page, (pageVisitCounts.get(page) || 0) + 1);
    });

    // Group by date and page name
    const pageViewTrendMap = new Map<string, Map<string, number>>();

    pageViewEvents.forEach((event) => {
      const date = new Date(event.createdAt).toLocaleDateString();
      const page = event.eventName;

      if (!pageViewTrendMap.has(date)) {
        pageViewTrendMap.set(date, new Map());
      }
      const dayMap = pageViewTrendMap.get(date)!;
      dayMap.set(page, (dayMap.get(page) || 0) + 1);
    });

    // Convert to array format and sort by date, with pages sorted by total visits
    const pageViewTrends = Array.from(pageViewTrendMap.entries())
      .map(([date, pageMap]) => ({
        date,
        pages: Array.from(pageMap.entries())
          .map(([page, count]) => ({
            page,
            count,
          }))
          .sort((a, b) => (pageVisitCounts.get(b.page) || 0) - (pageVisitCounts.get(a.page) || 0)),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const uniquePages = Array.from(allPages).sort(
      (a, b) => (pageVisitCounts.get(b) || 0) - (pageVisitCounts.get(a) || 0)
    );

    // Total page views
    const totalPageViews = await prisma.analyticsEvent.count({
      where: { eventType: 'page_view' },
    });

    // Unique sessions (last 30 days)
    const uniqueSessions = await prisma.analyticsEvent
      .findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { sessionId: true },
        distinct: ['sessionId'],
      })
      .then((results) => results.length);

    // Pages per active user
    const pagesPerActiveUser = activeUsers > 0 ? (totalPageViews / activeUsers).toFixed(1) : '0';

    // Return visitor rate - users with multiple sessions
    const usersWithMultipleSessions = await prisma.analyticsEvent
      .groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: thirtyDaysAgo },
          userId: { not: null },
        },
        _count: { sessionId: true },
      })
      .then((results) => results.filter((r) => r._count.sessionId > 1).length);

    const returnVisitorRate =
      activeUsers > 0
        ? ((usersWithMultipleSessions / activeUsers) * 100).toFixed(0)
        : '0';

    // Most popular page
    const mostPopularPage =
      topPages.length > 0
        ? { name: topPages[0].eventName, count: topPages[0]._count.id }
        : null;

    // Average logins per active user
    const avgLoginsPerActiveUser =
      activeUsers > 0 ? (loginCount / activeUsers).toFixed(1) : '0';

    // New user activation rate - % of new users who became active
    // Count only users who were created in the last 30 days AND had activity in the last 30 days
    const newUserIds = await prisma.user
      .findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { id: true },
      })
      .then((results) => results.map((u) => u.id));

    const activeNewUsers = await prisma.analyticsEvent
      .findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          userId: { in: newUserIds },
        },
        distinct: ['userId'],
        select: { userId: true },
      })
      .then((results) => results.length);

    const newUserActivationRate =
      newUsersLast30Days > 0
        ? ((activeNewUsers / newUsersLast30Days) * 100).toFixed(0)
        : '0';

    return NextResponse.json({
      summary: {
        totalUsers,
        newUsersLast30Days,
        activeUsersLast30Days: activeUsers,
        newUserActivationRate: parseInt(newUserActivationRate as string),
        uniqueSessions,
        totalPageViews,
        loginsLast30Days: loginCount,
        pagesPerActiveUser: parseFloat(pagesPerActiveUser as string),
        returnVisitorRate: parseInt(returnVisitorRate as string),
        mostPopularPage,
        avgLoginsPerActiveUser: parseFloat(avgLoginsPerActiveUser as string),
      },
      topPages: topPages.map((item) => ({
        name: item.eventName,
        count: item._count.id,
      })),
      pageViewTrends,
      uniquePages,
    });
  } catch (error) {
    console.error('Analytics data retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics data' },
      { status: 500 }
    );
  }
}
