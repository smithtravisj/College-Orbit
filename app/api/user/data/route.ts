import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// DELETE all user data
export const DELETE = withRateLimit(async function(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete all user data in parallel
    await Promise.all([
      prisma.course.deleteMany({ where: { userId } }),
      prisma.deadline.deleteMany({ where: { userId } }),
      prisma.task.deleteMany({ where: { userId } }),
      prisma.exam.deleteMany({ where: { userId } }),
      prisma.note.deleteMany({ where: { userId } }),
      prisma.folder.deleteMany({ where: { userId } }),
      prisma.gpaEntry.deleteMany({ where: { userId } }),
      prisma.excludedDate.deleteMany({ where: { userId } }),
      prisma.recurringPattern.deleteMany({ where: { userId } }),
      prisma.recurringDeadlinePattern.deleteMany({ where: { userId } }),
      prisma.recurringExamPattern.deleteMany({ where: { userId } }),
      prisma.settings.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.workItem.deleteMany({ where: { userId } }),
      prisma.recurringWorkPattern.deleteMany({ where: { userId } }),
      prisma.shoppingItem.deleteMany({ where: { userId } }),
      prisma.calendarEvent.deleteMany({ where: { userId } }),
      prisma.customQuickLink.deleteMany({ where: { userId } }),
      prisma.userStreak.deleteMany({ where: { userId } }),
      prisma.userAchievement.deleteMany({ where: { userId } }),
      prisma.gamificationCredit.deleteMany({ where: { userId } }),
      prisma.dailyActivity.deleteMany({ where: { userId } }),
      prisma.monthlyXpTotal.deleteMany({ where: { userId } }),
      prisma.deletedCanvasItem.deleteMany({ where: { userId } }),
      prisma.deletedBlackboardItem.deleteMany({ where: { userId } }),
      prisma.deletedMoodleItem.deleteMany({ where: { userId } }),
      prisma.deletedBrightspaceItem.deleteMany({ where: { userId } }),
      prisma.friendRequest.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }),
      prisma.friendship.deleteMany({ where: { OR: [{ user1Id: userId }, { user2Id: userId }] } }),
      prisma.referral.deleteMany({ where: { OR: [{ referrerId: userId }, { refereeId: userId }] } }),
      prisma.userSession.deleteMany({ where: { userId } }),
      prisma.analyticsEvent.deleteMany({ where: { userId } }),
      prisma.betaFeedback.deleteMany({ where: { userId } }),
      prisma.flashcardDeck.deleteMany({ where: { userId } }), // Cards cascade-deleted with decks
      prisma.dailyChallengeReward.deleteMany({ where: { userId } }),
      prisma.collegeRequest.deleteMany({ where: { userId } }),
      prisma.issueReport.deleteMany({ where: { userId } }),
      prisma.featureRequest.deleteMany({ where: { userId } }),
      prisma.rateLimit.deleteMany({ where: { userId } }),
      prisma.auditLog.deleteMany({ where: { OR: [{ adminId: userId }, { targetUserId: userId }] } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user data:', error);
    return NextResponse.json(
      { error: 'Failed to delete data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
});
