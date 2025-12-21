import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all recurring exam patterns
export const GET = withRateLimit(async function(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patterns = await prisma.recurringExamPattern.findMany({
      where: { userId: token.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ patterns });
  } catch (error) {
    console.error('[GET /api/recurring-exam-patterns] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 });
  }
});

// DELETE a recurring exam pattern
export const DELETE = withRateLimit(async function(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const patternId = searchParams.get('id');
    const deleteInstances = searchParams.get('deleteInstances') === 'true';

    if (!patternId) {
      return NextResponse.json({ error: 'Pattern ID required' }, { status: 400 });
    }

    // Verify ownership
    const pattern = await prisma.recurringExamPattern.findFirst({
      where: { id: patternId, userId: token.id },
    });

    if (!pattern) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 });
    }

    // Delete instances if requested
    if (deleteInstances) {
      await prisma.exam.deleteMany({
        where: { recurringPatternId: patternId },
      });
    }

    // Delete pattern
    await prisma.recurringExamPattern.delete({
      where: { id: patternId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/recurring-exam-patterns] Error:', error);
    return NextResponse.json({ error: 'Failed to delete pattern' }, { status: 500 });
  }
});
