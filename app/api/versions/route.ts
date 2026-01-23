import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET version release status (public, for feature gating)
export async function GET() {
  try {
    const versions = await prisma.appVersion.findMany({
      select: {
        version: true,
        isBetaOnly: true,
      },
      orderBy: { releasedAt: 'desc' },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}
