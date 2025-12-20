import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

// GET all excluded dates for authenticated user
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const excludedDates = await prisma.excludedDate.findMany({
      where: { userId: token.id },
      orderBy: { date: 'asc' },
    });

    // Format dates as YYYY-MM-DD strings for consistency
    const formattedDates = excludedDates.map(d => ({
      ...d,
      date: d.date.toISOString().split('T')[0],
    }));

    return NextResponse.json({ excludedDates: formattedDates });
  } catch (error) {
    console.error('Error fetching excluded dates:', error);
    return NextResponse.json(
      { error: 'We couldn\'t load your excluded dates. Please check your connection and try again.' },
      { status: 500 }
    );
  }
}

// POST create new excluded date(s)
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();
    console.log('[POST /api/excluded-dates] Request body:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.description || !data.description.trim()) {
      console.error('[POST /api/excluded-dates] Missing description');
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Handle single date or date range
    let datesToCreate = [];

    if (data.dates && Array.isArray(data.dates)) {
      // Batch creation of dates (for date ranges)
      datesToCreate = data.dates.map((date: string) => ({
        userId: token.id,
        courseId: data.courseId || null,
        date: new Date(date),
        description: data.description.trim(),
      }));
    } else if (data.date) {
      // Single date
      datesToCreate = [
        {
          userId: token.id,
          courseId: data.courseId || null,
          date: new Date(data.date),
          description: data.description.trim(),
        },
      ];
    } else {
      console.error('[POST /api/excluded-dates] Missing date or dates');
      return NextResponse.json(
        { error: 'Please select a date range' },
        { status: 400 }
      );
    }

    // If courseId is provided, verify it belongs to the user
    if (data.courseId) {
      const course = await prisma.course.findFirst({
        where: {
          id: data.courseId,
          userId: token.id,
        },
      });

      if (!course) {
        console.error('[POST /api/excluded-dates] Course not found or unauthorized');
        return NextResponse.json(
          { error: 'Course not found or unauthorized' },
          { status: 404 }
        );
      }
    }

    // Create excluded dates
    const createdDates = await prisma.excludedDate.createMany({
      data: datesToCreate,
    });

    console.log('[POST /api/excluded-dates] Created', createdDates.count, 'excluded dates');

    // Fetch and return the created dates
    const excludedDates = await prisma.excludedDate.findMany({
      where: { userId: token.id },
      orderBy: { date: 'asc' },
    });

    // Format dates as YYYY-MM-DD strings for consistency
    const formattedDates = excludedDates.map(d => ({
      ...d,
      date: d.date.toISOString().split('T')[0],
    }));

    return NextResponse.json({ excludedDates: formattedDates }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/excluded-dates] Error creating excluded dates:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create excluded dates', details: errorMessage },
      { status: 500 }
    );
  }
}
