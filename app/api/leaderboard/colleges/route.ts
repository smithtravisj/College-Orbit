import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// GET college leaderboard (monthly aggregated XP by college)
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
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

    // Get aggregated monthly XP totals by college
    const monthlyTotals = await prisma.monthlyXpTotal.groupBy({
      by: ['collegeId'],
      where: { yearMonth },
      _sum: { totalXp: true },
      _count: { userId: true },
    });

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
