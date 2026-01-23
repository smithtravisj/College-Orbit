import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';
import { createCanvasClient, decryptToken, CanvasAuthError } from '@/lib/canvas';

// POST - Sync grades from Canvas
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
        canvasUserId: true,
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

    const client = createCanvasClient(settings.canvasInstanceUrl, accessToken);

    const result = { updated: 0, errors: [] as string[] };

    // Get all courses with Canvas IDs
    const courses = await prisma.course.findMany({
      where: {
        userId,
        canvasCourseId: { not: null },
      },
      select: { id: true, canvasCourseId: true },
    });

    if (courses.length === 0) {
      return NextResponse.json({
        success: true,
        result,
        message: 'No Canvas courses found. Please sync courses first.',
      });
    }

    for (const course of courses) {
      if (!course.canvasCourseId) continue;

      try {
        // Get assignments with submissions for this course
        const assignments = await client.getAssignments(course.canvasCourseId, {
          include: ['submission'],
        });

        for (const assignment of assignments) {
          if (!assignment.submission) continue;

          try {
            const canvasAssignmentIdStr = String(assignment.id);

            // Find the work item with this Canvas assignment ID
            const workItem = await prisma.workItem.findFirst({
              where: {
                userId,
                courseId: course.id,
                canvasAssignmentId: canvasAssignmentIdStr,
              },
            });

            if (workItem) {
              await prisma.workItem.update({
                where: { id: workItem.id },
                data: {
                  canvasSubmissionId: String(assignment.submission.id),
                  canvasPointsEarned: assignment.submission.score,
                  canvasGradePostedAt: assignment.submission.graded_at
                    ? new Date(assignment.submission.graded_at)
                    : null,
                },
              });
              result.updated++;
            }
          } catch (error) {
            result.errors.push(
              `Failed to sync grade for ${assignment.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        result.errors.push(
          `Failed to fetch grades for course: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Updated ${result.updated} grades`,
    });
  } catch (error) {
    console.error('[Canvas Sync Grades] Error:', error);

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
      { error: 'Failed to sync grades from Canvas. Please try again.' },
      { status: 500 }
    );
  }
});
