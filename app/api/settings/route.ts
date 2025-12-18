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
    console.log('Updating settings for user:', session.user.id, 'with data:', data);

    // Build update object with only provided fields
    const updateData: any = {};
    if (data.dueSoonWindowDays !== undefined) updateData.dueSoonWindowDays = data.dueSoonWindowDays;
    if (data.weekStartsOn !== undefined) updateData.weekStartsOn = data.weekStartsOn;
    if (data.theme !== undefined) updateData.theme = data.theme;
    if (data.enableNotifications !== undefined) updateData.enableNotifications = data.enableNotifications;

    // Build create object with all fields (using defaults if not provided)
    const createData = {
      userId: session.user.id,
      dueSoonWindowDays: data.dueSoonWindowDays ?? 7,
      weekStartsOn: data.weekStartsOn ?? 'Sun',
      theme: data.theme ?? 'system',
      enableNotifications: data.enableNotifications ?? false,
    };

    const settings = await prisma.settings.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: createData,
    });

    console.log('Settings saved:', settings);

    // Verify the save by reading back
    const verify = await prisma.settings.findUnique({
      where: { userId: session.user.id },
    });
    console.log('Verification read:', verify);

    if (!verify) {
      throw new Error('Settings save failed - verification read returned null');
    }

    return NextResponse.json({ settings: verify });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
