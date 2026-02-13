import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';

// GET college leaderboard (monthly aggregated XP by college)
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);

    // Get month from query params or default to current month
    let yearMonth = searchParams.get('month');
    if (!yearMonth) {
      const now = new Date();
      yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
    }

    // Get user's college
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { collegeId: true },
    });

    // Get aggregated monthly XP totals by college (for users WITH colleges)
    const monthlyTotals = await prisma.monthlyXpTotal.groupBy({
      by: ['collegeId'],
      where: { yearMonth },
      _sum: { totalXp: true },
      _count: { userId: true },
    });

    // Also get XP from users WITHOUT colleges (from DailyActivity)
    // Parse yearMonth to get date range
    const [year, month] = yearMonth.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const unaffiliatedActivity = await prisma.dailyActivity.groupBy({
      by: ['userId'],
      where: {
        activityDate: { gte: startDate, lte: endDate },
        user: { collegeId: null },
      },
      _sum: { xpEarned: true },
    });

    const unaffiliatedTotalXp = unaffiliatedActivity.reduce((sum, a) => sum + (a._sum.xpEarned || 0), 0);
    const unaffiliatedUserCount = unaffiliatedActivity.length;

    // Get college details
    const collegeIds = monthlyTotals.map(t => t.collegeId);
    const colleges = await prisma.college.findMany({
      where: { id: { in: collegeIds }, isActive: true },
      select: { id: true, fullName: true, acronym: true },
    });

    const collegeMap = new Map(colleges.map(c => [c.id, c]));

    // Build leaderboard entries
    const entries = monthlyTotals
      .filter(t => collegeMap.has(t.collegeId))
      .map(t => {
        const college = collegeMap.get(t.collegeId)!;
        return {
          collegeId: t.collegeId,
          collegeName: college.fullName,
          acronym: college.acronym,
          totalXp: t._sum.totalXp || 0,
          userCount: t._count.userId,
          isUserCollege: t.collegeId === user?.collegeId,
        };
      });

    // Add unaffiliated users if there are any
    if (unaffiliatedUserCount > 0 && unaffiliatedTotalXp > 0) {
      entries.push({
        collegeId: 'unaffiliated',
        collegeName: 'Unaffiliated',
        acronym: '—',
        totalXp: unaffiliatedTotalXp,
        userCount: unaffiliatedUserCount,
        isUserCollege: !user?.collegeId,
      });
    }

    // Sort by total XP descending
    entries.sort((a, b) => b.totalXp - a.totalXp);

    // Add rank
    const leaderboard = entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return NextResponse.json({
      leaderboard,
      month: yearMonth,
      userCollegeId: user?.collegeId || null,
    });
  } catch (error) {
    console.error('Error fetching college leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch college leaderboard' },
      { status: 500 }
    );
  }
});
