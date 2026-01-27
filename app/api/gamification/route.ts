import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getUserGamificationData, toggleVacationMode } from '@/lib/gamification';

// GET user's gamification stats
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getUserGamificationData(token.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching gamification data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gamification data' },
      { status: 500 }
    );
  }
}

// PATCH update vacation mode
export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    if (typeof data.vacationMode !== 'boolean') {
      return NextResponse.json(
        { error: 'vacationMode must be a boolean' },
        { status: 400 }
      );
    }

    const streak = await toggleVacationMode(token.id, data.vacationMode);

    return NextResponse.json({
      vacationMode: streak.vacationMode,
      vacationStartedAt: streak.vacationStartedAt?.toISOString() || null,
    });
  } catch (error) {
    console.error('Error updating vacation mode:', error);
    return NextResponse.json(
      { error: 'Failed to update vacation mode' },
      { status: 500 }
    );
  }
}
