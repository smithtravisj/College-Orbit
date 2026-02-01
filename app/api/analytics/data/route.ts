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
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Run all independent queries in parallel
    const [
      totalUsers,
      newUsersLast30Days,
      activeUsersResult,
      topPages,
      loginCount,
      pageViewEvents,
      totalPageViews,
      uniqueSessionsResult,
      usersWithMultipleSessionsResult,
      newUserIdsResult,
      universityCounts,
      allColleges,
      premiumMonthly,
      premiumYearly,
      premiumSemester,
      lifetimePremium,
      trialUsers,
      freeUsers,
      canceledLast30Days,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // New users in last 30 days
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),

      // Active users in last 30 days
      prisma.analyticsEvent.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          userId: { not: null },
        },
        distinct: ['userId'],
        select: { userId: true },
      }),

      // Most visited pages
      prisma.analyticsEvent.groupBy({
        by: ['eventName'],
        where: { eventType: 'page_view' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Login frequency (last 30 days)
      prisma.analyticsEvent.count({
        where: {
          eventType: 'login',
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // Page view events for last 7 days
      prisma.analyticsEvent.findMany({
        where: {
          eventType: 'page_view',
          createdAt: { gte: sevenDaysAgo },
        },
        select: { createdAt: true, eventName: true },
      }),

      // Total page views
      prisma.analyticsEvent.count({
        where: { eventType: 'page_view' },
      }),

      // Unique sessions (last 30 days)
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { sessionId: true },
        distinct: ['sessionId'],
      }),

      // Users with multiple sessions
      prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: thirtyDaysAgo },
          userId: { not: null },
        },
        _count: { sessionId: true },
      }),

      // New user IDs for activation rate
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { id: true },
      }),

      // University distribution
      prisma.settings.groupBy({
        by: ['university'],
        _count: { id: true },
      }),

      // All colleges from database
      prisma.college.findMany({
        where: { isActive: true },
        select: { fullName: true },
        orderBy: { fullName: 'asc' },
      }),

      // Subscription stats
      prisma.user.count({
        where: {
          subscriptionTier: 'premium',
          subscriptionPlan: 'monthly',
          lifetimePremium: false,
        },
      }),

      prisma.user.count({
        where: {
          subscriptionTier: 'premium',
          subscriptionPlan: 'yearly',
          lifetimePremium: false,
        },
      }),

      prisma.user.count({
        where: {
          subscriptionTier: 'premium',
          subscriptionPlan: 'semester',
          lifetimePremium: false,
        },
      }),

      prisma.user.count({
        where: { lifetimePremium: true },
      }),

      prisma.user.count({
        where: {
          subscriptionTier: 'trial',
          lifetimePremium: false,
          trialEndsAt: { gt: now },
        },
      }),

      prisma.user.count({
        where: {
          OR: [
            { subscriptionTier: 'free' },
            { subscriptionTier: 'trial', trialEndsAt: { lte: now } },
            { subscriptionTier: 'trial', trialEndsAt: null },
          ],
          lifetimePremium: false,
        },
      }),

      // Canceled subscriptions in last 30 days (for churn rate)
      prisma.user.count({
        where: {
          subscriptionStatus: 'canceled',
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    // Process results
    const activeUsers = activeUsersResult.length;
    const uniqueSessions = uniqueSessionsResult.length;
    const usersWithMultipleSessions = usersWithMultipleSessionsResult.filter((r) => r._count.sessionId > 1).length;
    const newUserIds = newUserIdsResult.map((u) => u.id);

    // Get active new users (requires newUserIds, so run after)
    const activeNewUsers = newUserIds.length > 0
      ? await prisma.analyticsEvent.findMany({
          where: {
            createdAt: { gte: thirtyDaysAgo },
            userId: { in: newUserIds },
          },
          distinct: ['userId'],
          select: { userId: true },
        }).then((results) => results.length)
      : 0;

    // Process page view data
    const pageVisitCounts = new Map<string, number>();
    const allPages = new Set<string>();

    pageViewEvents.forEach((event) => {
      const page = event.eventName;
      allPages.add(page);
      pageVisitCounts.set(page, (pageVisitCounts.get(page) || 0) + 1);
    });

    const officialPages = new Set([
      'dashboard', 'calendar', 'profile', 'courses', 'privacy', 'terms',
      'tools', 'settings', 'exams', 'notes', 'tasks', 'deadlines',
      'analytics', 'forgot-password', 'reset-password',
    ]);

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

    const pageViewTrends = Array.from(pageViewTrendMap.entries())
      .map(([date, pageMap]) => ({
        date,
        pages: Array.from(pageMap.entries())
          .filter(([page]) => officialPages.has(page))
          .map(([page, count]) => ({ page, count }))
          .sort((a, b) => (pageVisitCounts.get(b.page) || 0) - (pageVisitCounts.get(a.page) || 0)),
      }))
      .filter((trend) => trend.pages.length > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const uniquePages = Array.from(allPages)
      .filter((page) => officialPages.has(page))
      .sort((a, b) => (pageVisitCounts.get(b) || 0) - (pageVisitCounts.get(a) || 0));

    // Calculate derived stats
    const pagesPerActiveUser = activeUsers > 0 ? (totalPageViews / activeUsers).toFixed(1) : '0';
    const returnVisitorRate = activeUsers > 0 ? ((usersWithMultipleSessions / activeUsers) * 100).toFixed(0) : '0';
    const mostPopularPage = topPages.length > 0 ? { name: topPages[0].eventName, count: topPages[0]._count.id } : null;
    const avgLoginsPerActiveUser = activeUsers > 0 ? (loginCount / activeUsers).toFixed(1) : '0';
    const newUserActivationRate = newUsersLast30Days > 0 ? ((activeNewUsers / newUsersLast30Days) * 100).toFixed(0) : '0';

    // Process university distribution
    const universityCountMap = new Map<string | null, number>();
    universityCounts.forEach((item) => {
      universityCountMap.set(item.university, item._count.id);
    });

    // Use colleges from database instead of hardcoded list
    const allUniversities = allColleges.map((c) => c.fullName);
    const universityDistribution = [
      { university: 'No University Selected', count: universityCountMap.get(null) || 0 },
      ...allUniversities.map((university) => ({
        university,
        count: universityCountMap.get(university) || 0,
      })),
    ].sort((a, b) => b.count - a.count);

    return NextResponse.json({
      summary: {
        totalUsers,
        newUsersLast30Days,
        activeUsersLast30Days: activeUsers,
        newUserActivationRate: parseInt(newUserActivationRate),
        uniqueSessions,
        totalPageViews,
        loginsLast30Days: loginCount,
        pagesPerActiveUser: parseFloat(pagesPerActiveUser),
        returnVisitorRate: parseInt(returnVisitorRate),
        mostPopularPage,
        avgLoginsPerActiveUser: parseFloat(avgLoginsPerActiveUser),
      },
      topPages: topPages.map((item) => ({
        name: item.eventName,
        count: item._count.id,
      })),
      pageViewTrends,
      uniquePages,
      universityDistribution,
      subscriptionStats: {
        premiumMonthly,
        premiumYearly,
        premiumSemester,
        lifetimePremium,
        trialUsers,
        freeUsers,
      },
      revenueStats: {
        // MRR = (monthly * $3) + (yearly * $29/12) + (semester * $10/4)
        mrr: (premiumMonthly * 3) + (premiumYearly * (29 / 12)) + (premiumSemester * (10 / 4)),
        activeSubscriptions: premiumMonthly + premiumYearly + premiumSemester,
        canceledLast30Days,
        // Churn rate = canceled / (active + canceled) * 100
        churnRate: (premiumMonthly + premiumYearly + premiumSemester + canceledLast30Days) > 0
          ? ((canceledLast30Days / (premiumMonthly + premiumYearly + premiumSemester + canceledLast30Days)) * 100).toFixed(1)
          : '0',
      },
    });
  } catch (error) {
    console.error('Analytics data retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics data' },
      { status: 500 }
    );
  }
}
