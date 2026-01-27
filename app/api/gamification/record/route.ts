import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { processTaskCompletion } from '@/lib/gamification';

// POST record a task completion
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const timezoneOffset = typeof data.timezoneOffset === 'number' ? data.timezoneOffset : 0;
    const itemType = data.itemType || 'task';
    const itemId = data.itemId;

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    const result = await processTaskCompletion(token.id, timezoneOffset, itemType, itemId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error recording task completion:', error);
    return NextResponse.json(
      { error: 'Failed to record task completion' },
      { status: 500 }
    );
  }
}
