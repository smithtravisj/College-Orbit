import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { logAuditEvent } from '@/lib/auditLog';

interface QuickLink {
  label: string;
  url: string;
}

// GET all colleges (admin only)
export const GET = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get all colleges ordered by name
    const colleges = await prisma.college.findMany({
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({ colleges });
  } catch (error) {
    console.error('[GET /api/admin/colleges] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch colleges' },
      { status: 500 }
    );
  }
});

// POST create a new college
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, email: true },
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const data = await req.json();
    const { fullName, acronym, darkAccent, darkLink, lightAccent, lightLink, quickLinks } = data;

    // Validate required fields
    if (!fullName || !acronym) {
      return NextResponse.json({ error: 'Full name and acronym are required' }, { status: 400 });
    }

    if (!darkAccent || !darkLink || !lightAccent || !lightLink) {
      return NextResponse.json({ error: 'All color fields are required' }, { status: 400 });
    }

    // Validate color format (hex)
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(darkAccent) || !hexColorRegex.test(darkLink) ||
        !hexColorRegex.test(lightAccent) || !hexColorRegex.test(lightLink)) {
      return NextResponse.json({ error: 'Colors must be valid hex format (e.g., #FF5500)' }, { status: 400 });
    }

    // Validate quickLinks format
    const validatedQuickLinks: QuickLink[] = [];
    if (quickLinks && Array.isArray(quickLinks)) {
      for (const link of quickLinks) {
        if (link.label && link.url) {
          validatedQuickLinks.push({
            label: String(link.label).trim(),
            url: String(link.url).trim(),
          });
        }
      }
    }

    // Check if college already exists
    const existingCollege = await prisma.college.findUnique({
      where: { fullName },
    });

    if (existingCollege) {
      return NextResponse.json({ error: 'A college with this name already exists' }, { status: 409 });
    }

    // Create the college
    const college = await prisma.college.create({
      data: {
        fullName: fullName.trim(),
        acronym: acronym.trim(),
        darkAccent,
        darkLink,
        lightAccent,
        lightLink,
        quickLinks: validatedQuickLinks as unknown as Parameters<typeof prisma.college.create>[0]['data']['quickLinks'],
      },
    });

    // Log audit event
    await logAuditEvent({
      adminId: userId,
      adminEmail: adminUser.email || 'unknown',
      action: 'add_college',
      details: {
        collegeId: college.id,
        collegeName: college.fullName,
        acronym: college.acronym,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'College added successfully',
      college,
    });
  } catch (error) {
    console.error('[POST /api/admin/colleges] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create college' },
      { status: 500 }
    );
  }
});

// PATCH update a college
export const PATCH = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, email: true },
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const data = await req.json();
    const { id, fullName, acronym, darkAccent, darkLink, lightAccent, lightLink, quickLinks, isActive } = data;

    if (!id) {
      return NextResponse.json({ error: 'College ID is required' }, { status: 400 });
    }

    // Validate color format if provided
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (darkAccent && !hexColorRegex.test(darkAccent)) {
      return NextResponse.json({ error: 'darkAccent must be valid hex format' }, { status: 400 });
    }
    if (darkLink && !hexColorRegex.test(darkLink)) {
      return NextResponse.json({ error: 'darkLink must be valid hex format' }, { status: 400 });
    }
    if (lightAccent && !hexColorRegex.test(lightAccent)) {
      return NextResponse.json({ error: 'lightAccent must be valid hex format' }, { status: 400 });
    }
    if (lightLink && !hexColorRegex.test(lightLink)) {
      return NextResponse.json({ error: 'lightLink must be valid hex format' }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, any> = {};
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (acronym !== undefined) updateData.acronym = acronym.trim();
    if (darkAccent !== undefined) updateData.darkAccent = darkAccent;
    if (darkLink !== undefined) updateData.darkLink = darkLink;
    if (lightAccent !== undefined) updateData.lightAccent = lightAccent;
    if (lightLink !== undefined) updateData.lightLink = lightLink;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (quickLinks !== undefined && Array.isArray(quickLinks)) {
      const validatedQuickLinks: QuickLink[] = [];
      for (const link of quickLinks) {
        if (link.label && link.url) {
          validatedQuickLinks.push({
            label: String(link.label).trim(),
            url: String(link.url).trim(),
          });
        }
      }
      updateData.quickLinks = validatedQuickLinks as unknown as Parameters<typeof prisma.college.update>[0]['data']['quickLinks'];
    }

    const college = await prisma.college.update({
      where: { id },
      data: updateData,
    });

    // Log audit event
    await logAuditEvent({
      adminId: userId,
      adminEmail: adminUser.email || 'unknown',
      action: 'update_college',
      details: {
        collegeId: college.id,
        collegeName: college.fullName,
        updatedFields: Object.keys(updateData),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'College updated successfully',
      college,
    });
  } catch (error) {
    console.error('[PATCH /api/admin/colleges] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update college' },
      { status: 500 }
    );
  }
});

// DELETE a college
export const DELETE = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, email: true },
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'College ID is required' }, { status: 400 });
    }

    const college = await prisma.college.findUnique({
      where: { id },
    });

    if (!college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }

    await prisma.college.delete({
      where: { id },
    });

    // Log audit event
    await logAuditEvent({
      adminId: userId,
      adminEmail: adminUser.email || 'unknown',
      action: 'delete_college',
      details: {
        collegeId: id,
        collegeName: college.fullName,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'College deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE /api/admin/colleges] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete college' },
      { status: 500 }
    );
  }
});
