import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { DEFAULT_VISIBLE_PAGES, DEFAULT_VISIBLE_DASHBOARD_CARDS, DEFAULT_VISIBLE_TOOLS_CARDS } from '@/lib/customizationConstants';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, university } = await req.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter both email and password' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
        settings: {
          create: {
            dueSoonWindowDays: 7,
            weekStartsOn: 'Sun',
            theme: 'system',
            enableNotifications: false,
            university: university || null,
            visiblePages: DEFAULT_VISIBLE_PAGES,
            visibleDashboardCards: DEFAULT_VISIBLE_DASHBOARD_CARDS,
            visibleToolsCards: DEFAULT_VISIBLE_TOOLS_CARDS,
          },
        },
      },
    });

    return NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'We couldn\'t create your account. Please try again.' },
      { status: 500 }
    );
  }
}
