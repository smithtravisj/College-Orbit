import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all active colleges (public endpoint for settings and color palettes)
export async function GET() {
  try {
    // Get all active colleges ordered by name
    const colleges = await prisma.college.findMany({
      where: { isActive: true },
      select: {
        id: true,
        fullName: true,
        acronym: true,
        darkAccent: true,
        darkLink: true,
        lightAccent: true,
        lightLink: true,
        quickLinks: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({ colleges });
  } catch (error) {
    console.error('[GET /api/colleges] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch colleges' },
      { status: 500 }
    );
  }
}
