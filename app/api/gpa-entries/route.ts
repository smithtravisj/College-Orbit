import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all GPA entries for authenticated user
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Fetch all GPA entries for the user (no filtering by university)
    const entries = await prisma.gpaEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching GPA entries:', error);
    return NextResponse.json(
      { error: 'We couldn\'t load your GPA entries. Please check your connection and try again.' },
      { status: 500 }
    );
  }
});

// POST create new GPA entry
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();

    // Get user's selected university
    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: { university: true },
    });

    const university = settings?.university || null;

    const entry = await prisma.gpaEntry.create({
      data: {
        userId,
        courseId: data.courseId || null,
        courseName: data.courseName,
        grade: data.grade,
        credits: parseFloat(data.credits),
        term: data.term || "",
        status: data.status || "final",
        university: university,
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/gpa-entries] Error creating GPA entry:', error);
    return NextResponse.json(
      { error: 'Failed to create GPA entry', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
});
