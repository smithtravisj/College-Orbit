import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';

// GET releases based on user's beta status
export async function GET() {
  try {
    const session = await getServerSession(authConfig);

    // Check if user is a beta user (for display purposes only)
    let isBetaUser = false;
    if (session?.user?.id) {
      const settings = await prisma.settings.findUnique({
        where: { userId: session.user.id },
        select: { isBetaUser: true },
      });
      isBetaUser = settings?.isBetaUser ?? false;
    }

    // Fetch all releases - beta restriction removed, everyone sees all versions
    const releases = await prisma.appVersion.findMany({
      orderBy: [{ releasedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        version: true,
        changes: true,
        isBetaOnly: true,
        releasedAt: true,
      },
    });

    // Transform to match expected format
    const formattedReleases = releases.map((release) => ({
      version: release.version,
      date: release.releasedAt.toISOString().split('T')[0],
      changes: release.changes as string[],
      isBetaOnly: release.isBetaOnly,
    }));

    return NextResponse.json({
      releases: formattedReleases,
      isBetaUser,
    });
  } catch (error) {
    console.error('Error fetching releases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch releases' },
      { status: 500 }
    );
  }
}
