import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';
import { createCanvasClient, decryptToken, getCurrentTerm, CanvasAuthError } from '@/lib/canvas';

// POST - Sync courses from Canvas
export const POST = withRateLimit(async function(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get settings with Canvas credentials
    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: {
        canvasInstanceUrl: true,
        canvasAccessToken: true,
        canvasSyncEnabled: true,
      },
    });

    if (!settings?.canvasInstanceUrl || !settings?.canvasAccessToken || !settings?.canvasSyncEnabled) {
      return NextResponse.json(
        { error: 'Canvas is not connected. Please connect to Canvas first.' },
        { status: 400 }
      );
    }

    // Decrypt the access token
    const encryptionSecret = process.env.CANVAS_ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET || 'default-secret';
    let accessToken: string;
    try {
      accessToken = decryptToken(settings.canvasAccessToken, encryptionSecret);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to authenticate with Canvas. Please reconnect.' },
        { status: 400 }
      );
    }

    // Create Canvas client
    const client = createCanvasClient(settings.canvasInstanceUrl, accessToken);

    const result = { created: 0, updated: 0, errors: [] as string[] };

    try {
      const canvasCourses = await client.getCourses({
        enrollment_state: 'active',
        include: ['term', 'enrollments'],
      });

      // Get existing courses with Canvas IDs
      const existingCourses = await prisma.course.findMany({
        where: {
          userId,
          canvasCourseId: { not: null },
        },
        select: { id: true, canvasCourseId: true },
      });

      const existingCourseMap = new Map(
        existingCourses.map(c => [c.canvasCourseId, c.id])
      );

      for (const canvasCourse of canvasCourses) {
        try {
          const canvasCourseIdStr = String(canvasCourse.id);
          const existingCourseId = existingCourseMap.get(canvasCourseIdStr);
          const term = getCurrentTerm();

          if (existingCourseId) {
            // Course already exists - don't override user-edited fields (name, code, term, dates)
            // Only update Canvas-specific metadata if needed in the future
            result.updated++;
          } else {
            await prisma.course.create({
              data: {
                userId,
                name: canvasCourse.name,
                code: canvasCourse.course_code,
                term,
                canvasCourseId: canvasCourseIdStr,
                canvasEnrollmentId: canvasCourse.enrollments?.[0]?.id
                  ? String(canvasCourse.enrollments[0].id)
                  : null,
                startDate: canvasCourse.start_at ? new Date(canvasCourse.start_at) : null,
                endDate: canvasCourse.end_at ? new Date(canvasCourse.end_at) : null,
                // No colorTag - Canvas courses use the default blue like regular courses
                meetingTimes: [],
                links: [],
                files: [],
              },
            });
            result.created++;
          }
        } catch (error) {
          result.errors.push(
            `Failed to sync course ${canvasCourse.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      result.errors.push(
        `Failed to fetch courses: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Synced ${result.created + result.updated} courses (${result.created} new, ${result.updated} updated)`,
    });
  } catch (error) {
    console.error('[Canvas Sync Courses] Error:', error);

    if (error instanceof CanvasAuthError) {
      const session = await getServerSession(authConfig);
      if (session?.user?.id) {
        const existingNotification = await prisma.notification.findFirst({
          where: { userId: session.user.id, type: 'canvas_token_expired', read: false },
        });
        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              userId: session.user.id,
              title: 'Canvas Connection Expired',
              message: 'Your Canvas access token has expired. Please go to Settings to reconnect your Canvas account.',
              type: 'canvas_token_expired',
              read: false,
            },
          });
        }
      }
      return NextResponse.json(
        { error: 'Your Canvas access token has expired. Please reconnect your Canvas account in Settings.', authError: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to sync courses from Canvas. Please try again.' },
      { status: 500 }
    );
  }
});
