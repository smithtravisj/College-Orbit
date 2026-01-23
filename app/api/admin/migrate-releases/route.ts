import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import releases from '@/data/releases.json';

// POST migrate releases.json to database (admin only, one-time use)
export async function POST() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if migration already done
    const existingVersions = await prisma.appVersion.count();
    if (existingVersions > 0) {
      return NextResponse.json({
        message: 'Migration already completed',
        existingCount: existingVersions,
      });
    }

    // Import all releases from releases.json
    const importedVersions = [];
    for (const release of releases.releases) {
      const [year, month, day] = release.date.split('-').map(Number);
      const releasedAt = new Date(year, month - 1, day, 12, 0, 0); // Noon to avoid timezone issues

      const version = await prisma.appVersion.create({
        data: {
          version: release.version,
          changes: release.changes,
          isBetaOnly: false, // All existing releases are already public
          releasedAt,
        },
      });
      importedVersions.push(version);
    }

    return NextResponse.json({
      message: 'Migration completed successfully',
      importedCount: importedVersions.length,
      versions: importedVersions.map((v) => v.version),
    });
  } catch (error) {
    console.error('Error migrating releases:', error);
    return NextResponse.json(
      { error: 'Failed to migrate releases', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PATCH sync releases.json changes to existing database versions (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const { version: targetVersion } = data;

    // Find the release in releases.json
    const release = releases.releases.find((r) => r.version === targetVersion);
    if (!release) {
      return NextResponse.json({ error: 'Version not found in releases.json' }, { status: 404 });
    }

    // Update or create the version in the database
    const existingVersion = await prisma.appVersion.findUnique({
      where: { version: targetVersion },
    });

    if (existingVersion) {
      // Update existing version's changes
      const updated = await prisma.appVersion.update({
        where: { version: targetVersion },
        data: { changes: release.changes },
      });
      return NextResponse.json({
        message: 'Version updated successfully',
        version: updated,
      });
    } else {
      // Create new version
      const [year, month, day] = release.date.split('-').map(Number);
      const releasedAt = new Date(year, month - 1, day, 12, 0, 0);

      const created = await prisma.appVersion.create({
        data: {
          version: release.version,
          changes: release.changes,
          isBetaOnly: true, // New versions default to beta
          releasedAt,
        },
      });
      return NextResponse.json({
        message: 'Version created successfully',
        version: created,
      });
    }
  } catch (error) {
    console.error('Error syncing release:', error);
    return NextResponse.json(
      { error: 'Failed to sync release', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
