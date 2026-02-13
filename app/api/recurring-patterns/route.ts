import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all recurring patterns for the authenticated user
export const GET = withRateLimit(async function (request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patterns = await prisma.recurringPattern.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ patterns });
  } catch (error) {
    console.error('[GET /api/recurring-patterns] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 });
  }
});

// DELETE a recurring pattern
export const DELETE = withRateLimit(async function (request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patternId = searchParams.get('id');
    const deleteInstances = searchParams.get('deleteInstances') === 'true';

    if (!patternId) {
      return NextResponse.json({ error: 'Pattern ID required' }, { status: 400 });
    }

    // Verify ownership
    const pattern = await prisma.recurringPattern.findFirst({
      where: { id: patternId, userId },
    });

    if (!pattern) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 });
    }

    if (deleteInstances) {
      // Delete all future open instances
      await prisma.task.deleteMany({
        where: {
          recurringPatternId: patternId,
          status: 'open',
          dueAt: { gte: new Date().toISOString() },
        },
      });
    }

    // Delete pattern (sets recurringPatternId to null on remaining tasks due to SetNull)
    await prisma.recurringPattern.delete({ where: { id: patternId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/recurring-patterns] Error:', error);
    return NextResponse.json({ error: 'Failed to delete pattern' }, { status: 500 });
  }
});
