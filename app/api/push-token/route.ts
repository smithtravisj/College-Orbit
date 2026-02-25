import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';

// POST — register a push token
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token, platform } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    await prisma.pushToken.upsert({
      where: { userId_token: { userId, token } },
      update: { updatedAt: new Date(), platform: platform || 'ios' },
      create: { userId, token, platform: platform || 'ios' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/push-token] Error:', error);
    return NextResponse.json({ error: 'Failed to register token' }, { status: 500 });
  }
}

// DELETE — unregister a push token
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    await prisma.pushToken.deleteMany({
      where: { userId, token },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/push-token] Error:', error);
    return NextResponse.json({ error: 'Failed to unregister token' }, { status: 500 });
  }
}
