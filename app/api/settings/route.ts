import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';

// GET settings for authenticated user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      settings: settings || {
        dueSoonWindowDays: 7,
        weekStartsOn: 'Sun',
        theme: 'system',
        enableNotifications: false,
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PATCH update settings
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const userId = session.user.id;

    // Use raw SQL to bypass Prisma issues
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 1;

    if (data.dueSoonWindowDays !== undefined) {
      updateFields.push(`"dueSoonWindowDays" = $${paramCount}`);
      updateValues.push(data.dueSoonWindowDays);
      paramCount++;
    }
    if (data.weekStartsOn !== undefined) {
      updateFields.push(`"weekStartsOn" = $${paramCount}`);
      updateValues.push(data.weekStartsOn);
      paramCount++;
    }
    if (data.theme !== undefined) {
      updateFields.push(`"theme" = $${paramCount}`);
      updateValues.push(data.theme);
      paramCount++;
    }
    if (data.enableNotifications !== undefined) {
      updateFields.push(`"enableNotifications" = $${paramCount}`);
      updateValues.push(data.enableNotifications);
      paramCount++;
    }

    updateValues.push(userId);
    const updateSetClause = updateFields.length > 0 ? updateFields.join(', ') : '"updatedAt" = NOW()';

    const updateQuery = `
      UPDATE "Settings"
      SET ${updateSetClause}, "updatedAt" = NOW()
      WHERE "userId" = $${paramCount}
      RETURNING *;
    `;

    let result = await prisma.$queryRawUnsafe(updateQuery, ...updateValues);

    // If no rows were updated, try inserting
    if (!Array.isArray(result) || result.length === 0) {
      const insertQuery = `
        INSERT INTO "Settings" ("id", "userId", "dueSoonWindowDays", "weekStartsOn", "theme", "enableNotifications", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *;
      `;

      result = await prisma.$queryRawUnsafe(
        insertQuery,
        userId,
        data.dueSoonWindowDays ?? 7,
        data.weekStartsOn ?? 'Sun',
        data.theme ?? 'system',
        data.enableNotifications ?? false
      );
    }

    const settings = Array.isArray(result) ? result[0] : result;
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
