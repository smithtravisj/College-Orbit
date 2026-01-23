import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { logAuditEvent } from '@/lib/auditLog';

// GET all app versions (admin only)
export const GET = withRateLimit(async function() {
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

    const versions = await prisma.appVersion.findMany({
      orderBy: { releasedAt: 'desc' },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error fetching app versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch app versions' },
      { status: 500 }
    );
  }
});

// POST create new app version (admin only)
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true },
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const { version, changes, isBetaOnly = true } = data;

    if (!version || !version.trim()) {
      return NextResponse.json(
        { error: 'Version number is required' },
        { status: 400 }
      );
    }

    // Check if version already exists
    const existingVersion = await prisma.appVersion.findUnique({
      where: { version: version.trim() },
    });

    if (existingVersion) {
      return NextResponse.json(
        { error: 'Version already exists' },
        { status: 400 }
      );
    }

    const appVersion = await prisma.appVersion.create({
      data: {
        version: version.trim(),
        changes: changes || [],
        isBetaOnly,
      },
    });

    // Log audit event
    await logAuditEvent({
      adminId: session.user.id,
      adminEmail: adminUser.email || 'unknown',
      action: 'create_app_version',
      details: {
        versionId: appVersion.id,
        version: appVersion.version,
        isBetaOnly,
      },
    });

    return NextResponse.json({ version: appVersion }, { status: 201 });
  } catch (error) {
    console.error('Error creating app version:', error);
    return NextResponse.json(
      { error: 'Failed to create app version' },
      { status: 500 }
    );
  }
});

// PATCH update app version (admin only)
export const PATCH = withRateLimit(async function(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true },
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const { id, isBetaOnly, changes } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'Version ID is required' },
        { status: 400 }
      );
    }

    // Get original version for audit log
    const originalVersion = await prisma.appVersion.findUnique({
      where: { id },
    });

    if (!originalVersion) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Build update data
    const updateData: {
      isBetaOnly?: boolean;
      changes?: string[];
    } = {};

    if (typeof isBetaOnly === 'boolean') {
      updateData.isBetaOnly = isBetaOnly;
    }

    if (changes !== undefined) {
      updateData.changes = changes;
    }

    const appVersion = await prisma.appVersion.update({
      where: { id },
      data: updateData,
    });

    // Log audit event
    await logAuditEvent({
      adminId: session.user.id,
      adminEmail: adminUser.email || 'unknown',
      action: isBetaOnly === false ? 'release_app_version' : 'update_app_version',
      details: {
        versionId: id,
        version: appVersion.version,
        previousIsBetaOnly: originalVersion.isBetaOnly,
        newIsBetaOnly: appVersion.isBetaOnly,
      },
    });

    return NextResponse.json({ version: appVersion });
  } catch (error) {
    console.error('Error updating app version:', error);
    return NextResponse.json(
      { error: 'Failed to update app version' },
      { status: 500 }
    );
  }
});
