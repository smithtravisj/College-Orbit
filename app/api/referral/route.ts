import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// Generate a random 8-character alphanumeric code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0, O, 1, I)
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET user's referral code and stats
export const GET = withRateLimit(async function(_request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user with referral code
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        sentReferrals: {
          select: {
            id: true,
            status: true,
            rewardMonths: true,
            createdAt: true,
            referee: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate referral code if user doesn't have one
    let referralCode = user.referralCode;
    if (!referralCode) {
      // Keep trying until we get a unique code
      let attempts = 0;
      while (!referralCode && attempts < 10) {
        const newCode = generateReferralCode();
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { referralCode: newCode },
          });
          referralCode = newCode;
        } catch {
          // Code already exists, try again
          attempts++;
        }
      }

      if (!referralCode) {
        return NextResponse.json(
          { error: 'Failed to generate referral code' },
          { status: 500 }
        );
      }
    }

    // Calculate stats
    const totalReferrals = user.sentReferrals.length;
    const successfulReferrals = user.sentReferrals.filter(r => r.status === 'completed').length;
    const monthsEarned = user.sentReferrals
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.rewardMonths, 0);

    // Generate referral link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://collegeorbit.com';
    const referralLink = `${appUrl}/signup?ref=${referralCode}`;

    return NextResponse.json({
      referralCode,
      referralLink,
      stats: {
        totalReferrals,
        successfulReferrals,
        monthsEarned,
      },
      referrals: user.sentReferrals.map(r => ({
        id: r.id,
        status: r.status,
        rewardMonths: r.rewardMonths,
        createdAt: r.createdAt,
        refereeName: r.referee.name || r.referee.email?.split('@')[0] || 'Unknown',
      })),
    });
  } catch (error) {
    console.error('Referral GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral info' },
      { status: 500 }
    );
  }
});
