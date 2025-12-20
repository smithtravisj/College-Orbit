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
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
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
      { error: 'We couldn\'t load your settings. Please check your connection and try again.' },
      { status: 500 }
    );
  }
}

// PATCH update settings
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
  }

  const userId = session.user.id;
  const data = await req.json();

  try {

    // Build update data object dynamically
    const updateData: any = {};

    if (data.dueSoonWindowDays !== undefined) updateData.dueSoonWindowDays = data.dueSoonWindowDays;
    if (data.weekStartsOn !== undefined) updateData.weekStartsOn = data.weekStartsOn;
    if (data.theme !== undefined) updateData.theme = data.theme;
    if (data.enableNotifications !== undefined) updateData.enableNotifications = data.enableNotifications;
    if (data.university !== undefined) updateData.university = data.university;
    if (data.visiblePages !== undefined) updateData.visiblePages = data.visiblePages;
    if (data.visibleDashboardCards !== undefined) updateData.visibleDashboardCards = data.visibleDashboardCards;
    if (data.visibleToolsCards !== undefined) updateData.visibleToolsCards = data.visibleToolsCards;
    if (data.hasCompletedOnboarding !== undefined) updateData.hasCompletedOnboarding = data.hasCompletedOnboarding;

    console.log('[PATCH /api/settings] Updating with data:', updateData);

    // Try to update existing settings
    let settings = await prisma.settings.update({
      where: { userId },
      data: updateData,
    });

    console.log('[PATCH /api/settings] Updated settings:', settings);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[PATCH /api/settings] Error:', error);

    // If settings don't exist, try to create them
    if (error instanceof Error && error.message.includes('An operation failed because it depends on one or more records that were required but not found')) {
      try {
        console.log('[PATCH /api/settings] Settings not found, creating new ones...');

        const crypto = require('crypto');
        const newId = crypto.randomUUID();

        const newSettings = await prisma.settings.create({
          data: {
            id: newId,
            userId: userId,
            dueSoonWindowDays: 7,
            weekStartsOn: 'Sun',
            theme: 'dark',
            enableNotifications: false,
            ...data,
          },
        });

        console.log('[PATCH /api/settings] Created new settings:', newSettings);
        return NextResponse.json({ settings: newSettings });
      } catch (createError) {
        console.error('[PATCH /api/settings] Failed to create settings:', createError);
        return NextResponse.json(
          { error: 'Failed to create settings', details: createError instanceof Error ? createError.message : String(createError) },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update settings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
