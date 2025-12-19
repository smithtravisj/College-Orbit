import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';

// GET settings for authenticated user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      console.log('[GET /api/settings] No user ID in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[GET /api/settings] Fetching for user:', session.user.id);

    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
    });

    console.log('[GET /api/settings] Found settings:', settings);

    const response = {
      userId: session.user.id,
      settings: settings || {
        dueSoonWindowDays: 7,
        weekStartsOn: 'Sun',
        theme: 'system',
        enableNotifications: false,
        university: null,
      },
    };

    console.log('[GET /api/settings] Returning:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[GET /api/settings] Error:', error);
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
    if (data.university !== undefined) {
      updateFields.push(`"university" = $${paramCount}`);
      updateValues.push(data.university);
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

    console.log('Update query:', updateQuery);
    console.log('Update values:', updateValues);

    let result = await prisma.$queryRawUnsafe(updateQuery, ...updateValues);
    console.log('Update result:', result);

    // If no rows were updated, try inserting
    if (!Array.isArray(result) || result.length === 0) {
      console.log('No rows updated, attempting insert...');

      // Use a simpler UUID method
      const crypto = require('crypto');
      const newId = crypto.randomUUID();

      const insertQuery = `
        INSERT INTO "Settings" ("id", "userId", "dueSoonWindowDays", "weekStartsOn", "theme", "enableNotifications", "university", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *;
      `;

      const insertValues = [
        newId,
        userId,
        data.dueSoonWindowDays ?? 7,
        data.weekStartsOn ?? 'Sun',
        data.theme ?? 'system',
        data.enableNotifications ?? false,
        data.university ?? null
      ];

      console.log('Insert query:', insertQuery);
      console.log('Insert values:', insertValues);

      result = await prisma.$queryRawUnsafe(insertQuery, ...insertValues);
      console.log('Insert result:', result);
    }

    const settings = Array.isArray(result) ? result[0] : result;
    console.log('Final settings to return:', settings);
    return NextResponse.json({ settings, debug: { updateQuery, result } });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
