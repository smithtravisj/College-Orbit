import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Clear colorTag from all Canvas courses so they use the default blue
    const result = await prisma.course.updateMany({
      where: {
        userId,
        canvasCourseId: { not: null },
        colorTag: { not: null },
      },
      data: { colorTag: null },
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${result.count} Canvas course${result.count === 1 ? '' : 's'} to use default blue`,
      updated: result.count,
    });
  } catch (error) {
    console.error('Fix canvas colors error:', error);
    return NextResponse.json(
      { error: 'Failed to fix canvas colors' },
      { status: 500 }
    );
  }
}
