import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

// POST create new issue report
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.description || !data.description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const issueReport = await prisma.issueReport.create({
      data: {
        userId: token.id,
        description: data.description.trim(),
        status: 'pending',
      },
    });

    // Get user info for notification message
    const user = await prisma.user.findUnique({
      where: { id: token.id },
      select: { name: true },
    });

    // Create notifications for all admins
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });

    if (admins.length > 0) {
      await Promise.all(
        admins.map((admin) =>
          prisma.notification.create({
            data: {
              userId: admin.id,
              title: 'New Issue Report',
              message: `${user?.name || 'A user'} reported: "${data.description.trim()}"`,
              type: 'issue_report',
              issueReportId: issueReport.id,
            },
          })
        )
      );
    }

    return NextResponse.json({ issueReport }, { status: 201 });
  } catch (error) {
    console.error('Error creating issue report:', error);
    return NextResponse.json(
      { error: 'Failed to create issue report' },
      { status: 500 }
    );
  }
}
