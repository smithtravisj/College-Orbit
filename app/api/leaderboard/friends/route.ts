import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// GET friends leaderboard (friends + self sorted by monthly XP)
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

    // Calculate date range for the month
    const [year, month] = yearMonth.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        profileImage: true,
        college: {
          select: { id: true, fullName: true, acronym: true },
        },
        streak: {
          select: { currentStreak: true, longestStreak: true, totalXp: true, level: true },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all friendships where user is either user1 or user2
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
            college: {
              select: { id: true, fullName: true, acronym: true },
            },
            streak: {
              select: { currentStreak: true, longestStreak: true, totalXp: true, level: true },
            },
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
            college: {
              select: { id: true, fullName: true, acronym: true },
            },
            streak: {
              select: { currentStreak: true, longestStreak: true, totalXp: true, level: true },
            },
          },
        },
      },
    });

    // Collect all user IDs (current user + friends)
    const allUserIds = [userId];
    for (const f of friendships) {
      const friendId = f.user1Id === userId ? f.user2Id : f.user1Id;
      allUserIds.push(friendId);
    }

    // Get monthly XP for all users from DailyActivity
    const monthlyXp = await prisma.dailyActivity.groupBy({
      by: ['userId'],
      where: {
        userId: { in: allUserIds },
        activityDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { xpEarned: true },
    });

    const monthlyXpMap = new Map(monthlyXp.map(m => [m.userId, m._sum.xpEarned || 0]));

    // Build leaderboard entries
    const entries = [];

    // Add current user
    entries.push({
      id: currentUser.id,
      username: currentUser.username,
      name: currentUser.name,
      profileImage: currentUser.profileImage,
      college: currentUser.college,
      streak: {
        currentStreak: currentUser.streak?.currentStreak || 0,
        longestStreak: currentUser.streak?.longestStreak || 0,
      },
      xp: {
        total: monthlyXpMap.get(currentUser.id) || 0,
        level: currentUser.streak?.level || 1,
      },
      isCurrentUser: true,
    });

    // Add friends
    for (const f of friendships) {
      const friend = f.user1Id === userId ? f.user2 : f.user1;
      entries.push({
        id: friend.id,
        username: friend.username,
        name: friend.name,
        profileImage: friend.profileImage,
        college: friend.college,
        streak: {
          currentStreak: friend.streak?.currentStreak || 0,
          longestStreak: friend.streak?.longestStreak || 0,
        },
        xp: {
          total: monthlyXpMap.get(friend.id) || 0,
          level: friend.streak?.level || 1,
        },
        isCurrentUser: false,
      });
    }

    // Sort by monthly XP descending
    entries.sort((a, b) => b.xp.total - a.xp.total);

    // Add rank
    const leaderboard = entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return NextResponse.json({ leaderboard, month: yearMonth });
  } catch (error) {
    console.error('Error fetching friends leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends leaderboard' },
      { status: 500 }
    );
  }
});
