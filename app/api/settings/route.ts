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
      console.log('No user ID in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    const settings = await prisma.settings.upsert({
      where: { userId: session.user.id },
      update: {
        ...(data.dueSoonWindowDays !== undefined && { dueSoonWindowDays: data.dueSoonWindowDays }),
        ...(data.weekStartsOn !== undefined && { weekStartsOn: data.weekStartsOn }),
        ...(data.theme !== undefined && { theme: data.theme }),
        ...(data.enableNotifications !== undefined && { enableNotifications: data.enableNotifications }),
      },
      create: {
        userId: session.user.id,
        dueSoonWindowDays: data.dueSoonWindowDays ?? 7,
        weekStartsOn: data.weekStartsOn ?? 'Sun',
        theme: data.theme ?? 'system',
        enableNotifications: data.enableNotifications ?? false,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
